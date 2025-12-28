CREATE TABLE `product_categories` (
	`id` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`description` text,
	`parent_id` varchar(64),
	`image` text,
	`featured` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `parent_id_idx` ON `product_categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `featured_idx` ON `product_categories` (`featured`);