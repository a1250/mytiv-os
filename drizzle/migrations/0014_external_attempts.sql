CREATE TABLE "external_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"target" text NOT NULL,
	"request_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"state" text DEFAULT 'in_flight' NOT NULL,
	"attested_unknown_attempt_id" uuid,
	"provider_ref" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone,
	CONSTRAINT "external_attempts_kind_ck" CHECK ("external_attempts"."kind" in ('gmail_send','meta_schedule')),
	CONSTRAINT "external_attempts_state_ck" CHECK ("external_attempts"."state" in ('in_flight','confirmed','failed','unknown'))
);
--> statement-breakpoint
ALTER TABLE "external_attempts" ADD CONSTRAINT "external_attempts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_attempts" ADD CONSTRAINT "external_attempts_actor_fk" FOREIGN KEY ("business_id","actor_id") REFERENCES "public"."business_memberships"("business_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "external_attempts_request_uq" ON "external_attempts" USING btree ("business_id","request_id");--> statement-breakpoint
CREATE INDEX "external_attempts_target_idx" ON "external_attempts" USING btree ("business_id","target","created_at");--> statement-breakpoint
-- ── Hand-written: the external-action gate, owned by the backend. Same invariant the Focus UI enforces, now in the DB
-- under a per-target lock: no new attempt while one is in flight or after one the target confirmed; after an UNKNOWN
-- outcome only with the user's explicit check of the target for THAT attempt (spent by the attempt it unlocks). ──
CREATE OR REPLACE FUNCTION external_attempt_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.business_id <> OLD.business_id OR NEW.kind <> OLD.kind OR NEW.target <> OLD.target
     OR NEW.request_id <> OLD.request_id OR NEW.actor_id <> OLD.actor_id OR NEW.payload_hash <> OLD.payload_hash
     OR NEW.payload <> OLD.payload OR NEW.attested_unknown_attempt_id IS DISTINCT FROM OLD.attested_unknown_attempt_id
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'external attempts are append-only (identity fields cannot change)';
  END IF;
  -- forward only: in_flight settles once; an unknown outcome may later be resolved by a readback of the target
  IF NOT (OLD.state = NEW.state OR (OLD.state = 'in_flight' AND NEW.state IN ('confirmed', 'failed', 'unknown'))
          OR (OLD.state = 'unknown' AND NEW.state IN ('confirmed', 'failed'))) THEN
    RAISE EXCEPTION 'external attempt state cannot go from % to %', OLD.state, NEW.state;
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER "external_attempts_forward_only" BEFORE UPDATE ON "external_attempts" FOR EACH ROW EXECUTE FUNCTION external_attempt_guard();--> statement-breakpoint
-- an attempt the server never settled (the process died mid-call) has an UNKNOWN outcome. Run in its own statement
-- before admit / list, so the state sticks even when the admit that follows is refused (and rolled back).
CREATE OR REPLACE FUNCTION external_attempt_expire(p_business uuid, p_target text, p_stale_after interval DEFAULT interval '2 minutes') RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  UPDATE external_attempts SET state = 'unknown', error = 'interrupted_before_answer', settled_at = now()
   WHERE business_id = p_business AND target = p_target AND state = 'in_flight' AND created_at < now() - p_stale_after;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION external_attempt_admit(p_business uuid, p_actor uuid, p_request uuid, p_kind text, p_target text, p_hash text,
                                                  p_payload jsonb, p_attested uuid, p_stale_after interval DEFAULT interval '2 minutes') RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_role text; r external_attempts; v_latest external_attempts;
BEGIN
  SELECT role INTO v_role FROM business_memberships WHERE business_id = p_business AND user_id = p_actor AND deactivated_at IS NULL;
  IF v_role IS NULL THEN PERFORM work_raise('not_member'); END IF;
  -- a Meta schedule publishes for the business: owners/admins (as every governed marketing write); a mail reply: any member
  IF p_kind = 'meta_schedule' AND v_role NOT IN ('owner', 'admin') THEN PERFORM work_raise('forbidden'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('external:' || p_business || ':' || p_target, 0));
  SELECT * INTO r FROM external_attempts WHERE business_id = p_business AND request_id = p_request;
  IF FOUND THEN
    IF r.actor_id <> p_actor OR r.kind <> p_kind OR r.target <> p_target OR r.payload_hash <> p_hash THEN PERFORM work_raise('request_conflict'); END IF;
    RETURN jsonb_build_object('admitted', false, 'replayed', true, 'attempt', to_jsonb(r));
  END IF;
  PERFORM external_attempt_expire(p_business, p_target, p_stale_after); -- (callers also run it on its own, so it sticks even when this admit is refused)
  -- a confirmed attempt is never repeated for the same unit (a Gmail draft; a Meta post as a whole), while the
  -- in-flight and UNKNOWN rules below cover the whole target (the thread): a new draft cannot route around them
  IF EXISTS (SELECT 1 FROM external_attempts WHERE business_id = p_business AND target = p_target AND state = 'confirmed'
              AND coalesce(payload ->> 'unit', '') = coalesce(p_payload ->> 'unit', '')) THEN
    PERFORM work_raise('already_done');
  END IF;
  SELECT * INTO v_latest FROM external_attempts WHERE business_id = p_business AND target = p_target ORDER BY created_at DESC, id DESC LIMIT 1;
  IF FOUND AND v_latest.state = 'in_flight' THEN PERFORM work_raise('in_flight'); END IF;
  IF FOUND AND v_latest.state = 'unknown' AND p_attested IS DISTINCT FROM v_latest.id THEN
    PERFORM work_raise('needs_target_check', jsonb_build_object('unknownAttemptId', v_latest.id));
  END IF;
  INSERT INTO external_attempts (business_id, kind, target, request_id, actor_id, payload_hash, payload, state, attested_unknown_attempt_id)
  VALUES (p_business, p_kind, p_target, p_request, p_actor, p_hash, coalesce(p_payload, '{}'::jsonb), 'in_flight',
          CASE WHEN FOUND AND v_latest.state = 'unknown' THEN p_attested END)
  RETURNING * INTO r;
  RETURN jsonb_build_object('admitted', true, 'attempt', to_jsonb(r));
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION external_attempt_settle(p_business uuid, p_attempt uuid, p_state text, p_ref text, p_error text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r external_attempts;
BEGIN
  UPDATE external_attempts SET state = p_state, provider_ref = p_ref, error = p_error, settled_at = now()
   WHERE business_id = p_business AND id = p_attempt AND state = 'in_flight' RETURNING * INTO r;
  IF NOT FOUND THEN SELECT * INTO r FROM external_attempts WHERE business_id = p_business AND id = p_attempt; END IF;
  RETURN to_jsonb(r);
END $$;
