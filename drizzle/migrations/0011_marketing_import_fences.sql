CREATE TABLE "marketing_import_fences" (
	"business_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"fenced_by" uuid NOT NULL,
	"fenced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_import_fences_business_id_request_id_pk" PRIMARY KEY("business_id","request_id")
);
--> statement-breakpoint
ALTER TABLE "marketing_import_fences" ADD CONSTRAINT "marketing_import_fences_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_import_fences" ADD CONSTRAINT "marketing_import_fences_fenced_by_users_id_fk" FOREIGN KEY ("fenced_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- GPT review P1-2 (round 2): make an import readback DEFINITIVE. Every artifact insert (the import function and
-- any direct insert) takes a transaction-scoped advisory lock on (business, request_id) and refuses a request id
-- that has been fenced. The readback only TRIES that lock: while it is held the original write is still in flight
-- (unresolved); once it is free, either the artifact is visible (written) or a fence is inserted in the same
-- transaction (not written) — after which the original can never commit an artifact for that request id.
CREATE FUNCTION marketing_import_fence_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('marketing_import_request:' || NEW.business_id::text || ':' || NEW.request_id::text, 0));
  IF EXISTS (SELECT 1 FROM marketing_import_fences WHERE business_id = NEW.business_id AND request_id = NEW.request_id) THEN
    RAISE EXCEPTION 'import_request_fenced';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_import_fence_guard BEFORE INSERT ON marketing_artifacts FOR EACH ROW EXECUTE FUNCTION marketing_import_fence_guard();
--> statement-breakpoint
-- 'written'     the request's artifact exists (committed)
-- 'in_flight'   another transaction holds the request's lock: the original write has not terminated — nothing is decided
-- 'not_written' no artifact, lock free: a fence is recorded now, so the request id can never produce an artifact
CREATE FUNCTION marketing_import_readback(p_business uuid, p_request_id uuid, p_actor uuid) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtextextended('marketing_import_request:' || p_business::text || ':' || p_request_id::text, 0)) THEN
    RETURN 'in_flight';
  END IF;
  IF EXISTS (SELECT 1 FROM marketing_artifacts WHERE business_id = p_business AND request_id = p_request_id) THEN
    RETURN 'written';
  END IF;
  INSERT INTO marketing_import_fences(business_id, request_id, fenced_by) VALUES (p_business, p_request_id, p_actor)
    ON CONFLICT (business_id, request_id) DO NOTHING;
  RETURN 'not_written';
END;
$$;
--> statement-breakpoint
-- A fence is permanent evidence: never updated or deleted.
CREATE FUNCTION marketing_import_fence_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'marketing_import_fences is append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER marketing_import_fence_immutable BEFORE UPDATE OR DELETE ON marketing_import_fences FOR EACH ROW EXECUTE FUNCTION marketing_import_fence_immutable();
