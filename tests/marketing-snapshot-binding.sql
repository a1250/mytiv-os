-- Run only on an isolated database after migrations (0009). All fixture rows roll back.
-- T-2.3: marketing plan snapshots are tied to the binding version they were imported under.
BEGIN;
DO $$
#variable_conflict use_variable
DECLARE a uuid := gen_random_uuid(); u uuid := gen_random_uuid(); p uuid := gen_random_uuid(); n integer;
  plan1 jsonb := '{"asOf":"2026-01-01T00:00:00Z"}'; plan2 jsonb := '{"asOf":"2026-01-02T00:00:00Z"}';
BEGIN
  INSERT INTO businesses(id,name,slug) VALUES (a,'Fixture A',a::text);
  INSERT INTO users(id,email) VALUES (u,u::text||'@fixture.invalid');
  INSERT INTO business_memberships(business_id,user_id,role) VALUES (a,u,'owner');
  INSERT INTO projects(id,business_id,name) VALUES (p,a,'Fixture');

  -- no binding → nothing can be imported
  BEGIN INSERT INTO marketing_snapshots(business_id,project_id,revision,binding_version,payload,imported_by) VALUES (a,p,1,1,plan1,u);
    RAISE EXCEPTION 'import without a binding accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;

  -- import under binding v1
  PERFORM marketing_bind(a,p,'umino',u,gen_random_uuid());
  INSERT INTO marketing_snapshots(business_id,project_id,revision,binding_version,payload,imported_by) VALUES (a,p,1,1,plan1,u),(a,p,2,1,plan2,u);
  -- an import claiming a version that is not the active one is refused
  BEGIN INSERT INTO marketing_snapshots(business_id,project_id,revision,binding_version,payload,imported_by) VALUES (a,p,3,2,plan2,u);
    RAISE EXCEPTION 'import under a non-current version accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;
  -- ordering still holds within a version
  BEGIN INSERT INTO marketing_snapshots(business_id,project_id,revision,binding_version,payload,imported_by) VALUES (a,p,1,1,plan2,u);
    RAISE EXCEPTION 'duplicate revision within a version accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_or_conflicting_revision' THEN RAISE; END IF; WHEN unique_violation THEN NULL; END;

  -- revoke → imports refused, even under the version that was just current
  PERFORM marketing_revoke(a,p,u,gen_random_uuid());
  BEGIN INSERT INTO marketing_snapshots(business_id,project_id,revision,binding_version,payload,imported_by) VALUES (a,p,3,1,plan2,u);
    RAISE EXCEPTION 'import under a revoked binding accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;

  -- rebind → version 2; the revision sequence restarts at 1 under the new version
  PERFORM marketing_bind(a,p,'umino',u,gen_random_uuid());
  INSERT INTO marketing_snapshots(business_id,project_id,revision,binding_version,payload,imported_by) VALUES (a,p,1,2,plan1,u);
  -- a late import confirmed against the historical projection (v1) is refused
  BEGIN INSERT INTO marketing_snapshots(business_id,project_id,revision,binding_version,payload,imported_by) VALUES (a,p,3,1,plan2,u);
    RAISE EXCEPTION 'import against a historical binding version accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;

  -- history stays readable, labelled by version: v1 has revisions 1,2; v2 has revision 1
  IF (SELECT string_agg(binding_version||':'||revision, ',' ORDER BY binding_version, revision) FROM marketing_snapshots WHERE business_id=a AND project_id=p) <> '1:1,1:2,2:1' THEN
    RAISE EXCEPTION 'snapshot history by binding version is wrong';
  END IF;
  -- the current plan is the latest revision of the ACTIVE version only
  SELECT revision INTO n FROM marketing_snapshots WHERE business_id=a AND project_id=p
    AND binding_version=(SELECT binding_version FROM marketing_bindings WHERE business_id=a AND project_id=p AND NOT revoked)
    ORDER BY revision DESC LIMIT 1;
  IF n <> 1 THEN RAISE EXCEPTION 'current plan is not v2 revision 1'; END IF;

  RAISE NOTICE 'PASS: snapshots need the active binding version, revisions restart per version, revoked/historical versions refuse imports, history labelled by version';
END $$;
ROLLBACK;
