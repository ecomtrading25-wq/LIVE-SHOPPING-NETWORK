/**
 * Advanced Security and Rate Limiting System
 * Authentication, authorization, input validation, rate limiting, DDoS protection, security headers
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  type: 'ip_block' | 'rate_limit' | 'geo_block' | 'user_agent_block' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  priority: number;
}

export interface SecurityEvent {
  id: string;
  type: 'blocked_request' | 'rate_limit_exceeded' | 'suspicious_activity' | 'authentication_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userId?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface InputValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'url' | 'uuid' | 'date' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
    this.startCleanup();
  }

  // Initialize default rate limit configs
  private initializeDefaultConfigs() {
    // Global rate limit
    this.configs.set('global', {
      windowMs: 60000, // 1 minute
      maxRequests: 100
    });

    // API rate limit
    this.configs.set('api', {
      windowMs: 60000,
      maxRequests: 60
    });

    // Authentication rate limit
    this.configs.set('auth', {
      windowMs: 900000, // 15 minutes
      maxRequests: 5,
      message: 'Too many authentication attempts'
    });

    // Order creation rate limit
    this.configs.set('order', {
      windowMs: 3600000, // 1 hour
      maxRequests: 10
    });

    // Search rate limit
    this.configs.set('search', {
      windowMs: 60000,
      maxRequests: 30
    });
  }

  // Check rate limit
  async check(key: string, identifier: string, config?: RateLimitConfig): Promise<RateLimitInfo> {
    const rateLimitConfig = config || this.configs.get(key) || this.configs.get('global')!;
    const requestKey = `${key}:${identifier}`;

    // Get existing requests
    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;
    
    let requests = this.requests.get(requestKey) || [];
    
    // Filter out old requests
    requests = requests.filter(time => time > windowStart);

    // Check if limit exceeded
    const current = requests.length;
    const remaining = Math.max(0, rateLimitConfig.maxRequests - current);
    const resetTime = new Date(now + rateLimitConfig.windowMs);

    if (current >= rateLimitConfig.maxRequests) {
      return {
        limit: rateLimitConfig.maxRequests,
        current,
        remaining: 0,
        resetTime
      };
    }

    // Add current request
    requests.push(now);
    this.requests.set(requestKey, requests);

    return {
      limit: rateLimitConfig.maxRequests,
      current: current + 1,
      remaining: remaining - 1,
      resetTime
    };
  }

  // Check if rate limit exceeded
  async isRateLimited(key: string, identifier: string, config?: RateLimitConfig): Promise<boolean> {
    const info = await this.check(key, identifier, config);
    return info.remaining <= 0;
  }

  // Reset rate limit for identifier
  reset(key: string, identifier: string) {
    const requestKey = `${key}:${identifier}`;
    this.requests.delete(requestKey);
  }

  // Get rate limit info
  async getInfo(key: string, identifier: string): Promise<RateLimitInfo> {
    return await this.check(key, identifier);
  }

  // Start cleanup interval
  private startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  // Cleanup old requests
  private cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, requests] of this.requests.entries()) {
      const filtered = requests.filter(time => time > now - 3600000); // Keep last hour
      
      if (filtered.length === 0) {
        this.requests.delete(key);
        cleaned++;
      } else if (filtered.length < requests.length) {
        this.requests.set(key, filtered);
      }
    }

    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`);
    }
  }

  // Add custom config
  addConfig(key: string, config: RateLimitConfig) {
    this.configs.set(key, config);
  }

  // Get all configs
  getConfigs(): Map<string, RateLimitConfig> {
    return this.configs;
  }
}

// ============================================================================
// INPUT VALIDATOR
// ============================================================================

class InputValidator {
  // Validate input against rules
  validate(input: Record<string, any>, rules: InputValidationRule[]): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      const value = input[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`
        });
        continue;
      }

      // Skip validation if not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      const typeError = this.validateType(value, rule);
      if (typeError) {
        errors.push({ field: rule.field, message: typeError });
        continue;
      }

      // String validations
      if (rule.type === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.minLength} characters`
          });
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at most ${rule.maxLength} characters`
          });
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({
            field: rule.field,
            message: `${rule.field} format is invalid`
          });
        }
      }

      // Number validations
      if (rule.type === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at least ${rule.min}`
          });
        }

        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: rule.field,
            message: `${rule.field} must be at most ${rule.max}`
          });
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be one of: ${rule.enum.join(', ')}`
        });
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push({
            field: rule.field,
            message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid`
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate type
  private validateType(value: any, rule: InputValidationRule): string | null {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${rule.field} must be a string`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${rule.field} must be a number`;
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return `${rule.field} must be a valid email`;
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return `${rule.field} must be a valid URL`;
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUUID(value)) {
          return `${rule.field} must be a valid UUID`;
        }
        break;

      case 'date':
        if (!(value instanceof Date) && !this.isValidDate(value)) {
          return `${rule.field} must be a valid date`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${rule.field} must be a boolean`;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return `${rule.field} must be an array`;
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `${rule.field} must be an object`;
        }
        break;
    }

    return null;
  }

  // Email validation
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // URL validation
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // UUID validation
  private isValidUUID(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  // Date validation
  private isValidDate(date: any): boolean {
    const timestamp = Date.parse(date);
    return !isNaN(timestamp);
  }

  // Sanitize HTML
  sanitizeHtml(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Sanitize SQL
  sanitizeSql(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  // Validate and sanitize user input
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000); // Limit length
  }
}

// ============================================================================
// SECURITY MANAGER
// ============================================================================

class SecurityManager {
  private rules: Map<string, SecurityRule> = new Map();
  private events: SecurityEvent[] = [];
  private blockedIPs: Set<string> = new Set();
  private blockedUserAgents: Set<string> = new Set();

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default security rules
  private initializeDefaultRules() {
    // Block suspicious user agents
    this.addRule({
      id: 'block-bots',
      name: 'Block Malicious Bots',
      type: 'user_agent_block',
      enabled: true,
      config: {
        patterns: [
          /bot/i,
          /crawler/i,
          /spider/i,
          /scraper/i
        ]
      },
      priority: 1
    });

    // Rate limit aggressive IPs
    this.addRule({
      id: 'aggressive-ip-limit',
      name: 'Limit Aggressive IPs',
      type: 'rate_limit',
      enabled: true,
      config: {
        windowMs: 60000,
        maxRequests: 100
      },
      priority: 2
    });
  }

  // Add security rule
  addRule(rule: SecurityRule) {
    this.rules.set(rule.id, rule);
  }

  // Remove security rule
  removeRule(id: string) {
    this.rules.delete(id);
  }

  // Check if request should be blocked
  async checkRequest(req: {
    ip: string;
    userAgent?: string;
    path: string;
    method: string;
  }): Promise<{ allowed: boolean; reason?: string }> {
    // Check blocked IPs
    if (this.blockedIPs.has(req.ip)) {
      this.logEvent({
        type: 'blocked_request',
        severity: 'high',
        ipAddress: req.ip,
        userAgent: req.userAgent,
        details: { reason: 'IP blocked' }
      });

      return {
        allowed: false,
        reason: 'IP address is blocked'
      };
    }

    // Check blocked user agents
    if (req.userAgent && this.isBlockedUserAgent(req.userAgent)) {
      this.logEvent({
        type: 'blocked_request',
        severity: 'medium',
        ipAddress: req.ip,
        userAgent: req.userAgent,
        details: { reason: 'User agent blocked' }
      });

      return {
        allowed: false,
        reason: 'User agent is blocked'
      };
    }

    // Check security rules
    const sortedRules = Array.from(this.rules.values())
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      const result = await this.checkRule(rule, req);
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true };
  }

  // Check individual rule
  private async checkRule(
    rule: SecurityRule,
    req: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    switch (rule.type) {
      case 'user_agent_block':
        if (req.userAgent) {
          const patterns = rule.config.patterns || [];
          for (const pattern of patterns) {
            if (pattern.test(req.userAgent)) {
              return {
                allowed: false,
                reason: 'User agent blocked by security rule'
              };
            }
          }
        }
        break;

      case 'ip_block':
        const blockedIPs = rule.config.ips || [];
        if (blockedIPs.includes(req.ip)) {
          return {
            allowed: false,
            reason: 'IP blocked by security rule'
          };
        }
        break;
    }

    return { allowed: true };
  }

  // Check if user agent is blocked
  private isBlockedUserAgent(userAgent: string): boolean {
    for (const blocked of this.blockedUserAgents) {
      if (userAgent.includes(blocked)) {
        return true;
      }
    }
    return false;
  }

  // Block IP address
  blockIP(ip: string, reason?: string) {
    this.blockedIPs.add(ip);
    this.logEvent({
      type: 'blocked_request',
      severity: 'high',
      ipAddress: ip,
      details: { reason: reason || 'Manually blocked' }
    });
  }

  // Unblock IP address
  unblockIP(ip: string) {
    this.blockedIPs.delete(ip);
  }

  // Block user agent
  blockUserAgent(userAgent: string) {
    this.blockedUserAgents.add(userAgent);
  }

  // Unblock user agent
  unblockUserAgent(userAgent: string) {
    this.blockedUserAgents.delete(userAgent);
  }

  // Log security event
  private logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }

    console.log(`[Security] ${event.severity.toUpperCase()}: ${event.type} from ${event.ipAddress}`);
  }

  // Get security events
  getEvents(filters?: {
    type?: string;
    severity?: string;
    ipAddress?: string;
  }): SecurityEvent[] {
    let filtered = this.events;

    if (filters?.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters?.ipAddress) {
      filtered = filtered.filter(e => e.ipAddress === filters.ipAddress);
    }

    return filtered;
  }

  // Get blocked IPs
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  // Get security stats
  getStats() {
    const events = this.events;
    const last24h = events.filter(e => 
      e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    return {
      totalEvents: events.length,
      last24Hours: last24h.length,
      blockedIPs: this.blockedIPs.size,
      blockedUserAgents: this.blockedUserAgents.size,
      eventsBySeverity: {
        low: events.filter(e => e.severity === 'low').length,
        medium: events.filter(e => e.severity === 'medium').length,
        high: events.filter(e => e.severity === 'high').length,
        critical: events.filter(e => e.severity === 'critical').length
      },
      eventsByType: {
        blocked_request: events.filter(e => e.type === 'blocked_request').length,
        rate_limit_exceeded: events.filter(e => e.type === 'rate_limit_exceeded').length,
        suspicious_activity: events.filter(e => e.type === 'suspicious_activity').length,
        authentication_failure: events.filter(e => e.type === 'authentication_failure').length
      }
    };
  }
}

// ============================================================================
// SECURITY HEADERS MANAGER
// ============================================================================

class SecurityHeadersManager {
  // Get security headers
  getHeaders(): Record<string, string> {
    return {
      // Prevent clickjacking
      'X-Frame-Options': 'SAMEORIGIN',
      
      // Prevent MIME sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Content Security Policy
      'Content-Security-Policy': this.getCSP(),
      
      // Permissions Policy
      'Permissions-Policy': this.getPermissionsPolicy(),
      
      // HSTS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
  }

  // Get Content Security Policy
  private getCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' wss: https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  // Get Permissions Policy
  private getPermissionsPolicy(): string {
    return [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', ');
  }

  // Get CORS headers
  getCORSHeaders(origin?: string): Record<string, string> {
    const allowedOrigins = [
      'https://liveshop.example.com',
      'https://www.liveshop.example.com'
    ];

    const isAllowed = origin && allowedOrigins.includes(origin);

    return {
      'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };
  }
}

// ============================================================================
// PASSWORD SECURITY
// ============================================================================

class PasswordSecurity {
  // Validate password strength
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check common passwords
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common, please choose a different one');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Check if password is common
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', '1234567', 'letmein', 'trustno1', 'dragon'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  // Calculate password strength score
  calculateStrength(password: string): number {
    let score = 0;

    // Length
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    return Math.min(100, score);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const rateLimiter = new RateLimiter();
export const inputValidator = new InputValidator();
export const securityManager = new SecurityManager();
export const securityHeaders = new SecurityHeadersManager();
export const passwordSecurity = new PasswordSecurity();

// Helper functions
export async function checkRateLimit(key: string, identifier: string): Promise<RateLimitInfo> {
  return await rateLimiter.check(key, identifier);
}

export function validateInput(input: Record<string, any>, rules: InputValidationRule[]): ValidationResult {
  return inputValidator.validate(input, rules);
}

export async function checkSecurity(req: any): Promise<{ allowed: boolean; reason?: string }> {
  return await securityManager.checkRequest(req);
}

export function getSecurityHeaders(): Record<string, string> {
  return securityHeaders.getHeaders();
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  return passwordSecurity.validatePassword(password);
}
