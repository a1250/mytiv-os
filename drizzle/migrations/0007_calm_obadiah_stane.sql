
CREATE UNIQUE INDEX "ops_action_business_id_uq" ON "ops_actions" USING btree ("business_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_business_id_uq" ON "projects" USING btree ("business_id","id");
--> statement-breakpoint
ALTER TABLE "marketing_snapshots" ADD CONSTRAINT "marketing_snapshots_business_id_project_id_projects_business_id_id_fk" FOREIGN KEY ("business_id","project_id") REFERENCES "public"."projects"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_snapshots" ADD CONSTRAINT "marketing_snapshots_business_id_imported_by_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","imported_by") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_actions" ADD CONSTRAINT "ops_actions_business_id_project_id_projects_business_id_id_fk" FOREIGN KEY ("business_id","project_id") REFERENCES "public"."projects"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_actions" ADD CONSTRAINT "ops_actions_business_id_user_id_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","user_id") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_audit_events" ADD CONSTRAINT "ops_audit_events_business_id_action_id_ops_actions_business_id_id_fk" FOREIGN KEY ("business_id","action_id") REFERENCES "public"."ops_actions"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE FUNCTION ops_reject_history_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Ops history is append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER ops_actions_immutable BEFORE UPDATE OR DELETE ON ops_actions FOR EACH ROW EXECUTE FUNCTION ops_reject_history_change();
--> statement-breakpoint
CREATE TRIGGER ops_audit_events_immutable BEFORE UPDATE OR DELETE ON ops_audit_events FOR EACH ROW EXECUTE FUNCTION ops_reject_history_change();
--> statement-breakpoint
CREATE TRIGGER marketing_snapshots_immutable BEFORE UPDATE OR DELETE ON marketing_snapshots FOR EACH ROW EXECUTE FUNCTION ops_reject_history_change();

--> statement-breakpoint
CREATE FUNCTION ops_check_snapshot_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest marketing_snapshots%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.business_id::text || ':' || NEW.project_id::text, 0));
  SELECT * INTO latest FROM marketing_snapshots WHERE business_id=NEW.business_id AND project_id=NEW.project_id ORDER BY revision DESC LIMIT 1;
  IF FOUND AND (NEW.revision < latest.revision OR (NEW.payload->>'asOf')::timestamptz < (latest.payload->>'asOf')::timestamptz) THEN
    RAISE EXCEPTION 'stale_or_conflicting_revision';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_snapshot_order BEFORE INSERT ON marketing_snapshots FOR EACH ROW EXECUTE FUNCTION ops_check_snapshot_order();
