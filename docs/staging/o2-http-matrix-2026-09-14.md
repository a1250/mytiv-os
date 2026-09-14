# O2 — real HTTP matrix, 2026-09-14 (staging: Neon branch ops-staging · ClickUp mock · four sessions)

Produced by `scripts/staging/http-matrix.mjs`. Every row is a real request through the running Next.js app; sessions are real Auth.js logins.

| session | method | path | expected | got | ok | note |
|---|---|---|---|---|---|---|
| anon | GET | /mytiv/ops | {"status":307,"location":{}} | 307 → /login | ✅ | unauthenticated → login |
| anon | GET | /mytiv/ops/projects | {"status":307,"location":{}} | 307 → /login | ✅ | unauthenticated → login |
| anon | GET | /mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":307,"location":{}} | 307 → /login | ✅ | unauthenticated → login |
| anon | GET | /mytiv/ops/money | {"status":307,"location":{}} | 307 → /login | ✅ | unauthenticated → login |
| anon | GET | /api/mytiv/ops/projects | {"status":401} | 401 unauthorized | ✅ | unauthenticated API |
| anon | GET | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":401} | 401 unauthorized | ✅ | unauthenticated API |
| anon | GET | /api/mytiv/ops/members | {"status":401} | 401 unauthorized | ✅ | unauthenticated API |
| anon | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":401} | 401 unauthorized | ✅ |  |
| anon | POST | /api/mytiv/ops/actions/34704af5-2c64-40df-9fb7-d0fbd916fd45/rollback | {"status":401} | 401 unauthorized | ✅ |  |
| owner-a | GET | /mytiv/ops | {"status":200} | 200 | ✅ | member of A reads pages |
| owner-a | GET | /mytiv/ops/projects | {"status":200} | 200 | ✅ | member of A reads pages |
| owner-a | GET | /mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":200} | 200 | ✅ | member of A reads pages |
| owner-a | GET | /mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a2 | {"status":200} | 200 | ✅ | member of A reads pages |
| owner-a | GET | /mytiv/ops/money | {"status":200} | 200 | ✅ | member of A reads pages |
| owner-a | GET | /api/mytiv/ops/projects | {"status":200} | 200 | ✅ |  |
| owner-a | GET | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":200} | 200 | ✅ |  |
| owner-a | GET | /api/mytiv/ops/members | {"status":200} | 200 | ✅ |  |
| member-a | GET | /mytiv/ops | {"status":200} | 200 | ✅ | member of A reads pages |
| member-a | GET | /mytiv/ops/projects | {"status":200} | 200 | ✅ | member of A reads pages |
| member-a | GET | /mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":200} | 200 | ✅ | member of A reads pages |
| member-a | GET | /mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a2 | {"status":200} | 200 | ✅ | member of A reads pages |
| member-a | GET | /mytiv/ops/money | {"status":200} | 200 | ✅ | member of A reads pages |
| member-a | GET | /api/mytiv/ops/projects | {"status":200} | 200 | ✅ |  |
| member-a | GET | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":200} | 200 | ✅ |  |
| member-a | GET | /api/mytiv/ops/members | {"status":200} | 200 | ✅ |  |
| owner-b | GET | /mytiv/ops | {"status":404} | 404 | ✅ | owner-b on A's pages |
| owner-b | GET | /mytiv/ops/projects | {"status":404} | 404 | ✅ | owner-b on A's pages |
| owner-b | GET | /mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":404} | 404 | ✅ | owner-b on A's pages |
| owner-b | GET | /api/mytiv/ops/projects | {"status":404} | 404 not found | ✅ | owner-b on A's API |
| owner-b | GET | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":404} | 404 not found | ✅ | owner-b on A's API |
| owner-b | GET | /api/mytiv/ops/members | {"status":404} | 404 not found | ✅ | owner-b on A's API |
| owner-a | GET | /api/mytiv/ops/projects/bbbbbbbb-1111-4000-8000-0000000000b1 | {"status":404} | 404 not_found | ✅ | A cannot see B's project through A |
| owner-b | GET | /api/second-business/ops/projects/bbbbbbbb-1111-4000-8000-0000000000b1 | {"status":200} | 200 | ✅ | B sees its own project |
| owner-b | GET | /api/second-business/ops/members | {"status":503} | 503 clickup_not_configured | ✅ | B has no ClickUp allowlist → not configured, not empty |
| owner-a | GET | /second-business/ops | {"status":404} | 404 | ✅ | owner-a on B's pages |
| member-a | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":403,"error":"approval_role_required"} | 403 approval_role_required | ✅ | member cannot write |
| member-a | POST | /api/mytiv/ops/chat/confirm | {"status":403} | 403 approval_role_required | ✅ |  |
| member-a | POST | /api/mytiv/ops/projects | {"status":403} | 403 approval_role_required | ✅ |  |
| member-a | PATCH | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":403} | 403 approval_role_required | ✅ |  |
| member-a | POST | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1/marketing | {"status":403} | 403 approval_role_required | ✅ |  |
| owner-b | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":404} | 404 not found | ✅ | cross-business write → 404 |
| owner-b | PATCH | /api/second-business/ops/tasks/STG-1 | {"status":404} | 404 not_found | ✅ | B's project folder is unauthorized → task not found, nothing read |
| owner-a | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":400,"error":"explicit_confirmation_required"} | 400 explicit_confirmation_required | ✅ |  |
| owner-a | PATCH | /api/mytiv/ops/tasks/X-1 | {"status":404} | 404 not_found | ✅ | unauthorized-folder project: task never looked up |
| owner-a | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":409} | 409 Review an attached recording and provide its exact URL before closing. | ✅ | closing without reviewed evidence refused |
| owner-a | PATCH | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a1 | {"status":403,"error":"folder_not_authorized"} | 403 folder_not_authorized | ✅ | owner cannot point a project outside the allowlist |
| owner-a | POST | /api/mytiv/ops/projects/aaaaaaaa-1111-4000-8000-0000000000a3/marketing | {"status":409,"error":"marketing_not_connected"} | 409 marketing_not_connected | ✅ | no binding → not connected (not zero) |
| owner-a | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":409} | 409 task_changed_since_read | ✅ | stale row refused before any write |
| owner-a | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":200} | 200 | ✅ | governed write |
| mock | state | STG-1 after write | review / [1001,1002] | review / [1001,1002] | ✅ |  |
| owner-a | PATCH | /api/mytiv/ops/tasks/STG-1 | {"status":409,"error":"request_already_claimed_check_audit_before_retry"} | 409 request_already_claimed_check_audit_before_retry | ✅ | duplicate request id |
| owner-a | POST | /api/mytiv/ops/chat/confirm | {"status":200} | 200 | ✅ | copilot write, confirmed (on a different task: a comment bumps date_updated and would, correctly, block rollback of STG-1) |
| owner-a | POST | /api/mytiv/ops/chat/confirm | {"status":400,"error":"invalid_action"} | 400 invalid_action | ✅ | rollback is not a copilot tool |
| owner-a | POST | /api/mytiv/ops/chat/confirm | {"status":400,"error":"invalid_action"} | 400 invalid_action | ✅ | no delete tool exists |
| page | GET | audit log lists the succeeded update_task (rollback-eligible) | 1 eligible action | action 95345b2a-7151-4582-9ec7-b5d62c435649 | ✅ |  |
| member-a | POST | /api/mytiv/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":403} | 403 approval_role_required | ✅ | member cannot roll back |
| owner-b | POST | /api/mytiv/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":404} | 404 not found | ✅ | cross-tenant rollback → 404 |
| owner-b | POST | /api/second-business/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":404} | 404 not_found | ✅ | A's action is invisible from B |
| owner-a | POST | /api/mytiv/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":404} | 404 not_found | ✅ | wrong project in A → 404 |
| owner-a | POST | /api/mytiv/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":400} | 400 explicit_confirmation_required | ✅ | rollback needs explicit confirmation |
| owner-a | POST | /api/mytiv/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":200} | 200 | ✅ | rollback restores pre_state |
| mock | state | STG-1 after rollback | working / [1001] | working / [1001] | ✅ |  |
| owner-a | POST | /api/mytiv/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":409,"error":"request_already_claimed_check_audit_before_retry"} | 409 request_already_claimed_check_audit_before_retry | ✅ | same rollback request replayed |
| owner-a | POST | /api/mytiv/ops/actions/95345b2a-7151-4582-9ec7-b5d62c435649/rollback | {"status":409,"error":"already_rolled_back"} | 409 already_rolled_back | ✅ | second rollback refused |
| owner-a | PATCH | /api/mytiv/ops/tasks/STG-2 | {"status":200} | 200 | ✅ | second governed write (STG-2) |
| owner-a | POST | /api/mytiv/ops/actions/b284a882-4a39-4017-b9dd-de1761612cd3/rollback | {"status":409,"error":"task_changed_since_action"} | 409 task_changed_since_action | ✅ | task changed after write → rollback refused |
| mock | log | requests touching the unauthorized folder | 0 | 0 | ✅ |  |

67/67 checks passed
