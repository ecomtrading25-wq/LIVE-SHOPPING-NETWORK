CREATE TABLE `payouts` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`method` enum('bank_account','paypal','stripe') NOT NULL,
	`stripe_payout_id` varchar(255),
	`estimated_arrival` timestamp,
	`completed_at` timestamp,
	`failure_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('deposit','withdrawal','purchase','earning','refund') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`stripe_payment_intent_id` varchar(255),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`pending_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`lifetime_earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`lifetime_spending` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`stripe_customer_id` varchar(255),
	`stripe_account_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `payouts` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payouts` (`status`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `transactions` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `wallets` (`user_id`);