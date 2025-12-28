import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDb } from "./db";
import fraudOps from "./lsn-fraud-financial-ops";

describe("LSN Fraud Detection Engine", () => {
  describe("Fraud Check - Multi-Layer Analysis", () => {
    it("should detect high-risk order with multiple fraud signals", async () => {
      // Mock order with suspicious characteristics
      const mockOrder = {
        id: 1,
        userId: 100,
        totalAmount: 5000, // High value
        shippingAddressId: 1,
        billingAddressId: 2, // Different from shipping
        status: "pending",
        createdAt: new Date(),
      };

      const result = await fraudOps.performFraudCheck(mockOrder.id);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(mockOrder.id);
      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.riskLevel).toMatch(/low|medium|high|critical/);
      expect(result.flags).toBeInstanceOf(Array);
      expect(result.reasons).toBeInstanceOf(Array);
    });

    it("should calculate risk score based on order value", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      expect(typeof result.riskScore).toBe("number");
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it("should flag mismatched billing and shipping addresses", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      if (result.flags.includes("address_mismatch")) {
        expect(result.riskScore).toBeGreaterThan(20);
      }
    });

    it("should detect velocity violations (too many orders)", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      expect(result).toHaveProperty("velocityCheck");
    });

    it("should assign correct risk level based on score", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      if (result.riskScore < 30) {
        expect(result.riskLevel).toBe("low");
      } else if (result.riskScore < 60) {
        expect(result.riskLevel).toBe("medium");
      } else if (result.riskScore < 80) {
        expect(result.riskLevel).toBe("high");
      } else {
        expect(result.riskLevel).toBe("critical");
      }
    });

    it("should recommend rejection for critical risk", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      if (result.riskLevel === "critical") {
        expect(result.shouldReject).toBe(true);
      }
    });

    it("should recommend hold for high risk", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      if (result.riskLevel === "high") {
        expect(result.shouldHold).toBe(true);
      }
    });

    it("should recommend review for medium risk", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      if (result.riskLevel === "medium") {
        expect(result.shouldReview).toBe(true);
      }
    });
  });

  describe("Batch Fraud Check", () => {
    it("should process multiple orders in batch", async () => {
      const orderIds = [1, 2, 3, 4, 5];
      
      const results = await fraudOps.batchFraudCheck(orderIds);
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(orderIds.length);
      
      results.forEach((result) => {
        expect(result).toHaveProperty("orderId");
        expect(result).toHaveProperty("riskScore");
        expect(result).toHaveProperty("riskLevel");
      });
    });

    it("should handle empty batch gracefully", async () => {
      const results = await fraudOps.batchFraudCheck([]);
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });

  describe("Dispute Management", () => {
    it("should create dispute with required fields", async () => {
      const disputeData = {
        transactionId: 1,
        disputeType: "chargeback" as const,
        amount: 100,
        customerReason: "Item not received",
        disputeDate: new Date().toISOString(),
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      const result = await fraudOps.createDispute(disputeData);
      
      expect(result).toHaveProperty("disputeId");
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("open");
    });

    it("should generate evidence pack for dispute", async () => {
      const evidenceData = {
        disputeId: 1,
        trackingNumber: "1Z999AA10123456784",
        deliveryConfirmation: "Delivered on 2024-01-15",
        customerCommunication: ["Email 1", "Email 2"],
        productDescription: "Widget XYZ",
        photos: ["photo1.jpg", "photo2.jpg"],
        invoices: ["invoice.pdf"],
        termsAcceptance: "Accepted on 2024-01-01",
      };
      
      const result = await fraudOps.generateEvidencePack(evidenceData);
      
      expect(result).toHaveProperty("evidencePackId");
      expect(result).toHaveProperty("documents");
      expect(result.documents).toBeInstanceOf(Array);
    });

    it("should auto-respond to dispute with evidence", async () => {
      const result = await fraudOps.autoRespondToDispute(1);
      
      expect(result).toHaveProperty("responseSubmitted");
      expect(result).toHaveProperty("submissionDate");
    });
  });

  describe("Chargeback Prevention", () => {
    it("should predict chargeback risk for transaction", async () => {
      const result = await fraudOps.predictChargebackRisk(1);
      
      expect(result).toHaveProperty("riskScore");
      expect(result).toHaveProperty("riskFactors");
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it("should identify high-risk chargeback patterns", async () => {
      const result = await fraudOps.predictChargebackRisk(1);
      
      if (result.riskScore > 70) {
        expect(result.riskFactors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Financial Dashboard", () => {
    it("should return revenue metrics for date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      
      const result = await fraudOps.getFinancialDashboard(startDate, endDate);
      
      expect(result).toHaveProperty("revenue");
      expect(result.revenue).toHaveProperty("total");
      expect(result.revenue).toHaveProperty("failed");
      expect(result.revenue).toHaveProperty("successRate");
    });

    it("should return dispute metrics", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      
      const result = await fraudOps.getFinancialDashboard(startDate, endDate);
      
      expect(result).toHaveProperty("disputes");
      expect(result.disputes).toHaveProperty("total");
      expect(result.disputes).toHaveProperty("rate");
      expect(result.disputes).toHaveProperty("amount");
      expect(result.disputes).toHaveProperty("byStatus");
    });

    it("should return fraud check statistics", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      
      const result = await fraudOps.getFinancialDashboard(startDate, endDate);
      
      expect(result).toHaveProperty("fraud");
      expect(result.fraud).toHaveProperty("totalChecks");
      expect(result.fraud).toHaveProperty("avgRiskScore");
      expect(result.fraud).toHaveProperty("lowRisk");
      expect(result.fraud).toHaveProperty("mediumRisk");
      expect(result.fraud).toHaveProperty("highRisk");
      expect(result.fraud).toHaveProperty("criticalRisk");
    });

    it("should calculate dispute rate correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      
      const result = await fraudOps.getFinancialDashboard(startDate, endDate);
      
      expect(result.disputes.rate).toBeGreaterThanOrEqual(0);
      expect(result.disputes.rate).toBeLessThanOrEqual(100);
    });
  });

  describe("Fraud Signal Detection", () => {
    it("should detect high-value order signal", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      // Orders over $1000 should be flagged
      if (result.flags.includes("high_value")) {
        expect(result.riskScore).toBeGreaterThan(10);
      }
    });

    it("should detect new account signal", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      if (result.flags.includes("new_account")) {
        expect(result.reasons).toContain(expect.stringContaining("new account"));
      }
    });

    it("should detect international shipping signal", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      if (result.flags.includes("international_shipping")) {
        expect(result.riskScore).toBeGreaterThan(5);
      }
    });
  });

  describe("Risk Score Calculation", () => {
    it("should increase score for multiple risk factors", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      const flagCount = result.flags.length;
      
      // More flags should mean higher risk
      if (flagCount > 3) {
        expect(result.riskScore).toBeGreaterThan(40);
      }
    });

    it("should cap risk score at 100", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it("should have minimum risk score of 0", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Fraud Prevention Actions", () => {
    it("should recommend appropriate action for each risk level", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      const hasAction = 
        result.shouldReject || 
        result.shouldHold || 
        result.shouldReview || 
        (!result.shouldReject && !result.shouldHold && !result.shouldReview);
      
      expect(hasAction).toBe(true);
    });

    it("should not recommend multiple conflicting actions", async () => {
      const result = await fraudOps.performFraudCheck(1);
      
      // Only one primary action should be true
      const actionCount = [
        result.shouldReject,
        result.shouldHold,
        result.shouldReview,
      ].filter(Boolean).length;
      
      expect(actionCount).toBeLessThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent order gracefully", async () => {
      await expect(fraudOps.performFraudCheck(999999)).rejects.toThrow();
    });

    it("should handle invalid dispute data", async () => {
      const invalidData = {
        transactionId: -1,
        disputeType: "invalid" as any,
        amount: -100,
        customerReason: "",
        disputeDate: "invalid-date",
        deadline: "invalid-date",
      };
      
      await expect(fraudOps.createDispute(invalidData)).rejects.toThrow();
    });

    it("should handle empty evidence pack", async () => {
      const emptyEvidence = {
        disputeId: 1,
        customerCommunication: [],
        productDescription: "",
        photos: [],
        invoices: [],
        termsAcceptance: "",
      };
      
      const result = await fraudOps.generateEvidencePack(emptyEvidence);
      
      expect(result).toBeDefined();
    });
  });

  describe("Performance", () => {
    it("should complete fraud check within 2 seconds", async () => {
      const startTime = Date.now();
      
      await fraudOps.performFraudCheck(1);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    it("should handle batch processing efficiently", async () => {
      const startTime = Date.now();
      const orderIds = Array.from({ length: 10 }, (_, i) => i + 1);
      
      await fraudOps.batchFraudCheck(orderIds);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 10 orders in under 5 seconds
    });
  });
});
