/**
 * Creator Onboarding Service
 * Handles creator applications, KYC verification, bank setup, training, and tier qualification
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  creatorApplications,
  creatorVerifications,
  creatorBankAccounts,
  creatorDocuments,
  creatorTraining,
  creatorAgreements,
  creators
} from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW';
export type DocumentType = 'ID_FRONT' | 'ID_BACK' | 'SELFIE' | 'TAX_FORM' | 'BANK_STATEMENT' | 'PORTFOLIO' | 'DEMO_VIDEO';
export type AgreementStatus = 'PENDING' | 'SIGNED' | 'EXPIRED' | 'REVOKED';

export interface CreatorApplication {
  applicationId: string;
  userId: string;
  channelId: string;
  status: ApplicationStatus;
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  experience: {
    yearsExperience: number;
    previousPlatforms: string[];
    avgViewers?: number;
    specialties: string[];
  };
  availability: {
    hoursPerWeek: number;
    preferredDays: string[];
    preferredTimeSlots: string[];
  };
  equipment: {
    hasCamera: boolean;
    hasLighting: boolean;
    hasMicrophone: boolean;
    internetSpeed: string;
  };
  portfolioUrls: string[];
  demoVideoUrl?: string;
  referralCode?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface KYCVerification {
  verificationId: string;
  applicationId: string;
  userId: string;
  status: VerificationStatus;
  provider: 'STRIPE' | 'PERSONA' | 'ONFIDO' | 'MANUAL';
  providerVerificationId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  idNumber?: string;
  idType?: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
  verifiedAt?: Date;
  failureReason?: string;
}

export interface BankAccount {
  bankAccountId: string;
  creatorId: string;
  accountHolderName: string;
  accountType: 'CHECKING' | 'SAVINGS';
  routingNumber: string;
  accountNumberLast4: string;
  bankName: string;
  currency: string;
  isDefault: boolean;
  isVerified: boolean;
  providerAccountId?: string;
}

export interface CreatorDocument {
  documentId: string;
  applicationId: string;
  userId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface TrainingModule {
  moduleId: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration: number;
  sortOrder: number;
  isRequired: boolean;
}

export interface CreatorTrainingProgress {
  progressId: string;
  creatorId: string;
  moduleId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  score?: number;
}

/**
 * Create creator application
 */
export async function createApplication(
  userId: string,
  channelId: string,
  data: {
    displayName: string;
    email: string;
    phone: string;
    bio: string;
    socialLinks: CreatorApplication['socialLinks'];
    experience: CreatorApplication['experience'];
    availability: CreatorApplication['availability'];
    equipment: CreatorApplication['equipment'];
    referralCode?: string;
  }
): Promise<CreatorApplication> {
  // Check if user already has an application
  const existing = await db.query.creatorApplications.findFirst({
    where: and(
      eq(creatorApplications.userId, userId),
      eq(creatorApplications.channelId, channelId)
    )
  });

  if (existing && existing.status !== 'REJECTED') {
    throw new Error('Application already exists');
  }

  const [application] = await db.insert(creatorApplications).values({
    userId,
    channelId,
    status: 'DRAFT',
    displayName: data.displayName,
    email: data.email,
    phone: data.phone,
    bio: data.bio,
    socialLinks: data.socialLinks,
    experience: data.experience,
    availability: data.availability,
    equipment: data.equipment,
    referralCode: data.referralCode || null
  }).returning();

  return application as CreatorApplication;
}

/**
 * Submit application for review
 */
export async function submitApplication(
  userId: string,
  applicationId: string
): Promise<void> {
  const application = await db.query.creatorApplications.findFirst({
    where: and(
      eq(creatorApplications.applicationId, applicationId),
      eq(creatorApplications.userId, userId)
    )
  });

  if (!application) {
    throw new Error('Application not found');
  }

  if (application.status !== 'DRAFT') {
    throw new Error('Application already submitted');
  }

  // Validate required fields
  if (!application.displayName || !application.email || !application.bio) {
    throw new Error('Missing required fields');
  }

  // Check for required documents
  const documents = await db.query.creatorDocuments.findMany({
    where: eq(creatorDocuments.applicationId, applicationId)
  });

  const hasIdFront = documents.some(d => d.type === 'ID_FRONT');
  const hasIdBack = documents.some(d => d.type === 'ID_BACK');
  const hasSelfie = documents.some(d => d.type === 'SELFIE');

  if (!hasIdFront || !hasIdBack || !hasSelfie) {
    throw new Error('Missing required identity documents');
  }

  await db.update(creatorApplications)
    .set({
      status: 'SUBMITTED',
      submittedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(creatorApplications.applicationId, applicationId));

  // Trigger automated review
  await triggerAutomatedReview(applicationId);
}

/**
 * Automated application review
 */
async function triggerAutomatedReview(applicationId: string): Promise<void> {
  const application = await db.query.creatorApplications.findFirst({
    where: eq(creatorApplications.applicationId, applicationId)
  });

  if (!application) return;

  // Calculate application score
  let score = 0;

  // Experience score (0-30)
  if (application.experience.yearsExperience >= 3) score += 30;
  else if (application.experience.yearsExperience >= 1) score += 20;
  else score += 10;

  // Equipment score (0-20)
  if (application.equipment.hasCamera) score += 5;
  if (application.equipment.hasLighting) score += 5;
  if (application.equipment.hasMicrophone) score += 5;
  if (application.equipment.internetSpeed === 'FAST') score += 5;

  // Availability score (0-20)
  if (application.availability.hoursPerWeek >= 20) score += 20;
  else if (application.availability.hoursPerWeek >= 10) score += 15;
  else score += 10;

  // Social presence score (0-15)
  const socialCount = Object.keys(application.socialLinks || {}).length;
  score += Math.min(socialCount * 5, 15);

  // Portfolio score (0-15)
  if (application.portfolioUrls && application.portfolioUrls.length > 0) score += 10;
  if (application.demoVideoUrl) score += 5;

  // Auto-approve if score >= 70
  if (score >= 70) {
    await db.update(creatorApplications)
      .set({
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: 'AUTOMATED',
        reviewNotes: `Auto-approved with score: ${score}/100`,
        updatedAt: new Date()
      })
      .where(eq(creatorApplications.applicationId, applicationId));

    // Create creator profile
    await createCreatorProfile(application);
  } else if (score >= 50) {
    // Send to manual review
    await db.update(creatorApplications)
      .set({
        status: 'UNDER_REVIEW',
        updatedAt: new Date()
      })
      .where(eq(creatorApplications.applicationId, applicationId));
  } else {
    // Auto-reject
    await db.update(creatorApplications)
      .set({
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: 'AUTOMATED',
        reviewNotes: `Auto-rejected with score: ${score}/100. Please improve your application and reapply.`,
        updatedAt: new Date()
      })
      .where(eq(creatorApplications.applicationId, applicationId));
  }
}

/**
 * Manual application review
 */
export async function reviewApplication(
  applicationId: string,
  reviewerId: string,
  decision: 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED',
  notes: string
): Promise<void> {
  const application = await db.query.creatorApplications.findFirst({
    where: eq(creatorApplications.applicationId, applicationId)
  });

  if (!application) {
    throw new Error('Application not found');
  }

  await db.update(creatorApplications)
    .set({
      status: decision,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      reviewNotes: notes,
      updatedAt: new Date()
    })
    .where(eq(creatorApplications.applicationId, applicationId));

  if (decision === 'APPROVED') {
    await createCreatorProfile(application);
  }
}

/**
 * Create creator profile after approval
 */
async function createCreatorProfile(application: CreatorApplication): Promise<void> {
  const [creator] = await db.insert(creators).values({
    channelId: application.channelId,
    userId: application.userId,
    displayName: application.displayName,
    bio: application.bio,
    tier: 'BRONZE',
    commissionRateBps: 1000, // 10% starting rate
    totalShowsCompleted: 0,
    totalRevenueCents: 0,
    totalCommissionCents: 0,
    avgViewersPerShow: 0,
    avgRevenuePerShow: 0,
    performanceScore: 0,
    isActive: true
  }).returning();

  // Send welcome email
  // TODO: Implement email sending

  // Assign training modules
  await assignTrainingModules(creator.creatorId);
}

/**
 * Start KYC verification
 */
export async function startKYCVerification(
  applicationId: string,
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    address: KYCVerification['address'];
    idNumber?: string;
    idType?: KYCVerification['idType'];
  }
): Promise<KYCVerification> {
  // In production, use Stripe Identity or Persona
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const verificationSession = await stripe.identity.verificationSessions.create({
  //   type: 'document',
  //   metadata: { application_id: applicationId }
  // });

  const providerVerificationId = `verify_${Date.now()}`;

  const [verification] = await db.insert(creatorVerifications).values({
    applicationId,
    userId,
    status: 'PENDING',
    provider: 'STRIPE',
    providerVerificationId,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    idNumber: data.idNumber || null,
    idType: data.idType || null
  }).returning();

  return verification as KYCVerification;
}

/**
 * Handle KYC verification webhook
 */
export async function handleKYCWebhook(
  providerVerificationId: string,
  status: 'VERIFIED' | 'FAILED',
  failureReason?: string
): Promise<void> {
  const verification = await db.query.creatorVerifications.findFirst({
    where: eq(creatorVerifications.providerVerificationId, providerVerificationId)
  });

  if (!verification) return;

  await db.update(creatorVerifications)
    .set({
      status: status === 'VERIFIED' ? 'VERIFIED' : 'FAILED',
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
      failureReason: failureReason || null,
      updatedAt: new Date()
    })
    .where(eq(creatorVerifications.verificationId, verification.verificationId));

  // Update application status
  if (status === 'VERIFIED') {
    await db.update(creatorApplications)
      .set({ updatedAt: new Date() })
      .where(eq(creatorApplications.applicationId, verification.applicationId));
  }
}

/**
 * Upload creator document
 */
export async function uploadDocument(
  applicationId: string,
  userId: string,
  type: DocumentType,
  file: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }
): Promise<CreatorDocument> {
  const [document] = await db.insert(creatorDocuments).values({
    applicationId,
    userId,
    type,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    uploadedAt: new Date()
  }).returning();

  return document as CreatorDocument;
}

/**
 * Verify uploaded document
 */
export async function verifyDocument(
  documentId: string,
  verifierId: string,
  notes?: string
): Promise<void> {
  await db.update(creatorDocuments)
    .set({
      verifiedAt: new Date(),
      verifiedBy: verifierId,
      notes: notes || null
    })
    .where(eq(creatorDocuments.documentId, documentId));
}

/**
 * Add bank account
 */
export async function addBankAccount(
  creatorId: string,
  data: {
    accountHolderName: string;
    accountType: BankAccount['accountType'];
    routingNumber: string;
    accountNumber: string;
    bankName: string;
    currency?: string;
  },
  setAsDefault: boolean = false
): Promise<BankAccount> {
  // In production, use Stripe Connect or Wise
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const account = await stripe.accounts.createExternalAccount(
  //   connectedAccountId,
  //   { external_account: { ... } }
  // );

  const accountNumberLast4 = data.accountNumber.slice(-4);
  const providerAccountId = `ba_${Date.now()}`;

  // If setting as default, unset other defaults
  if (setAsDefault) {
    await db.update(creatorBankAccounts)
      .set({ isDefault: false })
      .where(eq(creatorBankAccounts.creatorId, creatorId));
  }

  const [bankAccount] = await db.insert(creatorBankAccounts).values({
    creatorId,
    accountHolderName: data.accountHolderName,
    accountType: data.accountType,
    routingNumber: data.routingNumber,
    accountNumberLast4,
    bankName: data.bankName,
    currency: data.currency || 'AUD',
    isDefault: setAsDefault,
    isVerified: false,
    providerAccountId
  }).returning();

  // Initiate micro-deposit verification
  await initiateBankVerification(bankAccount.bankAccountId);

  return bankAccount as BankAccount;
}

/**
 * Initiate bank account verification with micro-deposits
 */
async function initiateBankVerification(bankAccountId: string): Promise<void> {
  // In production, Stripe will send micro-deposits
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // await stripe.accounts.createExternalAccountVerification(
  //   connectedAccountId,
  //   externalAccountId
  // );

  // Simulate micro-deposit amounts
  const amount1 = Math.floor(Math.random() * 50) + 10; // 10-59 cents
  const amount2 = Math.floor(Math.random() * 50) + 10;

  console.log(`Bank verification initiated for ${bankAccountId}. Amounts: ${amount1}, ${amount2}`);
}

/**
 * Verify bank account with micro-deposit amounts
 */
export async function verifyBankAccount(
  creatorId: string,
  bankAccountId: string,
  amount1: number,
  amount2: number
): Promise<{ success: boolean; error?: string }> {
  const bankAccount = await db.query.creatorBankAccounts.findFirst({
    where: and(
      eq(creatorBankAccounts.bankAccountId, bankAccountId),
      eq(creatorBankAccounts.creatorId, creatorId)
    )
  });

  if (!bankAccount) {
    return { success: false, error: 'Bank account not found' };
  }

  if (bankAccount.isVerified) {
    return { success: false, error: 'Bank account already verified' };
  }

  // In production, verify with Stripe
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const result = await stripe.accounts.verifyExternalAccount(
  //   connectedAccountId,
  //   externalAccountId,
  //   { amounts: [amount1, amount2] }
  // );

  // Simulate verification (in production, check against actual amounts)
  const isValid = true; // Simplified

  if (isValid) {
    await db.update(creatorBankAccounts)
      .set({
        isVerified: true,
        updatedAt: new Date()
      })
      .where(eq(creatorBankAccounts.bankAccountId, bankAccountId));

    return { success: true };
  } else {
    return { success: false, error: 'Incorrect verification amounts' };
  }
}

/**
 * Assign training modules to creator
 */
async function assignTrainingModules(creatorId: string): Promise<void> {
  // Get all required modules
  const modules = await getTrainingModules(true);

  for (const module of modules) {
    await db.insert(creatorTraining).values({
      creatorId,
      moduleId: module.moduleId,
      status: 'NOT_STARTED',
      progress: 0
    });
  }
}

/**
 * Get training modules
 */
export async function getTrainingModules(requiredOnly: boolean = false): Promise<TrainingModule[]> {
  // In production, fetch from database
  const modules: TrainingModule[] = [
    {
      moduleId: 'module_1',
      title: 'Introduction to Live Shopping',
      description: 'Learn the basics of live shopping and how to engage viewers',
      videoUrl: 'https://example.com/training/intro.mp4',
      duration: 600,
      sortOrder: 1,
      isRequired: true
    },
    {
      moduleId: 'module_2',
      title: 'Product Presentation Skills',
      description: 'Master the art of showcasing products effectively',
      videoUrl: 'https://example.com/training/presentation.mp4',
      duration: 900,
      sortOrder: 2,
      isRequired: true
    },
    {
      moduleId: 'module_3',
      title: 'Handling Price Drops',
      description: 'Learn how to create urgency with live price drops',
      videoUrl: 'https://example.com/training/price-drops.mp4',
      duration: 450,
      sortOrder: 3,
      isRequired: true
    },
    {
      moduleId: 'module_4',
      title: 'Chat Engagement',
      description: 'Best practices for interacting with viewers in real-time',
      videoUrl: 'https://example.com/training/chat.mp4',
      duration: 600,
      sortOrder: 4,
      isRequired: false
    },
    {
      moduleId: 'module_5',
      title: 'Technical Setup',
      description: 'Camera, lighting, and audio setup for professional streams',
      videoUrl: 'https://example.com/training/technical.mp4',
      duration: 750,
      sortOrder: 5,
      isRequired: true
    }
  ];

  return requiredOnly ? modules.filter(m => m.isRequired) : modules;
}

/**
 * Update training progress
 */
export async function updateTrainingProgress(
  creatorId: string,
  moduleId: string,
  progress: number
): Promise<void> {
  const training = await db.query.creatorTraining.findFirst({
    where: and(
      eq(creatorTraining.creatorId, creatorId),
      eq(creatorTraining.moduleId, moduleId)
    )
  });

  if (!training) return;

  const status = progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
  const completedAt = progress >= 100 ? new Date() : null;
  const startedAt = training.startedAt || (progress > 0 ? new Date() : null);

  await db.update(creatorTraining)
    .set({
      status,
      progress,
      startedAt,
      completedAt
    })
    .where(eq(creatorTraining.progressId, training.progressId));
}

/**
 * Get creator training progress
 */
export async function getTrainingProgress(creatorId: string): Promise<{
  modules: CreatorTrainingProgress[];
  overallProgress: number;
  requiredCompleted: boolean;
}> {
  const progress = await db.query.creatorTraining.findMany({
    where: eq(creatorTraining.creatorId, creatorId)
  });

  const modules = await getTrainingModules();
  const requiredModules = modules.filter(m => m.isRequired);

  const overallProgress = progress.reduce((sum, p) => sum + p.progress, 0) / progress.length || 0;
  const requiredCompleted = requiredModules.every(m => 
    progress.some(p => p.moduleId === m.moduleId && p.status === 'COMPLETED')
  );

  return {
    modules: progress as CreatorTrainingProgress[],
    overallProgress: Math.round(overallProgress),
    requiredCompleted
  };
}

/**
 * Generate creator agreement
 */
export async function generateCreatorAgreement(
  creatorId: string,
  channelId: string
): Promise<{
  agreementId: string;
  agreementUrl: string;
  expiresAt: Date;
}> {
  const creator = await db.query.creators.findFirst({
    where: eq(creators.creatorId, creatorId)
  });

  if (!creator) {
    throw new Error('Creator not found');
  }

  // In production, generate PDF agreement
  const agreementId = `agreement_${Date.now()}`;
  const agreementUrl = `https://example.com/agreements/${agreementId}.pdf`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(creatorAgreements).values({
    creatorId,
    channelId,
    agreementId,
    agreementUrl,
    status: 'PENDING',
    expiresAt
  });

  return { agreementId, agreementUrl, expiresAt };
}

/**
 * Sign creator agreement
 */
export async function signAgreement(
  creatorId: string,
  agreementId: string,
  signature: string,
  ipAddress: string
): Promise<void> {
  const agreement = await db.query.creatorAgreements.findFirst({
    where: and(
      eq(creatorAgreements.agreementId, agreementId),
      eq(creatorAgreements.creatorId, creatorId)
    )
  });

  if (!agreement) {
    throw new Error('Agreement not found');
  }

  if (agreement.status !== 'PENDING') {
    throw new Error('Agreement already signed or expired');
  }

  if (new Date() > agreement.expiresAt) {
    await db.update(creatorAgreements)
      .set({ status: 'EXPIRED' })
      .where(eq(creatorAgreements.agreementId, agreementId));
    
    throw new Error('Agreement has expired');
  }

  await db.update(creatorAgreements)
    .set({
      status: 'SIGNED',
      signature,
      signedAt: new Date(),
      ipAddress
    })
    .where(eq(creatorAgreements.agreementId, agreementId));

  // Activate creator
  await db.update(creators)
    .set({
      isActive: true,
      updatedAt: new Date()
    })
    .where(eq(creators.creatorId, creatorId));
}

/**
 * Get onboarding checklist status
 */
export async function getOnboardingChecklist(
  userId: string,
  applicationId: string
): Promise<{
  steps: Array<{
    step: string;
    title: string;
    completed: boolean;
    required: boolean;
  }>;
  overallProgress: number;
}> {
  const application = await db.query.creatorApplications.findFirst({
    where: and(
      eq(creatorApplications.applicationId, applicationId),
      eq(creatorApplications.userId, userId)
    )
  });

  if (!application) {
    throw new Error('Application not found');
  }

  const documents = await db.query.creatorDocuments.findMany({
    where: eq(creatorDocuments.applicationId, applicationId)
  });

  const verification = await db.query.creatorVerifications.findFirst({
    where: eq(creatorVerifications.applicationId, applicationId)
  });

  const creator = application.status === 'APPROVED' 
    ? await db.query.creators.findFirst({ where: eq(creators.userId, userId) })
    : null;

  const bankAccount = creator
    ? await db.query.creatorBankAccounts.findFirst({ where: eq(creatorBankAccounts.creatorId, creator.creatorId) })
    : null;

  const training = creator
    ? await getTrainingProgress(creator.creatorId)
    : null;

  const agreement = creator
    ? await db.query.creatorAgreements.findFirst({
        where: and(
          eq(creatorAgreements.creatorId, creator.creatorId),
          eq(creatorAgreements.status, 'SIGNED')
        )
      })
    : null;

  const steps = [
    {
      step: 'application',
      title: 'Submit Application',
      completed: application.status !== 'DRAFT',
      required: true
    },
    {
      step: 'documents',
      title: 'Upload Identity Documents',
      completed: documents.length >= 3,
      required: true
    },
    {
      step: 'kyc',
      title: 'Complete Identity Verification',
      completed: verification?.status === 'VERIFIED',
      required: true
    },
    {
      step: 'bank',
      title: 'Add Bank Account',
      completed: bankAccount?.isVerified || false,
      required: true
    },
    {
      step: 'training',
      title: 'Complete Training Modules',
      completed: training?.requiredCompleted || false,
      required: true
    },
    {
      step: 'agreement',
      title: 'Sign Creator Agreement',
      completed: !!agreement,
      required: true
    }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);

  return { steps, overallProgress };
}
