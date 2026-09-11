-- Run only on an isolated database after migrations. All fixture rows roll back.
BEGIN;
DO $$
DECLARE a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); u uuid := gen_random_uuid(); p uuid := gen_random_uuid(); action_id uuid := gen_random_uuid(); rid uuid := gen_random_uuid(); violated text;
BEGIN
  -- The composite tenant/project foreign keys are what stop a project from being attached to another
  -- business. A migration applied by a tool that mishandles statement breakpoints can silently drop
  -- them while every single-column FK still passes, so their presence is asserted, not assumed.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid = 'marketing_snapshots'::regclass AND c.contype = 'f' AND c.confrelid = 'projects'::regclass
      AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = c.conrelid AND attname = 'business_id'),
                           (SELECT attnum FROM pg_attribute WHERE attrelid = c.conrelid AND attname = 'project_id')]
  ) THEN RAISE EXCEPTION 'composite (business_id, project_id) FK missing on marketing_snapshots'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid = 'ops_actions'::regclass AND c.contype = 'f' AND c.confrelid = 'projects'::regclass
      AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = c.conrelid AND attname = 'business_id'),
                           (SELECT attnum FROM pg_attribute WHERE attrelid = c.conrelid AND attname = 'project_id')]
  ) THEN RAISE EXCEPTION 'composite (business_id, project_id) FK missing on ops_actions'; END IF;
  INSERT INTO businesses(id,name,slug) VALUES (a,'Fixture A',a::text),(b,'Fixture B',b::text);
  INSERT INTO users(id,email) VALUES(u,u::text || '@fixture.invalid');
  INSERT INTO business_memberships(business_id,user_id,role) VALUES(a,u,'owner'),(b,u,'owner');
  INSERT INTO projects(id,business_id,name) VALUES(p,a,'Fixture');
  INSERT INTO ops_actions(id,business_id,user_id,project_id,request_id,action,payload_hash) VALUES(action_id,a,u,p,rid,'test','hash');
  BEGIN
    INSERT INTO ops_actions(business_id,user_id,project_id,request_id,action,payload_hash) VALUES(a,u,p,rid,'test','hash');
    RAISE EXCEPTION 'duplicate claim accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO marketing_snapshots(business_id,project_id,revision,payload,imported_by) VALUES(b,p,1,'{}',u);
    RAISE EXCEPTION 'cross-business snapshot accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS violated = CONSTRAINT_NAME;
    IF violated NOT LIKE 'marketing_snapshots_business_id_project_id%' THEN
      RAISE EXCEPTION 'cross-business snapshot rejected by % instead of the composite project FK', violated;
    END IF;
  END;
  BEGIN
    INSERT INTO ops_actions(business_id,user_id,project_id,request_id,action,payload_hash) VALUES(b,u,p,gen_random_uuid(),'test','hash');
    RAISE EXCEPTION 'cross-business claim accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS violated = CONSTRAINT_NAME;
    IF violated NOT LIKE 'ops_actions_business_id_project_id%' THEN
      RAISE EXCEPTION 'cross-business claim rejected by % instead of the composite project FK', violated;
    END IF;
  END;
  BEGIN
    INSERT INTO ops_audit_events(business_id,action_id,event,detail) VALUES(b,action_id,'test','{}');
    RAISE EXCEPTION 'cross-business receipt accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    DELETE FROM ops_actions WHERE id=action_id;
    RAISE EXCEPTION 'claim deletion accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;
  INSERT INTO ops_audit_events(business_id,action_id,event,detail) VALUES(a,action_id,'confirmed','{}');
  BEGIN
    UPDATE ops_audit_events SET event='rewritten' WHERE business_id=a;
    RAISE EXCEPTION 'audit edit accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;
  INSERT INTO marketing_snapshots(business_id,project_id,revision,payload,imported_by) VALUES(a,p,1,'{}',u);
  BEGIN
    INSERT INTO marketing_snapshots(business_id,project_id,revision,payload,imported_by) VALUES(a,p,1,'{}',u);
    RAISE EXCEPTION 'duplicate plan revision accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    UPDATE marketing_snapshots SET payload='{"modified":true}' WHERE business_id=a;
    RAISE EXCEPTION 'snapshot edit accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;
  BEGIN
    INSERT INTO marketing_snapshots(business_id,project_id,revision,payload,imported_by) VALUES(a,p,0,'{}',u);
    RAISE EXCEPTION 'older revision accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_or_conflicting_revision' THEN RAISE; END IF; END;
  RAISE NOTICE 'PASS: composite project FKs present and enforced, duplicate claims, project/receipt isolation, immutable claims/audit/snapshots, unique revisions';
END $$;
ROLLBACK;
