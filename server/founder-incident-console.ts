/**
 * Founder Incident Console - Backend API
 * 
 * Provides founder-only endpoints for:
 * - Escalation management (ack/close)
 * - Policy incident viewing
 * - System timeline (SAFE_MODE flips, canary rollbacks, rebuilds)
 * 
 * Based on LSN_POLICY_AUTONOMY_MASTER.md Step 472
 */

import { z } from "zod";
import { getDbSync } from "./db";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { 
  escalations, 
  policyIncidents, 
  auditLog,
  regressionSeeds 
} from "../drizzle/schema";
import { eq, desc, and, sql, isNull } from "drizzle-orm";

// ============================================================================
// FOUNDER INCIDENT CONSOLE ROUTER
// ============================================================================

export const founderIncidentRouter = router({
  
  // --------------------------------------------------------------------------
  // Get escalations (filtered by status)
  // --------------------------------------------------------------------------
  getEscalations: publicProcedure
    .input(z.object({
      status: z.enum(["OPEN", "ACKED", "CLOSED"]).default("OPEN"),
      limit: z.number().min(1).max(500).default(200),
    }))
    .query(async ({ input, ctx }) => {
      // Founder-only check (in production, verify ctx.user.role === 'founder')
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Founder access required" });
      }

      const db = getDbSync();
      const results = await db
        .select()
        .from(escalations)
        .where(eq(escalations.status, input.status))
        .orderBy(desc(escalations.createdAt))
        .limit(input.limit);

      return {
        escalations: results,
        count: results.length,
      };
    }),

  // --------------------------------------------------------------------------
  // Acknowledge escalation
  // --------------------------------------------------------------------------
  ackEscalation: publicProcedure
    .input(z.object({
      escalationId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDbSync();
      await db
        .update(escalations)
        .set({
          status: "ACKED",
          ackByUserId: ctx.user.id.toString(),
          ackTs: new Date(),
        })
        .where(eq(escalations.id, input.escalationId));

      // Log to audit trail
      await db.insert(auditLog).values({
        channelId: "system",
        actorType: "FOUNDER",
        actorId: ctx.user.id.toString(),
        actorLabel: ctx.user.name || "Founder",
        action: "FOUNDER_ACTION:ESCALATION_ACK",
        severity: "INFO",
        refType: "ESCALATION",
        refId: input.escalationId,
        ip: ctx.ip || "",
        userAgent: ctx.userAgent || "",
        before: {},
        after: { escalationId: input.escalationId },
        meta: {},
        prevHash: null,
        entryHash: generateHash({ action: "ACK", id: input.escalationId }),
      });

      return { ok: true };
    }),

  // --------------------------------------------------------------------------
  // Close escalation
  // --------------------------------------------------------------------------
  closeEscalation: publicProcedure
    .input(z.object({
      escalationId: z.string(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDbSync();
      await db
        .update(escalations)
        .set({
          status: "CLOSED",
          notes: input.notes || null,
        })
        .where(eq(escalations.id, input.escalationId));

      await db.insert(auditLog).values({
        channelId: "system",
        actorType: "FOUNDER",
        actorId: ctx.user.id.toString(),
        actorLabel: ctx.user.name || "Founder",
        action: "FOUNDER_ACTION:ESCALATION_CLOSE",
        severity: "INFO",
        refType: "ESCALATION",
        refId: input.escalationId,
        ip: ctx.ip || "",
        userAgent: ctx.userAgent || "",
        before: {},
        after: { escalationId: input.escalationId, notes: input.notes },
        meta: {},
        prevHash: null,
        entryHash: generateHash({ action: "CLOSE", id: input.escalationId }),
      });

      return { ok: true };
    }),

  // --------------------------------------------------------------------------
  // Get policy incidents (optionally filtered by session)
  // --------------------------------------------------------------------------
  getIncidents: publicProcedure
    .input(z.object({
      sessionId: z.string().optional(),
      limit: z.number().min(1).max(500).default(200),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDbSync();
      const conditions = input.sessionId 
        ? eq(policyIncidents.sessionId, input.sessionId)
        : sql`1=1`;

      const results = await db
        .select()
        .from(policyIncidents)
        .where(conditions)
        .orderBy(desc(policyIncidents.createdAt))
        .limit(input.limit);

      return {
        incidents: results,
        count: results.length,
      };
    }),

  // --------------------------------------------------------------------------
  // Get system timeline (founder actions + auto actions + system events)
  // --------------------------------------------------------------------------
  getTimeline: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).default(200),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDbSync();
      const results = await db
        .select()
        .from(auditLog)
        .where(
          sql`${auditLog.action} LIKE 'FOUNDER_ACTION:%' 
              OR ${auditLog.action} LIKE 'AUTO_ACTION:%' 
              OR ${auditLog.action} LIKE 'SYSTEM_EVENT:%'`
        )
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit);

      return {
        timeline: results,
        count: results.length,
      };
    }),

  // --------------------------------------------------------------------------
  // Get risk radar suggestions for a session
  // --------------------------------------------------------------------------
  getRiskRadar: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      since: z.date().optional(),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Risk radar suggestions table doesn't exist yet, return empty for now
      const results: any[] = [];

      return {
        suggestions: results,
        count: results.length,
      };
    }),

  // --------------------------------------------------------------------------
  // Request seed addition (operator can request, founder approves)
  // --------------------------------------------------------------------------
  requestSeedAddition: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      chatEventId: z.string(),
      suggestedRuleId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Any authenticated user can request
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = getDbSync();
      await db.insert(regressionSeeds).values({
        id: generateId(),
        channelId: "system",
        sessionId: input.sessionId,
        chatEventId: input.chatEventId,
        ruleId: input.suggestedRuleId || null,
        textExcerpt: "Seed request",
        status: "OPEN",
        requestedBy: ctx.user?.id.toString() || null,
        decidedBy: null,
        decidedAt: null,
      });

      return { ok: true };
    }),

  // --------------------------------------------------------------------------
  // Get regression seed requests (founder review queue)
  // --------------------------------------------------------------------------
  getSeedRequests: publicProcedure
    .input(z.object({
      status: z.enum(["OPEN", "APPROVED", "REJECTED"]).default("OPEN"),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDbSync();
      const results = await db
        .select()
        .from(regressionSeeds)
        .where(eq(regressionSeeds.status, input.status))
        .orderBy(desc(regressionSeeds.createdAt))
        .limit(input.limit);

      return {
        requests: results,
        count: results.length,
      };
    }),

  // --------------------------------------------------------------------------
  // Approve/reject seed request
  // --------------------------------------------------------------------------
  decideSeedRequest: publicProcedure
    .input(z.object({
      requestId: z.string(),
      decision: z.enum(["APPROVED", "REJECTED"]),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "founder") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = getDbSync();
      await db
        .update(regressionSeeds)
        .set({
          status: input.decision,
          decidedBy: ctx.user.id.toString(),
          decidedAt: new Date(),
        })
        .where(eq(regressionSeeds.id, input.requestId));

      return { ok: true };
    }),

});

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateHash(data: any): string {
  // Simple hash for demo - in production use crypto.createHash
  return Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 32);
}
