/**
 * Health Check Endpoints
 * 
 * Provides health and readiness checks for Railway and monitoring systems
 * - /health: Basic health check
 * - /ready: Readiness check (includes database connectivity)
 * - /metrics: Basic application metrics
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDbSync } from "./db";

// Track application start time
const startTime = Date.now();

// Track request counts
let requestCount = 0;
let errorCount = 0;

/**
 * Increment request counter
 */
export function incrementRequestCount() {
  requestCount++;
}

/**
 * Increment error counter
 */
export function incrementErrorCount() {
  errorCount++;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<boolean> {
  try {
    const db = getDbSync();
    // Simple query to check connection
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('[Health] Database check failed:', error);
    return false;
  }
}

/**
 * Get system metrics
 */
function getSystemMetrics() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  
  return {
    uptime,
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    requests: {
      total: requestCount,
      errors: errorCount,
      errorRate: requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) + '%' : '0%',
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
}

/**
 * Health check router
 */
export const healthRouter = router({
  /**
   * Basic health check
   * Returns 200 if application is running
   */
  check: publicProcedure
    .query(async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        environment: process.env.NODE_ENV || 'development',
      };
    }),

  /**
   * Readiness check
   * Returns 200 only if application is ready to serve traffic
   * Includes database connectivity check
   */
  ready: publicProcedure
    .query(async () => {
      const dbHealthy = await checkDatabase();
      
      if (!dbHealthy) {
        throw new Error('Database connection failed');
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealthy,
        },
      };
    }),

  /**
   * Application metrics
   * Returns detailed metrics for monitoring
   */
  metrics: publicProcedure
    .query(async () => {
      const metrics = getSystemMetrics();
      const dbHealthy = await checkDatabase();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        ...metrics,
        health: {
          database: dbHealthy,
        },
      };
    }),

  /**
   * Liveness probe
   * Simple check that process is alive
   */
  live: publicProcedure
    .query(() => {
      return {
        status: 'alive',
        timestamp: new Date().toISOString(),
      };
    }),
});

/**
 * Express middleware for health endpoints
 * Can be used directly in Express routes
 */
export function healthCheckMiddleware(req: any, res: any) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}

export function readinessCheckMiddleware(req: any, res: any) {
  checkDatabase()
    .then((healthy) => {
      if (healthy) {
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks: { database: true },
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          checks: { database: false },
        });
      }
    })
    .catch((error) => {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    });
}

export function metricsMiddleware(req: any, res: any) {
  const metrics = getSystemMetrics();
  
  checkDatabase()
    .then((dbHealthy) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        ...metrics,
        health: {
          database: dbHealthy,
        },
      });
    })
    .catch((error) => {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    });
}
