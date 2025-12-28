/**
 * Content Moderation Service
 * AI-powered content filtering, spam detection, and automated moderation
 */

import { invokeLLM } from './_core/llm';
import { getDb } from './db';
import { chatMessages, users, moderationLogs, userReports } from '../drizzle/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

interface ModerationResult {
  allowed: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  confidence: number;
}

interface SpamDetectionResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
}

interface UserReputationScore {
  userId: string;
  score: number;
  level: 'trusted' | 'normal' | 'suspicious' | 'banned';
  violations: number;
  reports: number;
}

interface ModerationAction {
  action: 'allow' | 'warn' | 'mute' | 'timeout' | 'ban';
  duration?: number; // in seconds
  reason: string;
}

class ModerationService {
  private profanityList: Set<string>;
  private spamPatterns: RegExp[];
  private suspiciousPatterns: RegExp[];

  constructor() {
    this.profanityList = this.loadProfanityList();
    this.spamPatterns = this.loadSpamPatterns();
    this.suspiciousPatterns = this.loadSuspiciousPatterns();
    console.log('[Moderation] Service initialized');
  }

  /**
   * Moderate content using AI and rule-based filters
   */
  async moderateContent(content: string, userId: string, context: {
    showId?: string;
    messageType?: 'chat' | 'comment' | 'review';
  }): Promise<ModerationResult> {
    // Quick rule-based checks first
    const profanityCheck = this.checkProfanity(content);
    if (!profanityCheck.allowed) {
      await this.logModeration(userId, content, profanityCheck, context);
      return profanityCheck;
    }

    const spamCheck = this.detectSpam(content, userId);
    if (spamCheck.isSpam) {
      const result: ModerationResult = {
        allowed: false,
        reason: `Spam detected: ${spamCheck.reasons.join(', ')}`,
        severity: 'medium',
        categories: ['spam'],
        confidence: spamCheck.score,
      };
      await this.logModeration(userId, content, result, context);
      return result;
    }

    // AI-powered content moderation
    const aiResult = await this.aiModeration(content);
    await this.logModeration(userId, content, aiResult, context);

    // Update user reputation based on result
    if (!aiResult.allowed) {
      await this.updateUserReputation(userId, -10);
    }

    return aiResult;
  }

  /**
   * AI-powered content moderation using LLM
   */
  private async aiModeration(content: string): Promise<ModerationResult> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a content moderation AI for a live shopping platform. Analyze the following content and determine if it violates community guidelines.

Guidelines:
- No hate speech, harassment, or discrimination
- No explicit sexual content
- No violence or threats
- No illegal activities
- No personal information sharing
- No scams or fraudulent content
- No excessive self-promotion or spam

Respond in JSON format:
{
  "allowed": boolean,
  "reason": "explanation if not allowed",
  "severity": "low" | "medium" | "high" | "critical",
  "categories": ["category1", "category2"],
  "confidence": 0.0 to 1.0
}`,
          },
          {
            role: 'user',
            content: `Analyze this content: "${content}"`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'moderation_result',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                allowed: { type: 'boolean' },
                reason: { type: 'string' },
                severity: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                },
                categories: {
                  type: 'array',
                  items: { type: 'string' },
                },
                confidence: { type: 'number' },
              },
              required: ['allowed', 'severity', 'categories', 'confidence'],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as ModerationResult;
    } catch (error) {
      console.error('[Moderation] AI moderation failed:', error);
      // Fallback to allowing content if AI fails
      return {
        allowed: true,
        severity: 'low',
        categories: [],
        confidence: 0,
      };
    }
  }

  /**
   * Check for profanity using word list
   */
  private checkProfanity(content: string): ModerationResult {
    const lowerContent = content.toLowerCase();
    const words = lowerContent.split(/\s+/);

    const foundProfanity: string[] = [];
    for (const word of words) {
      if (this.profanityList.has(word)) {
        foundProfanity.push(word);
      }
    }

    if (foundProfanity.length > 0) {
      return {
        allowed: false,
        reason: 'Content contains inappropriate language',
        severity: 'medium',
        categories: ['profanity'],
        confidence: 1.0,
      };
    }

    return {
      allowed: true,
      severity: 'low',
      categories: [],
      confidence: 1.0,
    };
  }

  /**
   * Detect spam patterns
   */
  private detectSpam(content: string, userId: string): SpamDetectionResult {
    const reasons: string[] = [];
    let score = 0;

    // Check for spam patterns
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        reasons.push('Matches spam pattern');
        score += 0.3;
      }
    }

    // Check for excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > 2) {
      reasons.push('Excessive links');
      score += 0.4;
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      reasons.push('Excessive capitalization');
      score += 0.2;
    }

    // Check for repetitive characters
    if (/(.)\1{4,}/.test(content)) {
      reasons.push('Repetitive characters');
      score += 0.3;
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        reasons.push('Suspicious pattern detected');
        score += 0.4;
      }
    }

    return {
      isSpam: score >= 0.5,
      score: Math.min(score, 1.0),
      reasons,
    };
  }

  /**
   * Get user reputation score
   */
  async getUserReputation(userId: string): Promise<UserReputationScore> {
    const db = await getDb();

    // Get user violations count
    const violations = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(moderationLogs)
      .where(and(
        eq(moderationLogs.userId, userId),
        eq(moderationLogs.allowed, false)
      ));

    // Get user reports count
    const reports = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userReports)
      .where(eq(userReports.reportedUserId, userId));

    const violationCount = Number(violations[0]?.count || 0);
    const reportCount = Number(reports[0]?.count || 0);

    // Calculate score (100 - violations*5 - reports*10)
    const score = Math.max(0, 100 - violationCount * 5 - reportCount * 10);

    // Determine level
    let level: UserReputationScore['level'];
    if (score >= 80) level = 'trusted';
    else if (score >= 50) level = 'normal';
    else if (score >= 20) level = 'suspicious';
    else level = 'banned';

    return {
      userId,
      score,
      level,
      violations: violationCount,
      reports: reportCount,
    };
  }

  /**
   * Update user reputation
   */
  async updateUserReputation(userId: string, delta: number): Promise<void> {
    // Reputation is calculated dynamically from logs
    // This method is for triggering actions based on reputation changes
    const reputation = await this.getUserReputation(userId);

    if (reputation.level === 'banned') {
      await this.banUser(userId, 'Automatic ban due to low reputation');
    } else if (reputation.level === 'suspicious') {
      await this.flagUser(userId, 'User flagged for suspicious activity');
    }
  }

  /**
   * Determine moderation action based on content and user reputation
   */
  async determineModerationAction(
    content: string,
    userId: string,
    moderationResult: ModerationResult
  ): Promise<ModerationAction> {
    if (moderationResult.allowed) {
      return {
        action: 'allow',
        reason: 'Content passed moderation',
      };
    }

    const reputation = await this.getUserReputation(userId);

    // Critical violations = immediate ban
    if (moderationResult.severity === 'critical') {
      return {
        action: 'ban',
        reason: moderationResult.reason || 'Critical violation',
      };
    }

    // High severity + low reputation = ban
    if (moderationResult.severity === 'high' && reputation.score < 30) {
      return {
        action: 'ban',
        reason: moderationResult.reason || 'Repeated violations',
      };
    }

    // High severity + normal reputation = timeout
    if (moderationResult.severity === 'high') {
      return {
        action: 'timeout',
        duration: 3600, // 1 hour
        reason: moderationResult.reason || 'High severity violation',
      };
    }

    // Medium severity + suspicious reputation = timeout
    if (moderationResult.severity === 'medium' && reputation.level === 'suspicious') {
      return {
        action: 'timeout',
        duration: 600, // 10 minutes
        reason: moderationResult.reason || 'Repeated medium violations',
      };
    }

    // Medium severity = mute
    if (moderationResult.severity === 'medium') {
      return {
        action: 'mute',
        duration: 300, // 5 minutes
        reason: moderationResult.reason || 'Medium severity violation',
      };
    }

    // Low severity = warn
    return {
      action: 'warn',
      reason: moderationResult.reason || 'Minor violation',
    };
  }

  /**
   * Ban user
   */
  private async banUser(userId: string, reason: string): Promise<void> {
    const db = await getDb();
    await db
      .update(users)
      .set({
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
      })
      .where(eq(users.openId, userId));

    console.log(`[Moderation] Banned user ${userId}: ${reason}`);
  }

  /**
   * Flag user for review
   */
  private async flagUser(userId: string, reason: string): Promise<void> {
    console.log(`[Moderation] Flagged user ${userId}: ${reason}`);
    // Could send notification to moderators here
  }

  /**
   * Log moderation action
   */
  private async logModeration(
    userId: string,
    content: string,
    result: ModerationResult,
    context: any
  ): Promise<void> {
    const db = await getDb();
    try {
      await db.insert(moderationLogs).values({
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        content,
        allowed: result.allowed,
        reason: result.reason,
        severity: result.severity,
        categories: JSON.stringify(result.categories),
        confidence: result.confidence,
        context: JSON.stringify(context),
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('[Moderation] Failed to log moderation:', error);
    }
  }

  /**
   * Load profanity word list
   */
  private loadProfanityList(): Set<string> {
    // Basic profanity list - should be expanded
    return new Set([
      'fuck', 'shit', 'damn', 'bitch', 'ass', 'asshole',
      'bastard', 'cunt', 'dick', 'pussy', 'cock', 'whore',
      'slut', 'fag', 'nigger', 'retard', 'rape',
    ]);
  }

  /**
   * Load spam patterns
   */
  private loadSpamPatterns(): RegExp[] {
    return [
      /\b(buy|cheap|discount|free|click here|limited time)\b/i,
      /\b(viagra|cialis|pharmacy|pills)\b/i,
      /\b(lottery|winner|prize|claim)\b/i,
      /\b(earn money|make money|work from home)\b/i,
      /\b(click here|visit now|act now)\b/i,
    ];
  }

  /**
   * Load suspicious patterns
   */
  private loadSuspiciousPatterns(): RegExp[] {
    return [
      /\b(password|credit card|ssn|social security)\b/i,
      /\b(bank account|routing number|pin)\b/i,
      /\b(send money|wire transfer|western union)\b/i,
      /\b(nigerian prince|inheritance|millions)\b/i,
    ];
  }

  /**
   * Get moderation queue for manual review
   */
  async getModerationQueue(limit: number = 50): Promise<any[]> {
    const db = await getDb();

    const queue = await db
      .select()
      .from(moderationLogs)
      .where(eq(moderationLogs.allowed, false))
      .orderBy(desc(moderationLogs.createdAt))
      .limit(limit);

    return queue;
  }

  /**
   * Get user reports
   */
  async getUserReports(userId?: string, limit: number = 50): Promise<any[]> {
    const db = await getDb();

    let query = db
      .select()
      .from(userReports)
      .orderBy(desc(userReports.createdAt))
      .limit(limit);

    if (userId) {
      query = query.where(eq(userReports.reportedUserId, userId)) as any;
    }

    return await query;
  }

  /**
   * Report user
   */
  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    context?: any
  ): Promise<void> {
    const db = await getDb();

    await db.insert(userReports).values({
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporterId,
      reportedUserId,
      reason,
      context: JSON.stringify(context || {}),
      status: 'pending',
      createdAt: new Date(),
    });

    console.log(`[Moderation] User ${reportedUserId} reported by ${reporterId}: ${reason}`);

    // Check if user should be automatically flagged
    const reputation = await this.getUserReputation(reportedUserId);
    if (reputation.reports >= 5) {
      await this.flagUser(reportedUserId, 'Multiple user reports');
    }
  }
}

// Singleton instance
let moderationService: ModerationService | null = null;

export function initializeModeration() {
  if (!moderationService) {
    moderationService = new ModerationService();
  }
  return moderationService;
}

export function getModeration() {
  if (!moderationService) {
    throw new Error('Moderation service not initialized. Call initializeModeration() first.');
  }
  return moderationService;
}

export {
  ModerationService,
  ModerationResult,
  SpamDetectionResult,
  UserReputationScore,
  ModerationAction,
};
