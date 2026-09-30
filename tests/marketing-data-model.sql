-- Run only on an isolated database after migrations (0010). All fixture rows roll back.
-- T-3.1: marketing_artifacts / marketing_decisions / marketing_evidence.
BEGIN;
DO $$
#variable_conflict use_variable
DECLARE a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); u uuid := gen_random_uuid(); m uuid := gen_random_uuid(); v uuid := gen_random_uuid();
  p uuid := gen_random_uuid(); q uuid := gen_random_uuid(); n integer; art1 uuid; art2 uuid; wb uuid; dec uuid; violated text;
  h text := repeat('a', 64); h2 text := repeat('b', 64);
  queue jsonb := jsonb_build_object('items', jsonb_build_array(
    jsonb_build_object('approval_id','a1','content_hash',repeat('a',64),'state','pending'),
    jsonb_build_object('approval_id','a2','content_hash',repeat('a',64),'state','approved')));
  t1 timestamptz := '2026-01-02T00:00:00Z'; t0 timestamptz := '2026-01-01T00:00:00Z';
BEGIN
  INSERT INTO businesses(id,name,slug) VALUES (a,'A',a::text),(b,'B',b::text);
  INSERT INTO users(id,email) VALUES (u,u::text||'@fixture.invalid'),(m,m::text||'@fixture.invalid'),(v,v::text||'@fixture.invalid');
  INSERT INTO business_memberships(business_id,user_id,role) VALUES (a,u,'owner'),(a,m,'member'),(b,v,'owner');
  INSERT INTO projects(id,business_id,name) VALUES (p,a,'P'),(q,b,'Q');

  -- ── artifacts ──
  BEGIN PERFORM marketing_import_artifact(a,p,'C2a',1,'rev-1',t1,h,queue,u,gen_random_uuid()); RAISE EXCEPTION 'import without binding accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;
  PERFORM marketing_bind(a,p,'umino',u,gen_random_uuid());
  n := marketing_import_artifact(a,p,'C2a',1,'rev-1',t1,h,queue,u,gen_random_uuid()); IF n <> 1 THEN RAISE EXCEPTION 'first C2a revision %', n; END IF;
  n := marketing_import_artifact(a,p,'C2a',1,'rev-2',t1,h,queue,u,gen_random_uuid()); IF n <> 2 THEN RAISE EXCEPTION 'second C2a revision %', n; END IF;
  n := marketing_import_artifact(a,p,'C7',1,'rev-1',t0,h,'{"tasks":[]}',u,gen_random_uuid()); IF n <> 1 THEN RAISE EXCEPTION 'revisions are per kind'; END IF;
  BEGIN PERFORM marketing_import_artifact(a,p,'C2a',1,'rev-0',t0,h,queue,u,gen_random_uuid()); RAISE EXCEPTION 'older as_of accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_or_conflicting_revision' THEN RAISE; END IF; END;
  BEGIN PERFORM marketing_import_artifact(a,p,'C2a',2,'rev-3',t1,h,queue,u,gen_random_uuid()); RAISE EXCEPTION 'non-active version accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;
  FOREACH violated IN ARRAY ARRAY['C1','C2b','C3b','C6','C15','C16','bogus'] LOOP
    BEGIN PERFORM marketing_import_artifact(a,p,violated,1,'r',t1,h,'{}',u,gen_random_uuid()); RAISE EXCEPTION 'kind % accepted as an engine artifact', violated;
    EXCEPTION WHEN check_violation THEN NULL; END;
  END LOOP;
  BEGIN PERFORM marketing_import_artifact(a,p,'C9',1,'r',t1,'nothex','{}',u,gen_random_uuid()); RAISE EXCEPTION 'bad content hash accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  -- direct inserts obey the same order (no skipped revision) and binding rules
  BEGIN INSERT INTO marketing_artifacts(business_id,project_id,kind,binding_version,revision,source_revision,as_of,content_hash,payload,imported_by,request_id)
    VALUES (a,p,'C2a',1,9,'r',t1,h,queue,u,gen_random_uuid()); RAISE EXCEPTION 'skipped revision accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_or_conflicting_revision' THEN RAISE; END IF; END;
  -- append-only
  BEGIN UPDATE marketing_artifacts SET payload='{}' WHERE business_id=a; RAISE EXCEPTION 'artifact edit accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;
  BEGIN DELETE FROM marketing_artifacts WHERE business_id=a; RAISE EXCEPTION 'artifact delete accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;
  -- cross-business: the composite project FK rejects a project of another business (trigger disabled so the FK itself is proven)
  ALTER TABLE marketing_artifacts DISABLE TRIGGER marketing_artifact_order;
  BEGIN INSERT INTO marketing_artifacts(business_id,project_id,kind,binding_version,revision,source_revision,as_of,content_hash,payload,imported_by,request_id)
    VALUES (b,p,'C2a',1,1,'r',t1,h,queue,v,gen_random_uuid()); RAISE EXCEPTION 'cross-business artifact accepted';
  EXCEPTION WHEN foreign_key_violation THEN GET STACKED DIAGNOSTICS violated = CONSTRAINT_NAME;
    IF violated NOT LIKE 'marketing_artifacts_business_id_project_id%' THEN RAISE EXCEPTION 'cross-business artifact rejected by % instead of the composite project FK', violated; END IF; END;
  ALTER TABLE marketing_artifacts ENABLE TRIGGER marketing_artifact_order;
  SELECT id INTO art1 FROM marketing_artifacts WHERE business_id=a AND project_id=p AND kind='C2a' AND binding_version=1 AND revision=2;
  SELECT id INTO wb FROM marketing_artifacts WHERE business_id=a AND project_id=p AND kind='C7';

  -- ── decisions (C2b) ──
  INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,art1,'a1',h,'approved','looks right',u,gen_random_uuid()) RETURNING id INTO dec;
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,art1,'a1',h,'rejected','changed my mind',u,gen_random_uuid()); RAISE EXCEPTION 'second decision on the same content accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,art1,'a1',h2,'approved','x',u,gen_random_uuid()); RAISE EXCEPTION 'decision on content the human never saw accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'approval_linkage_invalid' THEN RAISE; END IF; END;
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,art1,'nope',h,'approved','x',u,gen_random_uuid()); RAISE EXCEPTION 'decision on unknown approval accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'approval_linkage_invalid' THEN RAISE; END IF; END;
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,wb,'a2',h,'approved','x',u,gen_random_uuid()); RAISE EXCEPTION 'decision against a non-C2a artifact accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'approval_linkage_invalid' THEN RAISE; END IF; END;
  -- the source must BE the approval queue: another kind whose payload happens to carry a matching item is refused
  PERFORM marketing_import_artifact(a,p,'C12',1,'r',t1,h,queue,u,gen_random_uuid());
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,(SELECT id FROM marketing_artifacts WHERE business_id=a AND kind='C12'),'a2',h,'approved','x',u,gen_random_uuid()); RAISE EXCEPTION 'decision against a non-queue artifact carrying items accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'approval_linkage_invalid' THEN RAISE; END IF; END;
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,art1,'a2',h,'approved','   ',u,gen_random_uuid()); RAISE EXCEPTION 'blank note accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (b,q,1,art1,'a2',h,'approved','x',v,gen_random_uuid()); RAISE EXCEPTION 'cross-business source artifact accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; WHEN foreign_key_violation THEN NULL; END;
  -- export stamp once; reconciliation state may move; everything else immutable; never deleted
  UPDATE marketing_decisions SET exported_at = now() WHERE id=dec;
  BEGIN UPDATE marketing_decisions SET exported_at = now() + interval '1 hour' WHERE id=dec; RAISE EXCEPTION 'export re-stamped';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'marketing_record_export_stamped_once' THEN RAISE; END IF; END;
  UPDATE marketing_decisions SET reconciled_state='awaiting' WHERE id=dec;
  UPDATE marketing_decisions SET reconciled_state='applied' WHERE id=dec;
  BEGIN UPDATE marketing_decisions SET reconciled_state='done' WHERE id=dec; RAISE EXCEPTION 'unknown reconciliation state accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE marketing_decisions SET decision='rejected' WHERE id=dec; RAISE EXCEPTION 'decision rewritten';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;
  BEGIN DELETE FROM marketing_decisions WHERE id=dec; RAISE EXCEPTION 'decision deleted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;

  -- ── evidence (C3b / C6 / C15 / C16) ──
  BEGIN INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,source_artifact_id,target_id,precondition_hash,payload,created_by,request_id)
    VALUES (a,p,1,'publish_evidence',wb,'t-1',h,'{}',u,gen_random_uuid()); RAISE EXCEPTION 'unreviewed publish evidence accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,source_artifact_id,target_id,precondition_hash,reviewed_by,reviewed_at,payload,created_by,request_id)
    VALUES (a,p,1,'publish_evidence',wb,'t-1',h,u,now(),'{}',u,gen_random_uuid());
  INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,target_id,precondition_hash,payload,created_by,request_id)
    VALUES (a,p,1,'brain_proposal','menu.yaml#items[0].price',h,'{}',m,gen_random_uuid()); -- a proposal needs no review
  BEGIN INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,target_id,approval_id,precondition_hash,reviewed_by,reviewed_at,payload,created_by,request_id)
    VALUES (a,p,1,'execution_receipt','a2','a2',h,u,now(),'{}',u,gen_random_uuid()); RAISE EXCEPTION 'receipt without source queue accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'approval_linkage_invalid' THEN RAISE; END IF; END;
  -- …and the CHECK constraint alone refuses it too (guard disabled so the constraint itself is proven)
  ALTER TABLE marketing_evidence DISABLE TRIGGER marketing_evidence_guard;
  BEGIN INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,target_id,approval_id,precondition_hash,reviewed_by,reviewed_at,payload,created_by,request_id)
    VALUES (a,p,1,'execution_receipt','a2','a2',h,u,now(),'{}',u,gen_random_uuid()); RAISE EXCEPTION 'receipt without source queue accepted by the CHECK';
  EXCEPTION WHEN check_violation THEN NULL; END;
  ALTER TABLE marketing_evidence ENABLE TRIGGER marketing_evidence_guard;
  BEGIN INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,source_artifact_id,target_id,approval_id,precondition_hash,reviewed_by,reviewed_at,payload,created_by,request_id)
    VALUES (a,p,1,'execution_receipt',art1,'a1','a1',h,u,now(),'{}',u,gen_random_uuid()); RAISE EXCEPTION 'receipt for a pending approval accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'approval_linkage_invalid' THEN RAISE; END IF; END;
  BEGIN INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,source_artifact_id,target_id,approval_id,precondition_hash,reviewed_by,reviewed_at,payload,created_by,request_id)
    VALUES (a,p,1,'execution_receipt',art1,'a2','a2',h2,u,now(),'{}',u,gen_random_uuid()); RAISE EXCEPTION 'receipt with stale content hash accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'approval_linkage_invalid' THEN RAISE; END IF; END;
  INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,source_artifact_id,target_id,approval_id,precondition_hash,reviewed_by,reviewed_at,payload,created_by,request_id)
    VALUES (a,p,1,'execution_receipt',art1,'a2','a2',h,u,now(),'{}',u,gen_random_uuid());
  BEGIN INSERT INTO marketing_evidence(business_id,project_id,binding_version,kind,target_id,precondition_hash,payload,created_by,request_id)
    VALUES (a,p,1,'bogus','x',h,'{}',u,gen_random_uuid()); RAISE EXCEPTION 'unknown evidence kind accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN UPDATE marketing_evidence SET payload='{"x":1}' WHERE business_id=a; RAISE EXCEPTION 'evidence rewritten';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ops history is append-only' THEN RAISE; END IF; END;

  -- ── revoke → rebind: history stays, decisions on the historical projection are refused, revisions restart ──
  PERFORM marketing_revoke(a,p,u,gen_random_uuid());
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,1,art1,'a2',h,'approved','x',u,gen_random_uuid()); RAISE EXCEPTION 'decision under a revoked binding accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;
  PERFORM marketing_bind(a,p,'umino',u,gen_random_uuid());
  BEGIN INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,2,art1,'a2',h,'approved','x',u,gen_random_uuid()); RAISE EXCEPTION 'decision against a historical (v1) projection accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'stale_binding_version' THEN RAISE; END IF; END;
  n := marketing_import_artifact(a,p,'C2a',2,'rev-9',t0,h,queue,u,gen_random_uuid()); IF n <> 1 THEN RAISE EXCEPTION 'revision did not restart under v2: %', n; END IF;
  SELECT id INTO art2 FROM marketing_artifacts WHERE business_id=a AND project_id=p AND kind='C2a' AND binding_version=2;
  INSERT INTO marketing_decisions(business_id,project_id,binding_version,source_artifact_id,approval_id,content_hash,decision,note,decided_by,request_id)
    VALUES (a,p,2,art2,'a1',h,'rejected','new binding, new decision',u,gen_random_uuid());
  IF (SELECT count(*) FROM marketing_artifacts WHERE business_id=a AND kind='C2a') <> 3 THEN RAISE EXCEPTION 'artifact history lost'; END IF;
  IF EXISTS (SELECT 1 FROM marketing_artifacts WHERE business_id=b) THEN RAISE EXCEPTION 'artifacts leaked to business B'; END IF;

  RAISE NOTICE 'PASS: artifact numbering/restart per binding version, as_of order, engine kinds only, append-only artifacts, cross-business FK, decision/receipt linkage to the C2a the human saw, review required, export stamped once, reconciliation-only updates, historical projection refused';
END $$;
ROLLBACK;
