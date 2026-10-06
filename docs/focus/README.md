# Mytiv OS — Focus redesign (Direction C)

Branch `auto/focus-redesign`, base `auto/preview-mvp-app` (`e35a189`). The approved Claude Design direction
"Direction C — Focus" (RTL, time-based "my day", approvals first, large targets) built as a typed, accessible
component library. **Frontend only:** no backend, DB, migrations or API routes change on this branch.

Focus lives under the tenant segment, `/{businessSlug}/focus/…`, and is scoped on the server like `lib/api-guard.ts`
(session → membership → verified business):
- **A business you are a member of** sees an honest "Focus עדיין לא מחובר לנתונים של …" page until the adapters
  exist. No fixture is ever rendered as a business's data.
- **The fixture demo** (`/_demo/focus/…`) is the only scope that renders fixtures, and it exists only where prototype
  surfaces are on: `next dev`, and Vercel Preview (`VERCEL_ENV=preview`). In any production build it is a 404.
- Not signed in → `/login`. Not a member, or no such business → 404 (indistinguishable).

| Document | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | tenant scope, layers (`ui` → `patterns` → `shell` → `screens`), contracts, demo store and its single write path, navigation guard, theming, accessibility rules |
| [mytiv-work-contract.md](mytiv-work-contract.md) | Mytiv Work components ↔ props/callbacks/types, commands, concurrency token, derived "blocked", errors, permissions + source capabilities, timer lifecycle, endpoint map, what `auto/work-pkg1` has and lacks, integration order |
| [QA.md](QA.md) | gates and their results, per-screen visual QA against the handoff, open issues by severity |
| [GPT_REVIEW_PACKET.md](GPT_REVIEW_PACKET.md) | the independent-review packet: SHAs, commits, findings and fixes, evidence, boundary, owner gates |

## Routes (all relative to `/{businessSlug}`, examples on the demo scope `/_demo`)
- **Product screens** — every desktop frame (D1–D8, E1–E7, F1–F6, G1–G6, H1–H15, W1–W6) is a product route; the
  registry is `lib/focus/screens.ts`. Links are written scope-relative (`R.*` → `"/focus/…"`) and resolved against
  the verified scope by `components/focus/ui/link.tsx`, so a link never leaves the business it was rendered for.
- **Prototype surfaces (demo scope only)** — `/focus/screens` (screen map with demo controls: role, "next external
  action fails", reset), `/focus/reference/<ID>` (the raw handoff conversion, never imported by product screens),
  and the redirects `/focus/work/task` (→ list with the drawer open) and `/focus/m/1…10` (→ the product route each
  phone frame shows). For a business scope these are 404 even in development.

## Run
```bash
AUTH_SECRET=dev-only-dummy DATABASE_URL='postgresql://x:x@127.0.0.1:1/x' DATABASE_URL_UNPOOLED='postgresql://x:x@127.0.0.1:1/x' SECRETS_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000 npx next dev -p 3200
```
Then open `http://localhost:3200/_demo/focus`. The dummy env only satisfies the rest of the app at boot; the demo
scope never reads the session or the DB. `next build` also needs dummy `QSTASH_CURRENT_SIGNING_KEY` /
`QSTASH_NEXT_SIGNING_KEY` (an unrelated API route checks them at build time).

## Tests and QA scripts
- Unit (pure rules + scope wiring, no DOM): `node node_modules/vitest/vitest.mjs run --config tests/route-vitest.config.mjs tests/focus-*.vitest.ts`
- Browser checks against the dev server (`scripts/focus/qa/`, Playwright via `PLAYWRIGHT_MODULE=<path to playwright>`,
  scope via `FOCUS_SCOPE`, default `/_demo`):
  - `routes.mjs` — every route at 1440/1280/1024/768/390: no console errors, no horizontal scroll, no `href="#"`,
    no placeholder links, internal links resolve and stay inside the scope, no product route imports the reference;
  - `axe.mjs` — axe-core serious/critical, light and dark, desktop and 390px;
  - `keyboard.mjs` — tab walk on every route (skip link first, visible focus, accessible names), menus, palette, dialogs;
  - `flows.mjs` — the stateful flows end to end: mandatory reason, confirmation before the red action, processing →
    success / failure, a failed proposal send that cannot be retried at a changed amount, undo window, focus queue,
    the unsaved-changes guard (links, ⌘K, Back/Forward, drawer, D3), history without duplicate entries, listeners that
    do not pile up, drafts that survive "save and leave", an interrupted send shown as unknown, Kanban keyboard, theme
    persistence, LTR content;
  - `prod-surfaces.mjs` — against `next build` + `next start`: `--expect production` (demo scope and prototype
    surfaces 404 with no fixture/prototype content; business routes → `/login`; forged cookies and query parameters
    cannot create a scope) and `--expect preview` (`VERCEL_ENV=preview`: the demo renders for QA);
  - `visual.mjs` — pixel diff of every product screen against its reference frame (light/dark, desktop/mobile),
    `--json` for the QA table, `--out` to keep the screenshots.

## Regenerating the visual reference
The handoff `.dc.html` files render through a small runtime, so the reference is taken from the rendered DOM:
`scripts/focus/frame-server.py` serves the handoff on localhost and accepts posted frames only from its own origin,
then `scripts/focus/convert-handoff.py` writes `components/focus/reference/*` and
`docs/focus/reference/screens.generated.json` only. It never writes product code.
