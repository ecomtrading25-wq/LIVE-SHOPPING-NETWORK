CREATE TABLE `live_show_participants` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('host','moderator','viewer') NOT NULL DEFAULT 'viewer',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	`left_at` timestamp,
	`watch_duration` int DEFAULT 0,
	`messages_sent` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_show_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recordings` (
	`id` varchar(64) NOT NULL,
	`show_id` varchar(64) NOT NULL,
	`recording_url` text NOT NULL,
	`duration` int NOT NULL,
	`status` enum('processing','ready','failed') NOT NULL DEFAULT 'processing',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `live_show_participants` ADD CONSTRAINT `live_show_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;