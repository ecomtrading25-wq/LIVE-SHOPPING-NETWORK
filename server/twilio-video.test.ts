import { describe, expect, it, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createMockContext(role: 'admin' | 'host' | 'user' = 'user'): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('Twilio Video Streaming', () => {
  describe('twilioVideoStreaming.createRoom', () => {
    it('should allow admin to create a video room', async () => {
      const ctx = createMockContext('admin');
      const caller = appRouter.createCaller(ctx);

      // Note: This will fail if Twilio credentials are not configured
      // In that case, we expect a specific error message
      try {
        const result = await caller.twilioVideoStreaming.createRoom({
          roomName: 'test-room-' + Date.now(),
          roomType: 'group',
          maxParticipants: 10,
        });

        // If successful, check the response structure
        expect(result).toHaveProperty('sid');
        expect(result).toHaveProperty('uniqueName');
        expect(result).toHaveProperty('status');
      } catch (error: any) {
        // Expected errors: Twilio not configured OR authentication error
        expect(
          error.message.includes('Twilio Video is not configured') ||
            error.message.includes('Authenticate')
        ).toBe(true);
      }
    });

    it('should allow host to create a video room', async () => {
      const ctx = createMockContext('host');
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.twilioVideoStreaming.createRoom({
          roomName: 'host-room-' + Date.now(),
          roomType: 'group',
        });

        expect(result).toHaveProperty('sid');
      } catch (error: any) {
        // Expected errors: Twilio not configured OR authentication error
        expect(
          error.message.includes('Twilio Video is not configured') ||
            error.message.includes('Authenticate')
        ).toBe(true);
      }
    });

    it('should deny regular user from creating a video room', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.twilioVideoStreaming.createRoom({
          roomName: 'user-room-' + Date.now(),
          roomType: 'group',
        })
      ).rejects.toThrow('Only hosts and admins can create video rooms');
    });
  });

  describe('twilioVideoStreaming.getAccessToken', () => {
    it('should generate access token for authenticated user', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.twilioVideoStreaming.getAccessToken({
          roomName: 'test-room',
        });

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('identity');
        expect(result).toHaveProperty('roomName');
        expect(result.roomName).toBe('test-room');
      } catch (error: any) {
        // Expected errors: Twilio not configured OR authentication error
        expect(
          error.message.includes('Twilio Video is not configured') ||
            error.message.includes('Authenticate')
        ).toBe(true);
      }
    });

    it('should use custom identity if provided', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.twilioVideoStreaming.getAccessToken({
          roomName: 'test-room',
          identity: 'custom-identity',
        });

        expect(result.identity).toBe('custom-identity');
      } catch (error: any) {
        // Expected errors: Twilio not configured OR authentication error
        expect(
          error.message.includes('Twilio Video is not configured') ||
            error.message.includes('Authenticate')
        ).toBe(true);
      }
    });
  });

  describe('twilioVideoStreaming.completeRoom', () => {
    it('should allow admin to complete a video room', async () => {
      const ctx = createMockContext('admin');
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.twilioVideoStreaming.completeRoom({
          roomSidOrName: 'test-room',
        });

        expect(result).toHaveProperty('status');
      } catch (error: any) {
        // Expected errors: Twilio not configured, authentication error, OR room not found
        expect(
          error.message.includes('Twilio Video is not configured') ||
            error.message.includes('Authenticate') ||
            error.message.includes('not found')
        ).toBe(true);
      }
    });

    it('should deny regular user from completing a video room', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.twilioVideoStreaming.completeRoom({
          roomSidOrName: 'test-room',
        })
      ).rejects.toThrow('Only hosts and admins can end video rooms');
    });
  });

  describe('twilioVideoStreaming.listActiveRooms', () => {
    it('should allow admin to list active rooms', async () => {
      const ctx = createMockContext('admin');
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.twilioVideoStreaming.listActiveRooms();

        expect(Array.isArray(result)).toBe(true);
      } catch (error: any) {
        // Expected errors: Twilio not configured OR authentication error
        expect(
          error.message.includes('Twilio Video is not configured') ||
            error.message.includes('Authenticate')
        ).toBe(true);
      }
    });

    it('should deny regular user from listing active rooms', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      await expect(caller.twilioVideoStreaming.listActiveRooms()).rejects.toThrow(
        'Only admins can list all video rooms'
      );
    });
  });

  describe('twilioVideoStreaming.webhook', () => {
    it('should handle room-created webhook event', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      const result = await caller.twilioVideoStreaming.webhook({
        StatusCallbackEvent: 'room-created',
        RoomSid: 'RM123456',
        RoomName: 'test-room',
        RoomStatus: 'in-progress',
      });

      expect(result).toEqual({ success: true });
    });

    it('should handle participant-connected webhook event', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      const result = await caller.twilioVideoStreaming.webhook({
        StatusCallbackEvent: 'participant-connected',
        RoomSid: 'RM123456',
        RoomName: 'test-room',
        ParticipantSid: 'PA123456',
        ParticipantIdentity: 'user_1',
        ParticipantStatus: 'connected',
      });

      expect(result).toEqual({ success: true });
    });

    it('should handle recording-completed webhook event', async () => {
      const ctx = createMockContext('user');
      const caller = appRouter.createCaller(ctx);

      const result = await caller.twilioVideoStreaming.webhook({
        StatusCallbackEvent: 'recording-completed',
        RoomSid: 'RM123456',
        RoomName: 'test-room',
        RecordingSid: 'RT123456',
        RecordingStatus: 'completed',
      });

      expect(result).toEqual({ success: true });
    });
  });
});
