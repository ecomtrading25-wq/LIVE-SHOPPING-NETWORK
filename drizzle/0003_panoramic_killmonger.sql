CREATE TABLE `email_campaigns` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('abandoned_cart','win_back','product_recommendation','promotional') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`status` enum('draft','active','paused') NOT NULL DEFAULT 'draft',
	`target_segment` json,
	`sent_count` int NOT NULL DEFAULT 0,
	`opened_count` int NOT NULL DEFAULT 0,
	`clicked_count` int NOT NULL DEFAULT 0,
	`revenue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`last_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`read` boolean NOT NULL DEFAULT false,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_subscriptions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`status` enum('active','paused','cancelled') NOT NULL DEFAULT 'active',
	`next_delivery_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` varchar(64) NOT NULL,
	`referrer_id` int NOT NULL,
	`referred_user_id` int,
	`referral_code` varchar(32) NOT NULL,
	`email` varchar(320),
	`status` enum('pending','signed_up','purchased') NOT NULL DEFAULT 'pending',
	`reward_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`reward_paid` boolean NOT NULL DEFAULT false,
	`reward_paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referral_code_unique` UNIQUE(`referral_code`)
);
--> statement-breakpoint
CREATE TABLE `saved_searches` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`query` text NOT NULL,
	`filters` json,
	`notify_on_match` boolean NOT NULL DEFAULT true,
	`last_notified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_alerts` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`variant_id` varchar(64),
	`alert_type` enum('back_in_stock','price_drop') NOT NULL,
	`target_price` decimal(10,2),
	`notified` boolean NOT NULL DEFAULT false,
	`notified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_subscriptions` ADD CONSTRAINT `product_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_subscriptions` ADD CONSTRAINT `product_subscriptions_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrer_id_users_id_fk` FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referred_user_id_users_id_fk` FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_searches` ADD CONSTRAINT `saved_searches_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE no action ON UPDATE no action;