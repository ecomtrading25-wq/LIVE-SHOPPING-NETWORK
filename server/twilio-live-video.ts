/**
 * Twilio Live Video Integration
 * Real-time video streaming for live shopping shows
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { liveShows } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

// ============================================================================
// Access Token Generation
// ============================================================================

export function generateAccessToken(
  identity: string,
  roomName: string
): string {
  if (!accountSid || !apiKeySid || !apiKeySecret) {
    throw new Error('Twilio API credentials not configured');
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;

  // Create access token
  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity,
    ttl: 14400, // 4 hours
  });

  // Create video grant
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  token.addGrant(videoGrant);

  return token.toJwt();
}

// ============================================================================
// Room Management
// ============================================================================

export async function createTwilioRoom(
  roomName: string,
  options: {
    type?: 'group' | 'group-small' | 'peer-to-peer' | 'go';
    recordParticipantsOnConnect?: boolean;
    maxParticipants?: number;
    statusCallback?: string;
  } = {}
): Promise<any> {
  const client = getTwilioClient();

  try {
    const room = await client.video.v1.rooms.create({
      uniqueName: roomName,
      type: options.type || 'group',
      recordParticipantsOnConnect: options.recordParticipantsOnConnect || false,
      maxParticipants: options.maxParticipants || 50,
      statusCallback: options.statusCallback,
      statusCallbackMethod: 'POST',
    });

    return {
      sid: room.sid,
      name: room.uniqueName,
      status: room.status,
      type: room.type,
      maxParticipants: room.maxParticipants,
      duration: room.duration,
      dateCreated: room.dateCreated,
    };
  } catch (error: any) {
    console.error('Failed to create Twilio room:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to create video room: ${error.message}`,
    });
  }
}

export async function completeTwilioRoom(roomSid: string): Promise<void> {
  const client = getTwilioClient();

  try {
    await client.video.v1.rooms(roomSid).update({
      status: 'completed',
    });
  } catch (error: any) {
    console.error('Failed to complete Twilio room:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to complete video room: ${error.message}`,
    });
  }
}

export async function getTwilioRoom(roomSid: string): Promise<any> {
  const client = getTwilioClient();

  try {
    const room = await client.video.v1.rooms(roomSid).fetch();
    return {
      sid: room.sid,
      name: room.uniqueName,
      status: room.status,
      type: room.type,
      maxParticipants: room.maxParticipants,
      duration: room.duration,
      dateCreated: room.dateCreated,
      dateUpdated: room.dateUpdated,
    };
  } catch (error: any) {
    console.error('Failed to fetch Twilio room:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch video room: ${error.message}`,
    });
  }
}

// ============================================================================
// Participant Management
// ============================================================================

export async function getRoomParticipants(roomSid: string): Promise<any[]> {
  const client = getTwilioClient();

  try {
    const participants = await client.video.v1
      .rooms(roomSid)
      .participants.list({ limit: 100 });

    return participants.map((p) => ({
      sid: p.sid,
      identity: p.identity,
      status: p.status,
      duration: p.duration,
      dateCreated: p.dateCreated,
      dateUpdated: p.dateUpdated,
    }));
  } catch (error: any) {
    console.error('Failed to fetch room participants:', error);
    return [];
  }
}

export async function disconnectParticipant(
  roomSid: string,
  participantSid: string
): Promise<void> {
  const client = getTwilioClient();

  try {
    await client.video.v1
      .rooms(roomSid)
      .participants(participantSid)
      .update({ status: 'disconnected' });
  } catch (error: any) {
    console.error('Failed to disconnect participant:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to disconnect participant: ${error.message}`,
    });
  }
}

// ============================================================================
// Recording Management
// ============================================================================

export async function getRecordings(roomSid: string): Promise<any[]> {
  const client = getTwilioClient();

  try {
    const recordings = await client.video.v1
      .rooms(roomSid)
      .recordings.list({ limit: 100 });

    return recordings.map((r) => ({
      sid: r.sid,
      status: r.status,
      type: r.type,
      duration: r.duration,
      size: r.size,
      containerFormat: r.containerFormat,
      codec: r.codec,
      dateCreated: r.dateCreated,
      mediaUrl: r.mediaUrl,
    }));
  } catch (error: any) {
    console.error('Failed to fetch recordings:', error);
    return [];
  }
}

export async function deleteRecording(
  roomSid: string,
  recordingSid: string
): Promise<void> {
  const client = getTwilioClient();

  try {
    await client.video.v1
      .rooms(roomSid)
      .recordings(recordingSid)
      .remove();
  } catch (error: any) {
    console.error('Failed to delete recording:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to delete recording: ${error.message}`,
    });
  }
}

// ============================================================================
// Composition (for combining multiple tracks)
// ============================================================================

export async function createComposition(
  roomSid: string,
  options: {
    audioSources?: string[];
    videoLayout?: any;
    resolution?: string;
    format?: string;
    statusCallback?: string;
  } = {}
): Promise<any> {
  const client = getTwilioClient();

  try {
    const composition = await client.video.v1.compositions.create({
      roomSid,
      audioSources: options.audioSources || ['*'],
      videoLayout: options.videoLayout,
      resolution: options.resolution || '1280x720',
      format: options.format || 'mp4',
      statusCallback: options.statusCallback,
      statusCallbackMethod: 'POST',
    });

    return {
      sid: composition.sid,
      status: composition.status,
      duration: composition.duration,
      size: composition.size,
      format: composition.format,
      resolution: composition.resolution,
      dateCreated: composition.dateCreated,
      mediaUrl: composition.mediaUrl,
    };
  } catch (error: any) {
    console.error('Failed to create composition:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to create composition: ${error.message}`,
    });
  }
}

// ============================================================================
// tRPC Router
// ============================================================================

export const twilioLiveVideoRouter = router({
  // Create a new live show room
  createRoom: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        showId: z.string(),
        roomName: z.string(),
        maxParticipants: z.number().optional(),
        enableRecording: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { channelId, showId, roomName, maxParticipants, enableRecording } = input;

      // Create Twilio room
      const room = await createTwilioRoom(roomName, {
        type: 'group',
        maxParticipants: maxParticipants || 50,
        recordParticipantsOnConnect: enableRecording || false,
        statusCallback: `${process.env.BASE_URL}/api/webhooks/twilio/video`,
      });

      // Update live show with room details
      await db
        .update(liveShows)
        .set({
          twilioRoomSid: room.sid,
          twilioRoomName: room.name,
          status: 'live',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        );

      return { room };
    }),

  // Generate access token for participant
  generateToken: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        showId: z.string(),
        identity: z.string(),
        role: z.enum(['host', 'viewer']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { channelId, showId, identity, role } = input;

      // Get show details
      const show = await db
        .select()
        .from(liveShows)
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        )
        .limit(1);

      if (show.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live show not found',
        });
      }

      const roomName = show[0].twilioRoomName;
      if (!roomName) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Live show room not created yet',
        });
      }

      // Generate access token
      const token = generateAccessToken(identity, roomName);

      // Track participant (table not yet in schema)
      // await db.insert(liveShowParticipants).values({
      //   channelId,
      //   showId,
      //   userId: ctx.user.id,
      //   identity,
      //   role,
      //   joinedAt: new Date(),
      // });

      return { token, roomName };
    }),

  // End live show
  endShow: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        showId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, showId } = input;

      // Get show details
      const show = await db
        .select()
        .from(liveShows)
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        )
        .limit(1);

      if (show.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live show not found',
        });
      }

      const roomSid = show[0].twilioRoomSid;
      if (roomSid) {
        // Complete Twilio room
        await completeTwilioRoom(roomSid);
      }

      // Update show status
      await db
        .update(liveShows)
        .set({
          status: 'ended',
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        );

      return { success: true };
    }),

  // Get room status
  getRoomStatus: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        showId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { channelId, showId } = input;

      // Get show details
      const show = await db
        .select()
        .from(liveShows)
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        )
        .limit(1);

      if (show.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live show not found',
        });
      }

      const roomSid = show[0].twilioRoomSid;
      if (!roomSid) {
        return { status: 'not_started', participants: [] };
      }

      // Get room info from Twilio
      const room = await getTwilioRoom(roomSid);
      const participants = await getRoomParticipants(roomSid);

      return {
        status: room.status,
        participants,
        duration: room.duration,
      };
    }),

  // Get recordings
  getRecordings: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        showId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { channelId, showId } = input;

      // Get show details
      const show = await db
        .select()
        .from(liveShows)
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        )
        .limit(1);

      if (show.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live show not found',
        });
      }

      const roomSid = show[0].twilioRoomSid;
      if (!roomSid) {
        return { recordings: [] };
      }

      // Get recordings from Twilio
      const twilioRecordings = await getRecordings(roomSid);

      return { recordings: twilioRecordings };
    }),

  // Create composition (combined video)
  createComposition: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        showId: z.string(),
        resolution: z.string().optional(),
        format: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, showId, resolution, format } = input;

      // Get show details
      const show = await db
        .select()
        .from(liveShows)
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        )
        .limit(1);

      if (show.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live show not found',
        });
      }

      const roomSid = show[0].twilioRoomSid;
      if (!roomSid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Live show room not found',
        });
      }

      // Create composition
      const composition = await createComposition(roomSid, {
        resolution: resolution || '1280x720',
        format: format || 'mp4',
        statusCallback: `${process.env.BASE_URL}/api/webhooks/twilio/video`,
      });

      return { composition };
    }),

  // Disconnect participant
  disconnectParticipant: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        showId: z.string(),
        participantSid: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, showId, participantSid } = input;

      // Get show details
      const show = await db
        .select()
        .from(liveShows)
        .where(
          and(
            eq(liveShows.channelId, channelId),
            eq(liveShows.id, showId)
          )
        )
        .limit(1);

      if (show.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live show not found',
        });
      }

      const roomSid = show[0].twilioRoomSid;
      if (!roomSid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Live show room not found',
        });
      }

      // Disconnect participant
      await disconnectParticipant(roomSid, participantSid);

      return { success: true };
    }),
});
