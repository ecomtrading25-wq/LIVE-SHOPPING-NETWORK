CREATE TABLE `avatar_creators` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`display_name` varchar(255) NOT NULL,
	`age` int NOT NULL,
	`category` enum('home','tech','beauty','fashion','lifestyle') NOT NULL,
	`look_description` text,
	`wardrobe_style` text,
	`camera_framing` text,
	`personality` text,
	`content_pillars` json,
	`brand_safety` json,
	`avatar_image_url` text,
	`cover_image_url` text,
	`reference_images_url` json,
	`voice_profile_url` text,
	`total_videos` int DEFAULT 0,
	`total_views` int DEFAULT 0,
	`total_revenue` decimal(12,2) DEFAULT '0.00',
	`avg_engagement_rate` decimal(5,2) DEFAULT '0.00',
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`is_verified` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avatar_creators_id` PRIMARY KEY(`id`),
	CONSTRAINT `avatar_channel_slug_idx` UNIQUE(`channel_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `avatar_qc_checks` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`content_id` varchar(64),
	`video_job_id` varchar(64),
	`check_type` enum('uncanny_valley','suggestive_content','lookalike_detection','disclosure_compliance','brand_safety') NOT NULL,
	`passed` boolean NOT NULL,
	`score` decimal(5,2),
	`issues` json,
	`check_method` enum('automated','manual','hybrid') NOT NULL,
	`reviewer_id` varchar(64),
	`action_taken` enum('approved','rejected','flagged','edited'),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avatar_qc_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_calendar` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`avatar_id` varchar(64) NOT NULL,
	`scheduled_for` timestamp NOT NULL,
	`published_at` timestamp,
	`content_type` enum('post','live','clip','story','reel') NOT NULL,
	`platform` enum('tiktok','instagram','youtube','facebook','custom') NOT NULL,
	`title` varchar(500),
	`script_id` varchar(64),
	`hook_angle` text,
	`product_ids` json,
	`video_job_id` varchar(255),
	`video_url` text,
	`thumbnail_url` text,
	`duration` int,
	`views` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`revenue` decimal(10,2) DEFAULT '0.00',
	`status` enum('draft','queued','generating','ready','published','failed') NOT NULL DEFAULT 'draft',
	`publish_status` enum('pending','success','failed'),
	`error_message` text,
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_calendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_winners` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`content_id` varchar(64) NOT NULL,
	`avatar_id` varchar(64) NOT NULL,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	`detection_reason` text,
	`views` int NOT NULL,
	`engagement_rate` decimal(5,2) NOT NULL,
	`conversion_rate` decimal(5,2),
	`revenue` decimal(10,2),
	`variants_generated` int DEFAULT 0,
	`variant_ids` json,
	`hook_type` varchar(128),
	`success_factors` json,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_winners_id` PRIMARY KEY(`id`),
	CONSTRAINT `winner_content_id_idx` UNIQUE(`content_id`)
);
--> statement-breakpoint
CREATE TABLE `script_library` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`avatar_id` varchar(64),
	`title` varchar(500) NOT NULL,
	`script_type` enum('live_intro','product_demo','price_drop','closing','transition','full_show') NOT NULL,
	`category` varchar(128),
	`script` text NOT NULL,
	`duration` int,
	`cue_cards` json,
	`hook_type` varchar(128),
	`angle` text,
	`times_used` int DEFAULT 0,
	`avg_engagement` decimal(5,2) DEFAULT '0.00',
	`avg_conversion` decimal(5,2) DEFAULT '0.00',
	`compliance_checked` boolean DEFAULT false,
	`compliance_issues` json,
	`tags` json,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `script_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_partnerships` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`contact_name` varchar(255),
	`contact_email` varchar(320),
	`contact_phone` varchar(50),
	`partnership_type` enum('product_placement','sponsored_content','affiliate','exclusive'),
	`category` varchar(128),
	`deal_value` decimal(12,2),
	`currency` varchar(3) DEFAULT 'AUD',
	`payment_terms` text,
	`content_requirements` json,
	`start_date` timestamp,
	`end_date` timestamp,
	`content_delivered` int DEFAULT 0,
	`total_views` int DEFAULT 0,
	`total_revenue` decimal(12,2) DEFAULT '0.00',
	`status` enum('prospect','contacted','negotiating','active','completed','declined') NOT NULL DEFAULT 'prospect',
	`outreach_stage` int DEFAULT 1,
	`last_contacted_at` timestamp,
	`next_follow_up_at` timestamp,
	`contract_url` text,
	`brief_url` text,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sponsor_partnerships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_generation_jobs` (
	`id` varchar(64) NOT NULL,
	`channel_id` varchar(64) NOT NULL,
	`content_id` varchar(64),
	`avatar_id` varchar(64) NOT NULL,
	`provider` enum('heygen','synthesia','d_id','custom') NOT NULL,
	`provider_job_id` varchar(255),
	`script_id` varchar(64),
	`script_text` text,
	`audio_url` text,
	`anchor_image_url` text,
	`config` json,
	`video_url` text,
	`thumbnail_url` text,
	`duration` int,
	`file_size` int,
	`status` enum('queued','processing','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`progress` int DEFAULT 0,
	`error_message` text,
	`queued_at` timestamp NOT NULL DEFAULT (now()),
	`started_at` timestamp,
	`completed_at` timestamp,
	`processing_time` int,
	`credits_cost` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_generation_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `avatar_creators` ADD CONSTRAINT `avatar_creators_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `avatar_qc_checks` ADD CONSTRAINT `avatar_qc_checks_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `avatar_qc_checks` ADD CONSTRAINT `avatar_qc_checks_content_id_content_calendar_id_fk` FOREIGN KEY (`content_id`) REFERENCES `content_calendar`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `avatar_qc_checks` ADD CONSTRAINT `avatar_qc_checks_video_job_id_video_generation_jobs_id_fk` FOREIGN KEY (`video_job_id`) REFERENCES `video_generation_jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_calendar` ADD CONSTRAINT `content_calendar_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_calendar` ADD CONSTRAINT `content_calendar_avatar_id_avatar_creators_id_fk` FOREIGN KEY (`avatar_id`) REFERENCES `avatar_creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_winners` ADD CONSTRAINT `content_winners_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_winners` ADD CONSTRAINT `content_winners_content_id_content_calendar_id_fk` FOREIGN KEY (`content_id`) REFERENCES `content_calendar`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_winners` ADD CONSTRAINT `content_winners_avatar_id_avatar_creators_id_fk` FOREIGN KEY (`avatar_id`) REFERENCES `avatar_creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `script_library` ADD CONSTRAINT `script_library_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `script_library` ADD CONSTRAINT `script_library_avatar_id_avatar_creators_id_fk` FOREIGN KEY (`avatar_id`) REFERENCES `avatar_creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsor_partnerships` ADD CONSTRAINT `sponsor_partnerships_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_generation_jobs` ADD CONSTRAINT `video_generation_jobs_channel_id_channels_id_fk` FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_generation_jobs` ADD CONSTRAINT `video_generation_jobs_content_id_content_calendar_id_fk` FOREIGN KEY (`content_id`) REFERENCES `content_calendar`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_generation_jobs` ADD CONSTRAINT `video_generation_jobs_avatar_id_avatar_creators_id_fk` FOREIGN KEY (`avatar_id`) REFERENCES `avatar_creators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_generation_jobs` ADD CONSTRAINT `video_generation_jobs_script_id_script_library_id_fk` FOREIGN KEY (`script_id`) REFERENCES `script_library`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `avatar_channel_id_idx` ON `avatar_creators` (`channel_id`);--> statement-breakpoint
CREATE INDEX `qc_content_id_idx` ON `avatar_qc_checks` (`content_id`);--> statement-breakpoint
CREATE INDEX `qc_video_job_id_idx` ON `avatar_qc_checks` (`video_job_id`);--> statement-breakpoint
CREATE INDEX `qc_check_type_idx` ON `avatar_qc_checks` (`check_type`);--> statement-breakpoint
CREATE INDEX `content_avatar_scheduled_idx` ON `content_calendar` (`avatar_id`,`scheduled_for`);--> statement-breakpoint
CREATE INDEX `content_channel_id_idx` ON `content_calendar` (`channel_id`);--> statement-breakpoint
CREATE INDEX `content_status_idx` ON `content_calendar` (`status`);--> statement-breakpoint
CREATE INDEX `winner_channel_id_idx` ON `content_winners` (`channel_id`);--> statement-breakpoint
CREATE INDEX `winner_avatar_id_idx` ON `content_winners` (`avatar_id`);--> statement-breakpoint
CREATE INDEX `script_channel_id_idx` ON `script_library` (`channel_id`);--> statement-breakpoint
CREATE INDEX `script_avatar_id_idx` ON `script_library` (`avatar_id`);--> statement-breakpoint
CREATE INDEX `script_type_idx` ON `script_library` (`script_type`);--> statement-breakpoint
CREATE INDEX `sponsor_channel_id_idx` ON `sponsor_partnerships` (`channel_id`);--> statement-breakpoint
CREATE INDEX `sponsor_status_idx` ON `sponsor_partnerships` (`status`);--> statement-breakpoint
CREATE INDEX `sponsor_company_name_idx` ON `sponsor_partnerships` (`company_name`);--> statement-breakpoint
CREATE INDEX `video_job_channel_id_idx` ON `video_generation_jobs` (`channel_id`);--> statement-breakpoint
CREATE INDEX `video_job_avatar_id_idx` ON `video_generation_jobs` (`avatar_id`);--> statement-breakpoint
CREATE INDEX `video_job_status_idx` ON `video_generation_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `video_job_provider_idx` ON `video_generation_jobs` (`provider`,`provider_job_id`);