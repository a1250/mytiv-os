# Mytiv OS — Focus redesign (Direction C)

Branch `auto/focus-redesign`, off `e35a189`. The approved Claude Design direction "Direction C — Focus" (RTL,
time-based "my day", approvals first, large targets) built as a typed, accessible component library that runs on
**typed fixtures**: no backend, no DB, no migrations, no API routes. Everything lives under `/focus` and is scoped to
`.focus-app`; the rest of the app is untouched.

| Document | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | layers (`ui` → `patterns` → `shell` → `screens`), contracts, fixtures, data states, demo store, theming, accessibility rules |
| [mytiv-work-contract.md](mytiv-work-contract.md) | Mytiv Work components ↔ props/callbacks/types, optimistic updates, concurrency token, errors, permissions, timer lifecycle, endpoint map, what `auto/work-pkg1` has and lacks, integration order |
| [QA.md](QA.md) | per-screen visual QA against the handoff (two passes), test and gate results, open issues by severity |

## Routes
- **Product screens** — every desktop frame (D1–D8, E1–E7, F1–F6, G1–G6, H1–H15, W1–W6) is a product route; the
  registry is `lib/focus/screens.ts`, the map is `/focus/screens` (with demo controls: role, "next external action
  fails", reset).
- **Deliberate redirects** — `/focus/work/task` → the list with the drawer open (`?task=t-post45`);
  `/focus/m/1…10` → the product route each phone frame shows (`MOBILE_TARGETS`). Mobile frames are the same product
  screens at 390px; the screen map previews them in a phone frame.
- **Visual reference** — `/focus/reference/<ID>` renders the raw handoff conversion (`components/focus/reference`).
  No product route imports it.

## Run
```bash
DATABASE_URL='postgresql://x:x@127.0.0.1:1/x' DATABASE_URL_UNPOOLED='postgresql://x:x@127.0.0.1:1/x' SECRETS_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000 npx next dev -p 3200
```
The dummy env only satisfies the rest of the app at boot; nothing under `/focus` reads it. `next build` also needs
dummy `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` (an unrelated API route checks them at build time).

## Tests and QA scripts
- Unit (pure rules, no DOM): `node node_modules/vitest/vitest.mjs run --config tests/route-vitest.config.mjs tests/focus-*.vitest.ts`
- Browser checks against the dev server (`scripts/focus/qa/`, Playwright via `PLAYWRIGHT_MODULE=<path to playwright>`):
  - `routes.mjs` — every route at 1440/1280/1024/768/390: no console errors, no horizontal scroll, no `href="#"`,
    no placeholder links, internal links resolve, no product route imports the reference;
  - `axe.mjs` — axe-core serious/critical, light and dark, desktop and 390px;
  - `keyboard.mjs` — tab walk on every route (skip link first, visible focus, accessible names), menus, palette, dialogs;
  - `flows.mjs` — the stateful flows end to end (reason, confirmation, processing, failure keeps the draft, undo window,
    focus queue, unsaved-change guards, Kanban keyboard, theme persistence, LTR content);
  - `visual.mjs` — pixel diff of every product screen against its reference frame (light/dark, desktop/mobile),
    `--json` for the QA table, `--out` to keep the screenshots.

## Regenerating the visual reference
The handoff `.dc.html` files render through a small runtime, so the reference is taken from the rendered DOM:
`scripts/focus/frame-server.py` serves the handoff and accepts posted frames, then
`scripts/focus/convert-handoff.py` writes `components/focus/reference/*` and `docs/focus/reference/screens.generated.json`
only. It never writes product code.
