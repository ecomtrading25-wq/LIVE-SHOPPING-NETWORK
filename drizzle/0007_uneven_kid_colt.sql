ALTER TABLE `orders` ADD `stripe_payment_intent_id` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `paid_at` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `total_amount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `orders` ADD `show_id` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `product_id` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `host_id` varchar(64);