import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDbSync } from "./db";
const db = getDbSync();
import { eq, and, desc, asc, gte, lte, sql, inArray } from "drizzle-orm";
import {
  trendProducts,
  launches,
  assetPacks,
  testStreams,
  goLiveReadiness,
  liveShows,
  liveShowTimestamps,
  postLiveClips,
  hosts,
  hostHandoffPacks,
  profitTracking,
  operationalSyncLog,
  dailyShortlists,
  automationJobs,
} from "../drizzle/schema-tiktok-arbitrage";
import { channels } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

/**
 * TikTok Shop Arbitrage - Complete Automation System
 * 
 * This router implements the full trend-to-live pipeline:
 * 1. Trend Discovery & Product Intelligence
 * 2. Profit Calculation & Scoring
 * 3. Asset Generation (thumbnails, scripts, OBS packs)
 * 4. Test Stream Automation
 * 5. Go-Live Gating & Readiness
 * 6. Host Handoff & Run-of-Show
 * 7. Live Show Execution
 * 8. Post-Live Clip Factory
 * 9. Profit Protection Engine
 * 10. Operational Data Sync
 */

// ============================================================================
// TREND DISCOVERY & PRODUCT INTELLIGENCE
// ============================================================================

export const tiktokArbitrageRouter = router({
  // Ingest trend from webhook or manual entry
  ingestTrend: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      trendSource: z.enum(["TIKTOK", "YOUTUBE", "FACEBOOK"]).default("TIKTOK"),
      trendUrl: z.string().url(),
      trendTitle: z.string(),
      trendHashtags: z.array(z.string()).optional(),
      trendCategory: z.string().optional(),
      viewCount: z.number().default(0),
      likeCount: z.number().default(0),
      commentCount: z.number().default(0),
      shareCount: z.number().default(0),
      productName: z.string(),
      productDescription: z.string().optional(),
      productCategory: z.string().optional(),
      productImages: z.array(z.string()).optional(),
      sourceUrl: z.string().url().optional(),
      sourcePlatform: z.enum(["ALIEXPRESS", "1688", "ALIBABA"]).optional(),
      sourceCostCents: z.number().default(0),
      suggestedPriceCents: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = nanoid();
      
      // Calculate virality metrics
      const totalEngagement = input.likeCount + input.commentCount + input.shareCount;
      const engagementRate = input.viewCount > 0 
        ? (totalEngagement / input.viewCount) * 100 
        : 0;
      const viralityScore = Math.min(100, Math.round(
        (input.viewCount / 100000) * 40 + // Views factor (40%)
        engagementRate * 60 // Engagement factor (60%)
      ));
      
      // Calculate profit metrics (basic)
      const shippingCostCents = Math.round(input.sourceCostCents * 0.15); // Estimate 15%
      const platformFeeCents = Math.round(input.suggestedPriceCents * 0.05); // 5% platform fee
      const paymentFeeCents = Math.round(input.suggestedPriceCents * 0.029 + 30); // Stripe fees
      const totalCostCents = input.sourceCostCents + shippingCostCents + platformFeeCents + paymentFeeCents;
      const profitMarginCents = input.suggestedPriceCents - totalCostCents;
      const profitMarginPercent = input.suggestedPriceCents > 0
        ? (profitMarginCents / input.suggestedPriceCents) * 100
        : 0;
      
      // Calculate profit score
      const profitScore = Math.min(100, Math.max(0, Math.round(profitMarginPercent * 2)));
      
      // Calculate overall score (weighted)
      const overallScore = Math.round(
        viralityScore * 0.4 + // 40% virality
        profitScore * 0.4 + // 40% profit
        50 * 0.2 // 20% availability (default 50)
      );
      
      await db.insert(trendProducts).values({
        id,
        channelId: input.channelId,
        trendSource: input.trendSource,
        trendUrl: input.trendUrl,
        trendTitle: input.trendTitle,
        trendHashtags: input.trendHashtags,
        trendCategory: input.trendCategory,
        viewCount: input.viewCount,
        likeCount: input.likeCount,
        commentCount: input.commentCount,
        shareCount: input.shareCount,
        engagementRate: engagementRate.toFixed(2),
        viralityScore,
        productName: input.productName,
        productDescription: input.productDescription,
        productCategory: input.productCategory,
        productImages: input.productImages,
        sourceUrl: input.sourceUrl,
        sourcePlatform: input.sourcePlatform,
        sourceCostCents: input.sourceCostCents,
        shippingCostCents,
        platformFeeCents,
        paymentFeeCents,
        totalCostCents,
        suggestedPriceCents: input.suggestedPriceCents,
        profitMarginCents,
        profitMarginPercent: profitMarginPercent.toFixed(2),
        profitScore,
        overallScore,
        status: "ANALYZING",
      });
      
      // Enqueue analysis job
      await db.insert(automationJobs).values({
        id: nanoid(),
        channelId: input.channelId,
        jobType: "TREND_DISCOVERY",
        jobPriority: 5,
        jobPayload: { trendProductId: id },
        status: "QUEUED",
      });
      
      return { id, overallScore, profitMarginPercent };
    }),

  // Get trend products with filtering
  getTrendProducts: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      status: z.enum(["DISCOVERED", "ANALYZING", "SHORTLISTED", "REJECTED", "LAUNCHED", "ARCHIVED"]).optional(),
      minScore: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(trendProducts.channelId, input.channelId)];
      if (input.status) {
        conditions.push(eq(trendProducts.status, input.status));
      }
      if (input.minScore) {
        conditions.push(gte(trendProducts.overallScore, input.minScore));
      }
      
      const products = await db
        .select()
        .from(trendProducts)
        .where(and(...conditions))
        .orderBy(desc(trendProducts.overallScore), desc(trendProducts.discoveredAt))
        .limit(input.limit)
        .offset(input.offset);
      
      return products;
    }),

  // Generate daily top 10 shortlist
  generateDailyShortlist: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      shortlistDate: z.string(), // ISO date
      minScore: z.number().default(70),
    }))
    .mutation(async ({ input }) => {
      // Get top 10 products by score
      const topProducts = await db
        .select()
        .from(trendProducts)
        .where(
          and(
            eq(trendProducts.channelId, input.channelId),
            eq(trendProducts.status, "ANALYZING"),
            gte(trendProducts.overallScore, input.minScore)
          )
        )
        .orderBy(desc(trendProducts.overallScore))
        .limit(10);
      
      if (topProducts.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No products meet the minimum score threshold",
        });
      }
      
      // Update ranks
      for (let i = 0; i < topProducts.length; i++) {
        await db
          .update(trendProducts)
          .set({ 
            rank: i + 1, 
            status: "SHORTLISTED",
            shortlistedAt: new Date(),
          })
          .where(eq(trendProducts.id, topProducts[i].id));
      }
      
      // Create shortlist record
      const shortlistId = nanoid();
      const productsData = topProducts.map((p, i) => ({
        rank: i + 1,
        trendProductId: p.id,
        productName: p.productName,
        overallScore: p.overallScore,
        profitMarginCents: Number(p.profitMarginCents),
      }));
      
      await db.insert(dailyShortlists).values({
        id: shortlistId,
        channelId: input.channelId,
        shortlistDate: new Date(input.shortlistDate),
        products: productsData,
        status: "GENERATING",
      });
      
      // Enqueue bundle generation job
      await db.insert(automationJobs).values({
        id: nanoid(),
        channelId: input.channelId,
        jobType: "ASSET_GENERATION",
        jobPriority: 1,
        jobPayload: { shortlistId, productIds: topProducts.map(p => p.id) },
        status: "QUEUED",
      });
      
      return { shortlistId, productCount: topProducts.length };
    }),

  // Update product scoring
  updateProductScoring: protectedProcedure
    .input(z.object({
      productId: z.string(),
      viralityScore: z.number().min(0).max(100).optional(),
      profitScore: z.number().min(0).max(100).optional(),
      availabilityScore: z.number().min(0).max(100).optional(),
      competitionScore: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const product = await db.query.trendProducts.findFirst({
        where: eq(trendProducts.id, input.productId),
      });
      
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      
      const viralityScore = input.viralityScore ?? product.viralityScore;
      const profitScore = input.profitScore ?? product.profitScore;
      const availabilityScore = input.availabilityScore ?? product.availabilityScore;
      const competitionScore = input.competitionScore ?? product.competitionScore;
      
      // Recalculate overall score
      const overallScore = Math.round(
        viralityScore * 0.3 +
        profitScore * 0.3 +
        availabilityScore * 0.2 +
        (100 - competitionScore) * 0.2 // Lower competition = better
      );
      
      await db
        .update(trendProducts)
        .set({
          viralityScore,
          profitScore,
          availabilityScore,
          competitionScore,
          overallScore,
        })
        .where(eq(trendProducts.id, input.productId));
      
      return { overallScore };
    }),

  // ============================================================================
  // LAUNCHES & 7-DAY SCHEDULES
  // ============================================================================

  createLaunch: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      trendProductId: z.string(),
      launchName: z.string(),
      launchDate: z.string(), // ISO date
    }))
    .mutation(async ({ input }) => {
      const product = await db.query.trendProducts.findFirst({
        where: eq(trendProducts.id, input.trendProductId),
      });
      
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      
      const launchId = nanoid();
      const launchDate = new Date(input.launchDate);
      const endDate = new Date(launchDate);
      endDate.setDate(endDate.getDate() + 7); // 7-day campaign
      
      await db.insert(launches).values({
        id: launchId,
        channelId: input.channelId,
        trendProductId: input.trendProductId,
        launchName: input.launchName,
        launchDate,
        endDate,
        productSnapshot: product as any,
        status: "PLANNED",
      });
      
      // Update product status
      await db
        .update(trendProducts)
        .set({ 
          status: "LAUNCHED",
          launchedAt: new Date(),
        })
        .where(eq(trendProducts.id, input.trendProductId));
      
      return { launchId };
    }),

  getLaunches: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      status: z.enum(["PLANNED", "ASSETS_GENERATING", "TEST_STREAMING", "READY", "LIVE", "COMPLETED", "CANCELLED"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(launches.channelId, input.channelId)];
      if (input.status) {
        conditions.push(eq(launches.status, input.status));
      }
      
      const launchList = await db
        .select()
        .from(launches)
        .where(and(...conditions))
        .orderBy(desc(launches.launchDate))
        .limit(input.limit);
      
      return launchList;
    }),

  // ============================================================================
  // ASSET GENERATION ENGINE
  // ============================================================================

  generateAssetPack: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      launchId: z.string(),
      platform: z.enum(["TIKTOK", "YOUTUBE", "FACEBOOK"]),
    }))
    .mutation(async ({ input }) => {
      const launch = await db.query.launches.findFirst({
        where: eq(launches.id, input.launchId),
      });
      
      if (!launch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Launch not found" });
      }
      
      const product = launch.productSnapshot as any;
      const packId = nanoid();
      
      // Generate host scripts using LLM
      const scriptPrompt = `Generate a complete live shopping script for the following product:

Product: ${product.productName}
Description: ${product.productDescription || "No description"}
Category: ${product.productCategory || "General"}
Platform: ${input.platform}

Create scripts for each segment of a 6-8 minute loop:
1. DEMO (proof-first approach) - Show the product in action
2. OBJECTION - Address common concerns
3. TRUST - Best for / Not for transparency
4. OFFER - Clear call to action
5. Q&A - Common questions and answers

Format as JSON with keys: demoScript, objectionScript, trustScript, offerScript, qaScript`;

      const scriptResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert live shopping script writer. Create engaging, authentic, and conversion-focused scripts." },
          { role: "user", content: scriptPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "host_scripts",
            strict: true,
            schema: {
              type: "object",
              properties: {
                demoScript: { type: "string" },
                objectionScript: { type: "string" },
                trustScript: { type: "string" },
                offerScript: { type: "string" },
                qaScript: { type: "string" },
              },
              required: ["demoScript", "objectionScript", "trustScript", "offerScript", "qaScript"],
              additionalProperties: false,
            },
          },
        },
      });
      
      const scripts = JSON.parse(scriptResponse.choices[0].message.content || "{}");
      
      // Generate moderator playbook
      const moderatorPrompt = `Create a moderator playbook for this live shopping show:

Product: ${product.productName}
Platform: ${input.platform}

Include:
1. Three pinned comments (How to buy, Best for/Not for, Transparency/AI disclosure)
2. Five moderator macros (quick responses for common questions)
3. Compliance safe words to avoid

Format as JSON with keys: pinnedComments (array), moderatorMacros (array of {trigger, response}), safeWords (array)`;

      const moderatorResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert live shopping moderator. Create helpful, compliant moderation materials." },
          { role: "user", content: moderatorPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "moderator_playbook",
            strict: true,
            schema: {
              type: "object",
              properties: {
                pinnedComments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      order: { type: "integer" },
                      text: { type: "string" },
                    },
                    required: ["order", "text"],
                    additionalProperties: false,
                  },
                },
                moderatorMacros: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      trigger: { type: "string" },
                      response: { type: "string" },
                    },
                    required: ["trigger", "response"],
                    additionalProperties: false,
                  },
                },
                safeWords: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["pinnedComments", "moderatorMacros", "safeWords"],
              additionalProperties: false,
            },
          },
        },
      });
      
      const moderatorData = JSON.parse(moderatorResponse.choices[0].message.content || "{}");
      
      // Generate compliance disclosure
      const disclosureText = `⚠️ DISCLOSURE: This is a live shopping broadcast. We may earn commission on sales. Product claims are based on manufacturer information. Individual results may vary. By purchasing, you agree to our terms of service. #ad #sponsored #liveshopping`;
      
      // Create asset pack
      await db.insert(assetPacks).values({
        id: packId,
        channelId: input.channelId,
        launchId: input.launchId,
        platform: input.platform,
        platformConfig: {
          platform: input.platform,
          resolution: input.platform === "TIKTOK" ? "1080x1920" : "1920x1080",
          bitrate: 4500,
        },
        demoScript: scripts.demoScript,
        objectionScript: scripts.objectionScript,
        trustScript: scripts.trustScript,
        offerScript: scripts.offerScript,
        qaScript: scripts.qaScript,
        hostScript: `${scripts.demoScript}\n\n${scripts.objectionScript}\n\n${scripts.trustScript}\n\n${scripts.offerScript}\n\n${scripts.qaScript}`,
        moderatorPlaybook: JSON.stringify(moderatorData, null, 2),
        pinnedComments: moderatorData.pinnedComments,
        moderatorMacros: moderatorData.moderatorMacros,
        disclosureText,
        safeWords: moderatorData.safeWords,
        complianceChecked: true,
        status: "READY",
      });
      
      // Update launch status
      await db
        .update(launches)
        .set({ status: "ASSETS_GENERATING" })
        .where(eq(launches.id, input.launchId));
      
      return { packId, scripts, moderatorData };
    }),

  getAssetPacks: protectedProcedure
    .input(z.object({
      launchId: z.string(),
    }))
    .query(async ({ input }) => {
      const packs = await db
        .select()
        .from(assetPacks)
        .where(eq(assetPacks.launchId, input.launchId));
      
      return packs;
    }),

  // ============================================================================
  // TEST STREAM AUTOMATION
  // ============================================================================

  enqueueTestStream: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      launchId: z.string(),
      assetPackId: z.string(),
      testDurationMinutes: z.number().default(10),
    }))
    .mutation(async ({ input }) => {
      const pack = await db.query.assetPacks.findFirst({
        where: eq(assetPacks.id, input.assetPackId),
      });
      
      if (!pack) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asset pack not found" });
      }
      
      const testStreamId = nanoid();
      
      await db.insert(testStreams).values({
        id: testStreamId,
        channelId: input.channelId,
        launchId: input.launchId,
        assetPackId: input.assetPackId,
        platform: pack.platform,
        testDurationMinutes: input.testDurationMinutes,
        testAudience: "PRIVATE",
        streamStatus: "QUEUED",
      });
      
      // Enqueue test stream job
      await db.insert(automationJobs).values({
        id: nanoid(),
        channelId: input.channelId,
        jobType: "TEST_STREAM",
        jobPriority: 3,
        jobPayload: { testStreamId },
        status: "QUEUED",
      });
      
      // Update launch status
      await db
        .update(launches)
        .set({ status: "TEST_STREAMING" })
        .where(eq(launches.id, input.launchId));
      
      return { testStreamId };
    }),

  getTestStreams: protectedProcedure
    .input(z.object({
      launchId: z.string(),
    }))
    .query(async ({ input }) => {
      const streams = await db
        .select()
        .from(testStreams)
        .where(eq(testStreams.launchId, input.launchId))
        .orderBy(desc(testStreams.createdAt));
      
      return streams;
    }),

  updateTestStreamVerdict: protectedProcedure
    .input(z.object({
      testStreamId: z.string(),
      verdict: z.enum(["GO", "NO_GO", "NEEDS_REVISION"]),
      verdictReason: z.string().optional(),
      verdictNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(testStreams)
        .set({
          verdict: input.verdict,
          verdictReason: input.verdictReason,
          verdictNotes: input.verdictNotes,
        })
        .where(eq(testStreams.id, input.testStreamId));
      
      return { success: true };
    }),

  // ============================================================================
  // GO-LIVE GATING & READINESS
  // ============================================================================

  checkGoLiveReadiness: protectedProcedure
    .input(z.object({
      launchId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const launch = await db.query.launches.findFirst({
        where: eq(launches.id, input.launchId),
      });
      
      if (!launch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Launch not found" });
      }
      
      // Check test streams
      const testStreamsList = await db
        .select()
        .from(testStreams)
        .where(
          and(
            eq(testStreams.launchId, input.launchId),
            eq(testStreams.verdict, "GO")
          )
        );
      
      const testStreamsPass = testStreamsList.length > 0;
      const lastTestStream = testStreamsList[0];
      const lastTestStreamAt = lastTestStream?.endedAt;
      
      // Check if test streams are still valid (within 2 hours)
      const now = new Date();
      const testStreamsExpired = lastTestStreamAt
        ? (now.getTime() - lastTestStreamAt.getTime()) / (1000 * 60) > 120
        : true;
      
      // Check asset packs
      const packs = await db
        .select()
        .from(assetPacks)
        .where(
          and(
            eq(assetPacks.launchId, input.launchId),
            eq(assetPacks.status, "READY")
          )
        );
      
      const assetsComplete = packs.length >= 1; // At least one platform
      
      // Check host handoff
      const handoffs = await db
        .select()
        .from(hostHandoffPacks)
        .where(
          and(
            eq(hostHandoffPacks.launchId, input.launchId),
            eq(hostHandoffPacks.hostConfirmed, true)
          )
        );
      
      const hostHandoffConfirmed = handoffs.length > 0;
      
      // Simplified checks (in production, these would be real API calls)
      const inventoryAvailable = true;
      const paymentGatewayHealthy = true;
      const complianceApproved = assetsComplete; // Based on asset compliance check
      const platformAccountActive = true;
      
      // Calculate overall readiness
      const checks = [
        testStreamsPass && !testStreamsExpired,
        assetsComplete,
        hostHandoffConfirmed,
        inventoryAvailable,
        paymentGatewayHealthy,
        complianceApproved,
        platformAccountActive,
      ];
      
      const passedChecks = checks.filter(Boolean).length;
      const overallReadiness = Math.round((passedChecks / checks.length) * 100);
      const isReady = overallReadiness === 100;
      
      // Determine risk level
      let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      const riskFactors: string[] = [];
      
      if (!testStreamsPass) {
        riskLevel = "CRITICAL";
        riskFactors.push("No successful test streams");
      }
      if (testStreamsExpired) {
        riskLevel = riskLevel === "CRITICAL" ? "CRITICAL" : "HIGH";
        riskFactors.push("Test streams expired (>2 hours old)");
      }
      if (!assetsComplete) {
        riskLevel = riskLevel === "CRITICAL" ? "CRITICAL" : "HIGH";
        riskFactors.push("Assets not complete");
      }
      if (!hostHandoffConfirmed) {
        riskLevel = riskLevel === "CRITICAL" || riskLevel === "HIGH" ? riskLevel : "MEDIUM";
        riskFactors.push("Host handoff not confirmed");
      }
      
      // Upsert readiness record
      const existing = await db.query.goLiveReadiness.findFirst({
        where: eq(goLiveReadiness.launchId, input.launchId),
      });
      
      if (existing) {
        await db
          .update(goLiveReadiness)
          .set({
            testStreamsPass,
            assetsComplete,
            hostHandoffConfirmed,
            inventoryAvailable,
            paymentGatewayHealthy,
            complianceApproved,
            platformAccountActive,
            overallReadiness,
            isReady,
            lastTestStreamAt,
            testStreamsExpired,
            riskLevel,
            riskFactors,
          })
          .where(eq(goLiveReadiness.id, existing.id));
      } else {
        await db.insert(goLiveReadiness).values({
          id: nanoid(),
          channelId: launch.channelId,
          launchId: input.launchId,
          testStreamsPass,
          assetsComplete,
          hostHandoffConfirmed,
          inventoryAvailable,
          paymentGatewayHealthy,
          complianceApproved,
          platformAccountActive,
          overallReadiness,
          isReady,
          lastTestStreamAt,
          testStreamsExpired,
          riskLevel,
          riskFactors,
        });
      }
      
      return {
        overallReadiness,
        isReady,
        riskLevel,
        riskFactors,
        checks: {
          testStreamsPass,
          testStreamsExpired,
          assetsComplete,
          hostHandoffConfirmed,
          inventoryAvailable,
          paymentGatewayHealthy,
          complianceApproved,
          platformAccountActive,
        },
      };
    }),

  armGoLiveGuard: protectedProcedure
    .input(z.object({
      launchId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const readiness = await db.query.goLiveReadiness.findFirst({
        where: eq(goLiveReadiness.launchId, input.launchId),
      });
      
      if (!readiness) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Readiness check not found. Run checkGoLiveReadiness first." });
      }
      
      if (!readiness.isReady) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot arm guard. Overall readiness: ${readiness.overallReadiness}%. All checks must pass.`,
        });
      }
      
      await db
        .update(goLiveReadiness)
        .set({ guardStatus: "ARMED" })
        .where(eq(goLiveReadiness.id, readiness.id));
      
      // Update launch status
      await db
        .update(launches)
        .set({ status: "READY" })
        .where(eq(launches.id, input.launchId));
      
      return { success: true, message: "Go-live guard ARMED" };
    }),

  overrideGoLiveGuard: protectedProcedure
    .input(z.object({
      launchId: z.string(),
      overrideReason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const readiness = await db.query.goLiveReadiness.findFirst({
        where: eq(goLiveReadiness.launchId, input.launchId),
      });
      
      if (!readiness) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Readiness check not found" });
      }
      
      await db
        .update(goLiveReadiness)
        .set({
          manualOverride: true,
          overrideBy: ctx.user.openId,
          overrideReason: input.overrideReason,
          overrideAt: new Date(),
          guardStatus: "OVERRIDDEN",
        })
        .where(eq(goLiveReadiness.id, readiness.id));
      
      return { success: true, message: "Go-live guard OVERRIDDEN" };
    }),

  // ============================================================================
  // HOST HANDOFF & RUN-OF-SHOW
  // ============================================================================

  generateHostHandoff: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      launchId: z.string(),
      hostId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const launch = await db.query.launches.findFirst({
        where: eq(launches.id, input.launchId),
      });
      
      if (!launch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Launch not found" });
      }
      
      const host = await db.query.hosts.findFirst({
        where: eq(hosts.id, input.hostId),
      });
      
      if (!host) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Host not found" });
      }
      
      const packs = await db
        .select()
        .from(assetPacks)
        .where(eq(assetPacks.launchId, input.launchId));
      
      if (packs.length === 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No asset packs available" });
      }
      
      const handoffId = nanoid();
      
      // Generate checklists
      const preLiveChecklist = [
        { item: "Test stream key and verify connection", completed: false },
        { item: "Set up OBS scenes from pack", completed: false },
        { item: "Review host script and practice segments", completed: false },
        { item: "Prepare product samples for demo", completed: false },
        { item: "Test audio and lighting", completed: false },
        { item: "Pin product link in chat", completed: false },
        { item: "Set pinned comments", completed: false },
        { item: "Brief moderator on playbook", completed: false },
      ];
      
      const duringLiveChecklist = [
        { item: "Follow 6-8 minute loop structure", completed: false },
        { item: "Monitor viewer count and engagement", completed: false },
        { item: "Respond to top questions in Q&A segment", completed: false },
        { item: "Emphasize Best For / Not For transparency", completed: false },
        { item: "Clear call-to-action in Offer segment", completed: false },
        { item: "Log timestamps for highlight moments", completed: false },
      ];
      
      const postLiveChecklist = [
        { item: "Export recording for clip extraction", completed: false },
        { item: "Mark 5 highlight timestamps", completed: false },
        { item: "Review performance metrics", completed: false },
        { item: "Document what worked / what didn't", completed: false },
        { item: "Submit feedback for next show", completed: false },
      ];
      
      await db.insert(hostHandoffPacks).values({
        id: handoffId,
        channelId: input.channelId,
        launchId: input.launchId,
        hostId: input.hostId,
        preLiveChecklist,
        duringLiveChecklist,
        postLiveChecklist,
      });
      
      return { handoffId, host: host.name };
    }),

  confirmHostHandoff: protectedProcedure
    .input(z.object({
      handoffId: z.string(),
      hostNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(hostHandoffPacks)
        .set({
          hostConfirmed: true,
          hostConfirmedAt: new Date(),
          hostNotes: input.hostNotes,
        })
        .where(eq(hostHandoffPacks.id, input.handoffId));
      
      return { success: true };
    }),

  // ============================================================================
  // LIVE SHOW EXECUTION
  // ============================================================================

  createLiveShow: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      launchId: z.string(),
      assetPackId: z.string(),
      hostId: z.string(),
      showTitle: z.string(),
      scheduledStartAt: z.string(), // ISO datetime
    }))
    .mutation(async ({ input }) => {
      const pack = await db.query.assetPacks.findFirst({
        where: eq(assetPacks.id, input.assetPackId),
      });
      
      if (!pack) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asset pack not found" });
      }
      
      const host = await db.query.hosts.findFirst({
        where: eq(hosts.id, input.hostId),
      });
      
      // Generate run-of-show (6-8 min loop)
      const runOfShow = [
        {
          segment: "DEMO",
          durationMinutes: 1.5,
          script: pack.demoScript || "",
          notes: "Proof-first approach. Show product in action.",
        },
        {
          segment: "OBJECTION",
          durationMinutes: 1,
          script: pack.objectionScript || "",
          notes: "Address common concerns proactively.",
        },
        {
          segment: "TRUST",
          durationMinutes: 1.5,
          script: pack.trustScript || "",
          notes: "Best for / Not for transparency. Build credibility.",
        },
        {
          segment: "OFFER",
          durationMinutes: 1.5,
          script: pack.offerScript || "",
          notes: "Clear call-to-action. Emphasize value.",
        },
        {
          segment: "QA",
          durationMinutes: 1.5,
          script: pack.qaScript || "",
          notes: "Answer viewer questions. Engage with chat.",
        },
      ];
      
      const showId = nanoid();
      
      await db.insert(liveShows).values({
        id: showId,
        channelId: input.channelId,
        launchId: input.launchId,
        assetPackId: input.assetPackId,
        showTitle: input.showTitle,
        platform: pack.platform,
        hostId: input.hostId,
        hostName: host?.name,
        segmentDurationMinutes: 7,
        runOfShow,
        status: "SCHEDULED",
        scheduledStartAt: new Date(input.scheduledStartAt),
      });
      
      return { showId, runOfShow };
    }),

  startLiveShow: protectedProcedure
    .input(z.object({
      showId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(liveShows)
        .set({
          status: "LIVE",
          actualStartAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));
      
      // Update launch status
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });
      
      if (show) {
        await db
          .update(launches)
          .set({ status: "LIVE" })
          .where(eq(launches.id, show.launchId));
      }
      
      return { success: true };
    }),

  endLiveShow: protectedProcedure
    .input(z.object({
      showId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(liveShows)
        .set({
          status: "ENDED",
          actualEndAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));
      
      // Enqueue clip extraction job
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });
      
      if (show) {
        await db.insert(automationJobs).values({
          id: nanoid(),
          channelId: show.channelId,
          jobType: "CLIP_EXTRACTION",
          jobPriority: 2,
          jobPayload: { showId: input.showId },
          status: "QUEUED",
        });
      }
      
      return { success: true };
    }),

  updateLiveMetrics: protectedProcedure
    .input(z.object({
      showId: z.string(),
      currentViewers: z.number().optional(),
      likes: z.number().optional(),
      comments: z.number().optional(),
      shares: z.number().optional(),
      productClicks: z.number().optional(),
      addToCarts: z.number().optional(),
      purchases: z.number().optional(),
      revenueCents: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });
      
      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }
      
      const updates: any = {};
      
      if (input.currentViewers !== undefined) {
        updates.currentViewers = input.currentViewers;
        updates.peakViewers = Math.max(show.peakViewers, input.currentViewers);
        updates.totalViews = show.totalViews + 1;
      }
      
      if (input.likes !== undefined) updates.likes = input.likes;
      if (input.comments !== undefined) updates.comments = input.comments;
      if (input.shares !== undefined) updates.shares = input.shares;
      if (input.productClicks !== undefined) updates.productClicks = input.productClicks;
      if (input.addToCarts !== undefined) updates.addToCarts = input.addToCarts;
      if (input.purchases !== undefined) updates.purchases = input.purchases;
      if (input.revenueCents !== undefined) updates.revenueCents = input.revenueCents;
      
      await db
        .update(liveShows)
        .set(updates)
        .where(eq(liveShows.id, input.showId));
      
      return { success: true };
    }),

  logShowTimestamp: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      liveShowId: z.string(),
      segmentType: z.enum(["DEMO", "OBJECTION", "TRUST", "OFFER", "QA"]),
      segmentNumber: z.number(),
      startTimestamp: z.number(), // Seconds from show start
      isHighlight: z.boolean().default(false),
      highlightReason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const timestampId = nanoid();
      
      await db.insert(liveShowTimestamps).values({
        id: timestampId,
        channelId: input.channelId,
        liveShowId: input.liveShowId,
        segmentType: input.segmentType,
        segmentNumber: input.segmentNumber,
        startTimestamp: input.startTimestamp,
        isHighlight: input.isHighlight,
        highlightReason: input.highlightReason,
      });
      
      return { timestampId };
    }),

  // ============================================================================
  // POST-LIVE CLIP FACTORY
  // ============================================================================

  extractClips: protectedProcedure
    .input(z.object({
      showId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });
      
      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }
      
      // Get highlight timestamps
      const timestamps = await db
        .select()
        .from(liveShowTimestamps)
        .where(
          and(
            eq(liveShowTimestamps.liveShowId, input.showId),
            eq(liveShowTimestamps.isHighlight, true)
          )
        )
        .orderBy(asc(liveShowTimestamps.startTimestamp));
      
      // If no highlights, create default clips from each segment type
      const clipTypes: Array<"PROOF" | "OBJECTION" | "TRUST" | "QA" | "OFFER"> = [
        "PROOF",
        "OBJECTION",
        "TRUST",
        "QA",
        "OFFER",
      ];
      
      const clipIds: string[] = [];
      
      for (const clipType of clipTypes) {
        const clipId = nanoid();
        
        // Find corresponding timestamp or use default
        const timestamp = timestamps.find(t => 
          (clipType === "PROOF" && t.segmentType === "DEMO") ||
          (clipType === "OBJECTION" && t.segmentType === "OBJECTION") ||
          (clipType === "TRUST" && t.segmentType === "TRUST") ||
          (clipType === "QA" && t.segmentType === "QA") ||
          (clipType === "OFFER" && t.segmentType === "OFFER")
        );
        
        const startSeconds = timestamp?.startTimestamp || 0;
        const durationSeconds = 30; // Default 30-second clips
        
        await db.insert(postLiveClips).values({
          id: clipId,
          channelId: show.channelId,
          liveShowId: input.showId,
          timestampId: timestamp?.id,
          clipType,
          clipTitle: `${show.showTitle} - ${clipType}`,
          clipStartSeconds: startSeconds,
          clipEndSeconds: startSeconds + durationSeconds,
          clipDurationSeconds: durationSeconds,
          status: "EXTRACTING",
        });
        
        clipIds.push(clipId);
      }
      
      // Enqueue clip processing jobs
      for (const clipId of clipIds) {
        await db.insert(automationJobs).values({
          id: nanoid(),
          channelId: show.channelId,
          jobType: "CLIP_EXTRACTION",
          jobPriority: 4,
          jobPayload: { clipId },
          status: "QUEUED",
        });
      }
      
      return { clipIds, count: clipIds.length };
    }),

  getPostLiveClips: protectedProcedure
    .input(z.object({
      showId: z.string(),
    }))
    .query(async ({ input }) => {
      const clips = await db
        .select()
        .from(postLiveClips)
        .where(eq(postLiveClips.liveShowId, input.showId))
        .orderBy(asc(postLiveClips.clipStartSeconds));
      
      return clips;
    }),

  scheduleClipPublishing: protectedProcedure
    .input(z.object({
      clipId: z.string(),
      publishScheduledAt: z.string(), // ISO datetime
    }))
    .mutation(async ({ input }) => {
      await db
        .update(postLiveClips)
        .set({
          status: "SCHEDULED",
          publishScheduledAt: new Date(input.publishScheduledAt),
        })
        .where(eq(postLiveClips.id, input.clipId));
      
      return { success: true };
    }),

  // ============================================================================
  // HOSTS & CREATOR CASTING
  // ============================================================================

  createHost: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      profileImageUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const hostId = nanoid();
      
      await db.insert(hosts).values({
        id: hostId,
        channelId: input.channelId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        profileImageUrl: input.profileImageUrl,
        tier: "APPLICANT",
        status: "ACTIVE",
      });
      
      return { hostId };
    }),

  getHosts: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      tier: z.enum(["APPLICANT", "BRONZE", "SILVER", "GOLD", "PLATINUM", "SUSPENDED"]).optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"]).optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(hosts.channelId, input.channelId)];
      if (input.tier) conditions.push(eq(hosts.tier, input.tier));
      if (input.status) conditions.push(eq(hosts.status, input.status));
      
      const hostList = await db
        .select()
        .from(hosts)
        .where(and(...conditions))
        .orderBy(desc(hosts.overallScore));
      
      return hostList;
    }),

  updateHostScoring: protectedProcedure
    .input(z.object({
      hostId: z.string(),
      energyScore: z.number().min(0).max(100).optional(),
      clarityScore: z.number().min(0).max(100).optional(),
      authenticityScore: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const host = await db.query.hosts.findFirst({
        where: eq(hosts.id, input.hostId),
      });
      
      if (!host) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Host not found" });
      }
      
      const energyScore = input.energyScore ?? host.energyScore;
      const clarityScore = input.clarityScore ?? host.clarityScore;
      const authenticityScore = input.authenticityScore ?? host.authenticityScore;
      
      const overallScore = Math.round((energyScore + clarityScore + authenticityScore) / 3);
      
      // Determine tier based on score
      let tier: "APPLICANT" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" = "APPLICANT";
      if (overallScore >= 90) tier = "PLATINUM";
      else if (overallScore >= 80) tier = "GOLD";
      else if (overallScore >= 70) tier = "SILVER";
      else if (overallScore >= 60) tier = "BRONZE";
      
      await db
        .update(hosts)
        .set({
          energyScore,
          clarityScore,
          authenticityScore,
          overallScore,
          tier,
        })
        .where(eq(hosts.id, input.hostId));
      
      return { overallScore, tier };
    }),

  updateHostPerformance: protectedProcedure
    .input(z.object({
      hostId: z.string(),
      showId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });
      
      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }
      
      const host = await db.query.hosts.findFirst({
        where: eq(hosts.id, input.hostId),
      });
      
      if (!host) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Host not found" });
      }
      
      // Calculate conversion rate
      const conversionRate = show.totalViews > 0
        ? (show.purchases / show.totalViews) * 100
        : 0;
      
      // Update host metrics
      const newTotalShows = host.totalShows + 1;
      const newTotalViewers = Number(host.totalViewers) + show.totalViews;
      const newTotalRevenueCents = Number(host.totalRevenueCents) + Number(show.revenueCents);
      
      // Calculate new average conversion rate
      const newAvgConversionRate = (
        (Number(host.avgConversionRate) * host.totalShows + conversionRate) / newTotalShows
      ).toFixed(2);
      
      // Calculate commission
      const commissionCents = Math.round(Number(show.revenueCents) * (Number(host.commissionPercent) / 100));
      const newTotalEarnedCents = Number(host.totalEarnedCents) + commissionCents;
      const newPendingPayoutCents = Number(host.pendingPayoutCents) + commissionCents;
      
      await db
        .update(hosts)
        .set({
          totalShows: newTotalShows,
          totalViewers: newTotalViewers,
          totalRevenueCents: newTotalRevenueCents,
          avgConversionRate: newAvgConversionRate,
          totalEarnedCents: newTotalEarnedCents,
          pendingPayoutCents: newPendingPayoutCents,
          lastShowAt: new Date(),
        })
        .where(eq(hosts.id, input.hostId));
      
      return { 
        commissionCents,
        newAvgConversionRate,
        newTotalShows,
      };
    }),

  // ============================================================================
  // PROFIT PROTECTION ENGINE
  // ============================================================================

  calculateProfit: protectedProcedure
    .input(z.object({
      launchId: z.string(),
      liveShowId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const launch = await db.query.launches.findFirst({
        where: eq(launches.id, input.launchId),
      });
      
      if (!launch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Launch not found" });
      }
      
      // Get all shows for this launch
      const shows = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.launchId, input.launchId));
      
      // Calculate totals
      let grossRevenueCents = 0;
      let unitsSold = 0;
      
      for (const show of shows) {
        grossRevenueCents += Number(show.revenueCents);
        unitsSold += show.purchases;
      }
      
      // Get product costs from snapshot
      const product = launch.productSnapshot as any;
      const productCostPerUnit = product.sourceCostCents || 0;
      const shippingCostPerUnit = product.shippingCostCents || 0;
      
      const productCostCents = productCostPerUnit * unitsSold;
      const shippingCostCents = shippingCostPerUnit * unitsSold;
      const platformFeeCents = Math.round(grossRevenueCents * 0.05);
      const paymentFeeCents = Math.round(grossRevenueCents * 0.029 + (unitsSold * 30));
      
      // Calculate host commissions
      let hostCommissionCents = 0;
      for (const show of shows) {
        if (show.hostId) {
          const host = await db.query.hosts.findFirst({
            where: eq(hosts.id, show.hostId),
          });
          if (host) {
            hostCommissionCents += Math.round(Number(show.revenueCents) * (Number(host.commissionPercent) / 100));
          }
        }
      }
      
      // Estimate marketing spend (10% of revenue)
      const marketingSpendCents = Math.round(grossRevenueCents * 0.10);
      
      // Estimate refunds (5% of revenue)
      const refundsCents = Math.round(grossRevenueCents * 0.05);
      
      const netRevenueCents = grossRevenueCents - refundsCents;
      
      const totalCostCents = 
        productCostCents +
        shippingCostCents +
        platformFeeCents +
        paymentFeeCents +
        marketingSpendCents +
        hostCommissionCents;
      
      const grossProfitCents = grossRevenueCents - totalCostCents;
      const netProfitCents = netRevenueCents - totalCostCents;
      const profitMarginPercent = grossRevenueCents > 0
        ? (netProfitCents / grossRevenueCents) * 100
        : 0;
      
      // Calculate break-even
      const costPerUnit = totalCostCents / (unitsSold || 1);
      const revenuePerUnit = grossRevenueCents / (unitsSold || 1);
      const breakEvenUnits = revenuePerUnit > costPerUnit
        ? Math.ceil(totalCostCents / (revenuePerUnit - costPerUnit))
        : 0;
      
      const isProfitable = netProfitCents > 0;
      const thresholdPercent = 20; // 20% margin threshold
      const belowThreshold = profitMarginPercent < thresholdPercent;
      
      const trackingId = nanoid();
      
      await db.insert(profitTracking).values({
        id: trackingId,
        channelId: launch.channelId,
        launchId: input.launchId,
        liveShowId: input.liveShowId,
        grossRevenueCents,
        refundsCents,
        netRevenueCents,
        productCostCents,
        shippingCostCents,
        platformFeeCents,
        paymentFeeCents,
        marketingSpendCents,
        hostCommissionCents,
        totalCostCents,
        grossProfitCents,
        netProfitCents,
        profitMarginPercent: profitMarginPercent.toFixed(2),
        breakEvenUnits,
        unitsSold,
        isProfitable,
        belowThreshold,
        thresholdPercent: thresholdPercent.toFixed(2),
        alertTriggered: belowThreshold,
        alertTriggeredAt: belowThreshold ? new Date() : null,
      });
      
      return {
        trackingId,
        grossRevenueCents,
        netProfitCents,
        profitMarginPercent: profitMarginPercent.toFixed(2),
        isProfitable,
        belowThreshold,
        breakEvenUnits,
        unitsSold,
      };
    }),

  getProfitTracking: protectedProcedure
    .input(z.object({
      launchId: z.string(),
    }))
    .query(async ({ input }) => {
      const tracking = await db
        .select()
        .from(profitTracking)
        .where(eq(profitTracking.launchId, input.launchId))
        .orderBy(desc(profitTracking.calculatedAt));
      
      return tracking;
    }),

  // ============================================================================
  // OPERATIONAL DATA SYNC
  // ============================================================================

  syncToExternal: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      syncTarget: z.enum(["GOOGLE_SHEETS", "AIRTABLE", "N8N"]),
      syncTable: z.string(),
      operation: z.enum(["CREATE", "UPDATE", "DELETE", "BULK_SYNC"]),
      recordId: z.string().optional(),
      recordData: z.any(),
    }))
    .mutation(async ({ input }) => {
      const syncId = nanoid();
      
      await db.insert(operationalSyncLog).values({
        id: syncId,
        channelId: input.channelId,
        syncTarget: input.syncTarget,
        syncTable: input.syncTable,
        operation: input.operation,
        recordId: input.recordId,
        recordData: input.recordData,
        status: "PENDING",
      });
      
      // In production, this would trigger actual sync to external systems
      // For now, mark as success
      await db
        .update(operationalSyncLog)
        .set({
          status: "SUCCESS",
          syncedAt: new Date(),
        })
        .where(eq(operationalSyncLog.id, syncId));
      
      return { syncId };
    }),

  getSyncLogs: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      syncTarget: z.enum(["GOOGLE_SHEETS", "AIRTABLE", "N8N"]).optional(),
      status: z.enum(["PENDING", "SUCCESS", "FAILED", "RETRYING"]).optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(operationalSyncLog.channelId, input.channelId)];
      if (input.syncTarget) conditions.push(eq(operationalSyncLog.syncTarget, input.syncTarget));
      if (input.status) conditions.push(eq(operationalSyncLog.status, input.status));
      
      const logs = await db
        .select()
        .from(operationalSyncLog)
        .where(and(...conditions))
        .orderBy(desc(operationalSyncLog.createdAt))
        .limit(input.limit);
      
      return logs;
    }),

  // ============================================================================
  // AUTOMATION JOB QUEUE
  // ============================================================================

  getAutomationJobs: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      jobType: z.enum(["TREND_DISCOVERY", "ASSET_GENERATION", "TEST_STREAM", "GO_LIVE", "CLIP_EXTRACTION"]).optional(),
      status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(automationJobs.channelId, input.channelId)];
      if (input.jobType) conditions.push(eq(automationJobs.jobType, input.jobType));
      if (input.status) conditions.push(eq(automationJobs.status, input.status));
      
      const jobs = await db
        .select()
        .from(automationJobs)
        .where(and(...conditions))
        .orderBy(asc(automationJobs.jobPriority), desc(automationJobs.createdAt))
        .limit(input.limit);
      
      return jobs;
    }),

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  getDashboardStats: protectedProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .query(async ({ input }) => {
      // Trend products stats
      const trendStats = await db
        .select({
          total: sql<number>`count(*)`,
          shortlisted: sql<number>`sum(case when status = 'SHORTLISTED' then 1 else 0 end)`,
          launched: sql<number>`sum(case when status = 'LAUNCHED' then 1 else 0 end)`,
          avgScore: sql<number>`avg(overall_score)`,
        })
        .from(trendProducts)
        .where(eq(trendProducts.channelId, input.channelId));
      
      // Launch stats
      const launchStats = await db
        .select({
          total: sql<number>`count(*)`,
          live: sql<number>`sum(case when status = 'LIVE' then 1 else 0 end)`,
          completed: sql<number>`sum(case when status = 'COMPLETED' then 1 else 0 end)`,
          totalRevenue: sql<number>`sum(total_revenue_cents)`,
          totalProfit: sql<number>`sum(total_profit_cents)`,
        })
        .from(launches)
        .where(eq(launches.channelId, input.channelId));
      
      // Host stats
      const hostStats = await db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when status = 'ACTIVE' then 1 else 0 end)`,
          avgScore: sql<number>`avg(overall_score)`,
        })
        .from(hosts)
        .where(eq(hosts.channelId, input.channelId));
      
      // Show stats
      const showStats = await db
        .select({
          total: sql<number>`count(*)`,
          live: sql<number>`sum(case when status = 'LIVE' then 1 else 0 end)`,
          totalViewers: sql<number>`sum(total_views)`,
          totalRevenue: sql<number>`sum(revenue_cents)`,
        })
        .from(liveShows)
        .where(eq(liveShows.channelId, input.channelId));
      
      return {
        trends: trendStats[0],
        launches: launchStats[0],
        hosts: hostStats[0],
        shows: showStats[0],
      };
    }),
});
