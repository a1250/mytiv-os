ALTER TABLE "proposals" ADD COLUMN "client_company" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "client_email" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "date" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "project_overview" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "valid_until" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "vat_rate" integer DEFAULT 18;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "include_vat" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "retainer_mode" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "services" jsonb DEFAULT '[]'::jsonb;