CREATE TABLE `lsn_disputes` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`provider` varchar(64) NOT NULL DEFAULT 'PAYPAL',
	`provider_case_id` varchar(255) NOT NULL,
	`provider_status` varchar(64),
	`order_id` varchar(64),
	`creator_id` varchar(64),
	`status` enum('OPEN','EVIDENCE_REQUIRED','EVIDENCE_BUILDING','EVIDENCE_READY','SUBMITTED','WON','LOST','CLOSED','NEEDS_MANUAL','DUPLICATE','CANCELED') NOT NULL DEFAULT 'OPEN',
	`reason` text,
	`amount_cents` bigint NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`evidence_deadline` timestamp,
	`last_provider_update_at` timestamp,
	`evidence_pack_id` varchar(64),
	`needs_manual` boolean NOT NULL DEFAULT false,
	`last_error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lsn_disputes_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_provider_case_idx` UNIQUE(`channel_id`,`provider`,`provider_case_id`)
);
--> statement-breakpoint
CREATE INDEX `disputes_status_idx` ON `lsn_disputes` (`status`);--> statement-breakpoint
CREATE INDEX `disputes_evidence_deadline_idx` ON `lsn_disputes` (`evidence_deadline`);