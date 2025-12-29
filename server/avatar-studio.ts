/**
 * Avatar Influencer Studio - Backend Service
 * Manages digital creator avatars, content calendar, scripts, and video generation
 */

import { getDbSync } from "./db";

const db = getDbSync();
import { 
  avatarCreators, 
  contentCalendar, 
  scriptLibrary,
  videoGenerationJobs,
  contentWinners,
  sponsorPartnerships,
  avatarQcChecks 
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// AVATAR CREATORS
// ============================================================================

export async function createAvatarCreator(data: {
  channelId: string;
  slug: string;
  displayName: string;
  age: number;
  category: "home" | "tech" | "beauty" | "fashion" | "lifestyle";
  lookDescription?: string;
  wardrobeStyle?: string;
  cameraFraming?: string;
  personality?: string;
  contentPillars?: string[];
  avatarImageUrl?: string;
  coverImageUrl?: string;
  referenceImagesUrl?: string[];
  voiceProfileUrl?: string;
}) {
  const id = nanoid();
  
  await db.insert(avatarCreators).values({
    id,
    ...data,
    brandSafety: {
      noSuggestive: true,
      noLookalike: true,
      originalFace: true,
      age21Plus: true,
    },
  });
  
  return { id };
}

export async function getAvatarCreators(channelId: string) {
  return await db
    .select()
    .from(avatarCreators)
    .where(eq(avatarCreators.channelId, channelId))
    .orderBy(desc(avatarCreators.createdAt));
}

export async function getAvatarCreator(id: string) {
  const [avatar] = await db
    .select()
    .from(avatarCreators)
    .where(eq(avatarCreators.id, id))
    .limit(1);
  
  return avatar;
}

export async function updateAvatarCreator(
  id: string,
  data: Partial<{
    displayName: string;
    lookDescription: string;
    wardrobeStyle: string;
    cameraFraming: string;
    personality: string;
    contentPillars: string[];
    avatarImageUrl: string;
    coverImageUrl: string;
    referenceImagesUrl: string[];
    voiceProfileUrl: string;
    status: "active" | "paused" | "archived";
  }>
) {
  await db
    .update(avatarCreators)
    .set(data)
    .where(eq(avatarCreators.id, id));
  
  return { success: true };
}

export async function updateAvatarMetrics(
  id: string,
  metrics: {
    totalVideos?: number;
    totalViews?: number;
    totalRevenue?: string;
    avgEngagementRate?: string;
  }
) {
  await db
    .update(avatarCreators)
    .set(metrics)
    .where(eq(avatarCreators.id, id));
  
  return { success: true };
}

// ============================================================================
// CONTENT CALENDAR
// ============================================================================

export async function scheduleContent(data: {
  channelId: string;
  avatarId: string;
  scheduledFor: Date;
  contentType: "post" | "live" | "clip" | "story" | "reel";
  platform: "tiktok" | "instagram" | "youtube" | "facebook" | "custom";
  title?: string;
  scriptId?: string;
  hookAngle?: string;
  productIds?: string[];
}) {
  const id = nanoid();
  
  await db.insert(contentCalendar).values({
    id,
    ...data,
    status: "draft",
  });
  
  return { id };
}

export async function getContentCalendar(
  channelId: string,
  filters?: {
    avatarId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    platform?: string;
  }
) {
  let query = db
    .select()
    .from(contentCalendar)
    .where(eq(contentCalendar.channelId, channelId));
  
  // Apply filters
  const conditions = [eq(contentCalendar.channelId, channelId)];
  
  if (filters?.avatarId) {
    conditions.push(eq(contentCalendar.avatarId, filters.avatarId));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(contentCalendar.scheduledFor, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(contentCalendar.scheduledFor, filters.endDate));
  }
  
  if (filters?.status) {
    conditions.push(eq(contentCalendar.status, filters.status as any));
  }
  
  if (filters?.platform) {
    conditions.push(eq(contentCalendar.platform, filters.platform as any));
  }
  
  return await db
    .select()
    .from(contentCalendar)
    .where(and(...conditions))
    .orderBy(contentCalendar.scheduledFor);
}

export async function updateContentStatus(
  id: string,
  status: "draft" | "queued" | "generating" | "ready" | "published" | "failed",
  data?: {
    videoUrl?: string;
    thumbnailUrl?: string;
    publishedAt?: Date;
    errorMessage?: string;
  }
) {
  await db
    .update(contentCalendar)
    .set({ status, ...data })
    .where(eq(contentCalendar.id, id));
  
  return { success: true };
}

export async function updateContentMetrics(
  id: string,
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    conversions?: number;
    revenue?: string;
  }
) {
  await db
    .update(contentCalendar)
    .set(metrics)
    .where(eq(contentCalendar.id, id));
  
  return { success: true };
}

// ============================================================================
// SCRIPT LIBRARY
// ============================================================================

export async function createScript(data: {
  channelId: string;
  avatarId?: string;
  title: string;
  scriptType: "live_intro" | "product_demo" | "price_drop" | "closing" | "transition" | "full_show";
  category?: string;
  script: string;
  duration?: number;
  cueCards?: Array<{
    timestamp: number;
    text: string;
    action?: string;
  }>;
  hookType?: string;
  angle?: string;
  tags?: string[];
}) {
  const id = nanoid();
  
  await db.insert(scriptLibrary).values({
    id,
    ...data,
  });
  
  return { id };
}

export async function getScripts(
  channelId: string,
  filters?: {
    avatarId?: string;
    scriptType?: string;
    category?: string;
    status?: "active" | "archived";
  }
) {
  const conditions = [eq(scriptLibrary.channelId, channelId)];
  
  if (filters?.avatarId) {
    conditions.push(eq(scriptLibrary.avatarId, filters.avatarId));
  }
  
  if (filters?.scriptType) {
    conditions.push(eq(scriptLibrary.scriptType, filters.scriptType as any));
  }
  
  if (filters?.category) {
    conditions.push(eq(scriptLibrary.category, filters.category));
  }
  
  if (filters?.status) {
    conditions.push(eq(scriptLibrary.status, filters.status));
  }
  
  return await db
    .select()
    .from(scriptLibrary)
    .where(and(...conditions))
    .orderBy(desc(scriptLibrary.createdAt));
}

export async function getScript(id: string) {
  const [script] = await db
    .select()
    .from(scriptLibrary)
    .where(eq(scriptLibrary.id, id))
    .limit(1);
  
  return script;
}

export async function updateScriptPerformance(
  id: string,
  metrics: {
    timesUsed?: number;
    avgEngagement?: string;
    avgConversion?: string;
  }
) {
  await db
    .update(scriptLibrary)
    .set(metrics)
    .where(eq(scriptLibrary.id, id));
  
  return { success: true };
}

export async function runComplianceCheck(
  id: string,
  issues: string[]
) {
  await db
    .update(scriptLibrary)
    .set({
      complianceChecked: true,
      complianceIssues: issues,
    })
    .where(eq(scriptLibrary.id, id));
  
  return { success: true, passed: issues.length === 0 };
}

// ============================================================================
// VIDEO GENERATION
// ============================================================================

export async function createVideoGenerationJob(data: {
  channelId: string;
  contentId?: string;
  avatarId: string;
  provider: "heygen" | "synthesia" | "d_id" | "custom";
  scriptId?: string;
  scriptText?: string;
  audioUrl?: string;
  anchorImageUrl?: string;
  config?: {
    voice?: string;
    style?: string;
    background?: string;
    resolution?: string;
    aspectRatio?: string;
  };
}) {
  const id = nanoid();
  
  await db.insert(videoGenerationJobs).values({
    id,
    ...data,
    status: "queued",
    queuedAt: new Date(),
  });
  
  return { id };
}

export async function getVideoGenerationJobs(
  channelId: string,
  filters?: {
    avatarId?: string;
    status?: string;
    provider?: string;
  }
) {
  const conditions = [eq(videoGenerationJobs.channelId, channelId)];
  
  if (filters?.avatarId) {
    conditions.push(eq(videoGenerationJobs.avatarId, filters.avatarId));
  }
  
  if (filters?.status) {
    conditions.push(eq(videoGenerationJobs.status, filters.status as any));
  }
  
  if (filters?.provider) {
    conditions.push(eq(videoGenerationJobs.provider, filters.provider as any));
  }
  
  return await db
    .select()
    .from(videoGenerationJobs)
    .where(and(...conditions))
    .orderBy(desc(videoGenerationJobs.createdAt));
}

export async function updateVideoJobStatus(
  id: string,
  status: "queued" | "processing" | "completed" | "failed" | "cancelled",
  data?: {
    providerJobId?: string;
    progress?: number;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    fileSize?: number;
    errorMessage?: string;
    startedAt?: Date;
    completedAt?: Date;
    processingTime?: number;
    creditsCost?: string;
  }
) {
  await db
    .update(videoGenerationJobs)
    .set({ status, ...data })
    .where(eq(videoGenerationJobs.id, id));
  
  return { success: true };
}

// ============================================================================
// WINNER DETECTION
// ============================================================================

export async function detectWinner(data: {
  channelId: string;
  contentId: string;
  avatarId: string;
  detectionReason: string;
  views: number;
  engagementRate: string;
  conversionRate?: string;
  revenue?: string;
  hookType?: string;
  successFactors?: string[];
}) {
  const id = nanoid();
  
  await db.insert(contentWinners).values({
    id,
    ...data,
    detectedAt: new Date(),
  });
  
  return { id };
}

export async function getWinners(
  channelId: string,
  filters?: {
    avatarId?: string;
    status?: "active" | "archived";
  }
) {
  const conditions = [eq(contentWinners.channelId, channelId)];
  
  if (filters?.avatarId) {
    conditions.push(eq(contentWinners.avatarId, filters.avatarId));
  }
  
  if (filters?.status) {
    conditions.push(eq(contentWinners.status, filters.status));
  }
  
  return await db
    .select()
    .from(contentWinners)
    .where(and(...conditions))
    .orderBy(desc(contentWinners.detectedAt));
}

export async function generateVariants(
  winnerId: string,
  variantIds: string[]
) {
  await db
    .update(contentWinners)
    .set({
      variantsGenerated: variantIds.length,
      variantIds,
    })
    .where(eq(contentWinners.id, winnerId));
  
  return { success: true };
}

// ============================================================================
// SPONSOR PARTNERSHIPS
// ============================================================================

export async function createSponsorPartnership(data: {
  channelId: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  partnershipType?: "product_placement" | "sponsored_content" | "affiliate" | "exclusive";
  category?: string;
  dealValue?: string;
  currency?: string;
  paymentTerms?: string;
  contentRequirements?: {
    minVideos?: number;
    minViews?: number;
    exclusivity?: boolean;
    approvalRequired?: boolean;
  };
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}) {
  const id = nanoid();
  
  await db.insert(sponsorPartnerships).values({
    id,
    ...data,
    status: "prospect",
  });
  
  return { id };
}

export async function getSponsorPartnerships(
  channelId: string,
  filters?: {
    status?: string;
    category?: string;
  }
) {
  const conditions = [eq(sponsorPartnerships.channelId, channelId)];
  
  if (filters?.status) {
    conditions.push(eq(sponsorPartnerships.status, filters.status as any));
  }
  
  if (filters?.category) {
    conditions.push(eq(sponsorPartnerships.category, filters.category));
  }
  
  return await db
    .select()
    .from(sponsorPartnerships)
    .where(and(...conditions))
    .orderBy(desc(sponsorPartnerships.createdAt));
}

export async function updateSponsorStatus(
  id: string,
  status: "prospect" | "contacted" | "negotiating" | "active" | "completed" | "declined",
  data?: {
    outreachStage?: number;
    lastContactedAt?: Date;
    nextFollowUpAt?: Date;
    contractUrl?: string;
    briefUrl?: string;
    notes?: string;
  }
) {
  await db
    .update(sponsorPartnerships)
    .set({ status, ...data })
    .where(eq(sponsorPartnerships.id, id));
  
  return { success: true };
}

export async function updateSponsorPerformance(
  id: string,
  metrics: {
    contentDelivered?: number;
    totalViews?: number;
    totalRevenue?: string;
  }
) {
  await db
    .update(sponsorPartnerships)
    .set(metrics)
    .where(eq(sponsorPartnerships.id, id));
  
  return { success: true };
}

// ============================================================================
// QC CHECKS
// ============================================================================

export async function createQcCheck(data: {
  channelId: string;
  contentId?: string;
  videoJobId?: string;
  checkType: "uncanny_valley" | "suggestive_content" | "lookalike_detection" | "disclosure_compliance" | "brand_safety";
  passed: boolean;
  score?: string;
  issues?: Array<{
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    timestamp?: number;
  }>;
  checkMethod: "automated" | "manual" | "hybrid";
  reviewerId?: string;
  actionTaken?: "approved" | "rejected" | "flagged" | "edited";
  notes?: string;
}) {
  const id = nanoid();
  
  await db.insert(avatarQcChecks).values({
    id,
    ...data,
  });
  
  return { id, passed: data.passed };
}

export async function getQcChecks(
  channelId: string,
  filters?: {
    contentId?: string;
    videoJobId?: string;
    checkType?: string;
  }
) {
  const conditions = [eq(avatarQcChecks.channelId, channelId)];
  
  if (filters?.contentId) {
    conditions.push(eq(avatarQcChecks.contentId, filters.contentId));
  }
  
  if (filters?.videoJobId) {
    conditions.push(eq(avatarQcChecks.videoJobId, filters.videoJobId));
  }
  
  if (filters?.checkType) {
    conditions.push(eq(avatarQcChecks.checkType, filters.checkType as any));
  }
  
  return await db
    .select()
    .from(avatarQcChecks)
    .where(and(...conditions))
    .orderBy(desc(avatarQcChecks.createdAt));
}

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

export async function getAvatarAnalytics(avatarId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get content performance
  const content = await db
    .select()
    .from(contentCalendar)
    .where(
      and(
        eq(contentCalendar.avatarId, avatarId),
        gte(contentCalendar.publishedAt, startDate)
      )
    );
  
  const totalViews = content.reduce((sum, c) => sum + (c.views || 0), 0);
  const totalLikes = content.reduce((sum, c) => sum + (c.likes || 0), 0);
  const totalComments = content.reduce((sum, c) => sum + (c.comments || 0), 0);
  const totalShares = content.reduce((sum, c) => sum + (c.shares || 0), 0);
  const totalConversions = content.reduce((sum, c) => sum + (c.conversions || 0), 0);
  const totalRevenue = content.reduce((sum, c) => sum + parseFloat(c.revenue || "0"), 0);
  
  const avgEngagementRate = content.length > 0
    ? (totalLikes + totalComments + totalShares) / totalViews * 100
    : 0;
  
  const avgConversionRate = totalViews > 0
    ? (totalConversions / totalViews) * 100
    : 0;
  
  return {
    totalContent: content.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalConversions,
    totalRevenue: totalRevenue.toFixed(2),
    avgEngagementRate: avgEngagementRate.toFixed(2),
    avgConversionRate: avgConversionRate.toFixed(2),
    contentByType: content.reduce((acc, c) => {
      acc[c.contentType] = (acc[c.contentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    contentByPlatform: content.reduce((acc, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export async function getTopPerformingContent(
  channelId: string,
  limit: number = 10,
  metric: "views" | "engagement" | "revenue" = "views"
) {
  let orderBy;
  
  switch (metric) {
    case "views":
      orderBy = desc(contentCalendar.views);
      break;
    case "engagement":
      orderBy = desc(sql`(${contentCalendar.likes} + ${contentCalendar.comments} + ${contentCalendar.shares})`);
      break;
    case "revenue":
      orderBy = desc(contentCalendar.revenue);
      break;
  }
  
  return await db
    .select()
    .from(contentCalendar)
    .where(
      and(
        eq(contentCalendar.channelId, channelId),
        eq(contentCalendar.status, "published")
      )
    )
    .orderBy(orderBy)
    .limit(limit);
}
