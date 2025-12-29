/**
 * HeyGen Avatar Video Generation Integration
 * 
 * Provides AI-powered avatar video generation for:
 * - Product demonstration videos
 * - Creator training videos
 * - Live show promos
 * - Social media content
 */

// ============================================================================
// Types
// ============================================================================

export interface HeyGenVideoRequest {
  avatarId: string;
  voiceId: string;
  script: string;
  background?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  quality?: "low" | "medium" | "high";
}

export interface HeyGenVideoResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  status?: "processing" | "completed" | "failed";
  error?: string;
}

// ============================================================================
// HeyGen Client
// ============================================================================

export class HeyGenClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || "";
    this.baseUrl = "https://api.heygen.com/v2";
  }

  /**
   * Generate an avatar video
   */
  async generateVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResult> {
    try {
      const response = await fetch(`${this.baseUrl}/video/generate`, {
        method: "POST",
        headers: {
          "X-Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: "avatar",
                avatar_id: request.avatarId,
              },
              voice: {
                type: "text",
                voice_id: request.voiceId,
                input_text: request.script,
              },
              background: request.background || "#FFFFFF",
            },
          ],
          dimension: {
            width: request.aspectRatio === "9:16" ? 1080 : 1920,
            height: request.aspectRatio === "16:9" ? 1080 : 1920,
          },
          test: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        videoId: result.data?.video_id,
        status: "processing",
      };
    } catch (error) {
      console.error("HeyGen video generation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check video generation status
   */
  async getVideoStatus(videoId: string): Promise<HeyGenVideoResult> {
    try {
      const response = await fetch(`${this.baseUrl}/video/${videoId}`, {
        method: "GET",
        headers: {
          "X-Api-Key": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data;

      return {
        success: true,
        videoId: data.video_id,
        videoUrl: data.video_url,
        status: data.status,
      };
    } catch (error) {
      console.error("HeyGen status check error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate product demo video
   */
  async generateProductDemo(params: {
    productName: string;
    productDescription: string;
    keyFeatures: string[];
    demoScript: string;
  }): Promise<HeyGenVideoResult> {
    const script = `
Hi! Let me show you the ${params.productName}.

${params.productDescription}

Here are the key features:
${params.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n")}

${params.demoScript}

Get yours today and experience the difference!
    `.trim();

    return this.generateVideo({
      avatarId: "default_avatar",
      voiceId: "default_voice",
      script,
      aspectRatio: "9:16", // TikTok/Instagram format
      quality: "high",
    });
  }

  /**
   * Generate creator training video
   */
  async generateCreatorTraining(params: {
    topic: string;
    content: string;
    tips: string[];
  }): Promise<HeyGenVideoResult> {
    const script = `
Welcome to your training on ${params.topic}.

${params.content}

Here are some pro tips:
${params.tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Practice these techniques and you'll be a pro in no time!
    `.trim();

    return this.generateVideo({
      avatarId: "trainer_avatar",
      voiceId: "professional_voice",
      script,
      aspectRatio: "16:9", // YouTube format
      quality: "high",
    });
  }

  /**
   * Generate live show promo
   */
  async generateLiveShowPromo(params: {
    showTitle: string;
    scheduledAt: Date;
    products: string[];
    hostName: string;
  }): Promise<HeyGenVideoResult> {
    const dateStr = params.scheduledAt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const script = `
Don't miss our live shopping event: ${params.showTitle}!

Join ${params.hostName} on ${dateStr} for exclusive deals on:
${params.products.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Set your reminder now and get ready to shop live!
    `.trim();

    return this.generateVideo({
      avatarId: "host_avatar",
      voiceId: "energetic_voice",
      script,
      aspectRatio: "9:16", // Social media format
      quality: "high",
    });
  }

  /**
   * Wait for video to complete (with polling)
   */
  async waitForVideo(
    videoId: string,
    maxWaitSeconds: number = 300
  ): Promise<HeyGenVideoResult> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      const status = await this.getVideoStatus(videoId);

      if (!status.success) {
        return status;
      }

      if (status.status === "completed") {
        return status;
      }

      if (status.status === "failed") {
        return {
          success: false,
          error: "Video generation failed",
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: "Video generation timeout",
    };
  }
}

// ============================================================================
// Avatar Presets
// ============================================================================

export const HEYGEN_AVATARS = {
  // Product demo avatars
  PRODUCT_DEMO_FEMALE: "avatar_demo_female_01",
  PRODUCT_DEMO_MALE: "avatar_demo_male_01",

  // Creator training avatars
  TRAINER_FEMALE: "avatar_trainer_female_01",
  TRAINER_MALE: "avatar_trainer_male_01",

  // Live show host avatars
  HOST_ENERGETIC: "avatar_host_energetic_01",
  HOST_PROFESSIONAL: "avatar_host_professional_01",
  HOST_FRIENDLY: "avatar_host_friendly_01",
};

export const HEYGEN_VOICES = {
  // English voices
  EN_FEMALE_PROFESSIONAL: "voice_en_female_professional",
  EN_FEMALE_FRIENDLY: "voice_en_female_friendly",
  EN_FEMALE_ENERGETIC: "voice_en_female_energetic",
  EN_MALE_PROFESSIONAL: "voice_en_male_professional",
  EN_MALE_FRIENDLY: "voice_en_male_friendly",
  EN_MALE_ENERGETIC: "voice_en_male_energetic",

  // Australian English (for AU market focus)
  AU_FEMALE: "voice_au_female",
  AU_MALE: "voice_au_male",
};

// Export singleton instance
export const heygenClient = new HeyGenClient();
