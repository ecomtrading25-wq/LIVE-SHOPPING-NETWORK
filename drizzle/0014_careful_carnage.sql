CREATE TABLE `broadcast_channels` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`stream_key` varchar(255),
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`settings` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broadcast_channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `broadcast_channels_slug_idx` UNIQUE(`channel_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`bundle_type` enum('FIXED','MIX_AND_MATCH') NOT NULL,
	`items` json,
	`price_cents` bigint NOT NULL,
	`compare_price_cents` bigint,
	`savings_percent` decimal(5,2),
	`status` enum('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bundles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creative_assets` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`asset_type` enum('VIDEO_CLIP','IMAGE','HOOK','UGC','AD_CREATIVE','THUMBNAIL','CLAIMS_PROOF') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`url` text NOT NULL,
	`thumbnail_url` text,
	`mime_type` varchar(128),
	`file_size_bytes` bigint,
	`duration_seconds` int,
	`product_ids` json,
	`live_session_id` varchar(64),
	`tags` json,
	`performance_metrics` json,
	`status` enum('DRAFT','READY','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`created_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creative_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_availability` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` varchar(5) NOT NULL,
	`end_time` varchar(5) NOT NULL,
	`is_recurring` boolean NOT NULL DEFAULT true,
	`specific_date` timestamp,
	`is_available` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dispute_timeline` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`dispute_id` varchar(64) NOT NULL,
	`kind` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`meta` json NOT NULL DEFAULT ('{}'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dispute_timeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalations` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
	`status` enum('OPEN','ACKED','CLOSED') NOT NULL DEFAULT 'OPEN',
	`session_id` varchar(64),
	`trigger_type` varchar(128) NOT NULL,
	`trigger_json` json,
	`ack_by_user_id` varchar(64),
	`ack_ts` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_packs` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`dispute_id` varchar(64) NOT NULL,
	`status` enum('BUILDING','READY','SUBMITTED','FAILED') NOT NULL DEFAULT 'BUILDING',
	`tracking_number` varchar(255),
	`tracking_url` text,
	`delivery_proof` json,
	`product_description` text,
	`customer_communication` json,
	`refund_policy` text,
	`terms_of_service` text,
	`attachments` json,
	`submitted_at` timestamp,
	`submitted_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_packs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executive_metrics` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`metric_date` timestamp NOT NULL,
	`gmv_cents` bigint NOT NULL DEFAULT 0,
	`net_profit_cents` bigint NOT NULL DEFAULT 0,
	`cash_position_cents` bigint NOT NULL DEFAULT 0,
	`reserves_cents` bigint NOT NULL DEFAULT 0,
	`trust_health_score` decimal(5,2),
	`ops_health_score` decimal(5,2),
	`active_orders` int NOT NULL DEFAULT 0,
	`active_disputes` int NOT NULL DEFAULT 0,
	`pending_refunds` int NOT NULL DEFAULT 0,
	`live_shows_count` int NOT NULL DEFAULT 0,
	`active_creators` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executive_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `executive_metrics_channel_date_idx` UNIQUE(`channel_id`,`metric_date`)
);
--> statement-breakpoint
CREATE TABLE `fraud_scores` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`score` int NOT NULL,
	`risk_level` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`outcome` enum('ALLOW','REVIEW','HOLD_PAYOUT','BLOCK') NOT NULL,
	`signals` json,
	`velocity_check` json,
	`device_fingerprint` varchar(255),
	`ip_address` varchar(45),
	`ip_reputation` int,
	`geo_location` json,
	`address_match` boolean,
	`account_age` int,
	`order_value_anomaly` boolean,
	`blacklist_match` boolean,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fraud_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hooks_library` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`hook_text` text NOT NULL,
	`category` varchar(128),
	`product_category` varchar(128),
	`performance_score` decimal(5,2),
	`usage_count` int NOT NULL DEFAULT 0,
	`conversion_rate` decimal(5,2),
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hooks_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`channel_id` varchar(64) NOT NULL,
	`scope` varchar(64) NOT NULL,
	`idem_key` varchar(255) NOT NULL,
	`request_hash` varchar(255) NOT NULL,
	`result` json NOT NULL DEFAULT ('{}'),
	`status` enum('IN_PROGRESS','COMPLETED','FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `idempotency_keys_pk` UNIQUE(`channel_id`,`scope`,`idem_key`)
);
--> statement-breakpoint
CREATE TABLE `inventory_lots` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`variant_id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`lot_number` varchar(128) NOT NULL,
	`purchase_order_id` varchar(64),
	`supplier_id` varchar(64),
	`quantity_received` int NOT NULL,
	`quantity_available` int NOT NULL,
	`quantity_reserved` int NOT NULL DEFAULT 0,
	`quantity_allocated` int NOT NULL DEFAULT 0,
	`unit_cost_cents` bigint NOT NULL,
	`landed_cost_cents` bigint NOT NULL,
	`shipping_cost_cents` bigint NOT NULL DEFAULT 0,
	`duty_cost_cents` bigint NOT NULL DEFAULT 0,
	`other_cost_cents` bigint NOT NULL DEFAULT 0,
	`received_at` timestamp NOT NULL,
	`expires_at` timestamp,
	`status` enum('ACTIVE','DEPLETED','EXPIRED','QUARANTINED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_lots_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_lots_lot_number_idx` UNIQUE(`channel_id`,`lot_number`)
);
--> statement-breakpoint
CREATE TABLE `launch_checklists` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`trend_id` varchar(64),
	`status` enum('IN_PROGRESS','COMPLETED','BLOCKED') NOT NULL DEFAULT 'IN_PROGRESS',
	`target_launch_date` timestamp,
	`actual_launch_date` timestamp,
	`checklistItems` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_checklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_highlights` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`live_session_id` varchar(64) NOT NULL,
	`timestamp_seconds` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`clip_url` text,
	`clip_status` enum('PENDING','PROCESSING','READY','FAILED') NOT NULL DEFAULT 'PENDING',
	`product_ids` json,
	`view_count` int NOT NULL DEFAULT 0,
	`share_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_highlights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_price_drops` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`live_session_id` varchar(64) NOT NULL,
	`variant_id` varchar(64) NOT NULL,
	`original_price_cents` bigint NOT NULL,
	`drop_price_cents` bigint NOT NULL,
	`discount_percent` decimal(5,2) NOT NULL,
	`started_at` timestamp NOT NULL,
	`ends_at` timestamp NOT NULL,
	`quantity_limit` int,
	`quantity_sold` int NOT NULL DEFAULT 0,
	`status` enum('SCHEDULED','ACTIVE','ENDED','CANCELED') NOT NULL DEFAULT 'SCHEDULED',
	`urgency_message` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_price_drops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_show_segments` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`live_session_id` varchar(64) NOT NULL,
	`segment_type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_offset_seconds` int NOT NULL,
	`duration_seconds` int,
	`product_ids` json,
	`script_notes` text,
	`actual_started_at` timestamp,
	`actual_ended_at` timestamp,
	`performance_metrics` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_show_segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `payout_holds` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`creator_id` varchar(64) NOT NULL,
	`order_id` varchar(64),
	`reason` varchar(255) NOT NULL,
	`hold_type` enum('FRAUD','DISPUTE','MANUAL','POLICY') NOT NULL,
	`amount_cents` bigint NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('ACTIVE','RELEASED','FORFEITED') NOT NULL DEFAULT 'ACTIVE',
	`released_at` timestamp,
	`released_by` varchar(64),
	`release_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payout_holds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policy_incidents` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`session_id` varchar(64),
	`rule_id` varchar(128) NOT NULL,
	`severity` enum('INFO','WARNING','ERROR','CRITICAL') NOT NULL DEFAULT 'INFO',
	`text_excerpt` text,
	`action_taken` varchar(255),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `policy_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_book_entries` (
	`id` varchar(64) NOT NULL,
	`price_book_id` varchar(64) NOT NULL,
	`variant_id` varchar(64) NOT NULL,
	`price_cents` bigint NOT NULL,
	`compare_price_cents` bigint,
	`cost_cents` bigint,
	`margin_percent` decimal(5,2),
	`min_price_cents` bigint,
	`max_price_cents` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_book_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `price_book_entries_book_variant_idx` UNIQUE(`price_book_id`,`variant_id`)
);
--> statement-breakpoint
CREATE TABLE `price_books` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`effective_from` timestamp,
	`effective_to` timestamp,
	`created_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `price_books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`code` varchar(64),
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('PERCENTAGE','FIXED_AMOUNT','FREE_SHIPPING','BOGO','BUNDLE') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`min_order_cents` bigint,
	`max_discount_cents` bigint,
	`usage_limit` int,
	`usage_count` int NOT NULL DEFAULT 0,
	`per_customer_limit` int,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`status` enum('DRAFT','ACTIVE','PAUSED','EXPIRED') NOT NULL DEFAULT 'DRAFT',
	`applies_to` json,
	`excludes` json,
	`stackable` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotions_code_idx` UNIQUE(`channel_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `provider_transactions` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`provider_txn_id` varchar(255) NOT NULL,
	`txn_type` varchar(64) NOT NULL,
	`amount_cents` bigint NOT NULL,
	`currency` varchar(3) NOT NULL,
	`fee_cents` bigint NOT NULL DEFAULT 0,
	`net_cents` bigint NOT NULL,
	`status` varchar(64) NOT NULL,
	`provider_data` json,
	`matched_order_id` varchar(64),
	`matched_payout_id` varchar(64),
	`match_status` enum('UNMATCHED','AUTO_MATCHED','MANUAL_MATCHED','DISCREPANCY') NOT NULL DEFAULT 'UNMATCHED',
	`matched_at` timestamp,
	`matched_by` varchar(64),
	`provider_created_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_txn_idx` UNIQUE(`channel_id`,`provider`,`provider_txn_id`)
);
--> statement-breakpoint
CREATE TABLE `provider_webhook_dedup` (
	`channel_id` varchar(64) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`event_id` varchar(255) NOT NULL,
	`received_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provider_webhook_dedup_pk` UNIQUE(`channel_id`,`provider`,`event_id`)
);
--> statement-breakpoint
CREATE TABLE `receiving_workflows` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`purchase_order_id` varchar(64) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`status` enum('EXPECTED','ARRIVED','INSPECTING','COMPLETED','DISCREPANCY','REJECTED') NOT NULL DEFAULT 'EXPECTED',
	`expected_at` timestamp,
	`arrived_at` timestamp,
	`completed_at` timestamp,
	`received_by` varchar(64),
	`inspected_by` varchar(64),
	`discrepancies` json,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receiving_workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reconciliation_discrepancies` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`type` varchar(64) NOT NULL,
	`severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
	`description` text NOT NULL,
	`provider_txn_id` varchar(64),
	`order_id` varchar(64),
	`expected_cents` bigint,
	`actual_cents` bigint,
	`difference_cents` bigint,
	`status` enum('OPEN','INVESTIGATING','RESOLVED','ACCEPTED') NOT NULL DEFAULT 'OPEN',
	`resolved_at` timestamp,
	`resolved_by` varchar(64),
	`resolution` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reconciliation_discrepancies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refund_policies` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`rules` json,
	`auto_approve_threshold_cents` bigint,
	`requires_rma` boolean NOT NULL DEFAULT false,
	`restocking_fee_percent` decimal(5,2),
	`return_window_days` int NOT NULL DEFAULT 30,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refund_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `region_configs` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`region_code` varchar(8) NOT NULL,
	`region_name` varchar(255) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`language` varchar(8) NOT NULL,
	`tax_rate` decimal(5,2),
	`shipping_rules` json,
	`compliance_rules` json,
	`payment_methods` json,
	`status` enum('ACTIVE','COMING_SOON','DISABLED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `region_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `region_configs_region_code_idx` UNIQUE(`channel_id`,`region_code`)
);
--> statement-breakpoint
CREATE TABLE `regional_inventory` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`variant_id` varchar(64) NOT NULL,
	`region_code` varchar(8) NOT NULL,
	`warehouse_id` varchar(64) NOT NULL,
	`quantity_available` int NOT NULL DEFAULT 0,
	`quantity_reserved` int NOT NULL DEFAULT 0,
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regional_inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `regional_inventory_variant_region_idx` UNIQUE(`variant_id`,`region_code`)
);
--> statement-breakpoint
CREATE TABLE `regression_seeds` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`session_id` varchar(64),
	`chat_event_id` varchar(64),
	`rule_id` varchar(128),
	`text_excerpt` text NOT NULL,
	`status` enum('OPEN','APPROVED','REJECTED') NOT NULL DEFAULT 'OPEN',
	`requested_by` varchar(64),
	`decided_by` varchar(64),
	`decided_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regression_seeds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `return_requests` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`order_item_id` varchar(64) NOT NULL,
	`customer_id` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`reason_details` text,
	`status` enum('REQUESTED','APPROVED','RMA_ISSUED','IN_TRANSIT','RECEIVED','INSPECTING','APPROVED_FOR_REFUND','RESTOCKED','REFUNDED','REJECTED','CANCELED') NOT NULL DEFAULT 'REQUESTED',
	`rma_number` varchar(64),
	`return_label_url` text,
	`tracking_number` varchar(255),
	`received_at` timestamp,
	`inspected_at` timestamp,
	`inspected_by` varchar(64),
	`inspection_notes` text,
	`inspection_result` enum('PASS','FAIL','PARTIAL'),
	`restocking_fee_cents` bigint NOT NULL DEFAULT 0,
	`refund_amount_cents` bigint,
	`refunded_at` timestamp,
	`policy_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `return_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `return_requests_rma_idx` UNIQUE(`rma_number`)
);
--> statement-breakpoint
CREATE TABLE `schedule_slots` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`broadcast_channel_id` varchar(64) NOT NULL,
	`creator_id` varchar(64),
	`start_time` timestamp NOT NULL,
	`end_time` timestamp NOT NULL,
	`status` enum('SCHEDULED','LIVE','COMPLETED','CANCELED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
	`is_prime_time` boolean NOT NULL DEFAULT false,
	`auto_filled` boolean NOT NULL DEFAULT false,
	`performance_score` decimal(5,2),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sku_kill_rules` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`condition` json,
	`action` varchar(64) NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sku_kill_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sku_profitability` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`variant_id` varchar(64) NOT NULL,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`units_sold` int NOT NULL DEFAULT 0,
	`gross_revenue_cents` bigint NOT NULL DEFAULT 0,
	`cogs_cents` bigint NOT NULL DEFAULT 0,
	`shipping_cost_cents` bigint NOT NULL DEFAULT 0,
	`payment_fees_cents` bigint NOT NULL DEFAULT 0,
	`platform_fees_cents` bigint NOT NULL DEFAULT 0,
	`return_cost_cents` bigint NOT NULL DEFAULT 0,
	`marketing_cost_cents` bigint NOT NULL DEFAULT 0,
	`creator_commission_cents` bigint NOT NULL DEFAULT 0,
	`net_profit_cents` bigint NOT NULL DEFAULT 0,
	`profit_margin_percent` decimal(5,2),
	`roi_percent` decimal(5,2),
	`decision` enum('SCALE','MAINTAIN','REVIEW','KILL'),
	`decision_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sku_profitability_id` PRIMARY KEY(`id`),
	CONSTRAINT `sku_profitability_variant_period_idx` UNIQUE(`variant_id`,`period_start`)
);
--> statement-breakpoint
CREATE TABLE `supplier_contacts` (
	`id` varchar(64) NOT NULL,
	`supplier_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(128),
	`email` varchar(320),
	`phone` varchar(32),
	`is_primary` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_contracts` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`supplier_id` varchar(64) NOT NULL,
	`contract_number` varchar(128),
	`terms` text,
	`lead_time_days` int,
	`moq` int,
	`payment_terms` varchar(255),
	`defect_rate_threshold_percent` decimal(5,2),
	`exclusivity_clause` text,
	`ip_ownership` text,
	`start_date` timestamp,
	`end_date` timestamp,
	`auto_renew` boolean NOT NULL DEFAULT false,
	`status` enum('DRAFT','ACTIVE','EXPIRED','TERMINATED') NOT NULL DEFAULT 'DRAFT',
	`document_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_performance` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`supplier_id` varchar(64) NOT NULL,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`total_orders` int NOT NULL DEFAULT 0,
	`on_time_deliveries` int NOT NULL DEFAULT 0,
	`on_time_percent` decimal(5,2),
	`total_units_received` int NOT NULL DEFAULT 0,
	`defective_units` int NOT NULL DEFAULT 0,
	`defect_rate_percent` decimal(5,2),
	`average_lead_time_days` decimal(5,1),
	`quality_score` decimal(5,2),
	`overall_score` decimal(5,2),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_performance_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplier_performance_supplier_period_idx` UNIQUE(`supplier_id`,`period_start`)
);
--> statement-breakpoint
CREATE TABLE `supplier_samples` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`supplier_id` varchar(64) NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`requested_at` timestamp NOT NULL,
	`received_at` timestamp,
	`status` enum('REQUESTED','SHIPPED','RECEIVED','TESTING','APPROVED','REJECTED') NOT NULL DEFAULT 'REQUESTED',
	`evaluation_notes` text,
	`evaluated_by` varchar(64),
	`evaluated_at` timestamp,
	`approval_decision` enum('APPROVED','REJECTED','NEEDS_REVISION'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_samples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `third_party_logistics_providers` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`provider_type` varchar(64) NOT NULL,
	`api_endpoint` text,
	`api_key_enc` text,
	`webhook_secret` varchar(255),
	`capabilities` json,
	`status` enum('ACTIVE','DISABLED','TESTING') NOT NULL DEFAULT 'TESTING',
	`settings` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `third_party_logistics_providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `third_party_shipments` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`provider_id` varchar(64) NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`provider_shipment_id` varchar(255),
	`status` enum('PENDING','SENT_TO_3PL','ACKNOWLEDGED','PICKING','PACKING','SHIPPED','DELIVERED','FAILED','CANCELED') NOT NULL DEFAULT 'PENDING',
	`tracking_number` varchar(255),
	`tracking_url` text,
	`label_url` text,
	`carrier` varchar(64),
	`service_level` varchar(64),
	`sent_at` timestamp,
	`acknowledged_at` timestamp,
	`shipped_at` timestamp,
	`delivered_at` timestamp,
	`last_sync_at` timestamp,
	`provider_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `third_party_shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `third_party_shipments_provider_idx` UNIQUE(`provider_id`,`provider_shipment_id`)
);
--> statement-breakpoint
CREATE TABLE `third_party_tracking_events` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`shipment_id` varchar(64) NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`event_code` varchar(64),
	`description` text,
	`location` varchar(255),
	`event_time` timestamp NOT NULL,
	`provider_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `third_party_tracking_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `top_performers` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`period_start` timestamp NOT NULL,
	`period_end` timestamp NOT NULL,
	`performer_type` enum('SKU','CREATOR','LIVE_SHOW') NOT NULL,
	`performer_id` varchar(64) NOT NULL,
	`performer_name` varchar(255) NOT NULL,
	`rank` int NOT NULL,
	`revenue_cents` bigint NOT NULL DEFAULT 0,
	`profit_cents` bigint NOT NULL DEFAULT 0,
	`units_sold` int NOT NULL DEFAULT 0,
	`conversion_rate` decimal(5,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `top_performers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trend_spotting` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`trend_name` varchar(255) NOT NULL,
	`source` varchar(128),
	`source_url` text,
	`category` varchar(128),
	`trend_score` decimal(5,2),
	`potential_revenue_cents` bigint,
	`status` enum('SPOTTED','EVALUATING','SOURCING','APPROVED','IN_PRODUCTION','LAUNCHED','REJECTED') NOT NULL DEFAULT 'SPOTTED',
	`notes` text,
	`spotted_by` varchar(64),
	`spotted_at` timestamp NOT NULL,
	`launched_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trend_spotting_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ugc_briefs` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`brief_text` text NOT NULL,
	`key_messages` json,
	`dos_list` json,
	`donts_list` json,
	`target_duration_seconds` int,
	`budget` int,
	`status` enum('DRAFT','ACTIVE','COMPLETED','CANCELED') NOT NULL DEFAULT 'DRAFT',
	`created_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ugc_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `creative_assets_type_idx` ON `creative_assets` (`asset_type`);--> statement-breakpoint
CREATE INDEX `creative_assets_live_session_idx` ON `creative_assets` (`live_session_id`);--> statement-breakpoint
CREATE INDEX `creative_assets_status_idx` ON `creative_assets` (`status`);--> statement-breakpoint
CREATE INDEX `creator_availability_creator_day_idx` ON `creator_availability` (`creator_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `dispute_timeline_dispute_idx` ON `dispute_timeline` (`dispute_id`);--> statement-breakpoint
CREATE INDEX `escalations_status_idx` ON `escalations` (`status`);--> statement-breakpoint
CREATE INDEX `escalations_severity_idx` ON `escalations` (`severity`);--> statement-breakpoint
CREATE INDEX `fraud_scores_order_idx` ON `fraud_scores` (`order_id`);--> statement-breakpoint
CREATE INDEX `fraud_scores_risk_level_idx` ON `fraud_scores` (`risk_level`);--> statement-breakpoint
CREATE INDEX `fraud_scores_outcome_idx` ON `fraud_scores` (`outcome`);--> statement-breakpoint
CREATE INDEX `idempotency_keys_status_idx` ON `idempotency_keys` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `inventory_lots_variant_warehouse_idx` ON `inventory_lots` (`variant_id`,`warehouse_id`);--> statement-breakpoint
CREATE INDEX `inventory_lots_status_idx` ON `inventory_lots` (`status`);--> statement-breakpoint
CREATE INDEX `launch_checklists_product_idx` ON `launch_checklists` (`product_id`);--> statement-breakpoint
CREATE INDEX `launch_checklists_status_idx` ON `launch_checklists` (`status`);--> statement-breakpoint
CREATE INDEX `live_highlights_session_idx` ON `live_highlights` (`live_session_id`);--> statement-breakpoint
CREATE INDEX `live_highlights_clip_status_idx` ON `live_highlights` (`clip_status`);--> statement-breakpoint
CREATE INDEX `live_price_drops_session_status_idx` ON `live_price_drops` (`live_session_id`,`status`);--> statement-breakpoint
CREATE INDEX `live_show_segments_session_idx` ON `live_show_segments` (`live_session_id`);--> statement-breakpoint
CREATE INDEX `disputes_status_idx` ON `lsn_disputes` (`status`);--> statement-breakpoint
CREATE INDEX `disputes_evidence_deadline_idx` ON `lsn_disputes` (`evidence_deadline`);--> statement-breakpoint
CREATE INDEX `payout_holds_creator_status_idx` ON `payout_holds` (`creator_id`,`status`);--> statement-breakpoint
CREATE INDEX `policy_incidents_session_idx` ON `policy_incidents` (`session_id`);--> statement-breakpoint
CREATE INDEX `policy_incidents_severity_idx` ON `policy_incidents` (`severity`);--> statement-breakpoint
CREATE INDEX `price_books_status_idx` ON `price_books` (`status`);--> statement-breakpoint
CREATE INDEX `promotions_status_idx` ON `promotions` (`status`);--> statement-breakpoint
CREATE INDEX `promotions_dates_idx` ON `promotions` (`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `provider_txn_match_status_idx` ON `provider_transactions` (`match_status`);--> statement-breakpoint
CREATE INDEX `provider_txn_created_idx` ON `provider_transactions` (`provider_created_at`);--> statement-breakpoint
CREATE INDEX `receiving_workflows_po_idx` ON `receiving_workflows` (`purchase_order_id`);--> statement-breakpoint
CREATE INDEX `receiving_workflows_status_idx` ON `receiving_workflows` (`status`);--> statement-breakpoint
CREATE INDEX `reconciliation_discrepancies_status_idx` ON `reconciliation_discrepancies` (`status`);--> statement-breakpoint
CREATE INDEX `reconciliation_discrepancies_severity_idx` ON `reconciliation_discrepancies` (`severity`);--> statement-breakpoint
CREATE INDEX `regression_seeds_status_idx` ON `regression_seeds` (`status`);--> statement-breakpoint
CREATE INDEX `return_requests_order_idx` ON `return_requests` (`order_id`);--> statement-breakpoint
CREATE INDEX `return_requests_status_idx` ON `return_requests` (`status`);--> statement-breakpoint
CREATE INDEX `schedule_slots_broadcast_time_idx` ON `schedule_slots` (`broadcast_channel_id`,`start_time`);--> statement-breakpoint
CREATE INDEX `schedule_slots_creator_time_idx` ON `schedule_slots` (`creator_id`,`start_time`);--> statement-breakpoint
CREATE INDEX `schedule_slots_status_idx` ON `schedule_slots` (`status`);--> statement-breakpoint
CREATE INDEX `sku_profitability_decision_idx` ON `sku_profitability` (`decision`);--> statement-breakpoint
CREATE INDEX `supplier_contacts_supplier_idx` ON `supplier_contacts` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `supplier_contracts_supplier_idx` ON `supplier_contracts` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `supplier_contracts_status_idx` ON `supplier_contracts` (`status`);--> statement-breakpoint
CREATE INDEX `supplier_samples_supplier_idx` ON `supplier_samples` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `supplier_samples_status_idx` ON `supplier_samples` (`status`);--> statement-breakpoint
CREATE INDEX `third_party_shipments_order_idx` ON `third_party_shipments` (`order_id`);--> statement-breakpoint
CREATE INDEX `third_party_shipments_status_idx` ON `third_party_shipments` (`status`);--> statement-breakpoint
CREATE INDEX `third_party_tracking_events_shipment_idx` ON `third_party_tracking_events` (`shipment_id`);--> statement-breakpoint
CREATE INDEX `third_party_tracking_events_time_idx` ON `third_party_tracking_events` (`event_time`);--> statement-breakpoint
CREATE INDEX `top_performers_period_type_idx` ON `top_performers` (`period_start`,`performer_type`);--> statement-breakpoint
CREATE INDEX `trend_spotting_status_idx` ON `trend_spotting` (`status`);--> statement-breakpoint
CREATE INDEX `trend_spotting_spotted_at_idx` ON `trend_spotting` (`spotted_at`);