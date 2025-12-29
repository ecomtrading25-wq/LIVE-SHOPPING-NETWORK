/**
 * Avatar Influencer Studio - tRPC Router
 * API endpoints for managing digital creator avatars and content
 */

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as avatarStudio from "./avatar-studio";

// ============================================================================
// AVATAR CREATORS
// ============================================================================

const avatarCreatorsRouter = router({
  /**
   * Create a new avatar creator
   */
  create: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      slug: z.string(),
      displayName: z.string(),
      age: z.number().min(21),
      category: z.enum(["home", "tech", "beauty", "fashion", "lifestyle"]),
      lookDescription: z.string().optional(),
      wardrobeStyle: z.string().optional(),
      cameraFraming: z.string().optional(),
      personality: z.string().optional(),
      contentPillars: z.array(z.string()).optional(),
      avatarImageUrl: z.string().optional(),
      coverImageUrl: z.string().optional(),
      referenceImagesUrl: z.array(z.string()).optional(),
      voiceProfileUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.createAvatarCreator(input);
    }),

  /**
   * Get all avatar creators for a channel
   */
  list: protectedProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .query(async ({ input }) => {
      return await avatarStudio.getAvatarCreators(input.channelId);
    }),

  /**
   * Get single avatar creator
   */
  get: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      const avatar = await avatarStudio.getAvatarCreator(input.id);
      if (!avatar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avatar creator not found",
        });
      }
      return avatar;
    }),

  /**
   * Update avatar creator
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      displayName: z.string().optional(),
      lookDescription: z.string().optional(),
      wardrobeStyle: z.string().optional(),
      cameraFraming: z.string().optional(),
      personality: z.string().optional(),
      contentPillars: z.array(z.string()).optional(),
      avatarImageUrl: z.string().optional(),
      coverImageUrl: z.string().optional(),
      referenceImagesUrl: z.array(z.string()).optional(),
      voiceProfileUrl: z.string().optional(),
      status: z.enum(["active", "paused", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await avatarStudio.updateAvatarCreator(id, data);
    }),

  /**
   * Get avatar analytics
   */
  analytics: protectedProcedure
    .input(z.object({
      avatarId: z.string(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return await avatarStudio.getAvatarAnalytics(input.avatarId, input.days);
    }),
});

// ============================================================================
// CONTENT CALENDAR
// ============================================================================

const contentCalendarRouter = router({
  /**
   * Schedule new content
   */
  schedule: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      avatarId: z.string(),
      scheduledFor: z.date(),
      contentType: z.enum(["post", "live", "clip", "story", "reel"]),
      platform: z.enum(["tiktok", "instagram", "youtube", "facebook", "custom"]),
      title: z.string().optional(),
      scriptId: z.string().optional(),
      hookAngle: z.string().optional(),
      productIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.scheduleContent(input);
    }),

  /**
   * Get content calendar
   */
  list: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      avatarId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.string().optional(),
      platform: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { channelId, ...filters } = input;
      return await avatarStudio.getContentCalendar(channelId, filters);
    }),

  /**
   * Update content status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["draft", "queued", "generating", "ready", "published", "failed"]),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      publishedAt: z.date().optional(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, status, ...data } = input;
      return await avatarStudio.updateContentStatus(id, status, data);
    }),

  /**
   * Update content metrics
   */
  updateMetrics: protectedProcedure
    .input(z.object({
      id: z.string(),
      views: z.number().optional(),
      likes: z.number().optional(),
      comments: z.number().optional(),
      shares: z.number().optional(),
      conversions: z.number().optional(),
      revenue: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...metrics } = input;
      return await avatarStudio.updateContentMetrics(id, metrics);
    }),

  /**
   * Get top performing content
   */
  topPerforming: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      limit: z.number().default(10),
      metric: z.enum(["views", "engagement", "revenue"]).default("views"),
    }))
    .query(async ({ input }) => {
      return await avatarStudio.getTopPerformingContent(
        input.channelId,
        input.limit,
        input.metric
      );
    }),
});

// ============================================================================
// SCRIPT LIBRARY
// ============================================================================

const scriptLibraryRouter = router({
  /**
   * Create new script
   */
  create: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      avatarId: z.string().optional(),
      title: z.string(),
      scriptType: z.enum(["live_intro", "product_demo", "price_drop", "closing", "transition", "full_show"]),
      category: z.string().optional(),
      script: z.string(),
      duration: z.number().optional(),
      cueCards: z.array(z.object({
        timestamp: z.number(),
        text: z.string(),
        action: z.string().optional(),
      })).optional(),
      hookType: z.string().optional(),
      angle: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.createScript(input);
    }),

  /**
   * Get scripts
   */
  list: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      avatarId: z.string().optional(),
      scriptType: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(["active", "archived"]).optional(),
    }))
    .query(async ({ input }) => {
      const { channelId, ...filters } = input;
      return await avatarStudio.getScripts(channelId, filters);
    }),

  /**
   * Get single script
   */
  get: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      const script = await avatarStudio.getScript(input.id);
      if (!script) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }
      return script;
    }),

  /**
   * Run compliance check
   */
  checkCompliance: protectedProcedure
    .input(z.object({
      id: z.string(),
      issues: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.runComplianceCheck(input.id, input.issues);
    }),
});

// ============================================================================
// VIDEO GENERATION
// ============================================================================

const videoGenerationRouter = router({
  /**
   * Create video generation job
   */
  create: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      contentId: z.string().optional(),
      avatarId: z.string(),
      provider: z.enum(["heygen", "synthesia", "d_id", "custom"]),
      scriptId: z.string().optional(),
      scriptText: z.string().optional(),
      audioUrl: z.string().optional(),
      anchorImageUrl: z.string().optional(),
      config: z.object({
        voice: z.string().optional(),
        style: z.string().optional(),
        background: z.string().optional(),
        resolution: z.string().optional(),
        aspectRatio: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.createVideoGenerationJob(input);
    }),

  /**
   * Get video generation jobs
   */
  list: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      avatarId: z.string().optional(),
      status: z.string().optional(),
      provider: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { channelId, ...filters } = input;
      return await avatarStudio.getVideoGenerationJobs(channelId, filters);
    }),

  /**
   * Update video job status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["queued", "processing", "completed", "failed", "cancelled"]),
      providerJobId: z.string().optional(),
      progress: z.number().optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      duration: z.number().optional(),
      fileSize: z.number().optional(),
      errorMessage: z.string().optional(),
      startedAt: z.date().optional(),
      completedAt: z.date().optional(),
      processingTime: z.number().optional(),
      creditsCost: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, status, ...data } = input;
      return await avatarStudio.updateVideoJobStatus(id, status, data);
    }),
});

// ============================================================================
// CONTENT WINNERS
// ============================================================================

const winnersRouter = router({
  /**
   * Detect winner
   */
  detect: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      contentId: z.string(),
      avatarId: z.string(),
      detectionReason: z.string(),
      views: z.number(),
      engagementRate: z.string(),
      conversionRate: z.string().optional(),
      revenue: z.string().optional(),
      hookType: z.string().optional(),
      successFactors: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.detectWinner(input);
    }),

  /**
   * Get winners
   */
  list: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      avatarId: z.string().optional(),
      status: z.enum(["active", "archived"]).optional(),
    }))
    .query(async ({ input }) => {
      const { channelId, ...filters } = input;
      return await avatarStudio.getWinners(channelId, filters);
    }),

  /**
   * Generate variants
   */
  generateVariants: protectedProcedure
    .input(z.object({
      winnerId: z.string(),
      variantIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.generateVariants(input.winnerId, input.variantIds);
    }),
});

// ============================================================================
// SPONSOR PARTNERSHIPS
// ============================================================================

const sponsorsRouter = router({
  /**
   * Create sponsor partnership
   */
  create: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      companyName: z.string(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      partnershipType: z.enum(["product_placement", "sponsored_content", "affiliate", "exclusive"]).optional(),
      category: z.string().optional(),
      dealValue: z.string().optional(),
      currency: z.string().optional(),
      paymentTerms: z.string().optional(),
      contentRequirements: z.object({
        minVideos: z.number().optional(),
        minViews: z.number().optional(),
        exclusivity: z.boolean().optional(),
        approvalRequired: z.boolean().optional(),
      }).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.createSponsorPartnership(input);
    }),

  /**
   * Get sponsor partnerships
   */
  list: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      status: z.string().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { channelId, ...filters } = input;
      return await avatarStudio.getSponsorPartnerships(channelId, filters);
    }),

  /**
   * Update sponsor status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["prospect", "contacted", "negotiating", "active", "completed", "declined"]),
      outreachStage: z.number().optional(),
      lastContactedAt: z.date().optional(),
      nextFollowUpAt: z.date().optional(),
      contractUrl: z.string().optional(),
      briefUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, status, ...data } = input;
      return await avatarStudio.updateSponsorStatus(id, status, data);
    }),

  /**
   * Update sponsor performance
   */
  updatePerformance: protectedProcedure
    .input(z.object({
      id: z.string(),
      contentDelivered: z.number().optional(),
      totalViews: z.number().optional(),
      totalRevenue: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...metrics } = input;
      return await avatarStudio.updateSponsorPerformance(id, metrics);
    }),
});

// ============================================================================
// QC CHECKS
// ============================================================================

const qcRouter = router({
  /**
   * Create QC check
   */
  create: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      contentId: z.string().optional(),
      videoJobId: z.string().optional(),
      checkType: z.enum(["uncanny_valley", "suggestive_content", "lookalike_detection", "disclosure_compliance", "brand_safety"]),
      passed: z.boolean(),
      score: z.string().optional(),
      issues: z.array(z.object({
        severity: z.enum(["low", "medium", "high", "critical"]),
        description: z.string(),
        timestamp: z.number().optional(),
      })).optional(),
      checkMethod: z.enum(["automated", "manual", "hybrid"]),
      reviewerId: z.string().optional(),
      actionTaken: z.enum(["approved", "rejected", "flagged", "edited"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await avatarStudio.createQcCheck(input);
    }),

  /**
   * Get QC checks
   */
  list: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      contentId: z.string().optional(),
      videoJobId: z.string().optional(),
      checkType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { channelId, ...filters } = input;
      return await avatarStudio.getQcChecks(channelId, filters);
    }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const avatarStudioRouter = router({
  avatars: avatarCreatorsRouter,
  content: contentCalendarRouter,
  scripts: scriptLibraryRouter,
  videoJobs: videoGenerationRouter,
  winners: winnersRouter,
  sponsors: sponsorsRouter,
  qc: qcRouter,
});
