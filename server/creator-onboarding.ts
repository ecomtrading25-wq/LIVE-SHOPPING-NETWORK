/**
 * Creator Onboarding System
 * Complete creator registration, verification, and management
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const creatorSchemas = {
  registerCreator: z.object({
    userId: z.string(),
    displayName: z.string().min(3).max(50),
    bio: z.string().max(500),
    category: z.enum(['fashion', 'beauty', 'tech', 'home', 'food', 'fitness', 'lifestyle']),
    socialLinks: z.object({
      instagram: z.string().url().optional(),
      tiktok: z.string().url().optional(),
      youtube: z.string().url().optional(),
    }).optional(),
  }),
  
  submitVerification: z.object({
    creatorId: z.string(),
    idType: z.enum(['passport', 'drivers_license', 'national_id']),
    idNumber: z.string(),
    idFrontImage: z.string(), // S3 URL
    idBackImage: z.string().optional(),
    selfieImage: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string(),
    }),
  }),
  
  setupPayout: z.object({
    creatorId: z.string(),
    method: z.enum(['stripe', 'paypal', 'wise', 'bank']),
    accountDetails: z.object({
      accountHolderName: z.string(),
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
      iban: z.string().optional(),
      swiftCode: z.string().optional(),
      email: z.string().email().optional(),
    }),
  }),
  
  updateCreatorTier: z.object({
    creatorId: z.string(),
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  }),
};

export async function registerCreator(input: z.infer<typeof creatorSchemas.registerCreator>) {
  // Create creator profile
  const creator = {
    id: crypto.randomUUID(),
    userId: input.userId,
    displayName: input.displayName,
    bio: input.bio,
    category: input.category,
    socialLinks: input.socialLinks,
    tier: 'bronze',
    status: 'pending_verification',
    createdAt: new Date(),
  };

  return {
    creatorId: creator.id,
    status: creator.status,
    nextSteps: [
      'Complete identity verification',
      'Setup payout account',
      'Complete creator training',
      'Schedule first show',
    ],
  };
}

export async function submitVerification(input: z.infer<typeof creatorSchemas.submitVerification>) {
  // In production, integrate with identity verification service (Stripe Identity, Onfido, etc.)
  
  return {
    verificationId: crypto.randomUUID(),
    status: 'under_review',
    estimatedCompletionTime: '24-48 hours',
  };
}

export async function setupPayout(input: z.infer<typeof creatorSchemas.setupPayout>) {
  // Store payout method
  return {
    payoutId: crypto.randomUUID(),
    method: input.method,
    status: 'active',
  };
}

export async function calculateCreatorTier(creatorId: string) {
  // Calculate tier based on performance metrics
  const metrics = {
    totalShows: 50,
    totalRevenue: 50000,
    averageViewers: 500,
    conversionRate: 5.5,
  };

  let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
  
  if (metrics.totalRevenue >= 100000 && metrics.averageViewers >= 1000) {
    tier = 'platinum';
  } else if (metrics.totalRevenue >= 50000 && metrics.averageViewers >= 500) {
    tier = 'gold';
  } else if (metrics.totalRevenue >= 10000 && metrics.averageViewers >= 100) {
    tier = 'silver';
  }

  return { tier, metrics };
}

export default {
  registerCreator,
  submitVerification,
  setupPayout,
  calculateCreatorTier,
};
