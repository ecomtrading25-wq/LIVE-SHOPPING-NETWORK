/**
 * Twilio Video Streaming Integration
 * Handles live video streaming for Live Shopping Network
 */

import twilio from 'twilio';
import { TRPCError } from '@trpc/server';

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// Twilio credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_KEY;
const apiKeySecret = process.env.TWILIO_API_SECRET;

if (!accountSid || !apiKeySid || !apiKeySecret) {
  console.warn('Twilio credentials not configured. Video streaming will not work.');
}

const twilioClient = accountSid && apiKeySid && apiKeySecret
  ? twilio(apiKeySid, apiKeySecret, { accountSid })
  : null;

export interface VideoRoomOptions {
  roomName: string;
  roomType?: 'group' | 'peer-to-peer' | 'group-small';
  maxParticipants?: number;
  recordParticipantsOnConnect?: boolean;
  statusCallback?: string;
}

export interface AccessTokenOptions {
  identity: string;
  roomName: string;
}

/**
 * Create a Twilio Video Room
 */
export async function createVideoRoom(options: VideoRoomOptions) {
  if (!twilioClient) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  try {
    const room = await twilioClient.video.v1.rooms.create({
      uniqueName: options.roomName,
      type: options.roomType || 'group',
      maxParticipants: options.maxParticipants,
      recordParticipantsOnConnect: options.recordParticipantsOnConnect || false,
      statusCallback: options.statusCallback,
    });

    return {
      sid: room.sid,
      uniqueName: room.uniqueName,
      status: room.status,
      type: room.type,
      maxParticipants: room.maxParticipants,
      duration: room.duration,
      dateCreated: room.dateCreated,
      url: room.url,
    };
  } catch (error: any) {
    console.error('Failed to create Twilio video room:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to create video room: ${error.message}`,
    });
  }
}

/**
 * Generate Access Token for a participant to join a video room
 */
export function generateAccessToken(options: AccessTokenOptions): string {
  if (!accountSid || !apiKeySid || !apiKeySecret) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  // Create an access token
  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity: options.identity,
    ttl: 14400, // 4 hours
  });

  // Create a video grant for this token
  const videoGrant = new VideoGrant({
    room: options.roomName,
  });

  // Add the video grant to the token
  token.addGrant(videoGrant);

  // Serialize the token to a JWT string
  return token.toJwt();
}

/**
 * Get room details
 */
export async function getVideoRoom(roomSidOrName: string) {
  if (!twilioClient) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  try {
    const room = await twilioClient.video.v1.rooms(roomSidOrName).fetch();

    return {
      sid: room.sid,
      uniqueName: room.uniqueName,
      status: room.status,
      type: room.type,
      maxParticipants: room.maxParticipants,
      duration: room.duration,
      dateCreated: room.dateCreated,
      dateUpdated: room.dateUpdated,
      url: room.url,
    };
  } catch (error: any) {
    console.error('Failed to fetch video room:', error);
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Video room not found: ${error.message}`,
    });
  }
}

/**
 * Complete (end) a video room
 */
export async function completeVideoRoom(roomSidOrName: string) {
  if (!twilioClient) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  try {
    const room = await twilioClient.video.v1.rooms(roomSidOrName).update({
      status: 'completed',
    });

    return {
      sid: room.sid,
      uniqueName: room.uniqueName,
      status: room.status,
      duration: room.duration,
    };
  } catch (error: any) {
    console.error('Failed to complete video room:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to complete video room: ${error.message}`,
    });
  }
}

/**
 * List active video rooms
 */
export async function listActiveVideoRooms() {
  if (!twilioClient) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  try {
    const rooms = await twilioClient.video.v1.rooms.list({
      status: 'in-progress',
      limit: 50,
    });

    return rooms.map((room) => ({
      sid: room.sid,
      uniqueName: room.uniqueName,
      status: room.status,
      type: room.type,
      maxParticipants: room.maxParticipants,
      duration: room.duration,
      dateCreated: room.dateCreated,
    }));
  } catch (error: any) {
    console.error('Failed to list video rooms:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to list video rooms: ${error.message}`,
    });
  }
}

/**
 * Get room participants
 */
export async function getRoomParticipants(roomSidOrName: string) {
  if (!twilioClient) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  try {
    const participants = await twilioClient.video.v1
      .rooms(roomSidOrName)
      .participants.list({ limit: 100 });

    return participants.map((participant) => ({
      sid: participant.sid,
      identity: participant.identity,
      status: participant.status,
      startTime: participant.startTime,
      endTime: participant.endTime,
      duration: participant.duration,
    }));
  } catch (error: any) {
    console.error('Failed to fetch room participants:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch participants: ${error.message}`,
    });
  }
}

/**
 * Get room recordings
 */
export async function getRoomRecordings(roomSid: string) {
  if (!twilioClient) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  try {
    const recordings = await twilioClient.video.v1
      .rooms(roomSid)
      .recordings.list({ limit: 100 });

    return recordings.map((recording) => ({
      sid: recording.sid,
      status: recording.status,
      type: recording.type,
      duration: recording.duration,
      size: recording.size,
      containerFormat: recording.containerFormat,
      codec: recording.codec,
      dateCreated: recording.dateCreated,
      url: recording.url,
      mediaUrl: recording.links?.media,
    }));
  } catch (error: any) {
    console.error('Failed to fetch room recordings:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch recordings: ${error.message}`,
    });
  }
}

/**
 * Delete a recording
 */
export async function deleteRecording(roomSid: string, recordingSid: string) {
  if (!twilioClient) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twilio Video is not configured',
    });
  }

  try {
    await twilioClient.video.v1.rooms(roomSid).recordings(recordingSid).remove();
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete recording:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to delete recording: ${error.message}`,
    });
  }
}

export default {
  createVideoRoom,
  generateAccessToken,
  getVideoRoom,
  completeVideoRoom,
  listActiveVideoRooms,
  getRoomParticipants,
  getRoomRecordings,
  deleteRecording,
};
