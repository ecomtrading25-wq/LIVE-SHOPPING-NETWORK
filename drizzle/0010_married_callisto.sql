CREATE TABLE `blocked_entities` (
	`id` varchar(64) NOT NULL,
	`entity_type` enum('user','ip','email','card_bin') NOT NULL,
	`entity_value` varchar(255) NOT NULL,
	`reason` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blocked_entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `entity_idx` UNIQUE(`entity_type`,`entity_value`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`code` varchar(3) NOT NULL,
	`name` varchar(100) NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`decimal_places` int NOT NULL DEFAULT 2,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `currencies_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `customer_satisfaction` (
	`id` varchar(64) NOT NULL,
	`ticket_id` varchar(64) NOT NULL,
	`customer_id` varchar(64) NOT NULL,
	`rating` int,
	`feedback` text,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	`responded_at` timestamp,
	CONSTRAINT `customer_satisfaction_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` varchar(64) NOT NULL,
	`from_currency` varchar(3) NOT NULL,
	`to_currency` varchar(3) NOT NULL,
	`rate` decimal(18,8) NOT NULL,
	`last_updated` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchange_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `currency_pair_idx` UNIQUE(`from_currency`,`to_currency`)
);
--> statement-breakpoint
CREATE TABLE `fraud_checks` (
	`id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`risk_score` int NOT NULL,
	`risk_level` enum('low','medium','high','critical') NOT NULL,
	`decision` enum('approve','review','decline') NOT NULL,
	`reasons` json,
	`checks` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fraud_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transfers` (
	`id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`from_warehouse_id` varchar(64) NOT NULL,
	`to_warehouse_id` varchar(64) NOT NULL,
	`quantity` int NOT NULL,
	`reason` text,
	`status` enum('pending','in_transit','completed','cancelled') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `inventory_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base` (
	`id` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`tags` json,
	`views` int NOT NULL DEFAULT 0,
	`helpful` int NOT NULL DEFAULT 0,
	`not_helpful` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `macro_responses` (
	`id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`auto_close` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `macro_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packing_stations` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('available','busy','offline') NOT NULL DEFAULT 'available',
	`assigned_to` varchar(64),
	`current_order_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packing_stations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` varchar(64) NOT NULL,
	`user_id` varchar(64) NOT NULL,
	`type` enum('card','bank_account','paypal','other') NOT NULL,
	`last4` varchar(4) NOT NULL,
	`brand` varchar(50),
	`expiry_month` int,
	`expiry_year` int,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picking_tasks` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`wave_id` varchar(64),
	`assigned_to` varchar(64),
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`items` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `picking_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regional_pricing` (
	`id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`region` varchar(10) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`base_price` decimal(10,2) NOT NULL,
	`sale_price` decimal(10,2),
	`tax_included` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regional_pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_region_idx` UNIQUE(`product_id`,`region`)
);
--> statement-breakpoint
CREATE TABLE `risk_scores` (
	`id` varchar(64) NOT NULL,
	`entity_type` enum('user','order','ip','device') NOT NULL,
	`entity_id` varchar(64) NOT NULL,
	`score` int NOT NULL,
	`factors` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risk_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `entity_idx` UNIQUE(`entity_type`,`entity_id`)
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` varchar(64) NOT NULL,
	`type` enum('login_attempt','password_change','suspicious_activity','fraud_detected','account_takeover') NOT NULL,
	`user_id` varchar(64),
	`ip_address` varchar(45) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`details` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipping_labels` (
	`id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`carrier` varchar(100) NOT NULL,
	`service` varchar(100) NOT NULL,
	`tracking_number` varchar(255) NOT NULL,
	`label_url` text NOT NULL,
	`weight` decimal(10,2),
	`cost` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipping_labels_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipping_labels_tracking_number_unique` UNIQUE(`tracking_number`)
);
--> statement-breakpoint
CREATE TABLE `shipping_zones` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`countries` json NOT NULL,
	`regions` json,
	`carriers` json NOT NULL,
	`rates` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_agents` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('available','busy','offline') NOT NULL DEFAULT 'available',
	`specialties` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_agents_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` varchar(64) NOT NULL,
	`customer_id` varchar(64) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`category` varchar(100) NOT NULL,
	`channel` enum('email','chat','phone','social','web') NOT NULL,
	`assigned_to` varchar(64),
	`tags` json,
	`order_id` varchar(64),
	`first_response_time` int,
	`resolution_time` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolved_at` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_rates` (
	`id` varchar(64) NOT NULL,
	`country` varchar(2) NOT NULL,
	`region` varchar(100),
	`tax_type` enum('VAT','GST','sales_tax','customs') NOT NULL,
	`rate` decimal(5,2) NOT NULL,
	`threshold` decimal(10,2),
	`include_in_price` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tax_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` varchar(64) NOT NULL,
	`ticket_id` varchar(64) NOT NULL,
	`sender_id` varchar(64) NOT NULL,
	`sender_type` enum('customer','agent','system') NOT NULL,
	`content` text NOT NULL,
	`attachments` json,
	`is_internal` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` varchar(64) NOT NULL,
	`key` varchar(255) NOT NULL,
	`language` varchar(10) NOT NULL,
	`value` text NOT NULL,
	`context` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `translations_id` PRIMARY KEY(`id`),
	CONSTRAINT `key_language_idx` UNIQUE(`key`,`language`)
);
--> statement-breakpoint
CREATE TABLE `warehouse_inventory` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`zone_id` varchar(64),
	`bin_location` varchar(100),
	`quantity` int NOT NULL DEFAULT 0,
	`reserved` int NOT NULL DEFAULT 0,
	`reorder_point` int DEFAULT 0,
	`reorder_quantity` int DEFAULT 0,
	`last_counted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouse_inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouse_product_idx` UNIQUE(`warehouse_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `warehouse_staff` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('picker','packer','receiver','manager') NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warehouse_staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warehouse_zones` (
	`id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('receiving','storage','picking','packing','shipping','returns') NOT NULL,
	`capacity` int NOT NULL DEFAULT 0,
	`current_load` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warehouse_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customer_satisfaction` ADD CONSTRAINT `customer_satisfaction_ticket_id_support_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_from_warehouse_id_warehouses_id_fk` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_transfers` ADD CONSTRAINT `inventory_transfers_to_warehouse_id_warehouses_id_fk` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packing_stations` ADD CONSTRAINT `packing_stations_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `picking_tasks` ADD CONSTRAINT `picking_tasks_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_ticket_id_support_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warehouse_inventory` ADD CONSTRAINT `warehouse_inventory_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warehouse_staff` ADD CONSTRAINT `warehouse_staff_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warehouse_zones` ADD CONSTRAINT `warehouse_zones_warehouse_id_warehouses_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_idx` ON `fraud_checks` (`order_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `fraud_checks` (`user_id`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `knowledge_base` (`category`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `payment_methods` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `security_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `security_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `support_tickets` (`customer_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `support_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `country_region_idx` ON `tax_rates` (`country`,`region`);--> statement-breakpoint
CREATE INDEX `ticket_idx` ON `ticket_messages` (`ticket_id`);