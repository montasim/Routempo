CREATE TABLE "api_idempotency" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_status" integer,
	"response_body" text,
	"response_content_type" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_idempotency_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE INDEX "api_idempotency_expires_at_idx" ON "api_idempotency" USING btree ("expires_at");