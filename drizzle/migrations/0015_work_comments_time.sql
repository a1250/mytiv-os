CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_comments_body_len" CHECK (char_length("task_comments"."body") between 1 and 5000)
);
--> statement-breakpoint
CREATE TABLE "task_time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"minutes" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_time_entries_minutes" CHECK ("task_time_entries"."minutes" between 1 and 1440),
	CONSTRAINT "task_time_entries_source" CHECK ("task_time_entries"."source" in ('timer', 'manual'))
);
--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_fk" FOREIGN KEY ("business_id","task_id") REFERENCES "public"."tasks"("business_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_fk" FOREIGN KEY ("business_id","author_id") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_task_fk" FOREIGN KEY ("business_id","task_id") REFERENCES "public"."tasks"("business_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_user_fk" FOREIGN KEY ("business_id","user_id") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_comments_task_idx" ON "task_comments" USING btree ("business_id","task_id","created_at");--> statement-breakpoint
CREATE INDEX "task_time_entries_task_idx" ON "task_time_entries" USING btree ("business_id","task_id");--> statement-breakpoint
-- Comments and logged time are history: never edited in place (a task's hard delete still cascades).
CREATE TRIGGER "task_comments_immutable" BEFORE UPDATE ON "task_comments" FOR EACH ROW EXECUTE FUNCTION ops_reject_history_change();--> statement-breakpoint
CREATE TRIGGER "task_time_entries_immutable" BEFORE UPDATE ON "task_time_entries" FOR EACH ROW EXECUTE FUNCTION ops_reject_history_change();--> statement-breakpoint
-- The task a comment / time entry is written on: a live task of the business, locked against a concurrent delete.
CREATE OR REPLACE FUNCTION work_live_task(p_business uuid, p_task uuid) RETURNS tasks LANGUAGE plpgsql AS $$
DECLARE t tasks;
BEGIN
  SELECT * INTO t FROM tasks WHERE business_id = p_business AND id = p_task AND deleted_at IS NULL FOR KEY SHARE;
  IF NOT FOUND THEN PERFORM work_raise('not_found'); END IF;
  RETURN t;
END $$;--> statement-breakpoint
-- work_add_comment: any active member; ledgered (a retry with the same request id returns the same comment);
-- the task's version is NOT changed, so a comment never turns someone's edit into a conflict.
CREATE OR REPLACE FUNCTION work_add_comment(p_business uuid, p_actor uuid, p_request uuid, p_hash text, p_task uuid, p_body jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_replay jsonb; t tasks; c task_comments; v_result jsonb;
BEGIN
  v_replay := work_replay(p_business, p_request, p_actor, 'comment', p_hash);
  IF v_replay IS NOT NULL THEN RETURN v_replay; END IF;
  PERFORM work_authorize(p_business, p_actor, 'comment');
  t := work_live_task(p_business, p_task);
  INSERT INTO task_comments (business_id, task_id, author_id, request_id, body)
  VALUES (p_business, t.id, p_actor, p_request, work_text(p_body, 'comment', 5000, true)) RETURNING * INTO c;
  INSERT INTO work_events (business_id, task_id, actor_id, request_id, event, detail, version)
  VALUES (p_business, t.id, p_actor, p_request, 'commented', jsonb_build_object('commentId', c.id), t.version);
  v_result := jsonb_build_object('ok', true, 'taskId', t.id, 'version', t.version, 'commentId', c.id);
  INSERT INTO work_requests (business_id, request_id, actor_id, operation, target_id, payload_hash, result) VALUES (p_business, p_request, p_actor, 'comment', t.id, p_hash, v_result);
  RETURN v_result;
END $$;--> statement-breakpoint
-- work_log_time: the actor logs their OWN time (1..1440 minutes per entry, not in the future); ledgered; the task's
-- version is not changed.
CREATE OR REPLACE FUNCTION work_log_time(p_business uuid, p_actor uuid, p_request uuid, p_hash text, p_task uuid, p_minutes integer, p_started timestamptz, p_source text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_replay jsonb; t tasks; e task_time_entries; v_result jsonb;
BEGIN
  v_replay := work_replay(p_business, p_request, p_actor, 'log_time', p_hash);
  IF v_replay IS NOT NULL THEN RETURN v_replay; END IF;
  PERFORM work_authorize(p_business, p_actor, 'log_time');
  t := work_live_task(p_business, p_task);
  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 1440 THEN PERFORM work_raise('invalid_minutes'); END IF;
  IF p_source IS NULL OR p_source NOT IN ('timer', 'manual') THEN PERFORM work_raise('invalid_source'); END IF;
  IF p_started IS NULL OR p_started > now() + interval '5 minutes' THEN PERFORM work_raise('invalid_started_at'); END IF;
  INSERT INTO task_time_entries (business_id, task_id, user_id, request_id, minutes, started_at, source)
  VALUES (p_business, t.id, p_actor, p_request, p_minutes, p_started, p_source) RETURNING * INTO e;
  INSERT INTO work_events (business_id, task_id, actor_id, request_id, event, detail, version)
  VALUES (p_business, t.id, p_actor, p_request, 'time_logged', jsonb_build_object('entryId', e.id, 'minutes', e.minutes, 'source', e.source), t.version);
  v_result := jsonb_build_object('ok', true, 'taskId', t.id, 'version', t.version, 'entryId', e.id);
  INSERT INTO work_requests (business_id, request_id, actor_id, operation, target_id, payload_hash, result) VALUES (p_business, p_request, p_actor, 'log_time', t.id, p_hash, v_result);
  RETURN v_result;
END $$;
