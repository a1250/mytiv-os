CREATE TABLE "marketing_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"binding_version" integer NOT NULL,
	"revision" integer NOT NULL,
	"source_revision" text NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"content_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"imported_by" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_artifact_kind" CHECK ("marketing_artifacts"."kind" in ('C2a','C3a','C4','C5','C7','C8','C9','C10','C11','C12','C13','C14')),
	CONSTRAINT "marketing_artifact_versions_positive" CHECK ("marketing_artifacts"."binding_version" >= 1 and "marketing_artifacts"."revision" >= 1),
	CONSTRAINT "marketing_artifact_hash" CHECK ("marketing_artifacts"."content_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "marketing_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"binding_version" integer NOT NULL,
	"source_artifact_id" uuid NOT NULL,
	"approval_id" text NOT NULL,
	"content_hash" text NOT NULL,
	"decision" text NOT NULL,
	"note" text NOT NULL,
	"decided_by" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exported_at" timestamp with time zone,
	"reconciled_state" text,
	CONSTRAINT "marketing_decision_kind" CHECK ("marketing_decisions"."decision" in ('approved','rejected')),
	CONSTRAINT "marketing_decision_note" CHECK (length(btrim("marketing_decisions"."note")) >= 1),
	CONSTRAINT "marketing_decision_hash" CHECK ("marketing_decisions"."content_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "marketing_decision_reconciled" CHECK ("marketing_decisions"."reconciled_state" is null or "marketing_decisions"."reconciled_state" in ('awaiting','open','applied','stale','conflict','expired','missing','unreviewed','resolved'))
);
--> statement-breakpoint
CREATE TABLE "marketing_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"binding_version" integer NOT NULL,
	"kind" text NOT NULL,
	"source_artifact_id" uuid,
	"target_id" text NOT NULL,
	"approval_id" text,
	"precondition_hash" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exported_at" timestamp with time zone,
	"reconciled_state" text,
	CONSTRAINT "marketing_evidence_kind" CHECK ("marketing_evidence"."kind" in ('publish_evidence','brain_proposal','outcome_evidence','execution_receipt')),
	CONSTRAINT "marketing_evidence_hash" CHECK ("marketing_evidence"."precondition_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "marketing_evidence_review" CHECK ("marketing_evidence"."kind" = 'brain_proposal' or ("marketing_evidence"."reviewed_by" is not null and "marketing_evidence"."reviewed_at" is not null)),
	CONSTRAINT "marketing_evidence_receipt_link" CHECK ("marketing_evidence"."kind" <> 'execution_receipt' or ("marketing_evidence"."approval_id" is not null and "marketing_evidence"."source_artifact_id" is not null)),
	CONSTRAINT "marketing_evidence_reconciled" CHECK ("marketing_evidence"."reconciled_state" is null or "marketing_evidence"."reconciled_state" in ('awaiting','open','applied','stale','conflict','expired','missing','unreviewed','resolved'))
);
--> statement-breakpoint
-- Must precede the composite FKs that reference marketing_artifacts(business_id, id).
CREATE UNIQUE INDEX "marketing_artifact_business_id_uq" ON "marketing_artifacts" USING btree ("business_id","id");--> statement-breakpoint
ALTER TABLE "marketing_artifacts" ADD CONSTRAINT "marketing_artifacts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_artifacts" ADD CONSTRAINT "marketing_artifacts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_artifacts" ADD CONSTRAINT "marketing_artifacts_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_artifacts" ADD CONSTRAINT "marketing_artifacts_business_id_project_id_projects_business_id_id_fk" FOREIGN KEY ("business_id","project_id") REFERENCES "public"."projects"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_artifacts" ADD CONSTRAINT "marketing_artifacts_business_id_imported_by_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","imported_by") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_decisions" ADD CONSTRAINT "marketing_decisions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_decisions" ADD CONSTRAINT "marketing_decisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_decisions" ADD CONSTRAINT "marketing_decisions_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_decisions" ADD CONSTRAINT "marketing_decisions_business_id_project_id_projects_business_id_id_fk" FOREIGN KEY ("business_id","project_id") REFERENCES "public"."projects"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_decisions" ADD CONSTRAINT "marketing_decisions_business_id_decided_by_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","decided_by") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_decisions" ADD CONSTRAINT "marketing_decisions_business_id_source_artifact_id_marketing_artifacts_business_id_id_fk" FOREIGN KEY ("business_id","source_artifact_id") REFERENCES "public"."marketing_artifacts"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_business_id_project_id_projects_business_id_id_fk" FOREIGN KEY ("business_id","project_id") REFERENCES "public"."projects"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_business_id_created_by_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","created_by") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_business_id_reviewed_by_business_memberships_business_id_user_id_fk" FOREIGN KEY ("business_id","reviewed_by") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_evidence" ADD CONSTRAINT "marketing_evidence_business_id_source_artifact_id_marketing_artifacts_business_id_id_fk" FOREIGN KEY ("business_id","source_artifact_id") REFERENCES "public"."marketing_artifacts"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_artifact_revision_uq" ON "marketing_artifacts" USING btree ("business_id","project_id","kind","binding_version","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_artifact_request_uq" ON "marketing_artifacts" USING btree ("business_id","request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_decision_request_uq" ON "marketing_decisions" USING btree ("business_id","request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_decision_item_uq" ON "marketing_decisions" USING btree ("business_id","project_id","binding_version","approval_id","content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_evidence_request_uq" ON "marketing_evidence" USING btree ("business_id","request_id");--> statement-breakpoint
CREATE TRIGGER marketing_artifacts_immutable BEFORE UPDATE OR DELETE ON marketing_artifacts FOR EACH ROW EXECUTE FUNCTION ops_reject_history_change();
--> statement-breakpoint
-- An engine artifact is imported only under the ACTIVE binding version (row locked FOR SHARE so a concurrent
-- rebind/revoke waits) and numbered by the database: revision = previous + 1 per (business, project, kind,
-- binding_version), restarting at 1 under a new binding version; as_of never moves backwards.
CREATE FUNCTION marketing_import_artifact(p_business uuid, p_project uuid, p_kind text, p_binding_version integer, p_source_revision text,
  p_as_of timestamptz, p_content_hash text, p_payload jsonb, p_actor uuid, p_request_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE cur marketing_bindings%ROWTYPE; latest marketing_artifacts%ROWTYPE; next_revision integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('marketing_artifact:' || p_business::text || ':' || p_project::text || ':' || p_kind, 0));
  SELECT * INTO cur FROM marketing_bindings WHERE business_id = p_business AND project_id = p_project FOR SHARE;
  IF cur.binding_version IS NULL OR cur.revoked OR cur.binding_version <> p_binding_version THEN RAISE EXCEPTION 'stale_binding_version'; END IF;
  SELECT * INTO latest FROM marketing_artifacts WHERE business_id = p_business AND project_id = p_project AND kind = p_kind AND binding_version = p_binding_version
    ORDER BY revision DESC LIMIT 1;
  IF latest.id IS NOT NULL AND p_as_of < latest.as_of THEN RAISE EXCEPTION 'stale_or_conflicting_revision'; END IF;
  next_revision := COALESCE(latest.revision, 0) + 1;
  INSERT INTO marketing_artifacts(business_id, project_id, kind, binding_version, revision, source_revision, as_of, content_hash, payload, imported_by, request_id)
    VALUES (p_business, p_project, p_kind, p_binding_version, next_revision, p_source_revision, p_as_of, p_content_hash, p_payload, p_actor, p_request_id);
  RETURN next_revision;
END;
$$;
--> statement-breakpoint
-- Direct inserts obey the same rules (defence in depth): active binding version and strict revision order.
CREATE FUNCTION marketing_artifact_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cur marketing_bindings%ROWTYPE; latest marketing_artifacts%ROWTYPE;
BEGIN
  SELECT * INTO cur FROM marketing_bindings WHERE business_id = NEW.business_id AND project_id = NEW.project_id;
  IF cur.binding_version IS NULL OR cur.revoked OR cur.binding_version <> NEW.binding_version THEN RAISE EXCEPTION 'stale_binding_version'; END IF;
  SELECT * INTO latest FROM marketing_artifacts WHERE business_id = NEW.business_id AND project_id = NEW.project_id AND kind = NEW.kind AND binding_version = NEW.binding_version
    ORDER BY revision DESC LIMIT 1;
  IF NEW.revision <> COALESCE(latest.revision, 0) + 1 OR (latest.id IS NOT NULL AND NEW.as_of < latest.as_of) THEN RAISE EXCEPTION 'stale_or_conflicting_revision'; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_artifact_order BEFORE INSERT ON marketing_artifacts FOR EACH ROW EXECUTE FUNCTION marketing_artifact_order();
--> statement-breakpoint
-- Decisions and evidence are written once, under the ACTIVE binding version, against a source artifact of that
-- same version (a decision on a historical projection is refused). A decision must name an item that exists,
-- with that exact content, in the C2a artifact the human saw; a receipt must link to an APPROVED item of it.
CREATE FUNCTION marketing_record_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cur marketing_bindings%ROWTYPE; src marketing_artifacts%ROWTYPE; rec jsonb := to_jsonb(NEW);
  is_decision boolean := TG_TABLE_NAME = 'marketing_decisions';
BEGIN
  SELECT * INTO cur FROM marketing_bindings WHERE business_id = NEW.business_id AND project_id = NEW.project_id FOR SHARE;
  IF cur.binding_version IS NULL OR cur.revoked OR cur.binding_version <> NEW.binding_version THEN RAISE EXCEPTION 'stale_binding_version'; END IF;
  IF NEW.source_artifact_id IS NOT NULL THEN
    SELECT * INTO src FROM marketing_artifacts WHERE business_id = NEW.business_id AND id = NEW.source_artifact_id;
    IF src.project_id <> NEW.project_id OR src.binding_version <> NEW.binding_version THEN RAISE EXCEPTION 'stale_binding_version'; END IF;
  END IF;
  -- (fields read through jsonb: the two tables share this guard but not all columns)
  IF is_decision OR rec->>'kind' = 'execution_receipt' THEN
    IF src.kind IS DISTINCT FROM 'C2a' OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(src.payload->'items') item
      WHERE item->>'approval_id' = rec->>'approval_id'
        AND item->>'content_hash' = CASE WHEN is_decision THEN rec->>'content_hash' ELSE rec->>'precondition_hash' END
        AND (is_decision OR item->>'state' = 'approved')
    ) THEN RAISE EXCEPTION 'approval_linkage_invalid'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_decision_guard BEFORE INSERT ON marketing_decisions FOR EACH ROW EXECUTE FUNCTION marketing_record_guard();
--> statement-breakpoint
CREATE TRIGGER marketing_evidence_guard BEFORE INSERT ON marketing_evidence FOR EACH ROW EXECUTE FUNCTION marketing_record_guard();
--> statement-breakpoint
-- After insert only the export stamp (set once) and the reconciliation state may change; nothing is deleted.
CREATE FUNCTION marketing_record_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Ops history is append-only'; END IF;
  IF OLD.exported_at IS NOT NULL AND NEW.exported_at IS DISTINCT FROM OLD.exported_at THEN RAISE EXCEPTION 'marketing_record_export_stamped_once'; END IF;
  IF (to_jsonb(NEW) - 'exported_at' - 'reconciled_state') IS DISTINCT FROM (to_jsonb(OLD) - 'exported_at' - 'reconciled_state') THEN
    RAISE EXCEPTION 'Ops history is append-only';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_decisions_immutable BEFORE UPDATE OR DELETE ON marketing_decisions FOR EACH ROW EXECUTE FUNCTION marketing_record_immutable();
--> statement-breakpoint
CREATE TRIGGER marketing_evidence_immutable BEFORE UPDATE OR DELETE ON marketing_evidence FOR EACH ROW EXECUTE FUNCTION marketing_record_immutable();
