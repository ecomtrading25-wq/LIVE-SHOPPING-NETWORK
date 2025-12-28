CREATE TABLE `paypal_disputes` (
	`id` varchar(36) NOT NULL,
	`paypal_dispute_id` varchar(255) NOT NULL,
	`reason` varchar(100),
	`status` varchar(50),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`outcome` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `paypal_disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paypal_payouts` (
	`id` varchar(36) NOT NULL,
	`paypal_batch_id` varchar(255) NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`status` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `paypal_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paypal_subscriptions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`paypal_subscription_id` varchar(255) NOT NULL,
	`plan_id` varchar(255) NOT NULL,
	`status` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`cancelled_at` timestamp,
	CONSTRAINT `paypal_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paypal_transactions` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36),
	`paypal_order_id` varchar(255),
	`paypal_transaction_id` varchar(255),
	`authorization_id` varchar(255),
	`status` varchar(50),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`created_at` timestamp DEFAULT (now()),
	`captured_at` timestamp,
	`refunded_at` timestamp,
	CONSTRAINT `paypal_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paypal_webhook_events` (
	`id` varchar(36) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`resource_type` varchar(100),
	`resource_id` varchar(255),
	`payload` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `paypal_webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_calculations` (
	`id` varchar(36) NOT NULL,
	`customer_id` varchar(36),
	`country` varchar(2) NOT NULL,
	`state` varchar(10),
	`amount` decimal(10,2) NOT NULL,
	`tax_rate` decimal(5,2) NOT NULL,
	`tax_amount` decimal(10,2) NOT NULL,
	`tax_type` varchar(50),
	`breakdown` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `tax_calculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_exemptions` (
	`id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`country` varchar(2) NOT NULL,
	`exemption_type` varchar(50) NOT NULL,
	`certificate_number` varchar(100) NOT NULL,
	`expiry_date` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `tax_exemptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wise_balances` (
	`id` varchar(36) NOT NULL,
	`profile_id` varchar(255) NOT NULL,
	`balance_id` varchar(255) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`reserved_amount` decimal(15,2) DEFAULT '0',
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `wise_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wise_recipients` (
	`id` varchar(36) NOT NULL,
	`wise_recipient_id` varchar(255) NOT NULL,
	`account_holder_name` varchar(255) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`type` varchar(50),
	`email` varchar(255),
	`iban` varchar(50),
	`account_number` varchar(50),
	`country` varchar(2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `wise_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wise_transfers` (
	`id` varchar(36) NOT NULL,
	`wise_transfer_id` varchar(255) NOT NULL,
	`recipient_id` varchar(255) NOT NULL,
	`quote_id` varchar(255) NOT NULL,
	`status` varchar(50),
	`source_amount` decimal(10,2) NOT NULL,
	`source_currency` varchar(3) NOT NULL,
	`target_amount` decimal(10,2) NOT NULL,
	`target_currency` varchar(3) NOT NULL,
	`reference` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `wise_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wise_webhook_events` (
	`id` varchar(36) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`resource_type` varchar(100),
	`resource_id` varchar(255),
	`payload` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `wise_webhook_events_id` PRIMARY KEY(`id`)
);
