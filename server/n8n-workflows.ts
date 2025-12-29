/**
 * N8N Workflow Orchestration Integration
 * 
 * Provides programmatic access to N8N workflows for automation:
 * - Product launch workflows
 * - Creator onboarding workflows
 * - Live show preparation workflows
 * - Post-show clip generation workflows
 * - Supplier outreach workflows
 */

import { env } from "./_core/env.js";

// ============================================================================
// Types
// ============================================================================

export interface N8NWorkflowTrigger {
  workflowId: string;
  data: Record<string, any>;
}

export interface N8NWorkflowResult {
  success: boolean;
  executionId?: string;
  data?: any;
  error?: string;
}

// ============================================================================
// N8N Client
// ============================================================================

export class N8NWorkflowClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // In production, these would come from environment variables
    this.baseUrl = process.env.N8N_BASE_URL || "http://localhost:5678";
    this.apiKey = process.env.N8N_API_KEY || "";
  }

  /**
   * Trigger a workflow by webhook
   */
  async triggerWorkflow(
    workflowId: string,
    data: Record<string, any>
  ): Promise<N8NWorkflowResult> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/${workflowId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`N8N workflow trigger failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("N8N workflow trigger error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Trigger product launch workflow
   */
  async triggerProductLaunch(params: {
    productId: number;
    productName: string;
    category: string;
    targetCOGS: number;
    targetRetailPrice: number;
    supplierKeywords: string[];
    liveScriptHooks: string[];
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("product-launch", params);
  }

  /**
   * Trigger creator onboarding workflow
   */
  async triggerCreatorOnboarding(params: {
    creatorId: number;
    creatorName: string;
    email: string;
    tier: string;
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("creator-onboarding", params);
  }

  /**
   * Trigger live show preparation workflow
   */
  async triggerLiveShowPrep(params: {
    showId: number;
    showTitle: string;
    scheduledAt: Date;
    productIds: number[];
    hostId: number;
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("live-show-prep", params);
  }

  /**
   * Trigger post-show clip generation workflow
   */
  async triggerClipGeneration(params: {
    showId: number;
    recordingUrl: string;
    highlightTimestamps: Array<{ start: number; end: number; label: string }>;
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("clip-generation", params);
  }

  /**
   * Trigger supplier outreach workflow
   */
  async triggerSupplierOutreach(params: {
    productName: string;
    targetCOGS: number;
    targetMOQ: number;
    supplierIds: number[];
    message: string;
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("supplier-outreach", params);
  }

  /**
   * Trigger 30-day launch sprint workflow
   */
  async trigger30DayLaunchSprint(params: {
    productId: number;
    launchDate: Date;
    checkpoints: string[];
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("30-day-launch-sprint", params);
  }

  /**
   * Trigger weekly experiment rotator
   */
  async triggerWeeklyExperimentRotator(params: {
    channelId: string;
    currentWeekProducts: number[];
    nextWeekCandidates: number[];
    rule6030010: { winners: number; experiments: number; wildcards: number };
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("weekly-experiment-rotator", params);
  }

  /**
   * Trigger winner clone defense workflow
   */
  async triggerWinnerCloneDefense(params: {
    productId: number;
    competitorUrls: string[];
    defenseTactics: string[];
  }): Promise<N8NWorkflowResult> {
    return this.triggerWorkflow("winner-clone-defense", params);
  }
}

// ============================================================================
// Workflow Templates
// ============================================================================

export const N8N_WORKFLOW_TEMPLATES = {
  /**
   * Product Launch Workflow (30-day sprint)
   * 
   * Steps:
   * 1. Create product in database
   * 2. Generate supplier outreach emails
   * 3. Create asset generation tasks
   * 4. Schedule test streams
   * 5. Generate creator briefs
   * 6. Set up live show calendar
   * 7. Create post-launch monitoring tasks
   */
  PRODUCT_LAUNCH: "product-launch",

  /**
   * Creator Onboarding Workflow (7-day training)
   * 
   * Steps:
   * 1. Send welcome email with credentials
   * 2. Schedule onboarding call
   * 3. Provide training materials
   * 4. Assign first test product
   * 5. Schedule first live show
   * 6. Set up payment details
   * 7. Add to creator dashboard
   */
  CREATOR_ONBOARDING: "creator-onboarding",

  /**
   * Live Show Prep Workflow (24-hour checklist)
   * 
   * Steps:
   * 1. Generate run-of-show document
   * 2. Create OBS scene pack
   * 3. Generate host script
   * 4. Create moderator playbook
   * 5. Set up product pins
   * 6. Test streaming setup
   * 7. Send reminder to host
   */
  LIVE_SHOW_PREP: "live-show-prep",

  /**
   * Post-Show Clip Factory (30 clips per winner)
   * 
   * Steps:
   * 1. Download recording from Twilio
   * 2. Identify highlight moments
   * 3. Generate 30 short clips (15s, 30s, 60s)
   * 4. Add captions and branding
   * 5. Upload to TikTok, YouTube Shorts, Instagram Reels
   * 6. Track performance metrics
   * 7. Identify top-performing clips
   */
  CLIP_GENERATION: "clip-generation",

  /**
   * Supplier Outreach Workflow
   * 
   * Steps:
   * 1. Search suppliers on Alibaba/1688
   * 2. Generate personalized outreach emails
   * 3. Send emails via SMTP
   * 4. Track responses
   * 5. Schedule follow-ups
   * 6. Create negotiation tasks
   * 7. Update supplier database
   */
  SUPPLIER_OUTREACH: "supplier-outreach",

  /**
   * Weekly Experiment Rotator (60/30/10 rule)
   * 
   * Steps:
   * 1. Analyze previous week performance
   * 2. Identify winners (60% of inventory)
   * 3. Select experiments (30% of inventory)
   * 4. Choose wildcards (10% of inventory)
   * 5. Update live show schedule
   * 6. Generate creator briefs
   * 7. Set auto-stop rules
   */
  WEEKLY_EXPERIMENT_ROTATOR: "weekly-experiment-rotator",

  /**
   * Winner Clone Defense (14-day moat sprint)
   * 
   * Steps:
   * 1. Monitor competitor listings
   * 2. Analyze competitor pricing
   * 3. Enhance product differentiation
   * 4. Create exclusive bundles
   * 5. Increase creator commissions
   * 6. Boost marketing spend
   * 7. File trademark/patent if applicable
   */
  WINNER_CLONE_DEFENSE: "winner-clone-defense",
};

// Export singleton instance
export const n8nClient = new N8NWorkflowClient();
