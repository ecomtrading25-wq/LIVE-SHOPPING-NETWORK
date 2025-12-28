CREATE TABLE `moderation_logs` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`allowed` boolean NOT NULL,
	`reason` text,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`categories` text,
	`confidence` decimal(3,2) NOT NULL,
	`context` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_reports` (
	`id` varchar(64) NOT NULL,
	`reporter_id` varchar(64) NOT NULL,
	`reported_user_id` varchar(64) NOT NULL,
	`reason` text NOT NULL,
	`context` json,
	`status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`reviewed_by` varchar(64),
	`reviewed_at` timestamp,
	`resolution` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payouts` MODIFY COLUMN `status` enum('pending','processing','completed','failed','cancelled','paid','in_transit') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `host_profiles` ADD `stripe_account_id` varchar(255);--> statement-breakpoint
ALTER TABLE `host_profiles` ADD `stripe_onboarding_complete` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `live_viewers` ADD `view_duration` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `payouts` ADD `host_id` varchar(64);--> statement-breakpoint
ALTER TABLE `payouts` ADD `stripe_transfer_id` varchar(255);--> statement-breakpoint
ALTER TABLE `payouts` ADD `description` text;--> statement-breakpoint
ALTER TABLE `users` ADD `is_banned` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `banned_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `ban_reason` text;--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `moderation_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `allowed_idx` ON `moderation_logs` (`allowed`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `moderation_logs` (`severity`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `moderation_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `reporter_id_idx` ON `user_reports` (`reporter_id`);--> statement-breakpoint
CREATE INDEX `reported_user_id_idx` ON `user_reports` (`reported_user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `user_reports` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `user_reports` (`created_at`);