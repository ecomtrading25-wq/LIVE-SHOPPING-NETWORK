CREATE TABLE `admin_users` (
	`id` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` text NOT NULL,
	`role` enum('admin','ops','viewer') NOT NULL DEFAULT 'viewer',
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`actor_type` varchar(64) NOT NULL,
	`actor_id` varchar(64),
	`actor_label` varchar(255),
	`action` varchar(255) NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL DEFAULT 'info',
	`ref_type` varchar(128) NOT NULL,
	`ref_id` varchar(64) NOT NULL,
	`ip` varchar(45),
	`user_agent` text,
	`before` json,
	`after` json,
	`metadata` json,
	`prev_hash` varchar(64),
	`entry_hash` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bins` (
	`id` varchar(64) NOT NULL,
	`zone_id` varchar(64) NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255),
	`row` int,
	`col` int,
	`level` int,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bins_id` PRIMARY KEY(`id`),
	CONSTRAINT `zone_code_idx` UNIQUE(`zone_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `channel_accounts` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`platform` enum('shopify','tiktok_shop','amazon','custom') NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`credentials_enc` text,
	`credentials_mask` json,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`settings` json,
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channel_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_platform_idx` UNIQUE(`channel_id`,`platform`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` varchar(64) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`settings` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `channels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`order_id` varchar(64),
	`provider` enum('paypal','stripe') NOT NULL DEFAULT 'paypal',
	`provider_case_id` varchar(255) NOT NULL,
	`provider_status` varchar(128),
	`status` enum('open','evidence_required','evidence_building','evidence_ready','submitted','won','lost','closed') NOT NULL DEFAULT 'open',
	`reason` text,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`evidence_deadline` timestamp,
	`needs_manual` boolean NOT NULL DEFAULT false,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_provider_case_idx` UNIQUE(`channel_id`,`provider`,`provider_case_id`)
);
--> statement-breakpoint
CREATE TABLE `fulfillment_tasks` (
	`id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`task_type` enum('pick','pack','ship') NOT NULL,
	`status` enum('pending','assigned','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`assigned_to` varchar(64),
	`priority` int NOT NULL DEFAULT 1,
	`due_at` timestamp,
	`started_at` timestamp,
	`completed_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fulfillment_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`available` int NOT NULL DEFAULT 0,
	`reserved` int NOT NULL DEFAULT 0,
	`on_hand` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouse_product_idx` UNIQUE(`warehouse_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `live_sessions` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`stream_url` text,
	`thumbnail_url` text,
	`status` enum('scheduled','live','ended','cancelled') NOT NULL DEFAULT 'scheduled',
	`viewer_count` int NOT NULL DEFAULT 0,
	`scheduled_at` timestamp,
	`started_at` timestamp,
	`ended_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `live_sessions_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`sku` varchar(128) NOT NULL,
	`name` varchar(500) NOT NULL,
	`quantity` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`fulfillment_status` enum('unfulfilled','fulfilled','cancelled') NOT NULL DEFAULT 'unfulfilled',
	`platform_line_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`order_number` varchar(128) NOT NULL,
	`platform_order_id` varchar(255),
	`customer_name` varchar(255),
	`customer_email` varchar(320),
	`shipping_address` json,
	`billing_address` json,
	`subtotal` decimal(10,2) NOT NULL,
	`tax` decimal(10,2) NOT NULL DEFAULT '0.00',
	`shipping` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`payment_status` enum('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
	`fulfillment_status` enum('unfulfilled','partial','fulfilled') NOT NULL DEFAULT 'unfulfilled',
	`notes` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_order_number_idx` UNIQUE(`channel_id`,`order_number`)
);
--> statement-breakpoint
CREATE TABLE `pinned_products` (
	`id` varchar(64) NOT NULL,
	`live_session_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`live_price` decimal(10,2),
	`is_active` boolean NOT NULL DEFAULT false,
	`pinned_at` timestamp NOT NULL DEFAULT (now()),
	`unpinned_at` timestamp,
	`sales_count` int NOT NULL DEFAULT 0,
	`metadata` json,
	CONSTRAINT `pinned_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `print_jobs` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`task_id` varchar(64),
	`printer_name` varchar(255),
	`document_type` enum('label','pick_list','packing_slip','invoice') NOT NULL,
	`document_url` text,
	`status` enum('pending','printing','completed','failed') NOT NULL DEFAULT 'pending',
	`retry_count` int NOT NULL DEFAULT 0,
	`last_error` text,
	`printed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `print_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`sku` varchar(128) NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`compare_at_price` decimal(10,2),
	`cost` decimal(10,2),
	`image_url` text,
	`status` enum('active','draft','archived') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_sku_idx` UNIQUE(`channel_id`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `review_queue_items` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`type` varchar(128) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','acknowledged','resolved','closed') NOT NULL DEFAULT 'open',
	`sla_due_at` timestamp,
	`ref_type` varchar(128) NOT NULL,
	`ref_id` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`checklist` json,
	`metadata` json,
	`assigned_to` varchar(64),
	`created_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_queue_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`carrier` varchar(128),
	`service` varchar(128),
	`tracking_number` varchar(255),
	`tracking_url` text,
	`label_url` text,
	`status` enum('pending','label_created','picked_up','in_transit','delivered','failed') NOT NULL DEFAULT 'pending',
	`shipped_at` timestamp,
	`delivered_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipping_provider_accounts` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`provider` enum('sendle','auspost','aramex') NOT NULL,
	`label` varchar(255),
	`credentials_enc` text,
	`credentials_mask` json,
	`settings` json,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_provider_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouse_provider_idx` UNIQUE(`warehouse_id`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `variant_bin_mappings` (
	`id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`bin_id` varchar(64) NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variant_bin_mappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_bin_idx` UNIQUE(`product_id`,`bin_id`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` varchar(64) NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouses_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`zone_type` enum('pick','pack','storage','receiving') NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zones_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouse_code_idx` UNIQUE(`warehouse_id`,`code`)
);
--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bins` ADD CONSTRAINT `bins_zone_id_zones_id_fk` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_accounts` ADD CONSTRAINT `channel_accounts_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fulfillment_tasks` ADD CONSTRAINT `fulfillment_tasks_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fulfillment_tasks` ADD CONSTRAINT `fulfillment_tasks_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_sessions` ADD CONSTRAINT `live_sessions_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pinned_products` ADD CONSTRAINT `pinned_products_live_session_id_live_sessions_id_fk` FOREIGN KEY (`live_session_id`) REFERENCES `live_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pinned_products` ADD CONSTRAINT `pinned_products_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `print_jobs` ADD CONSTRAINT `print_jobs_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_queue_items` ADD CONSTRAINT `review_queue_items_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipping_provider_accounts` ADD CONSTRAINT `shipping_provider_accounts_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variant_bin_mappings` ADD CONSTRAINT `variant_bin_mappings_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variant_bin_mappings` ADD CONSTRAINT `variant_bin_mappings_bin_id_bins_id_fk` FOREIGN KEY (`bin_id`) REFERENCES `bins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zones` ADD CONSTRAINT `zones_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_warehouse_idx` ON `fulfillment_tasks` (`order_id`,`warehouse_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `fulfillment_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `platform_order_id_idx` ON `orders` (`platform_order_id`);