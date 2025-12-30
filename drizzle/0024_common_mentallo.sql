CREATE TABLE `arbitrage_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_name` varchar(500) NOT NULL,
	`supplier_url` varchar(1000) NOT NULL,
	`supplier_name` varchar(255) NOT NULL,
	`supplier_price` decimal(10,2) NOT NULL,
	`suggested_retail_price` decimal(10,2) NOT NULL,
	`estimated_shipping` decimal(10,2),
	`marketplace_fees` decimal(10,2),
	`profit_margin` decimal(5,2) NOT NULL,
	`estimated_profit` decimal(10,2) NOT NULL,
	`competitor_count` int,
	`avg_competitor_price` decimal(10,2),
	`supplier_rating` decimal(3,2),
	`supplier_orders` int,
	`images` json,
	`category` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`score` int,
	`notes` text,
	`discovered_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`listed_at` timestamp,
	CONSTRAINT `arbitrage_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_name` varchar(255) NOT NULL,
	`job_type` varchar(100) NOT NULL,
	`schedule` varchar(100) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`last_run_at` timestamp,
	`last_run_status` varchar(50),
	`last_run_duration` int,
	`last_run_error` text,
	`next_run_at` timestamp,
	`run_count` int NOT NULL DEFAULT 0,
	`success_count` int NOT NULL DEFAULT 0,
	`failure_count` int NOT NULL DEFAULT 0,
	`config` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_jobs_job_name_unique` UNIQUE(`job_name`)
);
--> statement-breakpoint
CREATE TABLE `customer_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiry_id` varchar(255) NOT NULL,
	`order_id` varchar(255),
	`customer_email` varchar(255) NOT NULL,
	`customer_name` varchar(255),
	`subject` varchar(500),
	`message` text NOT NULL,
	`category` varchar(100),
	`priority` varchar(20) NOT NULL DEFAULT 'medium',
	`status` varchar(50) NOT NULL DEFAULT 'open',
	`assigned_to` varchar(255),
	`auto_responded` boolean NOT NULL DEFAULT false,
	`response_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `customer_inquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_inquiries_inquiry_id_unique` UNIQUE(`inquiry_id`)
);
--> statement-breakpoint
CREATE TABLE `customer_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiry_id` varchar(255) NOT NULL,
	`response_type` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`sent_by` varchar(255),
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_date` timestamp NOT NULL,
	`total_orders` int NOT NULL DEFAULT 0,
	`total_revenue` decimal(12,2) NOT NULL DEFAULT '0',
	`total_costs` decimal(12,2) NOT NULL DEFAULT '0',
	`total_profit` decimal(12,2) NOT NULL DEFAULT '0',
	`profit_margin` decimal(5,2),
	`avg_order_value` decimal(10,2),
	`top_products` json,
	`new_opportunities` int NOT NULL DEFAULT 0,
	`active_alerts` int NOT NULL DEFAULT 0,
	`customer_inquiries` int NOT NULL DEFAULT 0,
	`report_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_reports_report_date_unique` UNIQUE(`report_date`)
);
--> statement-breakpoint
CREATE TABLE `inventory_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`product_name` varchar(500) NOT NULL,
	`alert_type` varchar(50) NOT NULL,
	`current_stock` int NOT NULL,
	`supplier_stock` int,
	`message` text,
	`severity` varchar(20) NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_execution_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`job_name` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL,
	`started_at` timestamp NOT NULL,
	`completed_at` timestamp,
	`duration` int,
	`records_processed` int,
	`error_message` text,
	`execution_data` json,
	CONSTRAINT `job_execution_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`old_price` decimal(10,2) NOT NULL,
	`new_price` decimal(10,2) NOT NULL,
	`supplier_price` decimal(10,2),
	`change_reason` varchar(255),
	`change_percentage` decimal(5,2),
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tiktok_order_id` varchar(255) NOT NULL,
	`supplier_order_id` varchar(255),
	`supplier_name` varchar(255) NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`cost` decimal(10,2) NOT NULL,
	`shipping_cost` decimal(10,2),
	`tracking_number` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`order_url` varchar(1000),
	`estimated_delivery` timestamp,
	`actual_delivery` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tiktok_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shop_id` varchar(255) NOT NULL,
	`shop_name` varchar(255),
	`access_token` text NOT NULL,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`webhook_url` varchar(1000),
	`webhook_secret` varchar(255),
	`api_region` varchar(50) NOT NULL DEFAULT 'US',
	`is_active` boolean NOT NULL DEFAULT true,
	`last_synced_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tiktok_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `tiktok_credentials_shop_id_unique` UNIQUE(`shop_id`)
);
--> statement-breakpoint
CREATE TABLE `tiktok_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`order_status` varchar(50) NOT NULL,
	`buyer_email` varchar(255),
	`buyer_name` varchar(255),
	`shipping_address` json,
	`items` json NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) DEFAULT 'USD',
	`payment_status` varchar(50) NOT NULL,
	`webhook_timestamp` timestamp NOT NULL,
	`raw_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tiktok_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `tiktok_orders_order_id_unique` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `tiktok_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`name` varchar(500) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`compare_at_price` decimal(10,2),
	`stock_quantity` int NOT NULL DEFAULT 0,
	`sku` varchar(255),
	`images` json,
	`category` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`supplier_url` varchar(1000),
	`supplier_price` decimal(10,2),
	`supplier_name` varchar(255),
	`profit_margin` decimal(5,2),
	`last_synced_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tiktok_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `tiktok_products_product_id_unique` UNIQUE(`product_id`)
);
--> statement-breakpoint
CREATE INDEX `status_idx` ON `arbitrage_opportunities` (`status`);--> statement-breakpoint
CREATE INDEX `profit_margin_idx` ON `arbitrage_opportunities` (`profit_margin`);--> statement-breakpoint
CREATE INDEX `score_idx` ON `arbitrage_opportunities` (`score`);--> statement-breakpoint
CREATE INDEX `job_name_idx` ON `automation_jobs` (`job_name`);--> statement-breakpoint
CREATE INDEX `enabled_idx` ON `automation_jobs` (`enabled`);--> statement-breakpoint
CREATE INDEX `next_run_at_idx` ON `automation_jobs` (`next_run_at`);--> statement-breakpoint
CREATE INDEX `inquiry_id_idx` ON `customer_inquiries` (`inquiry_id`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `customer_inquiries` (`order_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `customer_inquiries` (`status`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `customer_inquiries` (`priority`);--> statement-breakpoint
CREATE INDEX `inquiry_id_idx` ON `customer_responses` (`inquiry_id`);--> statement-breakpoint
CREATE INDEX `report_date_idx` ON `daily_reports` (`report_date`);--> statement-breakpoint
CREATE INDEX `product_id_idx` ON `inventory_alerts` (`product_id`);--> statement-breakpoint
CREATE INDEX `alert_type_idx` ON `inventory_alerts` (`alert_type`);--> statement-breakpoint
CREATE INDEX `resolved_idx` ON `inventory_alerts` (`resolved`);--> statement-breakpoint
CREATE INDEX `job_id_idx` ON `job_execution_logs` (`job_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `job_execution_logs` (`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `job_execution_logs` (`started_at`);--> statement-breakpoint
CREATE INDEX `product_id_idx` ON `price_history` (`product_id`);--> statement-breakpoint
CREATE INDEX `changed_at_idx` ON `price_history` (`changed_at`);--> statement-breakpoint
CREATE INDEX `tiktok_order_id_idx` ON `supplier_orders` (`tiktok_order_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `supplier_orders` (`status`);--> statement-breakpoint
CREATE INDEX `supplier_name_idx` ON `supplier_orders` (`supplier_name`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `tiktok_orders` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `tiktok_orders` (`order_status`);--> statement-breakpoint
CREATE INDEX `payment_status_idx` ON `tiktok_orders` (`payment_status`);--> statement-breakpoint
CREATE INDEX `product_id_idx` ON `tiktok_products` (`product_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `tiktok_products` (`status`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `tiktok_products` (`category`);