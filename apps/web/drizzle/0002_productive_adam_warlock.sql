CREATE TABLE "integration_item" (
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"resource" text NOT NULL,
	"external_id" text NOT NULL,
	"routine_id" text NOT NULL,
	"direction" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_item_user_id_provider_resource_external_id_pk" PRIMARY KEY("user_id","provider","resource","external_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "integration_item_routine_idx" ON "integration_item" USING btree ("user_id","provider","resource","routine_id");