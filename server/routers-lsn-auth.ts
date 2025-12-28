import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  adminUsers,
  staffApiKeys,
  auditLog,
} from "../drizzle/schema";
import { createHash, randomBytes } from "crypto";

/**
 * LSN Authentication, RBAC & Audit Router
 * 
 * Comprehensive authentication and authorization system for Live Shopping Network:
 * - Founder-only control plane with special key auth
 * - RBAC permissions (Admin, Finance, Trust & Safety, Support)
 * - Tamper-evident audit logging with hash chains
 * - Staff user management
 * - Permission middleware and UI gating
 * - Session management
 * - Escalation system
 * - Policy incident tracking
 */

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type StaffRole = "founder" | "admin" | "ops" | "viewer";

export type Capability =
  | "MANUAL_RELEASE_TRAIN_CONTROL"
  | "MANUAL_PUBLISH_POLICY_PACK"
  | "VIEW_AUDIT_LOG"
  | "MANAGE_STAFF"
  | "MANAGE_DISPUTES"
  | "MANAGE_REFUNDS"
  | "MANAGE_PAYOUTS"
  | "MANAGE_CREATORS"
  | "MANAGE_PRODUCTS"
  | "MANAGE_ORDERS"
  | "MANAGE_INVENTORY"
  | "MANAGE_SUPPLIERS"
  | "MANAGE_3PL"
  | "VIEW_EXECUTIVE_DASHBOARD"
  | "VIEW_FINANCIAL_REPORTS"
  | "MANAGE_PRICING"
  | "MANAGE_PROMOTIONS"
  | "MANAGE_LIVE_SHOWS"
  | "MANAGE_CREATIVE_ASSETS"
  | "VIEW_FRAUD_SCORES"
  | "MANAGE_RECONCILIATION";

const ROLE_CAPABILITIES: Record<StaffRole, Capability[]> = {
  founder: [
    "MANUAL_RELEASE_TRAIN_CONTROL",
    "MANUAL_PUBLISH_POLICY_PACK",
    "VIEW_AUDIT_LOG",
    "MANAGE_STAFF",
    "MANAGE_DISPUTES",
    "MANAGE_REFUNDS",
    "MANAGE_PAYOUTS",
    "MANAGE_CREATORS",
    "MANAGE_PRODUCTS",
    "MANAGE_ORDERS",
    "MANAGE_INVENTORY",
    "MANAGE_SUPPLIERS",
    "MANAGE_3PL",
    "VIEW_EXECUTIVE_DASHBOARD",
    "VIEW_FINANCIAL_REPORTS",
    "MANAGE_PRICING",
    "MANAGE_PROMOTIONS",
    "MANAGE_LIVE_SHOWS",
    "MANAGE_CREATIVE_ASSETS",
    "VIEW_FRAUD_SCORES",
    "MANAGE_RECONCILIATION",
  ],
  admin: [
    "VIEW_AUDIT_LOG",
    "MANAGE_DISPUTES",
    "MANAGE_REFUNDS",
    "MANAGE_PAYOUTS",
    "MANAGE_CREATORS",
    "MANAGE_PRODUCTS",
    "MANAGE_ORDERS",
    "MANAGE_INVENTORY",
    "MANAGE_SUPPLIERS",
    "MANAGE_3PL",
    "VIEW_EXECUTIVE_DASHBOARD",
    "VIEW_FINANCIAL_REPORTS",
    "MANAGE_PRICING",
    "MANAGE_PROMOTIONS",
    "MANAGE_LIVE_SHOWS",
    "MANAGE_CREATIVE_ASSETS",
    "VIEW_FRAUD_SCORES",
    "MANAGE_RECONCILIATION",
  ],
  ops: [
    "MANAGE_DISPUTES",
    "MANAGE_REFUNDS",
    "MANAGE_ORDERS",
    "MANAGE_INVENTORY",
    "MANAGE_3PL",
    "MANAGE_LIVE_SHOWS",
    "VIEW_FRAUD_SCORES",
  ],
  viewer: [],
};

// ============================================================================
// AUDIT LOGGING UTILITIES
// ============================================================================

let lastAuditHash: string | null = null;

async function getLastAuditHash(db: any): Promise<string | null> {
  if (lastAuditHash) return lastAuditHash;
  
  const [lastEntry] = await db
    .select({ entryHash: auditLog.entryHash })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(1);
  
  lastAuditHash = lastEntry?.entryHash || null;
  return lastAuditHash;
}

function computeEntryHash(
  channelId: string,
  actorType: string,
  actorId: string | null,
  action: string,
  refType: string,
  refId: string,
  before: any,
  after: any,
  prevHash: string | null
): string {
  const data = JSON.stringify({
    channelId,
    actorType,
    actorId,
    action,
    refType,
    refId,
    before,
    after,
    prevHash,
    timestamp: Date.now(),
  });
  
  return createHash("sha256").update(data).digest("hex");
}

async function writeAuditLog(
  db: any,
  params: {
    channelId: string;
    actorType: "STAFF" | "SYSTEM" | "FOUNDER" | "CREATOR" | "CUSTOMER";
    actorId: string | null;
    actorLabel?: string;
    action: string;
    severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
    refType: string;
    refId: string;
    ip?: string;
    userAgent?: string;
    before?: any;
    after?: any;
    meta?: any;
  }
): Promise<void> {
  const prevHash = await getLastAuditHash(db);
  const entryHash = computeEntryHash(
    params.channelId,
    params.actorType,
    params.actorId,
    params.action,
    params.refType,
    params.refId,
    params.before || {},
    params.after || {},
    prevHash
  );
  
  await db.insert(auditLog).values({
    id: randomBytes(16).toString("hex"),
    channelId: params.channelId,
    actorType: params.actorType,
    actorId: params.actorId,
    actorLabel: params.actorLabel,
    action: params.action,
    severity: params.severity || "INFO",
    refType: params.refType,
    refId: params.refId,
    ip: params.ip,
    userAgent: params.userAgent,
    before: params.before || {},
    after: params.after || {},
    meta: params.meta || {},
    prevHash,
    entryHash,
  });
  
  lastAuditHash = entryHash;
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

function hasCapability(role: StaffRole, customCapabilities: string[] | null, capability: Capability): boolean {
  if (customCapabilities && customCapabilities.includes(capability)) {
    return true;
  }
  return ROLE_CAPABILITIES[role]?.includes(capability) || false;
}

async function requireStaffPerm(
  db: any,
  userId: string,
  channelId: string,
  capability: Capability
): Promise<void> {
  const [staff] = await db
    .select()
    .from(adminUsers)
    .where(and(eq(adminUsers.id, userId), eq(adminUsers.status, "active")));
  
  if (!staff) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Staff user not found or inactive",
    });
  }
  
  if (!hasCapability(staff.role, staff.capabilities, capability)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing required capability: ${capability}`,
    });
  }
}

// ============================================================================
// STAFF AUTHENTICATION
// ============================================================================

export const lsnAuthRouter = router({
  // --------------------------------------------------------------------------
  // Staff User Management
  // --------------------------------------------------------------------------
  
  staff: router({
    me: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        
        const db = getDb();
        const [staff] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, ctx.user.id));
        
        if (!staff) {
          return null;
        }
        
        const capabilities = ROLE_CAPABILITIES[staff.role] || [];
        const customCaps = staff.capabilities || [];
        const allCaps = [...new Set([...capabilities, ...customCaps])];
        
        return {
          id: staff.id,
          email: staff.email,
          role: staff.role,
          capabilities: allCaps,
          status: staff.status,
        };
      }),
    
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum(["active", "disabled"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANAGE_STAFF");
        
        let query = db.select().from(adminUsers);
        
        if (input.status) {
          query = query.where(eq(adminUsers.status, input.status));
        }
        
        const staff = await query.orderBy(desc(adminUsers.createdAt));
        
        return staff.map(s => ({
          id: s.id,
          email: s.email,
          role: s.role,
          status: s.status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        email: z.string().email(),
        password: z.string().min(12),
        role: z.enum(["founder", "admin", "ops", "viewer"]),
        capabilities: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANAGE_STAFF");
        
        const passwordHash = createHash("sha256").update(input.password).digest("hex");
        const staffId = randomBytes(16).toString("hex");
        
        await db.insert(adminUsers).values({
          id: staffId,
          email: input.email,
          passwordHash,
          role: input.role,
          capabilities: input.capabilities || null,
          status: "active",
        });
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "STAFF",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "STAFF_USER_CREATED",
          severity: "INFO",
          refType: "STAFF",
          refId: staffId,
          after: { email: input.email, role: input.role },
        });
        
        return { id: staffId, email: input.email, role: input.role };
      }),
    
    update: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        staffId: z.string(),
        role: z.enum(["founder", "admin", "ops", "viewer"]).optional(),
        capabilities: z.array(z.string()).optional(),
        status: z.enum(["active", "disabled"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANAGE_STAFF");
        
        const [before] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, input.staffId));
        
        if (!before) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Staff user not found" });
        }
        
        const updates: any = {};
        if (input.role) updates.role = input.role;
        if (input.capabilities !== undefined) updates.capabilities = input.capabilities;
        if (input.status) updates.status = input.status;
        
        await db.update(adminUsers)
          .set(updates)
          .where(eq(adminUsers.id, input.staffId));
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "STAFF",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "STAFF_USER_UPDATED",
          severity: "INFO",
          refType: "STAFF",
          refId: input.staffId,
          before: { role: before.role, status: before.status },
          after: updates,
        });
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        staffId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANAGE_STAFF");
        
        const [before] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, input.staffId));
        
        if (!before) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Staff user not found" });
        }
        
        await db.update(adminUsers)
          .set({ status: "disabled" })
          .where(eq(adminUsers.id, input.staffId));
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "STAFF",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "STAFF_USER_DELETED",
          severity: "WARNING",
          refType: "STAFF",
          refId: input.staffId,
          before: { email: before.email, role: before.role, status: before.status },
        });
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // API Keys Management
  // --------------------------------------------------------------------------
  
  apiKeys: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const db = getDb();
        
        const keys = await db
          .select({
            id: staffApiKeys.id,
            label: staffApiKeys.label,
            lastUsedAt: staffApiKeys.lastUsedAt,
            expiresAt: staffApiKeys.expiresAt,
            status: staffApiKeys.status,
            createdAt: staffApiKeys.createdAt,
          })
          .from(staffApiKeys)
          .where(eq(staffApiKeys.userId, ctx.user!.id))
          .orderBy(desc(staffApiKeys.createdAt));
        
        return keys;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        label: z.string().optional(),
        expiresInDays: z.number().min(1).max(365).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        
        const apiKey = `lsn_${randomBytes(32).toString("hex")}`;
        const keyHash = createHash("sha256").update(apiKey).digest("hex");
        const keyId = randomBytes(16).toString("hex");
        
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : null;
        
        await db.insert(staffApiKeys).values({
          id: keyId,
          userId: ctx.user!.id,
          keyHash,
          label: input.label || null,
          expiresAt,
          status: "active",
        });
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "STAFF",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "API_KEY_CREATED",
          severity: "INFO",
          refType: "API_KEY",
          refId: keyId,
          after: { label: input.label, expiresAt },
        });
        
        return { id: keyId, apiKey, expiresAt };
      }),
    
    revoke: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        keyId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        
        await db.update(staffApiKeys)
          .set({ status: "revoked" })
          .where(and(
            eq(staffApiKeys.id, input.keyId),
            eq(staffApiKeys.userId, ctx.user!.id)
          ));
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "STAFF",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "API_KEY_REVOKED",
          severity: "WARNING",
          refType: "API_KEY",
          refId: input.keyId,
        });
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // Audit Log
  // --------------------------------------------------------------------------
  
  audit: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
        actorType: z.enum(["STAFF", "SYSTEM", "FOUNDER", "CREATOR", "CUSTOMER"]).optional(),
        action: z.string().optional(),
        severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
        refType: z.string().optional(),
        refId: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "VIEW_AUDIT_LOG");
        
        let query = db
          .select()
          .from(auditLog)
          .where(eq(auditLog.channelId, input.channelId));
        
        if (input.actorType) {
          query = query.where(eq(auditLog.actorType, input.actorType));
        }
        if (input.action) {
          query = query.where(eq(auditLog.action, input.action));
        }
        if (input.severity) {
          query = query.where(eq(auditLog.severity, input.severity));
        }
        if (input.refType) {
          query = query.where(eq(auditLog.refType, input.refType));
        }
        if (input.refId) {
          query = query.where(eq(auditLog.refId, input.refId));
        }
        
        const entries = await query
          .orderBy(desc(auditLog.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return entries;
      }),
    
    verify: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "VIEW_AUDIT_LOG");
        
        let query = db
          .select()
          .from(auditLog)
          .where(eq(auditLog.channelId, input.channelId))
          .orderBy(auditLog.createdAt);
        
        if (input.startDate) {
          query = query.where(sql`${auditLog.createdAt} >= ${input.startDate}`);
        }
        if (input.endDate) {
          query = query.where(sql`${auditLog.createdAt} <= ${input.endDate}`);
        }
        
        const entries = await query;
        
        let prevHash: string | null = null;
        const errors: Array<{ entryId: string; error: string }> = [];
        
        for (const entry of entries) {
          if (entry.prevHash !== prevHash) {
            errors.push({
              entryId: entry.id,
              error: `Hash chain broken: expected prevHash ${prevHash}, got ${entry.prevHash}`,
            });
          }
          
          const computedHash = computeEntryHash(
            entry.channelId,
            entry.actorType,
            entry.actorId,
            entry.action,
            entry.refType,
            entry.refId,
            entry.before,
            entry.after,
            entry.prevHash
          );
          
          if (computedHash !== entry.entryHash) {
            errors.push({
              entryId: entry.id,
              error: `Hash mismatch: computed ${computedHash}, stored ${entry.entryHash}`,
            });
          }
          
          prevHash = entry.entryHash;
        }
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "STAFF",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "AUDIT_LOG_VERIFIED",
          severity: errors.length > 0 ? "CRITICAL" : "INFO",
          refType: "AUDIT",
          refId: input.channelId,
          meta: {
            entriesChecked: entries.length,
            errorsFound: errors.length,
            errors: errors.slice(0, 10),
          },
        });
        
        return {
          valid: errors.length === 0,
          entriesChecked: entries.length,
          errorsFound: errors.length,
          errors,
        };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // Founder Escalations
  // --------------------------------------------------------------------------
  
  escalations: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum(["OPEN", "ACKED", "CLOSED"]).optional(),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        limit: z.number().min(1).max(200).default(50),
      }))
      .query(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANUAL_RELEASE_TRAIN_CONTROL");
        
        let query = db
          .select()
          .from(escalations)
          .where(eq(escalations.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(escalations.status, input.status));
        }
        if (input.severity) {
          query = query.where(eq(escalations.severity, input.severity));
        }
        
        const items = await query
          .orderBy(desc(escalations.createdAt))
          .limit(input.limit);
        
        return items;
      }),
    
    acknowledge: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        escalationId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANUAL_RELEASE_TRAIN_CONTROL");
        
        await db.update(escalations)
          .set({
            status: "ACKED",
            ackByUserId: ctx.user!.id,
            ackTs: new Date(),
          })
          .where(eq(escalations.id, input.escalationId));
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "FOUNDER",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "ESCALATION_ACKNOWLEDGED",
          severity: "INFO",
          refType: "ESCALATION",
          refId: input.escalationId,
        });
        
        return { success: true };
      }),
    
    close: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        escalationId: z.string(),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANUAL_RELEASE_TRAIN_CONTROL");
        
        await db.update(escalations)
          .set({
            status: "CLOSED",
            notes: input.notes || null,
          })
          .where(eq(escalations.id, input.escalationId));
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "FOUNDER",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "ESCALATION_CLOSED",
          severity: "INFO",
          refType: "ESCALATION",
          refId: input.escalationId,
          after: { notes: input.notes },
        });
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // Policy Incidents
  // --------------------------------------------------------------------------
  
  policyIncidents: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        sessionId: z.string().optional(),
        severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
        limit: z.number().min(1).max(200).default(50),
      }))
      .query(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANUAL_RELEASE_TRAIN_CONTROL");
        
        let query = db
          .select()
          .from(policyIncidents)
          .where(eq(policyIncidents.channelId, input.channelId));
        
        if (input.sessionId) {
          query = query.where(eq(policyIncidents.sessionId, input.sessionId));
        }
        if (input.severity) {
          query = query.where(eq(policyIncidents.severity, input.severity));
        }
        
        const items = await query
          .orderBy(desc(policyIncidents.createdAt))
          .limit(input.limit);
        
        return items;
      }),
  }),
  
  // --------------------------------------------------------------------------
  // Regression Seeds
  // --------------------------------------------------------------------------
  
  regressionSeeds: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum(["OPEN", "APPROVED", "REJECTED"]).optional(),
        limit: z.number().min(1).max(200).default(50),
      }))
      .query(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANUAL_RELEASE_TRAIN_CONTROL");
        
        let query = db
          .select()
          .from(regressionSeeds)
          .where(eq(regressionSeeds.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(regressionSeeds.status, input.status));
        }
        
        const items = await query
          .orderBy(desc(regressionSeeds.createdAt))
          .limit(input.limit);
        
        return items;
      }),
    
    approve: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        seedId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANUAL_RELEASE_TRAIN_CONTROL");
        
        await db.update(regressionSeeds)
          .set({
            status: "APPROVED",
            decidedBy: ctx.user!.id,
            decidedAt: new Date(),
          })
          .where(eq(regressionSeeds.id, input.seedId));
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "FOUNDER",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "REGRESSION_SEED_APPROVED",
          severity: "INFO",
          refType: "REGRESSION_SEED",
          refId: input.seedId,
        });
        
        return { success: true };
      }),
    
    reject: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        seedId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await requireStaffPerm(db, ctx.user!.id, input.channelId, "MANUAL_RELEASE_TRAIN_CONTROL");
        
        await db.update(regressionSeeds)
          .set({
            status: "REJECTED",
            decidedBy: ctx.user!.id,
            decidedAt: new Date(),
          })
          .where(eq(regressionSeeds.id, input.seedId));
        
        await writeAuditLog(db, {
          channelId: input.channelId,
          actorType: "FOUNDER",
          actorId: ctx.user!.id,
          actorLabel: ctx.user!.email,
          action: "REGRESSION_SEED_REJECTED",
          severity: "INFO",
          refType: "REGRESSION_SEED",
          refId: input.seedId,
        });
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // Permissions Check (for UI gating)
  // --------------------------------------------------------------------------
  
  checkPermissions: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      capabilities: z.array(z.string()),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      
      const [staff] = await db
        .select()
        .from(adminUsers)
        .where(and(eq(adminUsers.id, ctx.user!.id), eq(adminUsers.status, "active")));
      
      if (!staff) {
        return input.capabilities.reduce((acc, cap) => ({ ...acc, [cap]: false }), {});
      }
      
      const result: Record<string, boolean> = {};
      for (const cap of input.capabilities) {
        result[cap] = hasCapability(staff.role, staff.capabilities, cap as Capability);
      }
      
      return result;
    }),
});
