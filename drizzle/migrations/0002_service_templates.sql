CREATE TABLE "service_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"label" text NOT NULL,
	"title" text DEFAULT '',
	"description" text DEFAULT '',
	"setup_fee" integer DEFAULT 0,
	"monthly_fee" integer DEFAULT 0,
	"monthly_block_title" text DEFAULT '',
	"monthly_breakdown" text DEFAULT '',
	"position" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_templates" ADD CONSTRAINT "service_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_templates_business_idx" ON "service_templates" USING btree ("business_id");