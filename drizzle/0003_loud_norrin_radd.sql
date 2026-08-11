CREATE TABLE "notification_delivery" (
	"subscription_id" text NOT NULL,
	"delivery_key" text NOT NULL,
	"user_id" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_delivery_subscription_id_delivery_key_pk" PRIMARY KEY("subscription_id","delivery_key")
);
--> statement-breakpoint
CREATE TABLE "notification_job" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_key" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"routine_id" text,
	"scheduled_for" timestamp with time zone NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_until" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_job_delivery_key_unique" UNIQUE("delivery_key")
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "notifications" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "weekly_summary" SET DEFAULT false;--> statement-breakpoint
CREATE INDEX "notification_delivery_user_id_idx" ON "notification_delivery" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_job_due_idx" ON "notification_job" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "notification_job_user_id_idx" ON "notification_job" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscription_endpoint_idx" ON "push_subscription" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "push_subscription_user_id_idx" ON "push_subscription" USING btree ("user_id");