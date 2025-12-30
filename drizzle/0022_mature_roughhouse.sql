CREATE TABLE `xero_contacts` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`xero_contact_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`synced_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xero_contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `xero_contacts_xero_contact_id_unique` UNIQUE(`xero_contact_id`)
);
--> statement-breakpoint
CREATE TABLE `xero_invoices` (
	`id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`xero_invoice_id` varchar(255) NOT NULL,
	`invoice_number` varchar(255),
	`status` varchar(50) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`synced_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xero_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `xero_invoices_xero_invoice_id_unique` UNIQUE(`xero_invoice_id`)
);
--> statement-breakpoint
CREATE TABLE `xero_payments` (
	`id` varchar(64) NOT NULL,
	`xero_invoice_id` varchar(255) NOT NULL,
	`xero_payment_id` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`payment_date` timestamp NOT NULL,
	`reference` varchar(255),
	`synced_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xero_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `xero_payments_xero_payment_id_unique` UNIQUE(`xero_payment_id`)
);
--> statement-breakpoint
CREATE TABLE `xero_sync_logs` (
	`id` varchar(64) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` varchar(255) NOT NULL,
	`status` enum('SUCCESS','ERROR') NOT NULL,
	`error_message` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xero_sync_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `xero_tokens` (
	`id` varchar(64) NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`tenant_id` varchar(255),
	`tenant_name` varchar(255),
	`scopes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `xero_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `xero_contact_user_id_idx` ON `xero_contacts` (`user_id`);--> statement-breakpoint
CREATE INDEX `xero_invoice_order_id_idx` ON `xero_invoices` (`order_id`);--> statement-breakpoint
CREATE INDEX `xero_payment_invoice_id_idx` ON `xero_payments` (`xero_invoice_id`);--> statement-breakpoint
CREATE INDEX `xero_sync_entity_type_idx` ON `xero_sync_logs` (`entity_type`);--> statement-breakpoint
CREATE INDEX `xero_sync_status_idx` ON `xero_sync_logs` (`status`);--> statement-breakpoint
CREATE INDEX `xero_tenant_id_idx` ON `xero_tokens` (`tenant_id`);