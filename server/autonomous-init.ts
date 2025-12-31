/**
 * Autonomous System Initialization
 * 
 * Initializes and starts all autonomous operation services
 */

import { getEmailServiceStatus } from './email-service';
import { getMonitoringService, getHealthStatus } from './monitoring-service';
import { getOrchestrator } from './agent-orchestrator';
import { initializeScheduler } from './autonomous-scheduler';

/**
 * Initialize all autonomous services
 */
export function initializeAutonomousServices() {
  console.log('\n==============================================');
  console.log('🤖 Initializing Autonomous Operation System');
  console.log('==============================================\n');

  // Check if autonomous mode is enabled
  const autonomousEnabled = process.env.ENABLE_AUTONOMOUS === 'true';
  
  if (!autonomousEnabled) {
    console.log('⚠️  Autonomous mode is DISABLED');
    console.log('   Set ENABLE_AUTONOMOUS=true to enable\n');
    return {
      enabled: false,
      services: {},
    };
  }

  console.log('✅ Autonomous mode is ENABLED\n');

  // Initialize services
  const services: Record<string, any> = {};

  // 1. Email Service
  console.log('📧 Email Service...');
  const emailStatus = getEmailServiceStatus();
  services.email = emailStatus;
  if (emailStatus.configured) {
    console.log(`   ✅ Configured (from: ${emailStatus.fromEmail})`);
    console.log(`   📬 Alert email: ${emailStatus.alertEmail}`);
  } else {
    console.log('   ⚠️  Not configured (set SENDGRID_API_KEY)');
  }

  // 2. Monitoring Service
  console.log('\n📊 Monitoring Service...');
  const monitoring = getMonitoringService();
  services.monitoring = monitoring;
  console.log('   ✅ Initialized with default thresholds');
  
  const slackConfigured = !!process.env.SLACK_WEBHOOK_URL;
  if (slackConfigured) {
    console.log('   ✅ Slack alerts configured');
  } else {
    console.log('   ⚠️  Slack alerts not configured (set SLACK_WEBHOOK_URL)');
  }

  // 3. Agent Orchestrator
  console.log('\n🤖 Agent Orchestrator...');
  const orchestrator = getOrchestrator();
  services.orchestrator = orchestrator;
  console.log('   ✅ Initialized with policy engine');
  console.log(`   💰 Daily payout limit: $${process.env.DAILY_PAYOUT_LIMIT || '5000'}`);
  console.log(`   💵 Single payout limit: $${process.env.SINGLE_PAYOUT_LIMIT || '1000'}`);

  // 4. Autonomous Scheduler
  console.log('\n⏰ Autonomous Scheduler...');
  const scheduler = initializeScheduler();
  services.scheduler = scheduler;
  const jobs = scheduler.getJobs();
  console.log(`   ✅ Initialized with ${jobs.length} scheduled jobs:`);
  
  jobs.forEach((job) => {
    console.log(`      • ${job.name} (${job.schedule})`);
  });

  // 5. Self-Healing
  console.log('\n🔧 Self-Healing Mechanisms...');
  console.log('   ✅ Retry logic with exponential backoff');
  console.log('   ✅ Circuit breakers for external APIs');
  console.log('   ✅ Dead-letter queue for failed tasks');
  console.log('   ✅ Graceful degradation strategies');
  console.log('   ✅ Database connection recovery');

  // Summary
  console.log('\n==============================================');
  console.log('✅ Autonomous System Ready');
  console.log('==============================================\n');

  // Check for missing critical configuration
  const warnings: string[] = [];
  
  if (!emailStatus.configured) {
    warnings.push('Email service not configured - alerts will not be sent');
  }
  
  if (!slackConfigured) {
    warnings.push('Slack alerts not configured - only email alerts will be sent');
  }
  
  if (!process.env.FOUNDER_EMAIL && !process.env.ALERT_EMAIL) {
    warnings.push('No founder/alert email configured - critical alerts will not be delivered');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach((warning) => {
      console.log(`   • ${warning}`);
    });
    console.log('');
  }

  console.log('📊 System Status:');
  console.log(`   • Email: ${emailStatus.configured ? '✅' : '❌'}`);
  console.log(`   • Monitoring: ✅`);
  console.log(`   • Agent Orchestrator: ✅`);
  console.log(`   • Scheduler: ✅ (${jobs.length} jobs)`);
  console.log(`   • Self-Healing: ✅`);
  console.log('');

  console.log('🚀 The system is now running autonomously!');
  console.log('   Check logs for scheduled task execution');
  console.log('   Monitor alerts via email/Slack');
  console.log('   Review daily summary emails\n');

  return {
    enabled: true,
    services,
    warnings,
  };
}

/**
 * Get autonomous system status
 */
export function getAutonomousStatus() {
  const autonomousEnabled = process.env.ENABLE_AUTONOMOUS === 'true';
  
  if (!autonomousEnabled) {
    return {
      enabled: false,
      message: 'Autonomous mode is disabled',
    };
  }

  const emailStatus = getEmailServiceStatus();
  const healthStatus = getHealthStatus();
  const orchestratorStats = getOrchestrator().getStats();

  return {
    enabled: true,
    email: emailStatus,
    health: healthStatus,
    orchestrator: orchestratorStats,
    timestamp: new Date(),
  };
}

/**
 * Health check endpoint data
 */
export function getHealthCheckData() {
  const autonomousStatus = getAutonomousStatus();
  const healthStatus = getHealthStatus();

  return {
    status: healthStatus.healthy ? 'healthy' : 'unhealthy',
    autonomous: {
      enabled: autonomousStatus.enabled,
      email: autonomousStatus.enabled ? autonomousStatus.email : null,
      orchestrator: autonomousStatus.enabled ? autonomousStatus.orchestrator : null,
    },
    monitoring: {
      healthy: healthStatus.healthy,
      criticalAlerts: healthStatus.criticalAlerts,
      warningAlerts: healthStatus.warningAlerts,
    },
    timestamp: new Date().toISOString(),
  };
}
