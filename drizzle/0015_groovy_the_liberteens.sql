CREATE TABLE `creator_bonuses` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`type` enum('MILESTONE','PERFORMANCE','REFERRAL','SEASONAL','MANUAL') NOT NULL,
	`status` enum('PENDING','APPROVED','PAID','CANCELED') NOT NULL DEFAULT 'PENDING',
	`title` varchar(255) NOT NULL,
	`description` text,
	`amount_cents` bigint NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`trigger_type` varchar(64),
	`trigger_value` json,
	`earned_at` timestamp,
	`paid_at` timestamp,
	`payout_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_payout_items` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`payout_id` varchar(64) NOT NULL,
	`ledger_txn_id` varchar(64),
	`ledger_entry_id` varchar(64),
	`reference_type` varchar(64) NOT NULL,
	`reference_id` varchar(64) NOT NULL,
	`description` text,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`amount_cents` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `creator_payout_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_payouts` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`status` enum('DRAFT','PENDING_APPROVAL','APPROVED','PROCESSING','PAID','FAILED','CANCELED','PENDING','COMPLETED','HELD') NOT NULL DEFAULT 'DRAFT',
	`method` enum('BANK_TRANSFER','PAYPAL','STRIPE_CONNECT','MANUAL','WISE') NOT NULL DEFAULT 'BANK_TRANSFER',
	`period_start` date NOT NULL,
	`period_end` date NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`gross_cents` bigint NOT NULL DEFAULT 0,
	`fees_cents` bigint NOT NULL DEFAULT 0,
	`adjustments_cents` bigint NOT NULL DEFAULT 0,
	`net_cents` bigint NOT NULL DEFAULT 0,
	`amount_cents` bigint,
	`fee_cents` bigint,
	`destination_ref` text,
	`payout_provider` varchar(64),
	`provider` varchar(64),
	`provider_payout_id` varchar(255),
	`provider_txn_id` varchar(255),
	`provider_status` varchar(64),
	`created_by` varchar(64),
	`approved_by` varchar(64),
	`approved_at` timestamp,
	`requested_at` timestamp,
	`paid_at` timestamp,
	`processed_at` timestamp,
	`hold_reason` text,
	`notes` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_transactions` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`source` enum('STRIPE','PAYPAL','SHOPIFY','TIKTOK_SHOP','BANK','WISE','OTHER') NOT NULL,
	`external_id` varchar(255) NOT NULL,
	`occurred_at` timestamp NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`amount_cents` bigint NOT NULL,
	`description` text,
	`raw` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_source_ext_idx` UNIQUE(`channel_id`,`source`,`external_id`)
);
--> statement-breakpoint
CREATE TABLE `ledger_accounts` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('ASSET','LIABILITY','INCOME','EXPENSE','EQUITY') NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ledger_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_code_idx` UNIQUE(`channel_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`txn_id` varchar(64) NOT NULL,
	`status` enum('PENDING','POSTED','REVERSED','VOID') NOT NULL DEFAULT 'POSTED',
	`account_id` varchar(64) NOT NULL,
	`direction` enum('DEBIT','CREDIT') NOT NULL,
	`amount_cents` bigint NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`entry_type` varchar(64),
	`ref_type` varchar(64) NOT NULL,
	`ref_id` varchar(64) NOT NULL,
	`debit_account` varchar(64),
	`credit_account` varchar(64),
	`counterparty_type` varchar(64),
	`counterparty_id` varchar(64),
	`description` text,
	`memo` text,
	`fx_rate` decimal(10,6),
	`base_currency` varchar(3),
	`base_amount_cents` bigint,
	`created_by` varchar(64),
	`posted_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `ledger_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lot_allocations` (
	`id` varchar(64) NOT NULL,
	`lot_id` varchar(64) NOT NULL,
	`order_id` varchar(64),
	`quantity` int NOT NULL,
	`allocated_at` timestamp NOT NULL DEFAULT (now()),
	`status` enum('reserved','committed','released') NOT NULL DEFAULT 'reserved',
	CONSTRAINT `lot_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_defects` (
	`id` varchar(64) NOT NULL,
	`inspection_id` varchar(64) NOT NULL,
	`defect_type` enum('critical','major','minor') NOT NULL,
	`description` text NOT NULL,
	`quantity` int NOT NULL,
	`image_urls` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_defects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_inspections` (
	`id` varchar(64) NOT NULL,
	`lot_id` varchar(64) NOT NULL,
	`inspector_id` varchar(64) NOT NULL,
	`inspection_date` timestamp NOT NULL,
	`sample_size` int NOT NULL,
	`aql_level` enum('0.65','1.0','1.5','2.5','4.0','6.5') NOT NULL DEFAULT '2.5',
	`defects_found` int NOT NULL DEFAULT 0,
	`defect_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`result` enum('pass','conditional_pass','fail') NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reconciliation_matches` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`status` enum('SUGGESTED','MATCHED','DISMISSED','UNMATCHED') NOT NULL DEFAULT 'SUGGESTED',
	`source` enum('STRIPE','PAYPAL','SHOPIFY','TIKTOK_SHOP','BANK','WISE','OTHER') NOT NULL,
	`external_transaction_id` varchar(64) NOT NULL,
	`provider_txn_id` varchar(64),
	`ledger_entry_id` varchar(64),
	`ledger_txn_id` varchar(64),
	`match_reason` text,
	`match_type` varchar(64),
	`match_confidence` decimal(5,2) NOT NULL DEFAULT '0.00',
	`confidence` decimal(5,2),
	`discrepancy_cents` bigint DEFAULT 0,
	`matched_by` varchar(64),
	`matched_at` timestamp,
	`notes` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reconciliation_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `creator_payout_items` ADD CONSTRAINT `creator_payout_items_payout_id_creator_payouts_id_fk` FOREIGN KEY (`payout_id`) REFERENCES `creator_payouts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lot_allocations` ADD CONSTRAINT `lot_allocations_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_defects` ADD CONSTRAINT `quality_defects_inspection_id_quality_inspections_id_fk` FOREIGN KEY (`inspection_id`) REFERENCES `quality_inspections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reconciliation_matches` ADD CONSTRAINT `reconciliation_matches_external_transaction_id_external_transactions_id_fk` FOREIGN KEY (`external_transaction_id`) REFERENCES `external_transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `channel_creator_idx` ON `creator_bonuses` (`channel_id`,`creator_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `creator_bonuses` (`channel_id`,`status`);--> statement-breakpoint
CREATE INDEX `payout_idx` ON `creator_payout_items` (`payout_id`);--> statement-breakpoint
CREATE INDEX `ref_idx` ON `creator_payout_items` (`channel_id`,`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `channel_creator_idx` ON `creator_payouts` (`channel_id`,`creator_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `channel_status_idx` ON `creator_payouts` (`channel_id`,`status`);--> statement-breakpoint
CREATE INDEX `period_idx` ON `creator_payouts` (`channel_id`,`period_start`,`period_end`);--> statement-breakpoint
CREATE INDEX `channel_time_idx` ON `external_transactions` (`channel_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `amount_idx` ON `external_transactions` (`channel_id`,`amount_cents`);--> statement-breakpoint
CREATE INDEX `channel_posted_idx` ON `ledger_entries` (`channel_id`,`posted_at`);--> statement-breakpoint
CREATE INDEX `channel_txn_idx` ON `ledger_entries` (`channel_id`,`txn_id`);--> statement-breakpoint
CREATE INDEX `ref_idx` ON `ledger_entries` (`channel_id`,`ref_type`,`ref_id`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `ledger_entries` (`channel_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `channel_status_idx` ON `reconciliation_matches` (`channel_id`,`status`);--> statement-breakpoint
CREATE INDEX `external_idx` ON `reconciliation_matches` (`external_transaction_id`);--> statement-breakpoint
CREATE INDEX `ledger_txn_idx` ON `reconciliation_matches` (`channel_id`,`ledger_txn_id`);