CREATE TABLE "work_status_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"status_id" uuid NOT NULL,
	"label_he" text NOT NULL,
	"position" integer NOT NULL,
	"retired_at" timestamp with time zone,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_status_templates" (
	"key" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"label_he" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "work_status_templates_category_ck" CHECK ("work_status_templates"."category" in ('open','active','waiting','review','done','cancelled'))
);
--> statement-breakpoint
CREATE TABLE "work_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"key" text NOT NULL,
	"template_key" text,
	"category" text NOT NULL,
	"label_he" text NOT NULL,
	"position" integer NOT NULL,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_statuses_category_ck" CHECK ("work_statuses"."category" in ('open','active','waiting','review','done','cancelled')),
	CONSTRAINT "work_statuses_key_ck" CHECK ("work_statuses"."key" ~ '^[a-z][a-z0-9_]{0,39}$')
);
--> statement-breakpoint
ALTER TABLE "business_memberships" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "work_source" text DEFAULT 'clickup' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cutover_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status_category" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "due_on" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "start_on" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "position" numeric;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "type" text DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "waiting_on" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "estimate_minutes" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "billable" boolean;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "source" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "external_status" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "last_activity_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "trash_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "work_status_revisions" ADD CONSTRAINT "work_status_revisions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_status_revisions" ADD CONSTRAINT "work_status_revisions_status_id_work_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."work_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_statuses" ADD CONSTRAINT "work_statuses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_statuses" ADD CONSTRAINT "work_statuses_template_key_work_status_templates_key_fk" FOREIGN KEY ("template_key") REFERENCES "public"."work_status_templates"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_status_revisions_status_idx" ON "work_status_revisions" USING btree ("business_id","status_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_statuses_business_key_uq" ON "work_statuses" USING btree ("business_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "work_statuses_business_id_category_uq" ON "work_statuses" USING btree ("business_id","id","category");--> statement-breakpoint
-- composite-FK targets first: tasks_parent_fk needs tasks(business_id,id) to be unique
CREATE UNIQUE INDEX "leads_business_id_uq" ON "leads" USING btree ("business_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_business_id_uq" ON "tasks" USING btree ("business_id","id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_fk" FOREIGN KEY ("business_id","status_id","status_category") REFERENCES "public"."work_statuses"("business_id","id","category") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_fk" FOREIGN KEY ("business_id","parent_id") REFERENCES "public"."tasks"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_member_fk" FOREIGN KEY ("business_id","owner_user_id") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_business_project_idx" ON "tasks" USING btree ("business_id","project_id");--> statement-breakpoint
CREATE INDEX "tasks_business_owner_idx" ON "tasks" USING btree ("business_id","owner_user_id");--> statement-breakpoint
CREATE INDEX "tasks_business_parent_idx" ON "tasks" USING btree ("business_id","parent_id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_work_source_ck" CHECK ("projects"."work_source" in ('clickup','mytiv'));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_type_ck" CHECK ("tasks"."type" in ('task','bug','decision'));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_waiting_on_ck" CHECK ("tasks"."waiting_on" is null or "tasks"."waiting_on" in ('client','contractor','internal'));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_ck" CHECK ("tasks"."source" in ('legacy','manual','proposal','comment','copilot','import_clickup'));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_estimate_ck" CHECK ("tasks"."estimate_minutes" is null or "tasks"."estimate_minutes" between 0 and 1000000);--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_version_ck" CHECK ("tasks"."version" >= 1);--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_pair_ck" CHECK (("tasks"."status_id" is null) = ("tasks"."status_category" is null));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_not_own_parent_ck" CHECK ("tasks"."parent_id" is null or "tasks"."parent_id" <> "tasks"."id");;--> statement-breakpoint
-- ── Hand-written (Mytiv Work expand, ADR-0001 decision 4). Only NEW tables/columns are constrained; no legacy value is touched. ──
INSERT INTO "work_status_templates" ("key", "category", "label_he", "position") VALUES
  ('backlog', 'open', 'לתכנון', 10), ('todo', 'open', 'לביצוע', 20), ('in_progress', 'active', 'בעבודה', 30),
  ('waiting', 'waiting', 'ממתין', 40), ('review', 'review', 'בבדיקה', 50), ('done', 'done', 'הושלם', 60), ('cancelled', 'cancelled', 'בוטל', 70);--> statement-breakpoint
-- Every business gets its own copy of the system statuses (same-business FKs by construction).
CREATE FUNCTION work_status_copy_templates(p_business uuid) RETURNS void LANGUAGE sql AS $$
  INSERT INTO work_statuses (business_id, key, template_key, category, label_he, position)
  SELECT p_business, t.key, t.key, t.category, t.label_he, t.position FROM work_status_templates t
  ON CONFLICT (business_id, key) DO NOTHING;
$$;--> statement-breakpoint
CREATE FUNCTION work_business_statuses() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN PERFORM work_status_copy_templates(NEW.id); RETURN NULL; END $$;--> statement-breakpoint
CREATE TRIGGER businesses_work_statuses AFTER INSERT ON businesses FOR EACH ROW EXECUTE FUNCTION work_business_statuses();--> statement-breakpoint
SELECT work_status_copy_templates(id) FROM businesses;--> statement-breakpoint
-- A status's identity, business and meaning never change; renames/reorders/retirement do, and each is recorded.
-- No DELETE (retire instead) — except the cascade of a business that no longer exists.
CREATE FUNCTION work_status_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM businesses WHERE id = OLD.business_id) THEN
      RAISE EXCEPTION 'work_statuses rows are retired, never deleted' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.id <> OLD.id OR NEW.business_id <> OLD.business_id OR NEW.key <> OLD.key OR NEW.category <> OLD.category
     OR NEW.template_key IS DISTINCT FROM OLD.template_key THEN
    RAISE EXCEPTION 'work_statuses id/business/key/category/template are immutable' USING ERRCODE = 'restrict_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER work_statuses_guard BEFORE UPDATE OR DELETE ON work_statuses FOR EACH ROW EXECUTE FUNCTION work_status_guard();--> statement-breakpoint
CREATE FUNCTION work_status_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.label_he IS DISTINCT FROM OLD.label_he OR NEW.position IS DISTINCT FROM OLD.position OR NEW.retired_at IS DISTINCT FROM OLD.retired_at THEN
    INSERT INTO work_status_revisions (business_id, status_id, label_he, position, retired_at, changed_by)
    VALUES (NEW.business_id, NEW.id, NEW.label_he, NEW.position, NEW.retired_at, nullif(current_setting('work.actor', true), '')::uuid);
  END IF;
  RETURN NULL;
END $$;--> statement-breakpoint
CREATE TRIGGER work_statuses_revision AFTER INSERT OR UPDATE ON work_statuses FOR EACH ROW EXECUTE FUNCTION work_status_revision();--> statement-breakpoint
-- Revisions are history: append-only, except the cascade of a business that no longer exists.
CREATE FUNCTION work_reject_history_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM businesses WHERE id = OLD.business_id) THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'Work history is append-only' USING ERRCODE = 'restrict_violation';
END $$;--> statement-breakpoint
CREATE TRIGGER work_status_revisions_append_only BEFORE UPDATE OR DELETE ON work_status_revisions FOR EACH ROW EXECUTE FUNCTION work_reject_history_change();--> statement-breakpoint
-- Statuses copied above were inserted before the revision trigger existed: give each its first revision.
INSERT INTO work_status_revisions (business_id, status_id, label_he, position, retired_at)
SELECT s.business_id, s.id, s.label_he, s.position, s.retired_at FROM work_statuses s
WHERE NOT EXISTS (SELECT 1 FROM work_status_revisions r WHERE r.status_id = s.id);
