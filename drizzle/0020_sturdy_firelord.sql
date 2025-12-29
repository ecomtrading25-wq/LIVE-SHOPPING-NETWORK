CREATE TABLE `stripe_billing_history` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`subscription_id` varchar(64) NOT NULL,
	`stripe_invoice_id` varchar(255) NOT NULL,
	`stripe_payment_intent_id` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('draft','open','paid','uncollectible','void') NOT NULL,
	`invoice_date` timestamp NOT NULL,
	`due_date` timestamp,
	`paid_at` timestamp,
	`hosted_invoice_url` text,
	`invoice_pdf` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_billing_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_billing_history_stripe_invoice_id_unique` UNIQUE(`stripe_invoice_id`)
);
--> statement-breakpoint
CREATE TABLE `stripe_payment_methods` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`stripe_payment_method_id` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`brand` varchar(50),
	`last4` varchar(4),
	`exp_month` int,
	`exp_year` int,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_payment_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_payment_methods_stripe_payment_method_id_unique` UNIQUE(`stripe_payment_method_id`)
);
--> statement-breakpoint
CREATE TABLE `stripe_subscription_plans` (
	`id` varchar(64) NOT NULL,
	`stripe_product_id` varchar(255) NOT NULL,
	`stripe_price_id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`interval` enum('month','year') NOT NULL,
	`interval_count` int NOT NULL DEFAULT 1,
	`features` json,
	`active` boolean NOT NULL DEFAULT true,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_subscription_plans_stripe_product_id_unique` UNIQUE(`stripe_product_id`),
	CONSTRAINT `stripe_subscription_plans_stripe_price_id_unique` UNIQUE(`stripe_price_id`)
);
--> statement-breakpoint
CREATE TABLE `stripe_subscriptions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`stripe_subscription_id` varchar(255) NOT NULL,
	`plan_id` varchar(64) NOT NULL,
	`status` enum('incomplete','incomplete_expired','trialing','active','past_due','canceled','unpaid') NOT NULL,
	`current_period_start` timestamp NOT NULL,
	`current_period_end` timestamp NOT NULL,
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`canceled_at` timestamp,
	`cancel_reason` text,
	`trial_start` timestamp,
	`trial_end` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_subscriptions_stripe_subscription_id_unique` UNIQUE(`stripe_subscription_id`)
);
--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`id` varchar(64) NOT NULL,
	`stripe_event_id` varchar(255) NOT NULL,
	`event_type` varchar(255) NOT NULL,
	`processed` boolean NOT NULL DEFAULT false,
	`processed_at` timestamp,
	`error` text,
	`event_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stripe_webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_webhook_events_stripe_event_id_unique` UNIQUE(`stripe_event_id`)
);
--> statement-breakpoint
ALTER TABLE `stripe_billing_history` ADD CONSTRAINT `stripe_billing_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stripe_billing_history` ADD CONSTRAINT `stripe_billing_history_subscription_id_stripe_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `stripe_subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stripe_payment_methods` ADD CONSTRAINT `stripe_payment_methods_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stripe_subscriptions` ADD CONSTRAINT `stripe_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stripe_subscriptions` ADD CONSTRAINT `stripe_subscriptions_plan_id_stripe_subscription_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `stripe_subscription_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `billing_user_id_idx` ON `stripe_billing_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `billing_subscription_id_idx` ON `stripe_billing_history` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `billing_status_idx` ON `stripe_billing_history` (`status`);--> statement-breakpoint
CREATE INDEX `payment_method_user_id_idx` ON `stripe_payment_methods` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_method_stripe_customer_id_idx` ON `stripe_payment_methods` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `plan_active_idx` ON `stripe_subscription_plans` (`active`);--> statement-breakpoint
CREATE INDEX `subscription_user_id_idx` ON `stripe_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subscription_status_idx` ON `stripe_subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `subscription_stripe_customer_id_idx` ON `stripe_subscriptions` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `webhook_processed_idx` ON `stripe_webhook_events` (`processed`);--> statement-breakpoint
CREATE INDEX `webhook_event_type_idx` ON `stripe_webhook_events` (`event_type`);