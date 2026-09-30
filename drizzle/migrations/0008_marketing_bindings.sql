CREATE TABLE "marketing_binding_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"event" text NOT NULL,
	"binding_version" integer NOT NULL,
	"marketing_business" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_binding_event_kind" CHECK ("marketing_binding_events"."event" in ('bind', 'revoke')),
	CONSTRAINT "marketing_binding_event_version_positive" CHECK ("marketing_binding_events"."binding_version" >= 1),
	CONSTRAINT "marketing_binding_event_slug" CHECK ("marketing_binding_events"."marketing_business" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
CREATE TABLE "marketing_bindings" (
	"business_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"marketing_business" text NOT NULL,
	"binding_version" integer NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_bindings_business_id_project_id_pk" PRIMARY KEY("business_id","project_id"),
	CONSTRAINT "marketing_binding_version_positive" CHECK ("marketing_bindings"."binding_version" >= 1),
	CONSTRAINT "marketing_binding_slug" CHECK ("marketing_bindings"."marketing_business" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "marketing_binding_events" ADD CONSTRAINT "marketing_binding_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_binding_events" ADD CONSTRAINT "marketing_binding_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_binding_events" ADD CONSTRAINT "marketing_binding_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_binding_events" ADD CONSTRAINT "marketing_binding_events_business_id_project_id_projects_business_id_id_fk" FOREIGN KEY ("business_id","project_id") REFERENCES "public"."projects"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_binding_events" ADD CONSTRAINT "marketing_binding_events_business_id_actor_id_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","actor_id") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_bindings" ADD CONSTRAINT "marketing_bindings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_bindings" ADD CONSTRAINT "marketing_bindings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_bindings" ADD CONSTRAINT "marketing_bindings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_bindings" ADD CONSTRAINT "marketing_bindings_business_id_project_id_projects_business_id_id_fk" FOREIGN KEY ("business_id","project_id") REFERENCES "public"."projects"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_bindings" ADD CONSTRAINT "marketing_bindings_business_id_updated_by_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","updated_by") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_binding_event_version_uq" ON "marketing_binding_events" USING btree ("business_id","project_id","binding_version","event");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_binding_event_request_uq" ON "marketing_binding_events" USING btree ("business_id","request_id");--> statement-breakpoint
CREATE TRIGGER marketing_binding_events_immutable BEFORE UPDATE OR DELETE ON marketing_binding_events FOR EACH ROW EXECUTE FUNCTION ops_reject_history_change();
--> statement-breakpoint
-- The event log is well-formed however it is written: a bind advances the version by exactly one, a
-- revoke closes the CURRENT bind (same version and tenant), and only an owner of the business may act.
CREATE FUNCTION marketing_binding_event_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest marketing_binding_events%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM business_memberships WHERE business_id = NEW.business_id AND user_id = NEW.actor_id AND role = 'owner') THEN
    RAISE EXCEPTION 'marketing_binding_owner_required';
  END IF;
  SELECT * INTO latest FROM marketing_binding_events WHERE business_id = NEW.business_id AND project_id = NEW.project_id
    ORDER BY binding_version DESC, (event = 'revoke') DESC LIMIT 1;
  IF NEW.event = 'bind' AND NEW.binding_version <> COALESCE(latest.binding_version, 0) + 1 THEN
    RAISE EXCEPTION 'marketing_binding_version_must_advance';
  END IF;
  IF NEW.event = 'revoke' AND (latest.event IS NULL OR latest.event <> 'bind' OR NEW.binding_version <> latest.binding_version OR NEW.marketing_business <> latest.marketing_business) THEN
    RAISE EXCEPTION 'marketing_binding_revoke_must_follow_current_bind';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_binding_event_order BEFORE INSERT ON marketing_binding_events FOR EACH ROW EXECUTE FUNCTION marketing_binding_event_order();
--> statement-breakpoint
-- The current row is a projection of the log: it may only ever mirror the latest event, and it is never deleted.
CREATE FUNCTION marketing_binding_mirror() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest marketing_binding_events%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'marketing_binding_never_deleted'; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.business_id <> OLD.business_id OR NEW.project_id <> OLD.project_id) THEN
    RAISE EXCEPTION 'marketing_binding_key_immutable';
  END IF;
  SELECT * INTO latest FROM marketing_binding_events WHERE business_id = NEW.business_id AND project_id = NEW.project_id
    ORDER BY binding_version DESC, (event = 'revoke') DESC LIMIT 1;
  IF latest.event IS NULL OR latest.binding_version <> NEW.binding_version OR latest.marketing_business <> NEW.marketing_business
     OR (latest.event = 'revoke') <> NEW.revoked OR latest.actor_id <> NEW.updated_by THEN
    RAISE EXCEPTION 'marketing_binding_must_mirror_latest_event';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_bindings_mirror BEFORE INSERT OR UPDATE OR DELETE ON marketing_bindings FOR EACH ROW EXECUTE FUNCTION marketing_binding_mirror();
--> statement-breakpoint
-- bind / rebind: one statement, serialized per (business, project) by an advisory transaction lock.
CREATE FUNCTION marketing_bind(p_business uuid, p_project uuid, p_marketing_business text, p_actor uuid, p_request_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE cur marketing_bindings%ROWTYPE; next_version integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('marketing_binding:' || p_business::text || ':' || p_project::text, 0));
  SELECT * INTO cur FROM marketing_bindings WHERE business_id = p_business AND project_id = p_project FOR UPDATE;
  IF cur.binding_version IS NOT NULL AND NOT cur.revoked AND cur.marketing_business = p_marketing_business THEN
    RAISE EXCEPTION 'marketing_binding_unchanged';
  END IF;
  next_version := COALESCE(cur.binding_version, 0) + 1;
  INSERT INTO marketing_binding_events(business_id, project_id, event, binding_version, marketing_business, actor_id, request_id)
    VALUES (p_business, p_project, 'bind', next_version, p_marketing_business, p_actor, p_request_id);
  INSERT INTO marketing_bindings(business_id, project_id, marketing_business, binding_version, revoked, updated_by, updated_at)
    VALUES (p_business, p_project, p_marketing_business, next_version, false, p_actor, now())
    ON CONFLICT (business_id, project_id) DO UPDATE SET marketing_business = EXCLUDED.marketing_business,
      binding_version = EXCLUDED.binding_version, revoked = false, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at;
  RETURN next_version;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION marketing_revoke(p_business uuid, p_project uuid, p_actor uuid, p_request_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE cur marketing_bindings%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('marketing_binding:' || p_business::text || ':' || p_project::text, 0));
  SELECT * INTO cur FROM marketing_bindings WHERE business_id = p_business AND project_id = p_project FOR UPDATE;
  IF cur.binding_version IS NULL OR cur.revoked THEN RAISE EXCEPTION 'marketing_binding_not_bound'; END IF;
  INSERT INTO marketing_binding_events(business_id, project_id, event, binding_version, marketing_business, actor_id, request_id)
    VALUES (p_business, p_project, 'revoke', cur.binding_version, cur.marketing_business, p_actor, p_request_id);
  UPDATE marketing_bindings SET revoked = true, updated_by = p_actor, updated_at = now()
    WHERE business_id = p_business AND project_id = p_project;
  RETURN cur.binding_version;
END;
$$;
