-- Run only on an isolated database after migrations. All fixture rows roll back.
BEGIN;
DO $$
DECLARE a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); u uuid := gen_random_uuid(); p uuid := gen_random_uuid(); action_id uuid := gen_random_uuid(); rid uuid := gen_random_uuid();
BEGIN
  INSERT INTO businesses(id,name,slug) VALUES (a,'Fixture A',a::text),(b,'Fixture B',b::text);
  INSERT INTO users(id,email) VALUES(u,u::text || '@fixture.invalid');
  INSERT INTO business_memberships(business_id,user_id,role) VALUES(a,u,'owner');
  INSERT INTO projects(id,business_id,name) VALUES(p,a,'Fixture');
  INSERT INTO ops_actions(id,business_id,user_id,project_id,request_id,action,payload_hash) VALUES(action_id,a,u,p,rid,'test','hash');
  BEGIN
    INSERT INTO ops_actions(business_id,user_id,project_id,request_id,action,payload_hash) VALUES(a,u,p,rid,'test','hash');
    RAISE EXCEPTION 'duplicate claim accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO marketing_snapshots(business_id,project_id,revision,payload,imported_by) VALUES(b,p,1,'{}',u);
    RAISE EXCEPTION 'cross-business snapshot accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
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
  RAISE NOTICE 'PASS: duplicate claims, project/receipt isolation, immutable claims/audit/snapshots, unique revisions';
END $$;
ROLLBACK;
