CREATE TABLE `actions` (
	`id` varchar(64) NOT NULL,
	`task_id` varchar(64) NOT NULL,
	`agent_id` varchar(64) NOT NULL,
	`tool_name` varchar(255) NOT NULL,
	`operation` varchar(255) NOT NULL,
	`arguments` json NOT NULL,
	`result` json,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`latency_ms` int,
	`cost_usd` decimal(10,6),
	`retry_count` int NOT NULL DEFAULT 0,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('orchestrator','cfo','coo','cmo','cto','legal','support','creator_ops','worker') NOT NULL,
	`capabilities` json NOT NULL,
	`tool_permissions` json NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`config` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` varchar(64) NOT NULL,
	`type` enum('task','action','plan','policy_change','budget','payout') NOT NULL,
	`entity_id` varchar(64) NOT NULL,
	`requested_by` varchar(64) NOT NULL,
	`approver_role` enum('founder','admin','ops') NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`reason` text,
	`context` json,
	`approved_by` varchar(64),
	`approved_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bandit_arms` (
	`id` varchar(64) NOT NULL,
	`experiment_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`config` json NOT NULL,
	`pulls` int NOT NULL DEFAULT 0,
	`total_reward` decimal(20,4) NOT NULL DEFAULT '0',
	`avg_reward` decimal(10,4),
	`confidence` decimal(5,4),
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bandit_arms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bandit_rewards` (
	`id` varchar(64) NOT NULL,
	`arm_id` varchar(64) NOT NULL,
	`experiment_id` varchar(64) NOT NULL,
	`context` json,
	`action` json NOT NULL,
	`reward` decimal(10,4) NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bandit_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` varchar(64) NOT NULL,
	`type` varchar(100) NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`context` json NOT NULL,
	`options` json NOT NULL,
	`selected_option` varchar(64),
	`reasoning` text,
	`status` enum('proposed','approved','executed','rejected','rolled_back') NOT NULL DEFAULT 'proposed',
	`executed_at` timestamp,
	`actual_impact` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(64) NOT NULL,
	`type` varchar(255) NOT NULL,
	`source` enum('system','external','user','agent') NOT NULL,
	`org_unit_id` varchar(64),
	`payload` json NOT NULL,
	`metadata` json,
	`processed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('ab_test','multivariate','bandit') NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`hypothesis` text,
	`variants` json NOT NULL,
	`metrics` json NOT NULL,
	`status` enum('draft','running','paused','completed','cancelled') NOT NULL DEFAULT 'draft',
	`started_at` timestamp,
	`ended_at` timestamp,
	`results` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` varchar(64) NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`type` enum('okr','constraint','target') NOT NULL,
	`priority` int NOT NULL DEFAULT 5,
	`target_value` decimal(20,4),
	`current_value` decimal(20,4),
	`unit` varchar(50),
	`deadline` timestamp,
	`status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	`parent_goal_id` varchar(64),
	`constraints` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_registry` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`version` varchar(50) NOT NULL,
	`type` enum('prompt','policy','classifier','forecaster') NOT NULL,
	`config` json NOT NULL,
	`eval_scores` json,
	`status` enum('draft','testing','production','deprecated') NOT NULL DEFAULT 'draft',
	`deployed_at` timestamp,
	`created_by` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `model_registry_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_version_idx` UNIQUE(`name`,`version`)
);
--> statement-breakpoint
CREATE TABLE `org_units` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('business','department','team') NOT NULL,
	`parent_id` varchar(64),
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`settings` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outcomes` (
	`id` varchar(64) NOT NULL,
	`task_id` varchar(64) NOT NULL,
	`goal_id` varchar(64),
	`result` json NOT NULL,
	`reward_score` decimal(10,4),
	`metrics` json,
	`success` boolean NOT NULL,
	`feedback` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(64) NOT NULL,
	`goal_id` varchar(64) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`title` varchar(500) NOT NULL,
	`description` text,
	`strategy` text NOT NULL,
	`steps` json NOT NULL,
	`status` enum('draft','approved','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	`created_by` varchar(64) NOT NULL,
	`approved_by` varchar(64),
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `goal_version_idx` UNIQUE(`goal_id`,`version`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`org_unit_id` varchar(64),
	`scope` enum('global','org_unit','workflow','agent') NOT NULL,
	`rules` json NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`version` int NOT NULL DEFAULT 1,
	`created_by` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reconciliations` (
	`id` varchar(64) NOT NULL,
	`type` enum('payout','payment','refund','chargeback') NOT NULL,
	`external_id` varchar(255) NOT NULL,
	`provider` varchar(100) NOT NULL,
	`amount` decimal(20,4) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`ledger_entry_id` varchar(64),
	`status` enum('pending','matched','unmatched','disputed') NOT NULL DEFAULT 'pending',
	`matched_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reconciliations_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_id_idx` UNIQUE(`external_id`)
);
--> statement-breakpoint
CREATE TABLE `simulation_runs` (
	`id` varchar(64) NOT NULL,
	`simulation_id` varchar(64) NOT NULL,
	`scenario` json NOT NULL,
	`predictions` json NOT NULL,
	`confidence` decimal(5,4),
	`run_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('demand','inventory','creator','payout','fraud','pricing') NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`model_config` json NOT NULL,
	`baseline_state` json NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`accuracy` decimal(5,4),
	`last_calibrated` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `state_snapshots` (
	`id` varchar(64) NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`snapshot_type` enum('hourly','daily','on_demand') NOT NULL,
	`metrics` json NOT NULL,
	`timestamp` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `state_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_unit_timestamp_idx` UNIQUE(`org_unit_id`,`timestamp`)
);
--> statement-breakpoint
CREATE TABLE `workflow_runs` (
	`id` varchar(64) NOT NULL,
	`workflow_id` varchar(64) NOT NULL,
	`event_id` varchar(64),
	`status` enum('pending','running','paused','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`inputs` json,
	`outputs` json,
	`trace` json,
	`error_message` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(100) NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`autonomy_level` enum('a0_manual','a1_assisted','a2_supervised','a3_autonomous','a4_self_optimizing') NOT NULL DEFAULT 'a0_manual',
	`trigger_events` json NOT NULL,
	`spec` json NOT NULL,
	`status` enum('active','paused','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `task_idx` ON `actions` (`task_id`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `actions` (`agent_id`);--> statement-breakpoint
CREATE INDEX `tool_idx` ON `actions` (`tool_name`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `actions` (`status`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `approvals` (`status`);--> statement-breakpoint
CREATE INDEX `approver_idx` ON `approvals` (`approver_role`);--> statement-breakpoint
CREATE INDEX `entity_idx` ON `approvals` (`entity_id`);--> statement-breakpoint
CREATE INDEX `experiment_idx` ON `bandit_arms` (`experiment_id`);--> statement-breakpoint
CREATE INDEX `arm_idx` ON `bandit_rewards` (`arm_id`);--> statement-breakpoint
CREATE INDEX `experiment_idx` ON `bandit_rewards` (`experiment_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `decisions` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `decisions` (`status`);--> statement-breakpoint
CREATE INDEX `org_unit_idx` ON `decisions` (`org_unit_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `events` (`type`);--> statement-breakpoint
CREATE INDEX `org_unit_idx` ON `events` (`org_unit_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `events` (`created_at`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `experiments` (`status`);--> statement-breakpoint
CREATE INDEX `org_unit_idx` ON `experiments` (`org_unit_id`);--> statement-breakpoint
CREATE INDEX `org_unit_idx` ON `goals` (`org_unit_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `goals` (`status`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `model_registry` (`status`);--> statement-breakpoint
CREATE INDEX `task_idx` ON `outcomes` (`task_id`);--> statement-breakpoint
CREATE INDEX `goal_idx` ON `outcomes` (`goal_id`);--> statement-breakpoint
CREATE INDEX `scope_idx` ON `policies` (`scope`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `policies` (`status`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `reconciliations` (`status`);--> statement-breakpoint
CREATE INDEX `simulation_idx` ON `simulation_runs` (`simulation_id`);--> statement-breakpoint
CREATE INDEX `run_at_idx` ON `simulation_runs` (`run_at`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `state_snapshots` (`timestamp`);--> statement-breakpoint
CREATE INDEX `workflow_idx` ON `workflow_runs` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `workflow_runs` (`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `workflow_runs` (`started_at`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `workflows` (`type`);--> statement-breakpoint
CREATE INDEX `autonomy_idx` ON `workflows` (`autonomy_level`);