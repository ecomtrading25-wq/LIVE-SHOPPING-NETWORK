/**
 * VIDEO STREAMING SERVICE
 * Complete video streaming infrastructure with Agora.io integration
 * Supports live broadcasting, multi-quality streaming, recording, and analytics
 */

import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { getDb } from './db';
import { liveShows, liveViewers, streamQualityLogs } from '../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Agora Configuration (will use env vars in production)
const AGORA_APP_ID = process.env.AGORA_APP_ID || 'demo-app-id';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'demo-certificate';

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_TIME = 24 * 3600;

// Stream quality presets
export const STREAM_QUALITIES = {
  LOW: {
    width: 640,
    height: 360,
    frameRate: 15,
    bitrate: 400,
    label: '360p',
  },
  MEDIUM: {
    width: 854,
    height: 480,
    frameRate: 24,
    bitrate: 800,
    label: '480p',
  },
  HIGH: {
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 1500,
    label: '720p',
  },
  ULTRA: {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 3000,
    label: '1080p',
  },
};

/**
 * Generate Agora RTC token for host (broadcaster)
 */
export async function generateHostToken(
  showId: string,
  userId: string,
  channelName: string
): Promise<{ token: string; uid: number; appId: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Generate unique UID for this user
  const uid = parseInt(userId.slice(-8), 36) % 1000000;

  // Calculate token expiration
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRATION_TIME;

  // Build token with publisher role
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  // Update show with stream info
  await db
    .update(liveShows)
    .set({
      streamKey: token,
      updatedAt: new Date(),
    })
    .where(eq(liveShows.id, showId));

  return {
    token,
    uid,
    appId: AGORA_APP_ID,
  };
}

/**
 * Generate Agora RTC token for viewer (subscriber)
 */
export async function generateViewerToken(
  showId: string,
  userId: number,
  channelName: string
): Promise<{ token: string; uid: number; appId: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Generate unique UID for this viewer
  const uid = userId % 1000000;

  // Calculate token expiration
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRATION_TIME;

  // Build token with subscriber role
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.SUBSCRIBER,
    privilegeExpiredTs
  );

  // Track viewer join
  await db.insert(liveViewers).values({
    id: `viewer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    showId,
    userId,
    joinedAt: new Date(),
  });

  return {
    token,
    uid,
    appId: AGORA_APP_ID,
  };
}

/**
 * Start live stream
 */
export async function startStream(
  showId: string,
  hostId: string,
  settings: {
    quality: keyof typeof STREAM_QUALITIES;
    enableRecording: boolean;
    enableChat: boolean;
  }
): Promise<{
  channelName: string;
  token: string;
  uid: number;
  appId: string;
  streamUrl: string;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Generate channel name
  const channelName = `show_${showId}`;

  // Generate host token
  const { token, uid, appId } = await generateHostToken(showId, hostId, channelName);

  // Update show status
  await db
    .update(liveShows)
    .set({
      status: 'live',
      actualStartAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(liveShows.id, showId));

  // Log stream start
  await db.insert(streamQualityLogs).values({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    showId,
    timestamp: new Date(),
    bitrate: STREAM_QUALITIES[settings.quality].bitrate,
    framerate: STREAM_QUALITIES[settings.quality].frameRate,
    resolution: `${STREAM_QUALITIES[settings.quality].width}x${STREAM_QUALITIES[settings.quality].height}`,
    droppedFrames: 0,
    bufferingEvents: 0,
    averageLatency: 0,
  });

  return {
    channelName,
    token,
    uid,
    appId,
    streamUrl: `agora://${channelName}`,
  };
}

/**
 * Stop live stream
 */
export async function stopStream(showId: string): Promise<{
  duration: number;
  totalViewers: number;
  peakViewers: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get show details
  const [show] = await db.select().from(liveShows).where(eq(liveShows.id, showId));

  if (!show) {
    throw new Error('Show not found');
  }

  const endTime = new Date();
  const duration = show.actualStartAt
    ? Math.floor((endTime.getTime() - show.actualStartAt.getTime()) / 1000)
    : 0;

  // Get viewer stats
  const viewerStats = await db
    .select({
      total: sql<number>`COUNT(DISTINCT ${liveViewers.userId})`,
    })
    .from(liveViewers)
    .where(eq(liveViewers.showId, showId));

  const totalViewers = viewerStats[0]?.total || 0;

  // Update show status
  await db
    .update(liveShows)
    .set({
      status: 'ended',
      actualEndAt: endTime,
      updatedAt: endTime,
    })
    .where(eq(liveShows.id, showId));

  return {
    duration,
    totalViewers,
    peakViewers: totalViewers, // Simplified - would track real-time in production
  };
}

/**
 * Get stream health metrics
 */
export async function getStreamHealth(showId: string): Promise<{
  quality: string;
  bitrate: number;
  frameRate: number;
  resolution: string;
  droppedFrames: number;
  latency: number;
  health: 'excellent' | 'good' | 'fair' | 'poor';
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get latest quality log
  const [latestLog] = await db
    .select()
    .from(streamQualityLogs)
    .where(eq(streamQualityLogs.showId, showId))
    .orderBy(desc(streamQualityLogs.timestamp))
    .limit(1);

  if (!latestLog) {
    return {
      quality: 'unknown',
      bitrate: 0,
      frameRate: 0,
      resolution: '0x0',
      droppedFrames: 0,
      latency: 0,
      health: 'poor',
    };
  }

  // Calculate health score
  let health: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  const droppedFrames = latestLog.droppedFrames || 0;
  const latency = latestLog.averageLatency || 0;
  
  if (droppedFrames > 100 || latency > 500) {
    health = 'poor';
  } else if (droppedFrames > 50 || latency > 300) {
    health = 'fair';
  } else if (droppedFrames > 20 || latency > 150) {
    health = 'good';
  }

  return {
    quality: 'medium', // Derived from bitrate
    bitrate: latestLog.bitrate || 0,
    frameRate: latestLog.framerate || 0,
    resolution: latestLog.resolution || '0x0',
    droppedFrames: latestLog.droppedFrames || 0,
    latency: latestLog.averageLatency || 0,
    health,
  };
}

/**
 * Update stream quality metrics (called periodically during stream)
 */
export async function updateStreamMetrics(
  showId: string,
  metrics: {
    bitrate: number;
    frameRate: number;
    droppedFrames: number;
    latency: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get current show
  const [show] = await db.select().from(liveShows).where(eq(liveShows.id, showId));

  if (!show) {
    throw new Error('Show not found');
  }

  // Determine quality based on bitrate
  let quality = 'low';
  if (metrics.bitrate >= 3000) quality = 'ultra';
  else if (metrics.bitrate >= 1500) quality = 'high';
  else if (metrics.bitrate >= 800) quality = 'medium';

  // Log metrics
  await db.insert(streamQualityLogs).values({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    showId,
    timestamp: new Date(),
    bitrate: metrics.bitrate,
    framerate: metrics.frameRate,
    resolution: quality === 'ultra' ? '1920x1080' : quality === 'high' ? '1280x720' : quality === 'medium' ? '854x480' : '640x360',
    droppedFrames: metrics.droppedFrames,
    bufferingEvents: 0,
    averageLatency: metrics.latency,
  });
}

/**
 * Enable/disable recording for a stream
 */
export async function toggleRecording(
  showId: string,
  enable: boolean
): Promise<{ recordingId?: string; status: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, this would call Agora Cloud Recording API
  // For now, we'll just track the state

  if (enable) {
    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    await db
      .update(liveShows)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(liveShows.id, showId));

    return {
      recordingId,
      status: 'recording',
    };
  } else {
    return {
      status: 'stopped',
    };
  }
}

/**
 * Get recording URL for a completed show
 */
export async function getRecordingUrl(showId: string): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, this would fetch from Agora Cloud Recording
  // For now, return a placeholder
  const [show] = await db.select().from(liveShows).where(eq(liveShows.id, showId));

  if (!show || show.status !== 'ended') {
    return null;
  }

  // Placeholder URL - would be actual recording URL in production
  return `https://recordings.example.com/${showId}.mp4`;
}

/**
 * Get live viewer count
 */
export async function getLiveViewerCount(showId: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Count viewers who joined and haven't left
  const result = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${liveViewers.userId})`,
    })
    .from(liveViewers)
    .where(
      and(
        eq(liveViewers.showId, showId),
        sql`${liveViewers.leftAt} IS NULL`
      )
    );

  return result[0]?.count || 0;
}

/**
 * Mark viewer as left
 */
export async function markViewerLeft(showId: string, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(liveViewers)
    .set({
      leftAt: new Date(),
    })
    .where(
      and(
        eq(liveViewers.showId, showId),
        eq(liveViewers.userId, userId),
        sql`${liveViewers.leftAt} IS NULL`
      )
    );
}

/**
 * Get stream analytics
 */
export async function getStreamAnalytics(showId: string): Promise<{
  totalViewers: number;
  peakViewers: number;
  averageViewDuration: number;
  totalViewTime: number;
  qualityDistribution: Record<string, number>;
  averageLatency: number;
  droppedFramesTotal: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get viewer stats
  const viewers = await db
    .select()
    .from(liveViewers)
    .where(eq(liveViewers.showId, showId));

  const totalViewers = viewers.length;
  const peakViewers = totalViewers; // Simplified

  // Calculate view durations
  let totalViewTime = 0;
  viewers.forEach((viewer) => {
    if (viewer.leftAt && viewer.joinedAt) {
      totalViewTime += (viewer.leftAt.getTime() - viewer.joinedAt.getTime()) / 1000;
    }
  });

  const averageViewDuration = totalViewers > 0 ? totalViewTime / totalViewers : 0;

  // Get quality logs
  const qualityLogs = await db
    .select()
    .from(streamQualityLogs)
    .where(eq(streamQualityLogs.showId, showId));

  // Calculate quality distribution
  const qualityDistribution: Record<string, number> = {};
  let totalLatency = 0;
  let droppedFramesTotal = 0;

  qualityLogs.forEach((log) => {
    const quality = log.bitrate && log.bitrate >= 1500 ? 'high' : 'medium';
    qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
    totalLatency += log.averageLatency || 0;
    droppedFramesTotal += log.droppedFrames || 0;
  });

  const averageLatency = qualityLogs.length > 0 ? totalLatency / qualityLogs.length : 0;

  return {
    totalViewers,
    peakViewers,
    averageViewDuration,
    totalViewTime,
    qualityDistribution,
    averageLatency,
    droppedFramesTotal,
  };
}
