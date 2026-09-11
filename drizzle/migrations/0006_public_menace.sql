CREATE TABLE "marketing_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"imported_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketing_snapshots" ADD CONSTRAINT "marketing_snapshots_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_snapshots" ADD CONSTRAINT "marketing_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_snapshots" ADD CONSTRAINT "marketing_snapshots_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_snapshot_revision_uq" ON "marketing_snapshots" USING btree ("business_id","project_id","revision");