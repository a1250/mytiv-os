ALTER TABLE "projects" ADD COLUMN "clickup_folder_id" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_business_clickup_folder_idx" ON "projects" USING btree ("business_id","clickup_folder_id");