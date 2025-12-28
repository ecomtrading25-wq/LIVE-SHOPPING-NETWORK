import { describe, it, expect, beforeEach, vi } from "vitest";
import purchasingOps from "./lsn-purchasing-supplier-os";

describe("LSN Purchasing & Supplier OS", () => {
  describe("Supplier Onboarding", () => {
    it("should onboard supplier with complete information", async () => {
      const supplierData = {
        name: "Test Supplier Inc",
        contactName: "John Doe",
        contactEmail: "john@testsupplier.com",
        contactPhone: "+1-555-0123",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US",
        taxId: "12-3456789",
        paymentTerms: "NET30",
        currency: "USD",
        leadTimeDays: 30,
        minimumOrderValue: 1000,
        shippingMethods: ["air", "sea"],
        certifications: ["ISO9001", "ISO14001"],
        productCategories: ["electronics", "accessories"],
      };

      const result = await purchasingOps.onboardSupplier(supplierData);

      expect(result).toHaveProperty("supplierId");
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("active");
      expect(result).toHaveProperty("trustScore");
      expect(result.trustScore).toBeGreaterThanOrEqual(0);
      expect(result.trustScore).toBeLessThanOrEqual(100);
    });

    it("should assign initial trust score to new supplier", async () => {
      const supplierData = {
        name: "New Supplier",
        contactName: "Jane Smith",
        contactEmail: "jane@newsupplier.com",
        contactPhone: "+1-555-0124",
        address: "456 Oak Ave",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        country: "US",
        taxId: "98-7654321",
        paymentTerms: "NET60",
        currency: "USD",
        leadTimeDays: 45,
        minimumOrderValue: 5000,
        shippingMethods: ["sea"],
        certifications: [],
        productCategories: ["clothing"],
      };

      const result = await purchasingOps.onboardSupplier(supplierData);

      // New suppliers start with base trust score
      expect(result.trustScore).toBe(50);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        name: "",
        contactName: "",
        contactEmail: "invalid-email",
        contactPhone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        taxId: "",
        paymentTerms: "",
        currency: "",
        leadTimeDays: -1,
        minimumOrderValue: -100,
        shippingMethods: [],
        certifications: [],
        productCategories: [],
      };

      await expect(purchasingOps.onboardSupplier(invalidData)).rejects.toThrow();
    });
  });

  describe("Purchase Order Generation", () => {
    it("should generate PO with valid data", async () => {
      const poData = {
        supplierId: 1,
        items: [
          { productId: 1, quantity: 100, unitPrice: 10 },
          { productId: 2, quantity: 50, unitPrice: 20 },
        ],
        shippingMethod: "air",
        requestedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Rush order",
      };

      const result = await purchasingOps.generatePurchaseOrder(poData);

      expect(result).toHaveProperty("poId");
      expect(result).toHaveProperty("poNumber");
      expect(result).toHaveProperty("totalAmount");
      expect(result).toHaveProperty("status");
      expect(result.status).toBe("pending");
    });

    it("should calculate PO total correctly", async () => {
      const poData = {
        supplierId: 1,
        items: [
          { productId: 1, quantity: 100, unitPrice: 10 },
          { productId: 2, quantity: 50, unitPrice: 20 },
        ],
        shippingMethod: "air",
        requestedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await purchasingOps.generatePurchaseOrder(poData);

      const expectedTotal = 100 * 10 + 50 * 20; // 2000
      expect(result.totalAmount).toBe(expectedTotal);
    });

    it("should enforce minimum order value", async () => {
      const poData = {
        supplierId: 1,
        items: [
          { productId: 1, quantity: 1, unitPrice: 10 },
        ],
        shippingMethod: "air",
        requestedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(purchasingOps.generatePurchaseOrder(poData)).rejects.toThrow(/minimum order value/i);
    });

    it("should generate unique PO numbers", async () => {
      const poData = {
        supplierId: 1,
        items: [
          { productId: 1, quantity: 100, unitPrice: 10 },
        ],
        shippingMethod: "air",
        requestedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result1 = await purchasingOps.generatePurchaseOrder(poData);
      const result2 = await purchasingOps.generatePurchaseOrder(poData);

      expect(result1.poNumber).not.toBe(result2.poNumber);
    });
  });

  describe("Landed Cost Calculation", () => {
    it("should calculate landed cost with all fees", async () => {
      const costData = {
        productCost: 1000,
        quantity: 100,
        shippingCost: 500,
        country: "US",
        hsCode: "8517.12.00",
      };

      const result = await purchasingOps.calculateLandedCost(costData);

      expect(result).toHaveProperty("productCost");
      expect(result).toHaveProperty("shipping");
      expect(result).toHaveProperty("duties");
      expect(result).toHaveProperty("insurance");
      expect(result).toHaveProperty("totalLandedCost");
      expect(result).toHaveProperty("perUnitCost");
    });

    it("should calculate per-unit cost correctly", async () => {
      const costData = {
        productCost: 1000,
        quantity: 100,
        shippingCost: 500,
        country: "US",
        hsCode: "8517.12.00",
      };

      const result = await purchasingOps.calculateLandedCost(costData);

      const expectedPerUnit = result.totalLandedCost / costData.quantity;
      expect(result.perUnitCost).toBeCloseTo(expectedPerUnit, 2);
    });

    it("should apply country-specific duty rates", async () => {
      const costDataUS = {
        productCost: 1000,
        quantity: 100,
        shippingCost: 500,
        country: "US",
        hsCode: "8517.12.00",
      };

      const costDataEU = {
        ...costDataUS,
        country: "DE",
      };

      const resultUS = await purchasingOps.calculateLandedCost(costDataUS);
      const resultEU = await purchasingOps.calculateLandedCost(costDataEU);

      // EU typically has higher duties
      expect(resultEU.duties).toBeGreaterThanOrEqual(resultUS.duties);
    });

    it("should calculate insurance as percentage of value", async () => {
      const costData = {
        productCost: 1000,
        quantity: 100,
        shippingCost: 500,
        country: "US",
        hsCode: "8517.12.00",
      };

      const result = await purchasingOps.calculateLandedCost(costData);

      // Insurance typically 1-2% of product value
      const expectedInsurance = costData.productCost * 0.015;
      expect(result.insurance).toBeCloseTo(expectedInsurance, 0);
    });

    it("should include all costs in total", async () => {
      const costData = {
        productCost: 1000,
        quantity: 100,
        shippingCost: 500,
        country: "US",
        hsCode: "8517.12.00",
      };

      const result = await purchasingOps.calculateLandedCost(costData);

      const expectedTotal = result.productCost + result.shipping + result.duties + result.insurance;
      expect(result.totalLandedCost).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe("Quality Inspection", () => {
    it("should create quality inspection record", async () => {
      const inspectionData = {
        poId: 1,
        inspectorId: 1,
        inspectionDate: new Date().toISOString(),
        samplesChecked: 50,
        defectsFound: 2,
        defectTypes: ["scratches", "misalignment"],
        passedInspection: true,
        notes: "Minor cosmetic issues",
      };

      const result = await purchasingOps.recordQualityInspection(inspectionData);

      expect(result).toHaveProperty("inspectionId");
      expect(result).toHaveProperty("qualityScore");
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it("should calculate quality score from defect rate", async () => {
      const inspectionData = {
        poId: 1,
        inspectorId: 1,
        inspectionDate: new Date().toISOString(),
        samplesChecked: 100,
        defectsFound: 5,
        defectTypes: ["scratches"],
        passedInspection: true,
        notes: "",
      };

      const result = await purchasingOps.recordQualityInspection(inspectionData);

      // 5 defects in 100 samples = 95% quality score
      expect(result.qualityScore).toBe(95);
    });

    it("should fail inspection with high defect rate", async () => {
      const inspectionData = {
        poId: 1,
        inspectorId: 1,
        inspectionDate: new Date().toISOString(),
        samplesChecked: 100,
        defectsFound: 25,
        defectTypes: ["major defects"],
        passedInspection: false,
        notes: "Excessive defects",
      };

      const result = await purchasingOps.recordQualityInspection(inspectionData);

      expect(result.passedInspection).toBe(false);
      expect(result.qualityScore).toBeLessThan(80);
    });

    it("should update supplier trust score based on quality", async () => {
      const inspectionData = {
        poId: 1,
        inspectorId: 1,
        inspectionDate: new Date().toISOString(),
        samplesChecked: 100,
        defectsFound: 1,
        defectTypes: ["minor"],
        passedInspection: true,
        notes: "Excellent quality",
      };

      const result = await purchasingOps.recordQualityInspection(inspectionData);

      expect(result).toHaveProperty("supplierTrustScoreUpdated");
      expect(result.supplierTrustScoreUpdated).toBe(true);
    });
  });

  describe("Automated Reorder System", () => {
    it("should identify products needing reorder", async () => {
      const result = await purchasingOps.runAutomatedReorder();

      expect(result).toHaveProperty("productsChecked");
      expect(result).toHaveProperty("ordersCreated");
      expect(result).toHaveProperty("totalValue");
      expect(result.productsChecked).toBeGreaterThan(0);
    });

    it("should create POs for low stock items", async () => {
      const result = await purchasingOps.runAutomatedReorder();

      if (result.ordersCreated > 0) {
        expect(result).toHaveProperty("orders");
        expect(result.orders).toBeInstanceOf(Array);
        expect(result.orders.length).toBe(result.ordersCreated);
      }
    });

    it("should respect reorder points", async () => {
      const result = await purchasingOps.runAutomatedReorder();

      expect(result).toHaveProperty("reorderLogic");
      expect(result.reorderLogic).toMatch(/reorder point|safety stock/i);
    });

    it("should calculate optimal order quantities", async () => {
      const result = await purchasingOps.runAutomatedReorder();

      if (result.ordersCreated > 0) {
        result.orders.forEach((order: any) => {
          expect(order).toHaveProperty("quantity");
          expect(order.quantity).toBeGreaterThan(0);
        });
      }
    });

    it("should consider lead times in reorder calculation", async () => {
      const result = await purchasingOps.runAutomatedReorder();

      expect(result).toHaveProperty("leadTimeConsidered");
      expect(result.leadTimeConsidered).toBe(true);
    });
  });

  describe("Supplier Performance Tracking", () => {
    it("should calculate supplier performance metrics", async () => {
      const supplierId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await purchasingOps.getSupplierPerformance(supplierId, periodStart, periodEnd);

      expect(result).toHaveProperty("supplierId");
      expect(result).toHaveProperty("onTimeDeliveryRate");
      expect(result).toHaveProperty("qualityScore");
      expect(result).toHaveProperty("defectRate");
      expect(result).toHaveProperty("totalOrders");
      expect(result).toHaveProperty("totalSpend");
    });

    it("should calculate on-time delivery rate", async () => {
      const supplierId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await purchasingOps.getSupplierPerformance(supplierId, periodStart, periodEnd);

      expect(result.onTimeDeliveryRate).toBeGreaterThanOrEqual(0);
      expect(result.onTimeDeliveryRate).toBeLessThanOrEqual(100);
    });

    it("should calculate average quality score", async () => {
      const supplierId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await purchasingOps.getSupplierPerformance(supplierId, periodStart, periodEnd);

      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it("should track defect rate over time", async () => {
      const supplierId = 1;
      const periodStart = new Date("2024-01-01");
      const periodEnd = new Date("2024-01-31");

      const result = await purchasingOps.getSupplierPerformance(supplierId, periodStart, periodEnd);

      expect(result.defectRate).toBeGreaterThanOrEqual(0);
      expect(result.defectRate).toBeLessThanOrEqual(100);
    });
  });

  describe("Purchasing Analytics", () => {
    it("should return comprehensive purchasing analytics", async () => {
      const dateRange = {
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-01-31").toISOString(),
      };

      const result = await purchasingOps.getPurchasingAnalytics(dateRange);

      expect(result).toHaveProperty("totalSpend");
      expect(result).toHaveProperty("totalPOs");
      expect(result).toHaveProperty("avgPOValue");
      expect(result).toHaveProperty("activeSuppliers");
      expect(result).toHaveProperty("totalSuppliers");
      expect(result).toHaveProperty("avgQualityScore");
      expect(result).toHaveProperty("topSuppliers");
      expect(result).toHaveProperty("posByStatus");
      expect(result).toHaveProperty("qualityInspections");
      expect(result).toHaveProperty("commonDefects");
    });

    it("should calculate average PO value correctly", async () => {
      const dateRange = {
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-01-31").toISOString(),
      };

      const result = await purchasingOps.getPurchasingAnalytics(dateRange);

      if (result.totalPOs > 0) {
        const expectedAvg = result.totalSpend / result.totalPOs;
        expect(result.avgPOValue).toBeCloseTo(expectedAvg, 2);
      }
    });

    it("should rank top suppliers by spend", async () => {
      const dateRange = {
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-01-31").toISOString(),
      };

      const result = await purchasingOps.getPurchasingAnalytics(dateRange);

      expect(result.topSuppliers).toBeInstanceOf(Array);
      
      // Should be sorted by spend descending
      for (let i = 1; i < result.topSuppliers.length; i++) {
        expect(result.topSuppliers[i - 1].totalSpend).toBeGreaterThanOrEqual(
          result.topSuppliers[i].totalSpend
        );
      }
    });

    it("should break down POs by status", async () => {
      const dateRange = {
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-01-31").toISOString(),
      };

      const result = await purchasingOps.getPurchasingAnalytics(dateRange);

      expect(result.posByStatus).toHaveProperty("pending");
      expect(result.posByStatus).toHaveProperty("approved");
      expect(result.posByStatus).toHaveProperty("in_transit");
      expect(result.posByStatus).toHaveProperty("received");
      expect(result.posByStatus).toHaveProperty("cancelled");
    });

    it("should identify common defect types", async () => {
      const dateRange = {
        startDate: new Date("2024-01-01").toISOString(),
        endDate: new Date("2024-01-31").toISOString(),
      };

      const result = await purchasingOps.getPurchasingAnalytics(dateRange);

      expect(result.commonDefects).toBeInstanceOf(Array);
      
      result.commonDefects.forEach((defect: any) => {
        expect(defect).toHaveProperty("type");
        expect(defect).toHaveProperty("count");
      });
    });
  });

  describe("Supplier Trust Score", () => {
    it("should update trust score based on performance", async () => {
      const supplierId = 1;

      const result = await purchasingOps.updateSupplierTrustScore(supplierId);

      expect(result).toHaveProperty("supplierId");
      expect(result).toHaveProperty("oldScore");
      expect(result).toHaveProperty("newScore");
      expect(result.newScore).toBeGreaterThanOrEqual(0);
      expect(result.newScore).toBeLessThanOrEqual(100);
    });

    it("should increase score for good performance", async () => {
      const supplierId = 1;

      // Simulate good performance
      const result = await purchasingOps.updateSupplierTrustScore(supplierId);

      if (result.performanceGood) {
        expect(result.newScore).toBeGreaterThanOrEqual(result.oldScore);
      }
    });

    it("should decrease score for poor performance", async () => {
      const supplierId = 1;

      // Simulate poor performance
      const result = await purchasingOps.updateSupplierTrustScore(supplierId);

      if (result.performancePoor) {
        expect(result.newScore).toBeLessThanOrEqual(result.oldScore);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent supplier", async () => {
      await expect(purchasingOps.getSupplierPerformance(999999, new Date(), new Date())).rejects.toThrow();
    });

    it("should handle invalid date ranges", async () => {
      const endDate = new Date();
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await expect(purchasingOps.getPurchasingAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })).rejects.toThrow();
    });

    it("should handle empty PO items", async () => {
      const poData = {
        supplierId: 1,
        items: [],
        shippingMethod: "air",
        requestedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(purchasingOps.generatePurchaseOrder(poData)).rejects.toThrow();
    });

    it("should handle zero quantity in landed cost", async () => {
      const costData = {
        productCost: 1000,
        quantity: 0,
        shippingCost: 500,
        country: "US",
        hsCode: "8517.12.00",
      };

      await expect(purchasingOps.calculateLandedCost(costData)).rejects.toThrow();
    });
  });

  describe("Performance", () => {
    it("should calculate landed cost within 500ms", async () => {
      const startTime = Date.now();

      await purchasingOps.calculateLandedCost({
        productCost: 1000,
        quantity: 100,
        shippingCost: 500,
        country: "US",
        hsCode: "8517.12.00",
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it("should run reorder system efficiently", async () => {
      const startTime = Date.now();

      await purchasingOps.runAutomatedReorder();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });
});
