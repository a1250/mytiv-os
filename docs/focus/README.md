# Mytiv OS — Focus redesign (Direction C)

Branch `auto/focus-redesign`, off `e35a189`. A **prototype on temporary data** of the approved Claude Design
direction "Direction C — Focus" (light, airy, RTL, time-based "my day", approvals-first, big tap targets).

- No DB / migration / backend-contract changes. Everything renders from `lib/focus/mock.ts`.
- Lives under `/focus`, fully isolated from the legacy dark app (scoped `.focus-app`, own Open Sans + light
  theme in `app/focus/focus.css`). After the design is approved, we wire Mytiv Work and the real sources in.

## Tokens (sampled from the approved board — docs/focus/reference)
page `#dfe4ec` · ink `#161d2e` · muted `#4d5870` · ring `#dde2ea` · surface `#fff` ·
accent `#5b45c9` / ink `#3f2ea3` / weak `#ece8fb` ·
risk high `#fbe4e1`/`#b8322a` · mid `#fbf0d9`/`#8c5a00` · low `#e3f3ea`/`#23774a` · fault `#e9edf3`/`#56617a` ·
radii card 14 / pill 999 / chip 6 · Open Sans 800/700/400.

## Status
- [x] Shell: top bar + 6-area nav (היום שלי · לקוחות ופרויקטים · שיווק ותוכן · מכירות · עבודה ותקשורת · דוחות), switcher, +יצירה, bell, avatar.
- [x] C1 — היום שלי (home): greeting+progress, now/today/week columns, מה תקוע, calendar, continue, projects-at-risk, KPI tiles.
- [ ] C2 — סביבת פרויקט (project environment): milestones, next action, blockers, approvals, marketing results.
- [ ] C3 — אישורים · מצב פוקוס (step-by-step approvals + high-risk send confirmation).
- [ ] C4 — סטודיו תוכן (one brief, all formats).
- [ ] Reports / Sales / Work, Mobile core screens, 8-flow prototype — **need the full handoff** (not reachable in this session; see below).

## Reference available vs missing
Only the **Focus direction board** was reachable (`docs/focus/reference/focus-direction.bundled.html`, rendered
offline), which contains C1–C4. The Design System spec, the 5 detailed desktop screens, mobile and the 8 flows
were not: the Claude Design MCP can't authorize headlessly here. To get them: run `/design-login` in an
interactive `claude` terminal, use Claude Design's "Send to Claude Code Web", or drop `design_handoff_mytiv_os/`
on disk.

## Run
`npx next dev -p 3200` then open `/focus` (no real env needed; dummy DB vars are fine — nothing DB is imported).
