/**
 * Twilio Video Router
 * tRPC endpoints for live video streaming
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from './_core/trpc';
import * as twilioVideo from './twilio-video';
import { TRPCError } from '@trpc/server';

export const twilioVideoRouter = router({
  /**
   * Create a new video room for live streaming
   */
  createRoom: protectedProcedure
    .input(
      z.object({
        roomName: z.string().min(1).max(255),
        roomType: z.enum(['group', 'peer-to-peer', 'group-small']).optional(),
        maxParticipants: z.number().min(2).max(50).optional(),
        recordParticipantsOnConnect: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only allow hosts/admins to create rooms
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'host') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only hosts and admins can create video rooms',
        });
      }

      return await twilioVideo.createVideoRoom({
        roomName: input.roomName,
        roomType: input.roomType,
        maxParticipants: input.maxParticipants,
        recordParticipantsOnConnect: input.recordParticipantsOnConnect,
      });
    }),

  /**
   * Generate access token for a participant to join a room
   */
  getAccessToken: protectedProcedure
    .input(
      z.object({
        roomName: z.string().min(1),
        identity: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Use user ID as identity if not provided
      const identity = input.identity || `user_${ctx.user.id}`;

      const token = twilioVideo.generateAccessToken({
        identity,
        roomName: input.roomName,
      });

      return {
        token,
        identity,
        roomName: input.roomName,
      };
    }),

  /**
   * Get room details
   */
  getRoom: protectedProcedure
    .input(
      z.object({
        roomSidOrName: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      return await twilioVideo.getVideoRoom(input.roomSidOrName);
    }),

  /**
   * Complete (end) a video room
   */
  completeRoom: protectedProcedure
    .input(
      z.object({
        roomSidOrName: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only allow hosts/admins to complete rooms
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'host') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only hosts and admins can end video rooms',
        });
      }

      return await twilioVideo.completeVideoRoom(input.roomSidOrName);
    }),

  /**
   * List active video rooms
   */
  listActiveRooms: protectedProcedure.query(async ({ ctx }) => {
    // Only allow admins to list all rooms
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can list all video rooms',
      });
    }

    return await twilioVideo.listActiveVideoRooms();
  }),

  /**
   * Get room participants
   */
  getRoomParticipants: protectedProcedure
    .input(
      z.object({
        roomSidOrName: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      return await twilioVideo.getRoomParticipants(input.roomSidOrName);
    }),

  /**
   * Get room recordings
   */
  getRoomRecordings: protectedProcedure
    .input(
      z.object({
        roomSid: z.string().min(1),
      })
    )
    .query(async ({ input, ctx }) => {
      // Only allow hosts/admins to view recordings
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'host') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only hosts and admins can view recordings',
        });
      }

      return await twilioVideo.getRoomRecordings(input.roomSid);
    }),

  /**
   * Delete a recording
   */
  deleteRecording: protectedProcedure
    .input(
      z.object({
        roomSid: z.string().min(1),
        recordingSid: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only allow admins to delete recordings
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete recordings',
        });
      }

      return await twilioVideo.deleteRecording(input.roomSid, input.recordingSid);
    }),

  /**
   * Webhook handler for Twilio video events
   */
  webhook: publicProcedure
    .input(
      z.object({
        StatusCallbackEvent: z.string(),
        RoomSid: z.string(),
        RoomName: z.string().optional(),
        RoomStatus: z.string().optional(),
        ParticipantSid: z.string().optional(),
        ParticipantIdentity: z.string().optional(),
        ParticipantStatus: z.string().optional(),
        RecordingSid: z.string().optional(),
        RecordingStatus: z.string().optional(),
        Timestamp: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Log the webhook event
      console.log('Twilio Video webhook received:', input);

      // Handle different event types
      switch (input.StatusCallbackEvent) {
        case 'room-created':
          console.log(`Room created: ${input.RoomName} (${input.RoomSid})`);
          break;

        case 'room-ended':
          console.log(`Room ended: ${input.RoomName} (${input.RoomSid})`);
          // TODO: Update database with room end time
          break;

        case 'participant-connected':
          console.log(
            `Participant connected: ${input.ParticipantIdentity} to room ${input.RoomName}`
          );
          // TODO: Update viewer count in database
          break;

        case 'participant-disconnected':
          console.log(
            `Participant disconnected: ${input.ParticipantIdentity} from room ${input.RoomName}`
          );
          // TODO: Update viewer count in database
          break;

        case 'recording-started':
          console.log(`Recording started: ${input.RecordingSid} in room ${input.RoomName}`);
          break;

        case 'recording-completed':
          console.log(`Recording completed: ${input.RecordingSid} in room ${input.RoomName}`);
          // TODO: Store recording URL in database
          break;

        default:
          console.log(`Unknown event type: ${input.StatusCallbackEvent}`);
      }

      return { success: true };
    }),
});
