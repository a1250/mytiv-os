# Mytiv OS — Focus redesign (Direction C)

Branch `auto/focus-redesign`, off `e35a189`. A **prototype on temporary data** of the approved Claude Design
direction "Direction C — Focus" (light, airy, RTL, time-based "my day", approvals-first, big tap targets).

- No DB / migration / backend-contract changes. Everything renders from `lib/focus/mock.ts`.
- Lives under `/focus`, fully isolated from the legacy dark app (scoped `.focus-app`, own Open Sans + light
  theme in `app/focus/focus.css`). After the design is approved, we wire Mytiv Work and the real sources in.

## Tokens (sampled from the approved board — docs/focus/reference)
page `#f3f5f9` (canvas) · ink `#161d2e` · muted `#4d5870` · ring `#dde2ea` · surface `#fff` ·
accent `#5b45c9` / ink `#3f2ea3` / weak `#ece8fb` ·
risk high `#fbe4e1`/`#b8322a` · mid `#fbf0d9`/`#8c5a00` · low `#e3f3ea`/`#23774a` · fault `#e9edf3`/`#56617a` ·
radii card 14 / pill 999 / chip 6 · Open Sans 800/700/400.

## Status — all 58 handoff screens
Every frame of the handoff (D1–D8, E1–E7, F1–F6, G1–G6, H1–H15, W1–W6, M1–M10) is a route under `/focus`
(see `/focus/screens` — the screen map). The top bar is the handoff's shared TopBar (7 words-only items:
היום שלי · לקוחות ופרויקטים · שיווק ותוכן · מכירות · עבודה · תקשורת · דוחות; הגדרות appears when active), driven
by `lib/focus/screens.ts`. Focus-mode screens and mobile previews hide it. Light + dark themes from the spec.

Still to do: the 8 interactive flows (mandatory reason, consent before the red button, "processing" states,
format selection, undo), cross-screen links, Mytiv Work as typed components on the handoff's props contract
(the meeting point with `auto/work-pkg1`), and a theme toggle.

## How the screens are produced
The handoff `.dc.html` files render through a small runtime (templating), so the screens are taken from the
**rendered** DOM:
1. `python3 scripts/focus/frame-server.py <handoff-dir> <out-dir>` (127.0.0.1:8779) serves the handoff and accepts
   `POST /save?file=<ID>.html`.
2. Open each handoff file in a browser on that server and post every `div[id=<ID>]` frame's `outerHTML` to `/save`.
3. `python3 scripts/focus/convert-handoff.py <dir-containing-frames/> <repo>` writes
   `components/focus/screens/<ID>.tsx`, `lib/focus/screens.ts` and the route pages.
The converter maps every colour to the theme variables (property-aware: status text on a status background vs on a
surface), turns Lucide images into `<Icon>`, strips the canvas-only frame chrome, and records each screen's
top-bar state. Generated files are ordinary React — edit them freely.

## Run
`npx next dev -p 3200` then open `/focus` or `/focus/screens` (dummy DB env is fine — nothing here touches a DB).
