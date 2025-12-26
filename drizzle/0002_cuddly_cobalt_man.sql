CREATE TABLE `app_settings` (
	`id` varchar(64) NOT NULL,
	`setting_key` varchar(255) NOT NULL,
	`setting_value` json NOT NULL,
	`description` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_setting_key_unique` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `attribution_clicks` (
	`id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`product_id` varchar(64),
	`live_session_id` varchar(64),
	`clicked_at` timestamp NOT NULL DEFAULT (now()),
	`ip_address` varchar(45),
	`user_agent` text,
	`metadata` json,
	CONSTRAINT `attribution_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carrier_accounts` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`carrier` varchar(128) NOT NULL,
	`account_number` varchar(255),
	`credentials_enc` text,
	`settings` json,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrier_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_access_tokens` (
	`id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`token_hash` text NOT NULL,
	`label` varchar(255),
	`last_used_at` timestamp,
	`expires_at` timestamp,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_access_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_bank_accounts` (
	`id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`account_number` varchar(255) NOT NULL,
	`routing_number` varchar(255),
	`bank_name` varchar(255),
	`account_type` enum('checking','savings') NOT NULL DEFAULT 'checking',
	`status` enum('pending','verified','failed') NOT NULL DEFAULT 'pending',
	`verified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_payout_batches` (
	`id` varchar(64) NOT NULL,
	`batch_number` varchar(128) NOT NULL,
	`status` enum('draft','pending','processing','completed','failed') NOT NULL DEFAULT 'draft',
	`total_amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`processed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_payout_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `creator_payout_batches_batch_number_unique` UNIQUE(`batch_number`)
);
--> statement-breakpoint
CREATE TABLE `creator_payout_lines` (
	`id` varchar(64) NOT NULL,
	`batch_id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','paid','failed','held') NOT NULL DEFAULT 'pending',
	`paid_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_payout_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_tiers` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`min_sales` int NOT NULL,
	`max_sales` int,
	`commission_rate` decimal(5,2) NOT NULL,
	`bonus_rate` decimal(5,2),
	`perks` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creators` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`commission_rate` decimal(5,2),
	`tier_id` varchar(64),
	`social_links` json,
	`bank_account_id` varchar(64),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creators_id` PRIMARY KEY(`id`),
	CONSTRAINT `creators_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `fulfillment_events` (
	`id` varchar(64) NOT NULL,
	`task_id` varchar(64) NOT NULL,
	`event_type` varchar(128) NOT NULL,
	`event_data` json,
	`performed_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fulfillment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`incident_type` varchar(128) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','investigating','paused','resolved','closed') NOT NULL DEFAULT 'open',
	`title` varchar(500) NOT NULL,
	`description` text,
	`paused_at` timestamp,
	`resumed_at` timestamp,
	`resolved_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_adjustments` (
	`id` varchar(64) NOT NULL,
	`inventory_id` varchar(64) NOT NULL,
	`adjustment_type` enum('recount','damage','loss','found','correction') NOT NULL,
	`quantity_change` int NOT NULL,
	`reason` text,
	`performed_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_reservations` (
	`id` varchar(64) NOT NULL,
	`inventory_id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`quantity` int NOT NULL,
	`expires_at` timestamp,
	`status` enum('active','released','fulfilled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_script_nodes` (
	`id` varchar(64) NOT NULL,
	`script_id` varchar(64) NOT NULL,
	`node_type` varchar(64) NOT NULL,
	`content` text,
	`position` int NOT NULL,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_script_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_scripts` (
	`id` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications_outbox` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`notification_type` varchar(128) NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(500),
	`body` text NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp,
	`failure_reason` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_outbox_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_refunds` (
	`id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text,
	`status` enum('pending','approved','processed','failed') NOT NULL DEFAULT 'pending',
	`processed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_refunds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packing_session_items` (
	`id` varchar(64) NOT NULL,
	`session_id` varchar(64) NOT NULL,
	`order_item_id` varchar(64) NOT NULL,
	`scanned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packing_session_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packing_sessions` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `packing_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`url` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`alt_text` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`sku` varchar(128) NOT NULL,
	`name` varchar(500),
	`price` decimal(10,2),
	`cost` decimal(10,2),
	`image_url` text,
	`options` json,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` varchar(64) NOT NULL,
	`purchase_order_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`quantity` int NOT NULL,
	`unit_cost` decimal(10,2) NOT NULL,
	`total_cost` decimal(10,2) NOT NULL,
	`received_quantity` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchase_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` varchar(64) NOT NULL,
	`supplier_id` varchar(64) NOT NULL,
	`po_number` varchar(128) NOT NULL,
	`status` enum('draft','submitted','confirmed','shipped','received','cancelled') NOT NULL DEFAULT 'draft',
	`total_amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`expected_delivery_date` timestamp,
	`received_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_orders_po_number_unique` UNIQUE(`po_number`)
);
--> statement-breakpoint
CREATE TABLE `secrets` (
	`id` varchar(64) NOT NULL,
	`secret_key` varchar(255) NOT NULL,
	`secret_value_enc` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `secrets_id` PRIMARY KEY(`id`),
	CONSTRAINT `secrets_secret_key_unique` UNIQUE(`secret_key`)
);
--> statement-breakpoint
CREATE TABLE `settlement_lines` (
	`id` varchar(64) NOT NULL,
	`settlement_id` varchar(64) NOT NULL,
	`order_id` varchar(64),
	`line_type` varchar(128) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `settlement_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`platform` varchar(128) NOT NULL,
	`settlement_id` varchar(255) NOT NULL,
	`settlement_date` timestamp NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','reconciled','discrepancy') NOT NULL DEFAULT 'pending',
	`raw_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_settlement_idx` UNIQUE(`channel_id`,`settlement_id`)
);
--> statement-breakpoint
CREATE TABLE `staff_api_keys` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`key_hash` text NOT NULL,
	`label` varchar(255),
	`last_used_at` timestamp,
	`expires_at` timestamp,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_products` (
	`id` varchar(64) NOT NULL,
	`supplier_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`supplier_sku` varchar(128),
	`cost` decimal(10,2) NOT NULL,
	`lead_time_days` int,
	`moq` int DEFAULT 1,
	`status` enum('active','discontinued') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplier_product_idx` UNIQUE(`supplier_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact_email` varchar(320),
	`contact_phone` varchar(50),
	`address` text,
	`credit_score` decimal(5,2),
	`payment_terms` varchar(128),
	`status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`task_type` varchar(128) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`status` enum('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`assigned_to` varchar(64),
	`due_at` timestamp,
	`completed_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_users` MODIFY COLUMN `role` enum('founder','admin','ops','viewer') NOT NULL DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE `channel_accounts` MODIFY COLUMN `platform` enum('shopify','tiktok_shop','amazon','ebay','whatnot','custom') NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_users` ADD `capabilities` json;--> statement-breakpoint
ALTER TABLE `live_sessions` ADD `creator_id` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `live_session_id` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `attribution_window` int;--> statement-breakpoint
ALTER TABLE `products` ADD `metadata` json;--> statement-breakpoint
ALTER TABLE `attribution_clicks` ADD CONSTRAINT `attribution_clicks_creator_id_creators_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attribution_clicks` ADD CONSTRAINT `attribution_clicks_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attribution_clicks` ADD CONSTRAINT `attribution_clicks_live_session_id_live_sessions_id_fk` FOREIGN KEY (`live_session_id`) REFERENCES `live_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carrier_accounts` ADD CONSTRAINT `carrier_accounts_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_access_tokens` ADD CONSTRAINT `creator_access_tokens_creator_id_creators_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_bank_accounts` ADD CONSTRAINT `creator_bank_accounts_creator_id_creators_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_payout_lines` ADD CONSTRAINT `creator_payout_lines_batch_id_creator_payout_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `creator_payout_batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creator_payout_lines` ADD CONSTRAINT `creator_payout_lines_creator_id_creators_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fulfillment_events` ADD CONSTRAINT `fulfillment_events_task_id_fulfillment_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `fulfillment_tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_inventory_id_inventory_id_fk` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_reservations` ADD CONSTRAINT `inventory_reservations_inventory_id_inventory_id_fk` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `live_script_nodes` ADD CONSTRAINT `live_script_nodes_script_id_live_scripts_id_fk` FOREIGN KEY (`script_id`) REFERENCES `live_scripts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications_outbox` ADD CONSTRAINT `notifications_outbox_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_refunds` ADD CONSTRAINT `order_refunds_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packing_session_items` ADD CONSTRAINT `packing_session_items_session_id_packing_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `packing_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packing_session_items` ADD CONSTRAINT `packing_session_items_order_item_id_order_items_id_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packing_sessions` ADD CONSTRAINT `packing_sessions_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchase_order_id_purchase_orders_id_fk` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `settlement_lines` ADD CONSTRAINT `settlement_lines_settlement_id_settlements_id_fk` FOREIGN KEY (`settlement_id`) REFERENCES `settlements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `settlement_lines` ADD CONSTRAINT `settlement_lines_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `settlements` ADD CONSTRAINT `settlements_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_api_keys` ADD CONSTRAINT `staff_api_keys_user_id_admin_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_products` ADD CONSTRAINT `supplier_products_supplier_id_suppliers_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_products` ADD CONSTRAINT `supplier_products_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;