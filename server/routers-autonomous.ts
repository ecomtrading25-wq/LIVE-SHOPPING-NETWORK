/**
 * Autonomous Operations Router
 * 
 * Provides endpoints for managing and monitoring autonomous operations
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { getHealthCheckData, getAutonomousStatus } from './autonomous-init';
import { getMonitoringService, getMonitoringStats } from './monitoring-service';
import { getOrchestrator } from './agent-orchestrator';
import { getScheduler } from './autonomous-scheduler';
import { getAllCircuitBreakerStats, getDLQ } from './self-healing';

export const autonomousRouter = router({
  /**
   * Health check endpoint
   */
  health: publicProcedure.query(() => {
    return getHealthCheckData();
  }),

  /**
   * Get autonomous system status
   */
  status: protectedProcedure.query(() => {
    return getAutonomousStatus();
  }),

  /**
   * Get monitoring statistics
   */
  monitoringStats: protectedProcedure.query(() => {
    const stats = getMonitoringStats();
    const health = getMonitoringService().getHealthStatus();
    return {
      stats,
      health,
    };
  }),

  /**
   * Get recent alerts
   */
  alerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        severity: z.enum(['info', 'warning', 'critical']).optional(),
      })
    )
    .query(({ input }) => {
      const monitoring = getMonitoringService();
      return monitoring.getAlerts(input.limit, input.severity);
    }),

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(({ input }) => {
      const monitoring = getMonitoringService();
      monitoring.acknowledgeAlert(input.alertId);
      return { success: true };
    }),

  /**
   * Get agent orchestrator stats
   */
  orchestratorStats: protectedProcedure.query(() => {
    const orchestrator = getOrchestrator();
    return orchestrator.getStats();
  }),

  /**
   * Get pending approvals
   */
  pendingApprovals: protectedProcedure.query(() => {
    const orchestrator = getOrchestrator();
    return orchestrator.getPendingApprovals();
  }),

  /**
   * Approve a task
   */
  approveTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        approvedBy: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const orchestrator = getOrchestrator();
      
      // Only admins or the owner can approve tasks
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can approve tasks',
        });
      }

      await orchestrator.approveTask(input.taskId, input.approvedBy);
      return { success: true };
    }),

  /**
   * Reject a task
   */
  rejectTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const orchestrator = getOrchestrator();
      
      // Only admins or the owner can reject tasks
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can reject tasks',
        });
      }

      await orchestrator.rejectTask(input.taskId, input.reason);
      return { success: true };
    }),

  /**
   * Get kill switch status
   */
  killSwitchStatus: protectedProcedure.query(() => {
    const orchestrator = getOrchestrator();
    return orchestrator.getKillSwitchStatus();
  }),

  /**
   * Activate kill switch
   */
  activateKillSwitch: protectedProcedure
    .input(z.object({ reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const orchestrator = getOrchestrator();
      
      // Only admins can activate kill switch
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can activate kill switch',
        });
      }

      await orchestrator.activateKillSwitch(input.reason);
      return { success: true };
    }),

  /**
   * Deactivate kill switch
   */
  deactivateKillSwitch: protectedProcedure.mutation(async ({ ctx }) => {
    const orchestrator = getOrchestrator();
    
    // Only admins can deactivate kill switch
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can deactivate kill switch',
      });
    }

    await orchestrator.deactivateKillSwitch();
    return { success: true };
  }),

  /**
   * Get scheduled jobs
   */
  scheduledJobs: protectedProcedure.query(() => {
    const scheduler = getScheduler();
    return scheduler.getJobs();
  }),

  /**
   * Enable a scheduled job
   */
  enableJob: protectedProcedure
    .input(z.object({ jobName: z.string() }))
    .mutation(({ input, ctx }) => {
      const scheduler = getScheduler();
      
      // Only admins can manage jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can manage scheduled jobs',
        });
      }

      scheduler.enableJob(input.jobName);
      return { success: true };
    }),

  /**
   * Disable a scheduled job
   */
  disableJob: protectedProcedure
    .input(z.object({ jobName: z.string() }))
    .mutation(({ input, ctx }) => {
      const scheduler = getScheduler();
      
      // Only admins can manage jobs
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can manage scheduled jobs',
        });
      }

      scheduler.disableJob(input.jobName);
      return { success: true };
    }),

  /**
   * Get circuit breaker stats
   */
  circuitBreakers: protectedProcedure.query(() => {
    return getAllCircuitBreakerStats();
  }),

  /**
   * Get dead letter queue
   */
  deadLetterQueue: protectedProcedure.query(() => {
    const dlq = getDLQ();
    return {
      size: dlq.size(),
      items: dlq.getAll(),
    };
  }),

  /**
   * Remove item from DLQ
   */
  removeDLQItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(({ input, ctx }) => {
      const dlq = getDLQ();
      
      // Only admins can manage DLQ
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can manage dead letter queue',
        });
      }

      dlq.remove(input.itemId);
      return { success: true };
    }),

  /**
   * Clear dead letter queue
   */
  clearDLQ: protectedProcedure.mutation(({ ctx }) => {
    const dlq = getDLQ();
    
    // Only admins can clear DLQ
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can clear dead letter queue',
      });
    }

    dlq.clear();
    return { success: true };
  }),
});
