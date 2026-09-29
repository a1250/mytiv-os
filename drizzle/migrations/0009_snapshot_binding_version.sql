DROP INDEX "marketing_snapshot_revision_uq";--> statement-breakpoint
-- Existing snapshots predate the DB binding (they were imported under the env-era binding): version 1.
-- The default is dropped right after the backfill so every new snapshot must state its binding version.
ALTER TABLE "marketing_snapshots" ADD COLUMN "binding_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_snapshots" ALTER COLUMN "binding_version" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "marketing_snapshots" ADD CONSTRAINT "marketing_snapshot_binding_version_positive" CHECK ("binding_version" >= 1);--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_snapshot_binding_revision_uq" ON "marketing_snapshots" USING btree ("business_id","project_id","binding_version","revision");
--> statement-breakpoint
-- Snapshot ordering is per binding version (revisions restart at 1 under a new version), and a plan may be
-- imported only under the ACTIVE binding version of its (business, project): an import confirmed against a
-- binding that has since been revoked or replaced is refused. The binding row is locked FOR SHARE so a
-- concurrent rebind/revoke waits for the import (and vice versa).
CREATE OR REPLACE FUNCTION ops_check_snapshot_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest marketing_snapshots%ROWTYPE; cur marketing_bindings%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.business_id::text || ':' || NEW.project_id::text, 0));
  SELECT * INTO cur FROM marketing_bindings WHERE business_id = NEW.business_id AND project_id = NEW.project_id FOR SHARE;
  IF cur.binding_version IS NULL OR cur.revoked OR cur.binding_version <> NEW.binding_version THEN
    RAISE EXCEPTION 'stale_binding_version';
  END IF;
  SELECT * INTO latest FROM marketing_snapshots
    WHERE business_id = NEW.business_id AND project_id = NEW.project_id AND binding_version = NEW.binding_version
    ORDER BY revision DESC LIMIT 1;
  IF FOUND AND (NEW.revision < latest.revision OR (NEW.payload->>'asOf')::timestamptz < (latest.payload->>'asOf')::timestamptz) THEN
    RAISE EXCEPTION 'stale_or_conflicting_revision';
  END IF;
  RETURN NEW;
END;
$$;
