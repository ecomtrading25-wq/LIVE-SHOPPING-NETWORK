import { describe, it, expect, beforeEach, vi } from "vitest";
import creatorOps from "./lsn-creator-economy-scheduling";

describe("LSN Creator Economy & Scheduling", () => {
  describe("Creator Onboarding", () => {
    it("should onboard creator with complete profile", async () => {
      const creatorData = {
        userId: 1,
        stageName: "TestCreator",
        bio: "Test bio",
        socialMedia: {
          tiktok: "@testcreator",
          instagram: "@testcreator",
          youtube: "testcreator",
          twitter: "@testcreator",
        },
        niches: ["fashion", "beauty"],
        languages: ["en", "es"],
        timezone: "America/New_York",
        availableHours: {
          monday: ["09:00-12:00", "14:00-18:00"],
          tuesday: ["09:00-12:00", "14:00-18:00"],
          wednesday: ["09:00-12:00", "14:00-18:00"],
          thursday: ["09:00-12:00", "14:00-18:00"],
          friday: ["09:00-12:00", "14:00-18:00"],
          saturday: ["10:00-16:00"],
          sunday: [],
        },
        equipment: {
          camera: "Sony A7III",
          microphone: "Shure SM7B",
          lighting: "Elgato Key Light",
          internet: "1Gbps Fiber",
        },
      };

      const result = await creatorOps.onboardCreator(creatorData);

      expect(result).toHaveProperty("creatorId");
      expect(result).toHaveProperty("tier");
      expect(result.tier).toBe("bronze"); // New creators start at bronze
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("active");
    });

    it("should assign bronze tier to new creators", async () => {
      const creatorData = {
        userId: 2,
        stageName: "NewCreator",
        bio: "New creator bio",
        socialMedia: {},
        niches: ["tech"],
        languages: ["en"],
        timezone: "UTC",
        availableHours: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
        equipment: {
          camera: "iPhone 14",
          microphone: "Built-in",
          lighting: "Natural",
          internet: "100Mbps",
        },
      };

      const result = await creatorOps.onboardCreator(creatorData);

      expect(result.tier).toBe("bronze");
    });

    it("should validate required fields", async () => {
      const invalidData = {
        userId: 0,
        stageName: "",
        bio: "",
        socialMedia: {},
        niches: [],
        languages: [],
        timezone: "",
        availableHours: {} as any,
        equipment: {} as any,
      };

      await expect(creatorOps.onboardCreator(invalidData)).rejects.toThrow();
    });
  });

  describe("Broadcast Scheduling", () => {
    it("should create broadcast schedule with valid data", async () => {
      const scheduleData = {
        creatorId: 1,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        title: "Fashion Show",
        description: "Latest fashion trends",
        productIds: [1, 2, 3],
        targetRevenue: 5000,
        isRecurring: false,
      };

      const result = await creatorOps.createBroadcastSchedule(scheduleData);

      expect(result).toHaveProperty("scheduleId");
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("scheduled");
    });

    it("should create recurring broadcast schedule", async () => {
      const scheduleData = {
        creatorId: 1,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        title: "Weekly Show",
        description: "Weekly fashion show",
        productIds: [1, 2, 3],
        targetRevenue: 5000,
        isRecurring: true,
        recurrencePattern: "weekly" as const,
      };

      const result = await creatorOps.createBroadcastSchedule(scheduleData);

      expect(result).toHaveProperty("recurrence");
      expect(result.recurrence).toBe("weekly");
    });

    it("should detect scheduling conflicts", async () => {
      const scheduleData1 = {
        creatorId: 1,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        title: "Show 1",
        description: "First show",
        productIds: [1],
        targetRevenue: 1000,
        isRecurring: false,
      };

      await creatorOps.createBroadcastSchedule(scheduleData1);

      const scheduleData2 = {
        ...scheduleData1,
        title: "Show 2",
        description: "Conflicting show",
      };

      await expect(creatorOps.createBroadcastSchedule(scheduleData2)).rejects.toThrow(/conflict/i);
    });

    it("should validate start time is before end time", async () => {
      const invalidSchedule = {
        creatorId: 1,
        startTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        title: "Invalid Show",
        description: "End before start",
        productIds: [1],
        targetRevenue: 1000,
        isRecurring: false,
      };

      await expect(creatorOps.createBroadcastSchedule(invalidSchedule)).rejects.toThrow();
    });
  });

  describe("24/7 Schedule Generation", () => {
    it("should generate optimal schedule for date range", async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await creatorOps.generateOptimal24x7Schedule(startDate, endDate);

      expect(result).toHaveProperty("schedulesCreated");
      expect(result.schedulesCreated).toBeGreaterThan(0);
      expect(result).toHaveProperty("coverage");
      expect(result.coverage).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeLessThanOrEqual(100);
    });

    it("should maximize schedule coverage", async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await creatorOps.generateOptimal24x7Schedule(startDate, endDate);

      // Should aim for high coverage
      expect(result.coverage).toBeGreaterThan(70);
    });

    it("should respect creator availability", async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await creatorOps.generateOptimal24x7Schedule(startDate, endDate);

      expect(result).toHaveProperty("conflicts");
      expect(result.conflicts).toBe(0);
    });

    it("should distribute shows across creators fairly", async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await creatorOps.generateOptimal24x7Schedule(startDate, endDate);

      expect(result).toHaveProperty("distribution");
      expect(result.distribution).toBeInstanceOf(Object);
    });
  });

  describe("Live Show Management", () => {
    it("should start live show from schedule", async () => {
      const result = await creatorOps.startLiveShow(1);

      expect(result).toHaveProperty("showId");
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("live");
      expect(result).toHaveProperty("startedAt");
    });

    it("should end live show and calculate metrics", async () => {
      const result = await creatorOps.endLiveShow(1);

      expect(result).toHaveProperty("showId");
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("ended");
      expect(result).toHaveProperty("endedAt");
      expect(result).toHaveProperty("metrics");
      expect(result.metrics).toHaveProperty("duration");
      expect(result.metrics).toHaveProperty("revenue");
      expect(result.metrics).toHaveProperty("viewers");
    });

    it("should track show duration accurately", async () => {
      const startResult = await creatorOps.startLiveShow(1);
      
      // Simulate 1 hour show
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endResult = await creatorOps.endLiveShow(startResult.showId);

      expect(endResult.metrics.duration).toBeGreaterThan(0);
    });

    it("should prevent starting already live show", async () => {
      await creatorOps.startLiveShow(1);

      await expect(creatorOps.startLiveShow(1)).rejects.toThrow(/already live/i);
    });
  });

  describe("Creator Payout Calculation", () => {
    it("should calculate payout for creator in period", async () => {
      const creatorId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.calculateCreatorPayout(creatorId, periodStart, periodEnd);

      expect(result).toHaveProperty("creatorId");
      expect(result.creatorId).toBe(creatorId);
      expect(result).toHaveProperty("baseCommission");
      expect(result).toHaveProperty("bonuses");
      expect(result).toHaveProperty("penalties");
      expect(result).toHaveProperty("totalPayout");
      expect(result.totalPayout).toBeGreaterThanOrEqual(0);
    });

    it("should apply tier-based commission rates", async () => {
      const creatorId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.calculateCreatorPayout(creatorId, periodStart, periodEnd);

      expect(result).toHaveProperty("tier");
      expect(result).toHaveProperty("commissionRate");
      
      // Bronze: 10%, Silver: 12%, Gold: 15%, Platinum: 18%, Diamond: 20%
      const validRates = [0.10, 0.12, 0.15, 0.18, 0.20];
      expect(validRates).toContain(result.commissionRate);
    });

    it("should calculate bonuses for high performance", async () => {
      const creatorId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.calculateCreatorPayout(creatorId, periodStart, periodEnd);

      if (result.bonuses > 0) {
        expect(result).toHaveProperty("bonusReasons");
        expect(result.bonusReasons).toBeInstanceOf(Array);
      }
    });

    it("should apply penalties for violations", async () => {
      const creatorId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.calculateCreatorPayout(creatorId, periodStart, periodEnd);

      if (result.penalties > 0) {
        expect(result).toHaveProperty("penaltyReasons");
        expect(result.penaltyReasons).toBeInstanceOf(Array);
      }
    });

    it("should calculate total payout correctly", async () => {
      const creatorId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.calculateCreatorPayout(creatorId, periodStart, periodEnd);

      const expectedTotal = result.baseCommission + result.bonuses - result.penalties;
      expect(result.totalPayout).toBeCloseTo(expectedTotal, 2);
    });

    it("should never have negative payout", async () => {
      const creatorId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.calculateCreatorPayout(creatorId, periodStart, periodEnd);

      expect(result.totalPayout).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Batch Payout Processing", () => {
    it("should process payouts for all creators", async () => {
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.processAllCreatorPayouts(periodStart, periodEnd);

      expect(result).toHaveProperty("totalCreators");
      expect(result).toHaveProperty("totalPayout");
      expect(result).toHaveProperty("payouts");
      expect(result.payouts).toBeInstanceOf(Array);
    });

    it("should handle creators with zero revenue", async () => {
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.processAllCreatorPayouts(periodStart, periodEnd);

      result.payouts.forEach((payout: any) => {
        expect(payout.totalPayout).toBeGreaterThanOrEqual(0);
      });
    });

    it("should calculate total payout sum correctly", async () => {
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await creatorOps.processAllCreatorPayouts(periodStart, periodEnd);

      const sum = result.payouts.reduce((acc: number, p: any) => acc + p.totalPayout, 0);
      expect(result.totalPayout).toBeCloseTo(sum, 2);
    });
  });

  describe("Creator Dashboard", () => {
    it("should return dashboard metrics for creator", async () => {
      const creatorId = 1;
      const days = 30;

      const result = await creatorOps.getCreatorDashboard(creatorId, days);

      expect(result).toHaveProperty("creatorId");
      expect(result).toHaveProperty("tier");
      expect(result).toHaveProperty("totalShows");
      expect(result).toHaveProperty("totalRevenue");
      expect(result).toHaveProperty("avgViewers");
      expect(result).toHaveProperty("conversionRate");
      expect(result).toHaveProperty("upcomingShows");
    });

    it("should calculate performance metrics", async () => {
      const creatorId = 1;
      const days = 30;

      const result = await creatorOps.getCreatorDashboard(creatorId, days);

      expect(result.conversionRate).toBeGreaterThanOrEqual(0);
      expect(result.conversionRate).toBeLessThanOrEqual(100);
    });

    it("should include upcoming shows", async () => {
      const creatorId = 1;
      const days = 30;

      const result = await creatorOps.getCreatorDashboard(creatorId, days);

      expect(result.upcomingShows).toBeInstanceOf(Array);
    });

    it("should show tier progression", async () => {
      const creatorId = 1;
      const days = 30;

      const result = await creatorOps.getCreatorDashboard(creatorId, days);

      expect(result).toHaveProperty("tierProgress");
      expect(result.tierProgress).toHaveProperty("current");
      expect(result.tierProgress).toHaveProperty("next");
      expect(result.tierProgress).toHaveProperty("progress");
    });
  });

  describe("Tier Advancement", () => {
    it("should advance tier based on performance", async () => {
      const creatorId = 1;

      // Simulate high performance
      const result = await creatorOps.evaluateTierAdvancement(creatorId);

      expect(result).toHaveProperty("eligible");
      expect(result).toHaveProperty("currentTier");
      expect(result).toHaveProperty("nextTier");
    });

    it("should require minimum shows for advancement", async () => {
      const creatorId = 1;

      const result = await creatorOps.evaluateTierAdvancement(creatorId);

      if (!result.eligible) {
        expect(result).toHaveProperty("requirements");
        expect(result.requirements).toHaveProperty("minShows");
      }
    });

    it("should require minimum revenue for advancement", async () => {
      const creatorId = 1;

      const result = await creatorOps.evaluateTierAdvancement(creatorId);

      if (!result.eligible) {
        expect(result).toHaveProperty("requirements");
        expect(result.requirements).toHaveProperty("minRevenue");
      }
    });
  });

  describe("Performance Tracking", () => {
    it("should track creator performance metrics", async () => {
      const creatorId = 1;

      const result = await creatorOps.getCreatorPerformance(creatorId);

      expect(result).toHaveProperty("avgRevenue");
      expect(result).toHaveProperty("avgViewers");
      expect(result).toHaveProperty("avgDuration");
      expect(result).toHaveProperty("conversionRate");
      expect(result).toHaveProperty("retentionRate");
    });

    it("should compare performance to benchmarks", async () => {
      const creatorId = 1;

      const result = await creatorOps.getCreatorPerformance(creatorId);

      expect(result).toHaveProperty("benchmarks");
      expect(result.benchmarks).toHaveProperty("tierAverage");
      expect(result.benchmarks).toHaveProperty("platformAverage");
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent creator", async () => {
      await expect(creatorOps.getCreatorDashboard(999999, 30)).rejects.toThrow();
    });

    it("should handle invalid date ranges", async () => {
      const endDate = new Date();
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await expect(creatorOps.generateOptimal24x7Schedule(startDate, endDate)).rejects.toThrow();
    });

    it("should handle zero-day period for payouts", async () => {
      const date = new Date();

      const result = await creatorOps.calculateCreatorPayout(1, date, date);

      expect(result.totalPayout).toBe(0);
    });
  });

  describe("Performance", () => {
    it("should calculate payout within 1 second", async () => {
      const startTime = Date.now();

      await creatorOps.calculateCreatorPayout(1, new Date("2024-01-01"), new Date("2024-01-31"));

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it("should process batch payouts efficiently", async () => {
      const startTime = Date.now();

      await creatorOps.processAllCreatorPayouts(new Date("2024-01-01"), new Date("2024-01-31"));

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });
});
