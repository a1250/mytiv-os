# Ops / Marketing OS audit and upgrade

Baseline: Ops `217e0e4bffe01471b0f78ca29c73901fe3a7c87a`; Marketing OS `8e9d2a839b058e543f604f194988d59f8d1f0896`. Audit date: 2026-09-10. Original repositories remain separate. Work is in an isolated checkout.

## Ownership decided before implementation

| Domain | Canonical owner | Ops responsibility |
|---|---|---|
| Business facts, verified gaps, priorities, strategy, monthly/weekly plans | Marketing OS / Business Brain | Versioned, provenance-labelled projection; no second strategy editor |
| Work status, assignees, execution deadlines, comments, operational decisions | ClickUp | Scoped reads and explicitly confirmed writes |
| App users, business memberships, client projects/specs | mytiv-web | Authenticate and map its business+project to a Marketing OS business |
| Marketing governance decisions (claims, budgets, publishing, skill promotion) | Existing Marketing OS approval queue | References only; task approval never grants publication or spend approval |
| ClickUp execution authorization and receipts | Ops | Durable actor/payload-bound audit and duplicate suppression |
| Media | Drive | References, no copied media |
| Events leads/quotes and revenue | mytiv-events CRM | References/aggregates, no duplicate CRM |
| Consent/customer records | Existing verified system of record (still to be confirmed) | No contact import or outbound messaging |
| Review runs, KPI provenance, process learning and skill lifecycle | Marketing OS | Due review dates and links; no automatic promotion |

Important tenancy difference: a mytiv-web business is the agency's access boundary; UMINO is a project within it. A Marketing OS tenant is the restaurant. Never equate the two slugs. An explicit server-controlled `(ops business, project) -> marketing business` mapping is required.

## Baseline findings and order

1. **P0 authorization:** task PATCH guards business membership but not task ownership. Copilot evidence/update/comment accept arbitrary task IDs. Project folder IDs are editable without workspace ownership enforcement. The shared ClickUp token makes these cross-business access paths.
2. **P0 execution governance:** proof is a prompt instruction; no server closure gate. Confirmation requests have no durable audit/idempotency record. Task creation can omit owner/date/definition of done despite the prompt. Fix these before adding execution integrations.
3. **P1 truthfulness:** ClickUp context failures become empty arrays and “none”; money summary can combine unknown costs and unrelated revenue. Preserve unavailable vs empty and unknown vs zero.
4. **P1 complementary planning:** introduce a read-only Marketing projection with priorities, schedule/dependencies, campaign/content/CRM/events references and review cadence. Imports validate scope/version/references and never write ClickUp. Preserve the existing Marketing approval authority.
5. **P2 integration automation:** signed delivery, outbox/reconciliation and verified publication/outcome receipts after manual contract acceptance. No automatic external writes in the first increment.

## Baseline validation

- TypeScript passed before changes.
- Full lint failed: 51 errors, 43 warnings, including existing non-Ops hooks and `any` usage. Earlier “lint clean” claim is not reproducible at this baseline.
- Existing `scripts/leak-audit.ts` mutates the first two real businesses and does not cover Ops/ClickUp. It must not be treated as proof of Ops isolation or run against production during this audit.
- Build, regression tests, live deployment status and remaining limitations are recorded below after verification.

## Integration acceptance contract

Manual authenticated import first. Payloads carry schema version, source revision, source timestamp and explicit marketing business. A server-side mapping chooses the allowed project; payloads cannot assign tenants or ClickUp folders. Reject stale/conflicting versions, duplicate item IDs, missing references, dependency cycles, invalid dates and unsafe URLs. Imported schedule status is marketing artifact state, never execution completion. Execution rows are read from ClickUp. Missing metrics stay unknown. Review dates do not create autonomous scheduled jobs. A public/financial marketing approval cannot be inferred from an Ops task confirmation.

## Production and live source evidence

The recorded public URL responded: `/login` 200, `/mytiv/ops` 307 to `/login`, and unauthenticated snapshot/projects/members APIs 401. This establishes availability and anonymous-access rejection only. The connected Vercel tool returned 404 for the locally recorded project/team; deployed commit and production environment settings remain unverified.

Read-only checks using the existing local configuration found five projects; 22 open ClickUp rows (including operational decision records), three or four lists per project, and no populated project briefs. No stored Claude API key and no local hourly-cost setting were present. The initial zero-hour result was from the original endpoint's default authenticated-user scope; it was not proof of missing contractor time. Corrected all-member time results are recorded in final verification.

The ClickUp [time-entry API documentation](https://developer.clickup.com/reference/gettimeentrieswithinadaterange) confirms that other users require explicit `assignee` IDs and workspace owner/admin permissions. The adapter now requests all returned workspace members and fails rather than assuming coverage when no members are available.

Runtime audit initially reported 4 findings (3 high, 1 critical). Next.js 16.2.12 is affected by the [AVIF optimizer advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4). Next.js and its ESLint configuration are upgraded to 16.3.4; final dependency audit is recorded below. This is vulnerability remediation, not proof that the production site was exploited.

## Delivery and rollout

1. Review this branch and run `npm ci`, `npm test`, the changed-file lint check and production build. Existing repository-wide lint failures remain a separate backlog; do not suppress them globally.
2. Apply migrations 0005–0007 to an isolated staging database first. All baseline plus new SQL migrations and fixture database constraint tests were exercised locally. New history tables are append-only, with composite tenant/project/actor foreign keys. Existing data is retained.
3. Apply the migrations before deploying this code. Missing audit storage blocks writes. Do not roll back history tables or remove their triggers to retry an uncertain action.
4. The existing ClickUp token remains restricted by the checked-in per-business folder allowlist. Adding a client folder requires explicit operator configuration, not an arbitrary editable ID. Additional businesses must receive an explicit allowlist; there is no default shared workspace access.
5. Set `OPS_MARKETING_BINDINGS` as a server-only JSON object mapping `"<ops-business-slug>:<project-uuid>"` to `"<marketing-business>"`. Obtain the actual UUID from the tenant-scoped project record; do not guess or equate restaurant and agency slugs. No binding is enabled by this branch.
6. Validate an actual authored planning export using `node --import tsx scripts/validate-marketing-plan.ts <marketing-business> <plan.json>`. `docs/marketing-plan.fixture.json` is synthetic test material only, never UMINO business evidence. The canonical shape is `lib/marketing/contract.ts`.
7. An owner/admin previews the JSON and confirms import in the Marketing tab. Each new source revision must increase `revision`. Preserve `sourceRevision`, `asOf`, evidence references and review source links. This is a manual import boundary; no authenticated marketing-os HTTP service or automated delivery is claimed.
8. Marketing approval references stay references. Approve budgets, claims, publishing and skill promotion in the existing Marketing OS queue. Ops never interprets a task confirmation as authorization for these actions.
9. Reconcile an uncertain write in ClickUp and inspect `ops_actions` / `ops_audit_events` before a new request. Duplicate request IDs fail closed; the system does not promise exactly-once external delivery or retry an uncertain write.

## Deferred capabilities and remaining verification

- Authenticated browser acceptance against staging, verified deployed revision, production environment configuration and real external write/readback acceptance are still required before rollout. No production writes or migrations were performed.
- Marketing OS Control Center has a preference-based actor cookie and a navigation-only proxy, not the Ops membership boundary. Keep it local/private; importing its business logic does not make it safe to expose publicly.
- A bidirectional automated connector, signed webhooks, reconciliation workers, task creation from a marketing item and outcome-to-learning feedback are subsequent increments. First establish real plans/data and operational acceptance.
- CRM/event metrics and customer consent remain with their existing source systems. This release references campaign/content/CRM/events artifacts; it does not invent revenue, consent or attribution data.
- Review cadence displays explicit due dates. It does not schedule hidden jobs or auto-approve reviews.
- Existing ClickUp board pagination caps at 20 pages; large boards require explicit completeness handling. Comment evidence reads the current API page, not a full historic attachment review. Human review remains required; a recording URL is not machine proof that a repair worked.

## Final verification — 2026-09-11

- **30 regression tests pass**: 18 deterministic/adapter checks and 12 HTTP/proposal/audit tests, including foreign-project access, custom terminal status without evidence, concurrent duplicate claims, audit failure before mutation and unknown external outcomes. Route tests mock the database and ClickUp transport; they are not live write acceptance tests.
- **Marketing OS baseline: 80/80 tests pass** in an isolated clone. No skill promoted, brain edited or live plan approved.
- **PostgreSQL**: all baseline and new migrations applied successfully to an isolated local database. Fixture checks cover cross-business project/receipt foreign keys, duplicate claims/revisions and append-only history. An advisory transaction lock serializes snapshot imports, so an older revision cannot supersede a newer one through concurrent submissions.
- **TypeScript and changed/new code lint pass.** Repository-wide lint still reports 51 errors and 44 warnings, all outside the Ops/Marketing module paths. These are not hidden by an eslint override. The full baseline had 51 errors and 43 warnings; the dependency upgrade changed the full diagnostic set.
- **Runtime dependency audit: zero known findings** after upgrading Next.js/eslint-config-next to 16.3.4 and refreshing the vulnerable nanoid patch. This refers to `npm audit --omit=dev`; existing tooling/development advisories remain separate, and is not a claim of universal security.
- **Browser**: synthetic Marketing panel rendered, source/freshness/priority/schedule/review content inspected, invalid JSON plan rejected and valid plan showed an explicit import approval button. Browser reported no errors. No import was submitted. Temporary fixture route removed from delivered code.
- **Live read-only recheck**: all-member time request completed for all five projects with zero returned hours over the last 30 days. This is the API result for the accessible workspace, not proof of zero work. Claude key still absent, local hourly rate absent and five project briefs empty.
- **Deployment**: no production database migration, external write, deployment or merge was performed. The final build result is noted in the delivery receipt. Authenticated staging acceptance and real marketing business/project mapping remain rollout gates.

## Prioritized operational follow-up

| Priority | Next action | Acceptance evidence |
|---|---|---|
| P0 | Stage the migrations and patched release, verify using owner/member and two-business sessions | Actual HTTP rejection/allowance, one confirmed fixture task update with evidence and receipt, deployed commit recorded |
| P1 | Configure the business Claude key and contractor rate; fill each project's spec | Successful scoped chat, actual recorded costs, owner-reviewed specs |
| P1 | Establish time-reporting practice | Entries for the relevant contractors and period, coverage verified against ClickUp |
| P1 | Bind UMINO's Ops project to the Marketing OS business and import the first real plan | Explicit UUID mapping, versioned source plan, owner-reviewed priorities and valid dependencies |
| P2 | Connect measured outcomes and review results back to Marketing OS | Read-only CRM/reservation/media data with as-of/provenance and real review evidence |
| P2 | Consider automated transport only after manual acceptance | Authenticated contract, replay/expiry controls, reconciliation and no duplicate approval authority |

### Delivery receipt

Final clean Next.js **16.3.4 production build passed**, including TypeScript, page-data collection and static generation. Used fixture-only database/QStash settings; external access was only needed for the configured Google Fonts downloads. No temporary preview route remains. A client-bundle marker scan found no ClickUp token, secrets master key, QStash signing key or fixture database URL markers. This limited scan supplements the server-only imports and does not certify the absence of every possible secret.

Code delivered on `codex/ops-marketing-integration` in an isolated `mytiv-web-audit` checkout. Original repositories remain separate. Screenshot evidence is a synthetic UI preview, not production data. Production rollout and authenticated acceptance remain outstanding as listed above.
