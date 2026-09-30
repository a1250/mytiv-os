-- Run only on an isolated database after migrations (0008). All fixture rows roll back.
-- T-2.1 / owner decision D2: the DB-backed marketing tenant binding.
BEGIN;
DO $$
#variable_conflict use_variable
DECLARE a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  owner_a uuid := gen_random_uuid(); admin_a uuid := gen_random_uuid(); member_a uuid := gen_random_uuid(); owner_b uuid := gen_random_uuid();
  p uuid := gen_random_uuid(); q uuid := gen_random_uuid(); v integer; n integer; violated text;
  cur marketing_bindings%ROWTYPE;
BEGIN
  INSERT INTO businesses(id,name,slug) VALUES (a,'Fixture A',a::text),(b,'Fixture B',b::text);
  INSERT INTO users(id,email) VALUES (owner_a,owner_a::text||'@fixture.invalid'),(admin_a,admin_a::text||'@fixture.invalid'),
    (member_a,member_a::text||'@fixture.invalid'),(owner_b,owner_b::text||'@fixture.invalid');
  INSERT INTO business_memberships(business_id,user_id,role) VALUES (a,owner_a,'owner'),(a,admin_a,'admin'),(a,member_a,'member'),(b,owner_b,'owner');
  INSERT INTO projects(id,business_id,name) VALUES (p,a,'Fixture P'),(q,b,'Fixture Q');

  -- nothing bound yet
  IF EXISTS (SELECT 1 FROM marketing_bindings WHERE business_id=a AND project_id=p) THEN RAISE EXCEPTION 'unexpected binding'; END IF;

  -- owner binds -> version 1, current row mirrors the event
  v := marketing_bind(a,p,'umino',owner_a,gen_random_uuid());
  IF v <> 1 THEN RAISE EXCEPTION 'first bind version % <> 1', v; END IF;
  SELECT * INTO cur FROM marketing_bindings WHERE business_id=a AND project_id=p;
  IF cur.marketing_business <> 'umino' OR cur.binding_version <> 1 OR cur.revoked OR cur.updated_by <> owner_a THEN RAISE EXCEPTION 'current row does not mirror bind v1'; END IF;

  -- binding the same tenant again is refused (no spurious version bump)
  BEGIN PERFORM marketing_bind(a,p,'umino',owner_a,gen_random_uuid()); RAISE EXCEPTION 'unchanged rebind accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_unchanged' THEN RAISE; END IF; END;

  -- only an OWNER of THIS business may bind: admin, member and another business's owner are refused
  BEGIN PERFORM marketing_bind(a,p,'tala',admin_a,gen_random_uuid()); RAISE EXCEPTION 'admin bind accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_owner_required' THEN RAISE; END IF; END;
  BEGIN PERFORM marketing_bind(a,p,'tala',member_a,gen_random_uuid()); RAISE EXCEPTION 'member bind accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_owner_required' THEN RAISE; END IF; END;
  BEGIN PERFORM marketing_bind(a,p,'tala',owner_b,gen_random_uuid()); RAISE EXCEPTION 'foreign owner bind accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_owner_required' THEN RAISE; END IF; END;

  -- a project of another business can never be bound under this business (composite FK)
  BEGIN PERFORM marketing_bind(a,q,'tala',owner_a,gen_random_uuid()); RAISE EXCEPTION 'cross-business project bound';
  EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS violated = CONSTRAINT_NAME;
    IF violated NOT LIKE 'marketing_binding_events_business_id_project_id%' THEN RAISE EXCEPTION 'cross-business bind rejected by % instead of the composite project FK', violated; END IF;
  END;

  -- the tenant must be a canonical slug
  BEGIN PERFORM marketing_bind(a,p,'Bad Slug',owner_a,gen_random_uuid()); RAISE EXCEPTION 'invalid slug accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- rebind to another tenant -> version 2
  v := marketing_bind(a,p,'tala',owner_a,gen_random_uuid());
  IF v <> 2 THEN RAISE EXCEPTION 'rebind version % <> 2', v; END IF;

  -- revoke -> "not connected", version kept; a second revoke is refused
  v := marketing_revoke(a,p,owner_a,gen_random_uuid());
  SELECT * INTO cur FROM marketing_bindings WHERE business_id=a AND project_id=p;
  IF v <> 2 OR NOT cur.revoked OR cur.binding_version <> 2 THEN RAISE EXCEPTION 'revoke did not mark v2 revoked'; END IF;
  BEGIN PERFORM marketing_revoke(a,p,owner_a,gen_random_uuid()); RAISE EXCEPTION 'double revoke accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_not_bound' THEN RAISE; END IF; END;
  BEGIN PERFORM marketing_revoke(a,p,admin_a,gen_random_uuid()); RAISE EXCEPTION 'admin revoke of unbound accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT IN ('marketing_binding_not_bound','marketing_binding_owner_required') THEN RAISE; END IF; END;

  -- rebind after revoke (even to the same tenant) opens a NEW version
  v := marketing_bind(a,p,'tala',owner_a,gen_random_uuid());
  IF v <> 3 THEN RAISE EXCEPTION 'rebind-after-revoke version % <> 3', v; END IF;
  -- an admin cannot revoke either
  BEGIN PERFORM marketing_revoke(a,p,admin_a,gen_random_uuid()); RAISE EXCEPTION 'admin revoke accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_owner_required' THEN RAISE; END IF; END;

  -- full audit trail: bind v1, bind v2, revoke v2, bind v3 — in order, each with actor and request id
  SELECT count(*) INTO n FROM marketing_binding_events WHERE business_id=a AND project_id=p;
  IF n <> 4 THEN RAISE EXCEPTION 'expected 4 binding events, got %', n; END IF;
  IF (SELECT string_agg(event||binding_version||':'||marketing_business, ',' ORDER BY created_at, binding_version, (event='revoke'))
      FROM marketing_binding_events WHERE business_id=a AND project_id=p) <> 'bind1:umino,bind2:tala,revoke2:tala,bind3:tala' THEN
    RAISE EXCEPTION 'event log out of order';
  END IF;

  -- history is append-only
  BEGIN UPDATE marketing_binding_events SET marketing_business='evil' WHERE business_id=a; RAISE EXCEPTION 'event edit accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;
  BEGIN DELETE FROM marketing_binding_events WHERE business_id=a; RAISE EXCEPTION 'event delete accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;

  -- the current row cannot be tampered with or deleted outside the functions
  BEGIN UPDATE marketing_bindings SET marketing_business='evil' WHERE business_id=a AND project_id=p; RAISE EXCEPTION 'current row tamper accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_must_mirror_latest_event' THEN RAISE; END IF; END;
  BEGIN UPDATE marketing_bindings SET revoked=true WHERE business_id=a AND project_id=p; RAISE EXCEPTION 'silent revoke accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_must_mirror_latest_event' THEN RAISE; END IF; END;
  BEGIN DELETE FROM marketing_bindings WHERE business_id=a AND project_id=p; RAISE EXCEPTION 'current row delete accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_never_deleted' THEN RAISE; END IF; END;

  -- the log stays well-formed even for direct inserts: no skipped versions, revoke only closes the current bind
  BEGIN INSERT INTO marketing_binding_events(business_id,project_id,event,binding_version,marketing_business,actor_id,request_id)
    VALUES (a,p,'bind',9,'tala',owner_a,gen_random_uuid()); RAISE EXCEPTION 'skipped version accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_version_must_advance' THEN RAISE; END IF; END;
  BEGIN INSERT INTO marketing_binding_events(business_id,project_id,event,binding_version,marketing_business,actor_id,request_id)
    VALUES (a,p,'revoke',3,'umino',owner_a,gen_random_uuid()); RAISE EXCEPTION 'revoke of another tenant accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_binding_revoke_must_follow_current_bind' THEN RAISE; END IF; END;

  -- a replayed request id never records a second event
  BEGIN
    v := marketing_revoke(a,p,owner_a,(SELECT request_id FROM marketing_binding_events WHERE business_id=a AND binding_version=1));
    RAISE EXCEPTION 'replayed request id accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  SELECT * INTO cur FROM marketing_bindings WHERE business_id=a AND project_id=p;
  IF cur.revoked OR cur.binding_version <> 3 THEN RAISE EXCEPTION 'failed replay changed the current binding'; END IF;

  -- tenant isolation: business B sees nothing of A's binding
  IF EXISTS (SELECT 1 FROM marketing_bindings WHERE business_id=b) THEN RAISE EXCEPTION 'binding leaked to business B'; END IF;

  RAISE NOTICE 'PASS: owner-only bind/revoke, cross-business FK, slug check, versioned rebind, revoke, append-only log, mirrored current row, well-formed direct inserts, replay refusal, tenant isolation';
END $$;
ROLLBACK;
