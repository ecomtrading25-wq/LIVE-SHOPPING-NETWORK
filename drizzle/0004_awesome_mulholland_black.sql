CREATE TABLE `host_followers` (
	`id` varchar(64) NOT NULL,
	`host_id` varchar(64) NOT NULL,
	`follower_id` int NOT NULL,
	`notifications_enabled` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `host_followers_id` PRIMARY KEY(`id`),
	CONSTRAINT `host_follower_idx` UNIQUE(`host_id`,`follower_id`)
);
--> statement-breakpoint
CREATE TABLE `host_profiles` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`display_name` varchar(255) NOT NULL,
	`bio` text,
	`avatar_url` text,
	`cover_image_url` text,
	`is_verified` boolean DEFAULT false,
	`verified_at` timestamp,
	`total_shows` int DEFAULT 0,
	`total_followers` int DEFAULT 0,
	`total_revenue` decimal(10,2) DEFAULT '0.00',
	`rating` decimal(3,2) DEFAULT '0.00',
	`status` enum('active','suspended','banned') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `host_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `host_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `live_chat_messages` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`user_id` int,
	`message` text NOT NULL,
	`message_type` enum('text','emoji','gift','system') NOT NULL DEFAULT 'text',
	`is_deleted` boolean DEFAULT false,
	`deleted_at` timestamp,
	`deleted_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_gift_transactions` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`gift_id` varchar(64) NOT NULL,
	`sender_id` int NOT NULL,
	`recipient_id` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`total_price` decimal(10,2) NOT NULL,
	`message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_gift_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_show_analytics` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`timestamp` timestamp NOT NULL,
	`concurrent_viewers` int DEFAULT 0,
	`new_viewers` int DEFAULT 0,
	`messages_per_minute` int DEFAULT 0,
	`gifts_per_minute` int DEFAULT 0,
	`revenue_per_minute` decimal(10,2) DEFAULT '0.00',
	`engagement_score` decimal(5,2) DEFAULT '0.00',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_show_analytics_id` PRIMARY KEY(`id`),
	CONSTRAINT `show_timestamp_idx` UNIQUE(`show_id`,`timestamp`)
);
--> statement-breakpoint
CREATE TABLE `live_show_products` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`display_order` int DEFAULT 0,
	`special_price` decimal(10,2),
	`stock` int,
	`sold_count` int DEFAULT 0,
	`is_pinned` boolean DEFAULT false,
	`pinned_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_show_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `show_product_idx` UNIQUE(`show_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `live_shows` (
	`id` varchar(64) NOT NULL,
	`host_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`status` enum('scheduled','live','ended','cancelled') NOT NULL DEFAULT 'scheduled',
	`scheduled_start_at` timestamp NOT NULL,
	`actual_start_at` timestamp,
	`actual_end_at` timestamp,
	`stream_key` varchar(128),
	`stream_url` text,
	`recording_url` text,
	`peak_viewers` int DEFAULT 0,
	`total_views` int DEFAULT 0,
	`total_messages` int DEFAULT 0,
	`total_gifts` int DEFAULT 0,
	`total_revenue` decimal(10,2) DEFAULT '0.00',
	`settings` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_shows_id` PRIMARY KEY(`id`),
	CONSTRAINT `live_shows_stream_key_unique` UNIQUE(`stream_key`)
);
--> statement-breakpoint
CREATE TABLE `live_viewers` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`user_id` int,
	`session_id` varchar(128),
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	`left_at` timestamp,
	`watch_duration` int DEFAULT 0,
	`messages_count` int DEFAULT 0,
	`gifts_count` int DEFAULT 0,
	`purchases_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_viewers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_actions` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`moderator_id` int NOT NULL,
	`target_user_id` int,
	`action_type` enum('timeout','ban','delete_message','warning') NOT NULL,
	`reason` text,
	`duration` int,
	`message_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stream_quality_logs` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`timestamp` timestamp NOT NULL,
	`bitrate` int,
	`framerate` int,
	`resolution` varchar(32),
	`dropped_frames` int DEFAULT 0,
	`buffering_events` int DEFAULT 0,
	`average_latency` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_quality_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virtual_gifts` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon_url` text,
	`animation_url` text,
	`price` decimal(10,2) NOT NULL,
	`category` varchar(64),
	`is_active` boolean DEFAULT true,
	`display_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virtual_gifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `host_followers` ADD CONSTRAINT `host_followers_host_id_host_profiles_id_fk` FOREIGN KEY (`host_id`) REFERENCES `host_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `host_followers` ADD CONSTRAINT `host_followers_follower_id_users_id_fk` FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `host_profiles` ADD CONSTRAINT `host_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_chat_messages` ADD CONSTRAINT `live_chat_messages_show_id_live_shows_id_fk` FOREIGN KEY (`show_id`) REFERENCES `live_shows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_chat_messages` ADD CONSTRAINT `live_chat_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_chat_messages` ADD CONSTRAINT `live_chat_messages_deleted_by_users_id_fk` FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_gift_transactions` ADD CONSTRAINT `live_gift_transactions_show_id_live_shows_id_fk` FOREIGN KEY (`show_id`) REFERENCES `live_shows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_gift_transactions` ADD CONSTRAINT `live_gift_transactions_gift_id_virtual_gifts_id_fk` FOREIGN KEY (`gift_id`) REFERENCES `virtual_gifts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_gift_transactions` ADD CONSTRAINT `live_gift_transactions_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_gift_transactions` ADD CONSTRAINT `live_gift_transactions_recipient_id_users_id_fk` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_show_analytics` ADD CONSTRAINT `live_show_analytics_show_id_live_shows_id_fk` FOREIGN KEY (`show_id`) REFERENCES `live_shows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_show_products` ADD CONSTRAINT `live_show_products_show_id_live_shows_id_fk` FOREIGN KEY (`show_id`) REFERENCES `live_shows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_shows` ADD CONSTRAINT `live_shows_host_id_users_id_fk` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_viewers` ADD CONSTRAINT `live_viewers_show_id_live_shows_id_fk` FOREIGN KEY (`show_id`) REFERENCES `live_shows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_viewers` ADD CONSTRAINT `live_viewers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderation_actions` ADD CONSTRAINT `moderation_actions_show_id_live_shows_id_fk` FOREIGN KEY (`show_id`) REFERENCES `live_shows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderation_actions` ADD CONSTRAINT `moderation_actions_moderator_id_users_id_fk` FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderation_actions` ADD CONSTRAINT `moderation_actions_target_user_id_users_id_fk` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderation_actions` ADD CONSTRAINT `moderation_actions_message_id_live_chat_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `live_chat_messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stream_quality_logs` ADD CONSTRAINT `stream_quality_logs_show_id_live_shows_id_fk` FOREIGN KEY (`show_id`) REFERENCES `live_shows`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `host_id_idx` ON `host_followers` (`host_id`);--> statement-breakpoint
CREATE INDEX `follower_id_idx` ON `host_followers` (`follower_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `host_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `show_id_idx` ON `live_chat_messages` (`show_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `live_chat_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `show_id_idx` ON `live_gift_transactions` (`show_id`);--> statement-breakpoint
CREATE INDEX `sender_id_idx` ON `live_gift_transactions` (`sender_id`);--> statement-breakpoint
CREATE INDEX `recipient_id_idx` ON `live_gift_transactions` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `show_id_idx` ON `live_show_analytics` (`show_id`);--> statement-breakpoint
CREATE INDEX `show_id_idx` ON `live_show_products` (`show_id`);--> statement-breakpoint
CREATE INDEX `host_id_idx` ON `live_shows` (`host_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `live_shows` (`status`);--> statement-breakpoint
CREATE INDEX `scheduled_start_idx` ON `live_shows` (`scheduled_start_at`);--> statement-breakpoint
CREATE INDEX `show_user_idx` ON `live_viewers` (`show_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `show_id_idx` ON `live_viewers` (`show_id`);--> statement-breakpoint
CREATE INDEX `show_id_idx` ON `moderation_actions` (`show_id`);--> statement-breakpoint
CREATE INDEX `moderator_id_idx` ON `moderation_actions` (`moderator_id`);--> statement-breakpoint
CREATE INDEX `target_user_id_idx` ON `moderation_actions` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `show_id_idx` ON `stream_quality_logs` (`show_id`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `stream_quality_logs` (`timestamp`);