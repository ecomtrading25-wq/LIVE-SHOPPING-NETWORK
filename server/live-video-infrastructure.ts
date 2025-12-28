/**
 * Live Video Infrastructure Service
 * Handles Agora SDK integration, Mux video processing, real-time streaming, and viewer management
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  liveShows,
  liveViewers,
  liveChat,
  streamHealth,
  videoRecordings
} from '../drizzle/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import crypto from 'crypto';

export type StreamStatus = 'INITIALIZING' | 'LIVE' | 'BUFFERING' | 'RECONNECTING' | 'ENDED' | 'FAILED';
export type ChatMessageType = 'TEXT' | 'EMOJI' | 'SYSTEM' | 'PRODUCT_LINK' | 'PRICE_DROP_ALERT';
export type ViewerRole = 'VIEWER' | 'MODERATOR' | 'HOST' | 'ADMIN';

export interface AgoraCredentials {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  expiresAt: Date;
}

export interface MuxAsset {
  assetId: string;
  playbackId: string;
  streamKey: string;
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;
  mp4Url?: string;
}

export interface StreamHealth {
  showId: string;
  bitrate: number;
  fps: number;
  resolution: string;
  latency: number;
  droppedFrames: number;
  viewerCount: number;
  buffering: boolean;
  lastCheckAt: Date;
}

export interface ChatMessage {
  messageId: string;
  showId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  role: ViewerRole;
  type: ChatMessageType;
  content: string;
  metadata?: Record<string, any>;
  isModerated: boolean;
  createdAt: Date;
}

export interface LiveViewer {
  viewerId: string;
  showId: string;
  userId?: string;
  sessionId: string;
  role: ViewerRole;
  joinedAt: Date;
  lastSeenAt: Date;
  totalWatchSeconds: number;
  hasInteracted: boolean;
  hasPurchased: boolean;
}

/**
 * Generate Agora RTC token for live streaming
 */
export function generateAgoraToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: 'publisher' | 'subscriber',
  expirationSeconds: number = 3600
): string {
  // Simplified token generation - in production use official Agora SDK
  const timestamp = Math.floor(Date.now() / 1000);
  const expireTime = timestamp + expirationSeconds;
  
  const message = `${appId}${channelName}${uid}${expireTime}`;
  const signature = crypto
    .createHmac('sha256', appCertificate)
    .update(message)
    .digest('hex');
  
  const token = Buffer.from(JSON.stringify({
    signature,
    appId,
    channelName,
    uid,
    expireTime,
    role
  })).toString('base64');
  
  return token;
}

/**
 * Initialize live stream with Agora
 */
export async function initializeAgoraStream(
  channelId: string,
  showId: string,
  creatorId: string
): Promise<AgoraCredentials> {
  const show = await db.query.liveShows.findFirst({
    where: and(
      eq(liveShows.showId, showId),
      eq(liveShows.channelId, channelId)
    )
  });

  if (!show) {
    throw new Error('Show not found');
  }

  // Get Agora credentials from env
  const appId = process.env.AGORA_APP_ID || 'demo_app_id';
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || 'demo_certificate';
  
  const channelName = `live_show_${showId}`;
  const uid = parseInt(creatorId.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 1000000);
  
  // Generate token for publisher (host)
  const token = generateAgoraToken(appId, appCertificate, channelName, uid, 'publisher', 7200);
  
  const expiresAt = new Date(Date.now() + 7200 * 1000);

  // Update show with stream details
  await db.update(liveShows)
    .set({
      streamUrl: `agora://${channelName}`,
      updatedAt: new Date()
    })
    .where(eq(liveShows.showId, showId));

  return {
    appId,
    channelName,
    token,
    uid,
    expiresAt
  };
}

/**
 * Generate viewer token for Agora
 */
export async function generateViewerToken(
  showId: string,
  userId?: string
): Promise<AgoraCredentials> {
  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  if (!show) {
    throw new Error('Show not found');
  }

  if (show.status !== 'LIVE') {
    throw new Error('Show is not live');
  }

  const appId = process.env.AGORA_APP_ID || 'demo_app_id';
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || 'demo_certificate';
  
  const channelName = `live_show_${showId}`;
  const uid = userId 
    ? parseInt(userId.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 1000000)
    : Math.floor(Math.random() * 1000000);
  
  // Generate token for subscriber (viewer)
  const token = generateAgoraToken(appId, appCertificate, channelName, uid, 'subscriber', 3600);
  
  const expiresAt = new Date(Date.now() + 3600 * 1000);

  return {
    appId,
    channelName,
    token,
    uid,
    expiresAt
  };
}

/**
 * Create Mux live stream
 */
export async function createMuxLiveStream(
  channelId: string,
  showId: string
): Promise<MuxAsset> {
  // In production, use actual Mux API
  // const muxClient = new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);
  
  // Simulate Mux stream creation
  const streamKey = crypto.randomBytes(16).toString('hex');
  const playbackId = crypto.randomBytes(12).toString('hex');
  const assetId = `asset_${crypto.randomBytes(12).toString('hex')}`;

  // Update show with Mux details
  await db.update(liveShows)
    .set({
      streamUrl: `rtmps://global-live.mux.com:443/app/${streamKey}`,
      updatedAt: new Date()
    })
    .where(eq(liveShows.showId, showId));

  return {
    assetId,
    playbackId,
    streamKey,
    status: 'preparing'
  };
}

/**
 * Track viewer joining stream
 */
export async function trackViewerJoin(
  showId: string,
  sessionId: string,
  userId?: string,
  role: ViewerRole = 'VIEWER'
): Promise<LiveViewer> {
  // Check if viewer already exists
  const existing = await db.query.liveViewers.findFirst({
    where: and(
      eq(liveViewers.showId, showId),
      eq(liveViewers.sessionId, sessionId)
    )
  });

  if (existing) {
    // Update last seen
    await db.update(liveViewers)
      .set({ lastSeenAt: new Date() })
      .where(eq(liveViewers.viewerId, existing.viewerId));
    
    return existing as LiveViewer;
  }

  // Create new viewer
  const [viewer] = await db.insert(liveViewers).values({
    showId,
    userId: userId || null,
    sessionId,
    role,
    joinedAt: new Date(),
    lastSeenAt: new Date(),
    totalWatchSeconds: 0,
    hasInteracted: false,
    hasPurchased: false
  }).returning();

  // Update show viewer count
  await updateViewerCount(showId);

  return viewer as LiveViewer;
}

/**
 * Track viewer leaving stream
 */
export async function trackViewerLeave(
  showId: string,
  sessionId: string
): Promise<void> {
  const viewer = await db.query.liveViewers.findFirst({
    where: and(
      eq(liveViewers.showId, showId),
      eq(liveViewers.sessionId, sessionId)
    )
  });

  if (!viewer) return;

  // Calculate watch time
  const watchSeconds = Math.floor((Date.now() - viewer.joinedAt.getTime()) / 1000);
  
  await db.update(liveViewers)
    .set({
      totalWatchSeconds: watchSeconds,
      lastSeenAt: new Date()
    })
    .where(eq(liveViewers.viewerId, viewer.viewerId));

  // Update show viewer count
  await updateViewerCount(showId);
}

/**
 * Update show viewer count
 */
async function updateViewerCount(showId: string): Promise<void> {
  // Count active viewers (seen in last 30 seconds)
  const thirtySecondsAgo = new Date(Date.now() - 30000);
  
  const activeViewers = await db.query.liveViewers.findMany({
    where: and(
      eq(liveViewers.showId, showId),
      gte(liveViewers.lastSeenAt, thirtySecondsAgo)
    )
  });

  const viewerCount = activeViewers.length;

  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  if (show) {
    const peakViewerCount = Math.max(show.peakViewerCount || 0, viewerCount);

    await db.update(liveShows)
      .set({
        viewerCount,
        peakViewerCount,
        updatedAt: new Date()
      })
      .where(eq(liveShows.showId, showId));
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(
  showId: string,
  userId: string,
  username: string,
  content: string,
  type: ChatMessageType = 'TEXT',
  role: ViewerRole = 'VIEWER',
  metadata?: Record<string, any>
): Promise<ChatMessage> {
  // Content moderation check
  const isModerated = await moderateContent(content);

  const [message] = await db.insert(liveChat).values({
    showId,
    userId,
    username,
    role,
    type,
    content,
    metadata: metadata || null,
    isModerated
  }).returning();

  // Mark viewer as interacted
  await db.update(liveViewers)
    .set({ hasInteracted: true })
    .where(and(
      eq(liveViewers.showId, showId),
      eq(liveViewers.userId, userId)
    ));

  return message as ChatMessage;
}

/**
 * Get chat messages for show
 */
export async function getChatMessages(
  showId: string,
  limit: number = 100,
  beforeMessageId?: string
): Promise<ChatMessage[]> {
  let query = db.query.liveChat.findMany({
    where: eq(liveChat.showId, showId),
    orderBy: desc(liveChat.createdAt),
    limit
  });

  const messages = await query;
  
  // Filter out moderated messages
  return messages.filter(m => !m.isModerated) as ChatMessage[];
}

/**
 * Delete chat message (moderation)
 */
export async function deleteChatMessage(
  messageId: string,
  moderatorId: string
): Promise<void> {
  await db.update(liveChat)
    .set({ isModerated: true })
    .where(eq(liveChat.messageId, messageId));
}

/**
 * Ban user from chat
 */
export async function banUserFromChat(
  showId: string,
  userId: string,
  reason: string
): Promise<void> {
  // Mark all messages as moderated
  await db.update(liveChat)
    .set({ isModerated: true })
    .where(and(
      eq(liveChat.showId, showId),
      eq(liveChat.userId, userId)
    ));

  // Update viewer role
  await db.update(liveViewers)
    .set({ role: 'VIEWER' }) // Remove any special roles
    .where(and(
      eq(liveViewers.showId, showId),
      eq(liveViewers.userId, userId)
    ));

  // TODO: Add to ban list table
}

/**
 * Content moderation (simple keyword filter)
 */
async function moderateContent(content: string): Promise<boolean> {
  const bannedWords = [
    'spam', 'scam', 'fake', 'fraud', 'cheat',
    // Add more banned words
  ];

  const lowerContent = content.toLowerCase();
  return bannedWords.some(word => lowerContent.includes(word));
}

/**
 * Record stream health metrics
 */
export async function recordStreamHealth(
  showId: string,
  metrics: {
    bitrate: number;
    fps: number;
    resolution: string;
    latency: number;
    droppedFrames: number;
    buffering: boolean;
  }
): Promise<void> {
  await db.insert(streamHealth).values({
    showId,
    bitrate: metrics.bitrate,
    fps: metrics.fps,
    resolution: metrics.resolution,
    latency: metrics.latency,
    droppedFrames: metrics.droppedFrames,
    buffering: metrics.buffering,
    lastCheckAt: new Date()
  });

  // Alert if stream health is poor
  if (metrics.latency > 5000 || metrics.droppedFrames > 100 || metrics.buffering) {
    console.warn(`Stream health warning for show ${showId}:`, metrics);
    // TODO: Send alert to ops team
  }
}

/**
 * Get stream health for show
 */
export async function getStreamHealth(showId: string): Promise<StreamHealth | null> {
  const health = await db.query.streamHealth.findFirst({
    where: eq(streamHealth.showId, showId),
    orderBy: desc(streamHealth.lastCheckAt)
  });

  if (!health) return null;

  const viewerCount = await db.query.liveViewers.count({
    where: and(
      eq(liveViewers.showId, showId),
      gte(liveViewers.lastSeenAt, new Date(Date.now() - 30000))
    )
  });

  return {
    ...health,
    viewerCount
  } as StreamHealth;
}

/**
 * Create video recording from Mux
 */
export async function createVideoRecording(
  showId: string,
  muxAssetId: string,
  playbackId: string,
  duration: number
): Promise<void> {
  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  if (!show) return;

  const recordingUrl = `https://stream.mux.com/${playbackId}.m3u8`;
  const mp4Url = `https://stream.mux.com/${playbackId}/high.mp4`;

  await db.insert(videoRecordings).values({
    showId,
    channelId: show.channelId,
    muxAssetId,
    playbackId,
    recordingUrl,
    mp4Url,
    duration,
    status: 'ready'
  });

  // Update show with recording URL
  await db.update(liveShows)
    .set({
      recordingUrl,
      updatedAt: new Date()
    })
    .where(eq(liveShows.showId, showId));
}

/**
 * Get viewer analytics for show
 */
export async function getViewerAnalytics(showId: string): Promise<{
  totalViewers: number;
  uniqueViewers: number;
  avgWatchTime: number;
  peakViewers: number;
  interactionRate: number;
  purchaseRate: number;
}> {
  const viewers = await db.query.liveViewers.findMany({
    where: eq(liveViewers.showId, showId)
  });

  const totalViewers = viewers.length;
  const uniqueViewers = new Set(viewers.map(v => v.userId).filter(Boolean)).size;
  const avgWatchTime = viewers.reduce((sum, v) => sum + v.totalWatchSeconds, 0) / totalViewers || 0;
  const interactionRate = viewers.filter(v => v.hasInteracted).length / totalViewers || 0;
  const purchaseRate = viewers.filter(v => v.hasPurchased).length / totalViewers || 0;

  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  return {
    totalViewers,
    uniqueViewers,
    avgWatchTime: Math.round(avgWatchTime),
    peakViewers: show?.peakViewerCount || 0,
    interactionRate: Math.round(interactionRate * 100),
    purchaseRate: Math.round(purchaseRate * 100)
  };
}

/**
 * Enable DVR (rewind/replay) for stream
 */
export async function enableDVR(
  showId: string,
  bufferSeconds: number = 300 // 5 minutes default
): Promise<void> {
  // In production, configure Mux/Agora for DVR
  await db.update(liveShows)
    .set({
      metadata: sql`JSON_SET(COALESCE(metadata, '{}'), '$.dvr_enabled', true, '$.dvr_buffer_seconds', ${bufferSeconds})`
    })
    .where(eq(liveShows.showId, showId));
}

/**
 * Generate HLS playlist for adaptive bitrate streaming
 */
export function generateHLSPlaylist(
  playbackId: string,
  qualities: Array<{ resolution: string; bitrate: number }>
): string {
  const variants = qualities.map(q => 
    `#EXT-X-STREAM-INF:BANDWIDTH=${q.bitrate},RESOLUTION=${q.resolution}\n` +
    `https://stream.mux.com/${playbackId}/${q.resolution}.m3u8`
  ).join('\n');

  return `#EXTM3U\n#EXT-X-VERSION:3\n${variants}`;
}

/**
 * Handle stream reconnection
 */
export async function handleStreamReconnection(
  showId: string,
  attemptNumber: number
): Promise<{ shouldRetry: boolean; delayMs: number }> {
  const maxAttempts = 5;
  const baseDelay = 1000;

  if (attemptNumber >= maxAttempts) {
    // Mark stream as failed
    await db.update(liveShows)
      .set({
        status: 'ENDED',
        updatedAt: new Date()
      })
      .where(eq(liveShows.showId, showId));

    return { shouldRetry: false, delayMs: 0 };
  }

  // Exponential backoff
  const delayMs = baseDelay * Math.pow(2, attemptNumber);

  return { shouldRetry: true, delayMs };
}

/**
 * Calculate stream latency
 */
export function calculateStreamLatency(
  clientTimestamp: number,
  serverTimestamp: number
): number {
  return Math.abs(serverTimestamp - clientTimestamp);
}

/**
 * Optimize stream quality based on viewer connection
 */
export function recommendStreamQuality(
  bandwidth: number, // in kbps
  latency: number // in ms
): {
  resolution: string;
  bitrate: number;
  fps: number;
} {
  if (bandwidth > 5000 && latency < 100) {
    return { resolution: '1920x1080', bitrate: 4500, fps: 30 };
  } else if (bandwidth > 2500 && latency < 200) {
    return { resolution: '1280x720', bitrate: 2500, fps: 30 };
  } else if (bandwidth > 1000 && latency < 300) {
    return { resolution: '854x480', bitrate: 1000, fps: 24 };
  } else {
    return { resolution: '640x360', bitrate: 600, fps: 24 };
  }
}
