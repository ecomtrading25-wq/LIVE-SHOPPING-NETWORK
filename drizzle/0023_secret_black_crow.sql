CREATE TABLE `bos_ledger_accounts` (
	`id` varchar(64) NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`org_unit_id` varchar(64) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`balance` decimal(20,4) NOT NULL DEFAULT '0',
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bos_ledger_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bos_ledger_accounts_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `bos_ledger_entries` (
	`id` varchar(64) NOT NULL,
	`transaction_id` varchar(64) NOT NULL,
	`account_id` varchar(64) NOT NULL,
	`type` enum('debit','credit') NOT NULL,
	`amount` decimal(20,4) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`description` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bos_ledger_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `transaction_idx` ON `bos_ledger_entries` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `bos_ledger_entries` (`account_id`);