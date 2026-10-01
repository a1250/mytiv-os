# תוכנית מימוש — Mytiv Work (גרסה 2, אחרי review הבעלים)

> **מצב:** תוכנית מעודכנת לפי 12 החלטות הבעלים, ובסופה מפרט מימוש לחבילה 1 בלבד.
> **התקדמות (מקומית בלבד, ענף `auto/work-pkg1`, לא נדחף):** חבילה 1 + תיקוני ביקורת ✔ · PR 2 דוח נתונים ישנים ✔ · PR 3 `0012_work_expand` + dual-write ✔ · PR 4 backfill ✔. השערים הבאים חיצוניים: הרצת הדוח על production, החלת 0012 על staging/production, ה־backfill שם, החלטות על יתומים/סטטוסים לא מוכרים, ופיצול תפקיד ה־runtime. ראיות: `docs/work/pkg1-verification.md`.
> **v2.1 (2026-10-01):** תיקוני ביקורת — קטגוריות סטטוס עם `unknown`, זהויות ספק־ניטרליות, הפרדת Query/Command/Capabilities, גבול אבטחת DB מוצהר בכנות, ו־`work_statuses` לכל עסק. ראו החלטות 9, 12, 15.
> בחבילה 1 אין migrations, אין שינוי ב־staging/production ואין נגיעה ב־ClickUp.

## Context
היום יש ב־Mytiv OS שלוש ישויות משימה:
- **משימות פנימיות** (`tasks`).
- **משימות ClickUp**, מקור האמת של Ops (`lib/clickup.ts:4`).
- **לוח העבודה C7 של מנוע השיווק**.

המטרה: Mytiv הופכת בהדרגה, פרויקט אחר פרויקט, למקור האמת היחיד למשימות ולזמן. בכל שלב יש מקור אמת יחיד, ואין סנכרון דו־כיווני.

### בסיס הקוד המדויק (נקרא ב־`git ls-remote` + `gh pr list`, ‏2026-10-01)
| ref | SHA | מצב |
|---|---|---|
| `main` | `3ca991c952426740cc3c247eef366731deea4665` | ללא PRs #7/#8 |
| PR #7 `auto/t-1.5-contract-consumers` | `48acb1ed79d8e2ef2aa7c032f547530524c69e98` | draft, מאושר ב־review ‏GPT round 3, לא מוזג |
| PR #8 `auto/preview-mvp-app` (מוערם על #7) | `e35a189f7cbb545bdf1c7dd0a70c860bf3ea5031` | draft, מאושר ב־round 3, לא מוזג |

**ענף המימוש:**
- `auto/work-pkg1` נוצר מ־`e35a189`, ולכן כולל את #7 ו־#8 בגרסאות המאושרות.
- **לפני כל שינוי:** `git ls-remote` חוזר. אם ה־HEADs זזו, עוצרים ומדווחים.
- **אחרי מיזוג #7/#8 ל־main:** rebase על main.

---

## 1. ממצאי המצב הקיים
(ללא שינוי מגרסה 1; ממצאי `file:line` בקצרה)
- **`tasks` פנימי:**
  - הטבלה: `lib/db/schema.ts:93-111`.
  - **`createTask` לא שומר `projectId`:** `lib/db/queries/tasks.ts:19-38`.
  - **PATCH:** מעביר גוף גולמי ומקבל `projectId`/`leadId` של עסק אחר (`tasks.ts:40-51`, `_patch.ts:32-39`).
  - **Routes:** ללא ולידציה, ללא בדיקת תפקיד וללא audit; מחזירים 200/204 על id לא קיים (`app/api/[businessSlug]/tasks/**`).
  - **follow-up מהצעת מחיר:** לא מעביר `projectId` (`proposals/[id]/page.tsx:140-153`).
  - **צרכנים:** Dashboard (`page.tsx:17-45`), סקירה (`review-builder.ts:83-94`), leak-audit (`scripts/leak-audit.ts:84-87,175`).
- **ClickUp:**
  - קריאה חיה בלבד, ללא שיקוף (`lib/clickup.ts:4`, `schema.ts:999`).
  - הטיפוס `OpsTask` בנוי מאוצר מילים של ClickUp (`lib/clickup.ts:64-101`): `url`, `listId`, `statusType`, assignee מספרי, `blockedOn` "Me".
  - **צרכני `OpsTask`:**
    - `ops/page.tsx`, `ops/projects/page.tsx`, `ops/projects/[projectId]/page.tsx`, `ops/money/page.tsx`
    - `components/ops/{stuck-list,task-table,client-workspace,marketing-panel,stat-tiles}.tsx`
    - `lib/ai/ops-copilot.ts`
    - `app/api/.../ops/{snapshot,members,tasks/[taskId],chat/confirm,actions/*}`
    - `lib/ops-policy.ts:32` (`assertClosure` לפי `statusType`)
  - **כתיבה:** דרך `auditedAction` (`lib/ops-audit.ts:46-85`). ה־route מקבל assignee ids מספריים (`ops/tasks/[taskId]/route.ts:28-36`) ו־`expectedUpdatedAt` כ־marker של ClickUp (`:39`).
- **שיווק:**
  - `clickupTaskId` בחוזה C1 (`lib/marketing/contract.ts:9,63,72`; `contracts/C1.schema.json:119`).
  - התאמה בפאנל: `marketing-panel.tsx:97`.
- **תשתית:**
  - neon-http בלי טרנזקציות; `db.batch` לא מסתעף ולא נתמך ב־harness המקומי (`node_modules/drizzle-orm/neon-http/session.js:117-158`, `tests/db-integration/db-local.ts:3-7`).
  - דפוס הכתיבה האטומית: פונקציות plpgsql עם advisory locks (migrations 0007–0011).
  - Blob ציבורי (`lib/blob.ts:5-17`); התאריכים ב־UTC (`lib/date-utils.ts:5-13`).
  - תפקידים בטקסט חופשי, ללא CHECK (`schema.ts:54`).
- **ClickUp freeze (נבדק בתיעוד, לא בחשבון עצמו):**
  - **מה קיים:** אפשר לקבוע ל־Folder ‏"Default permission = View only" (Sharing & Permissions), ונראה שזה דורש תוכנית בתשלום.
  - **מה לא מאומת:**
    - התיעוד אומר שכברירת מחדל ל־members, admins ו־owner יש full edit. **לא אומת** שה־View only מגביל owner/admins.
    - **לא אומת** שהוא מגביל את ה־API token שבו Mytiv משתמשת (token של משתמש), או אוטומציות.
  - **מסקנה:** ההקפאה היא best effort בלבד. ההגנה האמיתית היא snapshot בלתי משתנה ושתי קריאות מלאות זהות (§9).
  - **לאימות בפועל:** הבעלים מבצע בדיקה ידנית עם משתמש member ועם ה־token.
  - מקורות: [Permissions in detail](https://help.clickup.com/hc/en-us/articles/6309221065495-Permissions-in-detail), [Share Spaces, Folders…](https://help.clickup.com/hc/en-us/articles/6309266954263-Share-Spaces-Folders-Lists-and-tasks), [Set permissions on individual locations](https://help.clickup.com/hc/en-us/articles/31233419651607-Set-permissions-on-individual-locations).

**תיקון להנחות:**
- **ישויות:** יש שלוש ישויות, לא שתיים.
- **`projectId` ב־PATCH:** כן נשמר, ובלי בדיקת דייר. זה סיכון בידוד.
- **מודל רווחיות:** אין היום תעריפים, לקוחות או דגל billable.
- **קבצים:** האחסון ציבורי.

## 2. סיכונים
1. **שני מקורות אמת היום.**
2. **בידוד דיירים ב־`/tasks`.**
3. **אין הרשאות ואין היסטוריה.**
4. **נתונים ישנים פגומים:** כל constraint חדש חייב לבוא אחרי דוח על נתונים חיים.
5. **אזור זמן.**
6. **14 מקומות שמניחים ClickUp.** הפתרון: `TaskSource` ניטרלי (§3, החלטה 15).
7. **ClickUp API:** rate limits, time entries ללא pagination, מחיקות שלא נראות ב־delta. ההקפאה לא מובטחת.
8. **אחסון ציבורי.**
9. **אין התראות או cron.**
10. **בסיס ענף לא ממוזג:** ראו טבלת ה־HEADs למעלה.

---

## 3. החלטות ארכיטקטוניות
| # | נושא | החלטה |
|---|---|---|
| 1 | מודל ראשי | הרחבת `tasks` הקיים באמצעות expand/backfill/validate/contract (§5). אין שינוי in-place. |
| 2 | תתי־משימות | `parent_id` עם FK מורכב, `position numeric`, ומיון לפי `(position,id)` + renormalize. **MVP: אב וילד באותו פרויקט בלבד** (נאכף ב־DB). |
| 3 | עומק | עד 3 רמות. trigger בודק עומק אבות ואת גובה תת־העץ. ביבוא, עומק גדול יותר משוטח ונרשם כחריגה. |
| 4 | לולאת אב | נבדקת רק בתוך `work_move_task`: נעילת advisory לכל עסק, ואז קריאת אבות בפקודה נפרדת. |
| 5 | תלויות | `task_dependencies(blocker_id, blocked_id, kind)`. **ב־MVP רק `blocks`, ורק בתוך אותו פרויקט** (נאכף ב־trigger). "חסומה ע״י", "חוסמת" ו"קודמת/עוקבת" הן שני הכיוונים של `blocks`. **`relates` חוצה־פרויקטים נדחה.** CHECK `blocker≠blocked`, unique לזוג. |
| 6 | תלות מעגלית | `work_add_dependency` נועלת לכל עסק ומריצה CTE רקורסיבי על תלויות פעילות. `work_restore` מריץ את הבדיקה מחדש. אסור להוסיף תלות למשימה שבסל או מאורכבת. |
| 7 | שיוך | `owner_user_id` + `task_members(collaborator\|watcher)`, עם FK מורכב לחברות. חברות מבוטלת מסומנת ב־`deactivated_at` ולא נמחקת. |
| 8 | קישורים | `project_id` ו־`lead_id` (FK מורכב), ו־`task_links` לסוגים `proposal`, `calendar_event`, `marketing_item`, `url`. trigger מאמת קיום ועסק. |
| 9 | **סטטוסים, ללא סתירה (עודכן ב־v2.1)** | `work_status_templates` גלובלית (קטלוג מערכת בלבד) + `work_statuses` **לכל עסק** (`business_id NOT NULL`, ‏`UNIQUE(business_id,key)`, ‏`UNIQUE(business_id,id,category)`). סטטוסי המערכת מועתקים לכל עסק (backfill + trigger על עסק חדש). ‏`tasks(status_id, status_category)` עם FK מורכב `(business_id, status_id, status_category)` — סטטוס של עסק אחר או קטגוריה סותרת בלתי ניתנים לשמירה. `key`/`category` בלתי ניתנים לשינוי; שינוי שם → `label_he` בלבד + `work_status_revisions` (append-only); אירועי משימה שומרים `status_id` + התווית באותו רגע. אין `DELETE` — `retired_at`. פירוט ה־schema ב־ADR החלטה 4. |
| 10 | **ledger אידמפוטנטיות** | ראו הטבלה `work_requests` מתחת לטבלה הזו. |
| 11 | היסטוריה ו־audit | כל שינוי הוא פונקציית plpgsql אחת, שכותבת את השינוי, את שורת `work_requests` ואת `work_events` (append-only) באותה טרנזקציה. `version` עולה בתוך הפונקציה, ו־`expectedVersion` לא תואם מחזיר 409. ה־audit המאוחד מציג אירועים משמעותיים מתוך שאילתה נפרדת. יבוא, cutover וכתיבות ל־ClickUp נשארים ב־`auditedAction`. |
| 12 | **הרשאה וגבול ה־DB (עודכן ב־v2.1)** | **היום** ה־runtime וה־migrations מתחברים שניהם כ־`neondb_owner` (בעל הטבלאות) ב־prod וב־staging — לכן `work.via_function` ו־triggers הם **guardrail בלבד, לא גבול אבטחה**. **יעד (שער בעלים):** תפקיד runtime חדש `mytiv_app` (LOGIN, דרך Neon API) ללא `INSERT/UPDATE/DELETE` על טבלאות Work; טבלאות Work בבעלות `mytiv_work_owner` (NOLOGIN); כל כתיבה דרך פונקציה `SECURITY DEFINER` עם `SET search_path = pg_catalog, public, pg_temp`, ‏`REVOKE ALL … FROM PUBLIC` ו־`GRANT EXECUTE` מצומצם; `neondb_owner` רק ל־migrations. בכל פונקציה `work_authorize` (חברות פעילה, תפקיד, תחום עסק). `p_actor`/`p_business` נגזרים מה־session בצד השרת (`guard()`), לעולם לא מגוף הבקשה. סיכון שנותר ומתועד: אפליקציה פרוצה יכולה לפעול בשם חבר דרך הפונקציות, אך לא לעקוף את חוקיהן. פירוט ב־ADR החלטה 8. |
| 13 | מחיקה | **soft delete, סל וארכוב בלבד. `purge` הוסר מה־MVP.** מחיקה פיזית תתוכנן בנפרד, יחד עם retention, פרטיות ובקשות מחיקה. |
| 14 | מעבר | לכל פרויקט: `projects.work_source ∈ {clickup, mytiv}`. יבוא חד־פעמי ואידמפוטנטי מתוך snapshot קפוא (§9). בלי סנכרון דו־כיווני, בלי עותק צל ב־prod, ושינויים ב־ClickUp אחרי ה־flip רק מדווחים. |
| 15 | **`TaskSource` ניטרלי — Query/Command/Capabilities (עודכן ב־v2.1)** | `TaskQuerySource` ו־`TaskCommandSource` (`prepare` → payload לאודיט, `apply` → כתיבה) נפרדים, שניהם עם `TaskSourceCapabilities`; ה־UI מציע פעולה רק אם הספק מצהיר עליה **וגם** הפריט שייך לאותו ספק. כל זהות כוללת provider (`WorkRef` לפריט, אדם, scope של סטטוס, שורת זמן); `refKey()` היא הצורה היחידה כמחרוזת. קטגוריות: `open/active/waiting/review/done/cancelled/unknown`; ClickUp custom ממופה רק לפי טבלת שמות מפורשת, אחרת `unknown` — לא נספר כהושלם או כפעיל, מוצג "לא ממופה", ואין פעולה שמסתמכת עליו. ארכוב וסל הם flags. |
| 16 | ראיות לסגירה | ב־MVP: `task_evidence` (URL מאומת + "בדקתי") ומדיניות לכל פרויקט, שקולה ל־`assertClosure`. |
| 17 | דגל | `WORK_MODULE_ENABLED` (מתג חירום) + הגדרה לכל עסק. נאכף ב־routes ובדפים. |
| 18 | אזור זמן | `lib/work/time.ts` לפי `businesses.timezone`. עמודות `date` ו־`timestamptz` חדשות (expand). |
| 19 | **הפניה ניטרלית בחוזי השיווק** | מתוכנן בשלב 5 (ראו §9). בחבילה 1 נוספת רק נרמול בצד הקריאה. |

**החלטה 10 — `work_requests`:**
- **עמודות:** `business_id, request_id, actor_user_id, operation, target_kind, target_id, permission_context jsonb, payload_hash, status, result jsonb, created_at, completed_at, retain_until`.
  - `permission_context` מכיל role, membership id, גרסת מדיניות ו־override.
  - `status` הוא אחד מ־`succeeded`, `refused`, `failed`.
- **unique:** `(business_id, request_id)`.
- **Replay:** מוחזר רק אם business, actor, operation ו־payload_hash זהים. כל אי־התאמה מחזירה 409 `request_id_conflict`. Replay מבוצע גם כשהחברות בוטלה בינתיים: נבדקת מחדש ההרשאה, ואם היא לא קיימת עוד מוחזר 403 בלי לחשוף את התוצאה.
- **Retention:**
  - `retain_until` = 90 יום.
  - הניקוי הוא job עתידי (§13).
  - הטבלה append-only, מלבד מחיקה אחרי retention.
- **ירידה מהתוכנית:** `refused` נרשם כתוצאה מוחזרת, לא כחריגה, כדי שה־replay יחזיר את אותו סירוב.

### 3.1 מחיקה, שחזור, ארכוב והעברה (החלטה 11 של הבעלים)

**מחיקה לסל**
| רכיב | התנהגות |
|---|---|
| תתי־משימות | כל תת־העץ עובר לסל באותה פונקציה, עם `trash_batch_id` משותף. |
| תלויות | נשמרות אך לא פעילות: לא חוסמות, ובממשק מופיעות כ"תלות במשימה שבסל". |
| זמן | רשומות נשמרות ונספרות בדוחות, עם סימון "משימה בסל". טיימר רץ בתת־העץ נעצר ב־`now()` ונרשם. |
| תגובות, קישורים, checklist | נשמרים ומוסתרים יחד עם המשימה. |

**שחזור**
| רכיב | התנהגות |
|---|---|
| תתי־משימות | ה־batch כולו משוחזר. שחזור ילד כשהאב עדיין בסל: מסורב, או "שחזור כמשימה ראשית" כבחירה מפורשת. |
| תלויות | נבדקות מחדש לפני ההפעלה; תלות שיוצרת מעגל נשארת לא פעילה ומדווחת. |
| זמן | ללא שינוי. |
| תגובות, קישורים, checklist | חוזרים. |

**ארכוב**
| רכיב | התנהגות |
|---|---|
| תתי־משימות | תת־העץ מאורכב לקריאה בלבד. |
| תלויות | נשמרות; משימה מאורכבת לא חוסמת. |
| זמן | אסור להפעיל טיימר או להוסיף זמן; הנתונים נשמרים. |
| תגובות, קישורים, checklist | קריאה בלבד. |

**העברת אב לפרויקט אחר**
| רכיב | התנהגות |
|---|---|
| תתי־משימות | כל תת־העץ עובר. |
| תלויות | **בדיקה מקדימה:** כל תלות `blocks` בין תת־העץ למשימה שמחוצה לו גורמת לסירוב, עם רשימת התלויות. |
| זמן | הרשומות עוברות לפרויקט החדש. רשומה בתקופה נעולה גורמת לסירוב. |
| תגובות, קישורים, checklist | עוברים יחד. קישור לפריט שתלוי בפרויקט (הצעת מחיר של הפרויקט הישן) מוצג כאזהרה ונשמר. |

**העברת תת־משימה לאב אחר**
| רכיב | התנהגות |
|---|---|
| תתי־משימות | אותו פרויקט בלבד, עם בדיקת עומק, גובה ומעגל. |
| תלויות | ללא שינוי (אותו פרויקט). |
| זמן | ללא שינוי. |
| תגובות, קישורים, checklist | ללא שינוי. |

**העברה ל"ללא פרויקט"**
| רכיב | התנהגות |
|---|---|
| תתי־משימות | מותר רק למשימה שאין לה תתי־משימות. |
| תלויות | מותר רק אם אין לה תלויות. |
| זמן | הרשומות עוברות. |
| תגובות, קישורים, checklist | ללא שינוי. |

**חבר שהוסר:** הטיימר נעצר, המשימות נכנסות לתור "להעברה", ההיסטוריה נשמרת.

## 4. ERD (עיקרי)
```
work_status_templates(key PK, category, label_he, position)   # קטלוג מערכת גלובלי
work_statuses(id, business_id, key, template_key?, category, label_he, position, retired_at)  # לכל עסק; UNIQUE(business_id,key), UNIQUE(business_id,id,category)
work_status_revisions(append-only)
tasks (+ status_id, status_category FK(business_id,status_id,status_category)→work_statuses, parent_id, position, owner_user_id,
       created_by, type task|bug|decision, waiting_on, start_on date, due_on date,
       estimate_minutes, billable, source, external_status, version, last_activity_at,
       completed_at, archived_at, deleted_at, deleted_by, trash_batch_id)
task_members · task_dependencies(kind=blocks, same project) · task_links · task_evidence
task_checklist_items(id, business_id, task_id, title, done, done_by, done_at, position, created_by, deleted_at)
task_comments · comment_mentions · work_notifications · work_events(append-only)
work_requests(ledger, §3.10) · time_entries · time_entry_revisions · time_locks · member_rates(שלב 2b, בהחלטה)
work_external_refs · work_import_runs · work_import_snapshots(immutable) · work_import_items · work_import_anomalies
clickup_user_map · clickup_status_map
```
- **בכל טבלה:** `business_id`, unique `(business_id,id)` ו־FKs מורכבים.
- **`time_entries`:**
  - partial unique לטיימר רץ אחד;
  - CHECK `ended>started`;
  - `EXCLUDE USING gist` עם `btree_gist` (החלטת בעלים).
- **זמן בפועל** הוא `SUM` של הרשומות.

## 5. Migrations: expand → backfill → validate → contract (לא בחבילה 1)
| שלב | migration / סקריפט | תוכן | שער |
|---|---|---|---|
| 0 | סקריפט `scripts/work/legacy-tasks-report.ts` (קריאה בלבד) | ערכי status/priority לא מוכרים, `due_date` פסולים, `project_id`/`lead_id` יתומים או של עסק אחר, תפקידים לא מוכרים, נפחים | הרצה על prod באישור; הפלט ללא PII |
| expand | `0012_work_expand` | עמודות חדשות nullable בלבד (`status_key`, `due_on date`, `start_on`, …); טבלאות חדשות; `work_statuses` + seed; unique `(business_id,id)` ל־tasks ו־leads; CHECK/FK על **העמודות החדשות בלבד**, כ־`NOT VALID` כשנדרש. `due_date`/`status` הישנים לא נגעים. | staging, ואז prod |
| backfill | סקריפט אידמפוטנטי `scripts/work/backfill-tasks.ts` (batched, מדווח) | `status` → `status_key`; `due_date` תקין → `due_on`; ערכים פסולים → `work_legacy_quarantine` ודוח; `source='legacy'`. ה־app כותב לשתי העמודות בתקופה הזו (dual-write). | אחרי דוח שלב 0 והחלטה על יתומים |
| validate | `0013_work_validate` | `VALIDATE CONSTRAINT`; `SET NOT NULL` על `status_id`/`status_category`; CHECK תפקידים; FK מורכב ל־`project_id`/`lead_id`; guard triggers של `work.via_function` (**guardrail בלבד**) | רק כשדוח ה־backfill נקי |
| role split | `00xx_work_roles` + שינוי `DATABASE_URL` של ה־runtime | `mytiv_work_owner` (NOLOGIN), ‏`mytiv_app` (LOGIN, נוצר ב־Neon API), העברת בעלות טבלאות Work, ‏`REVOKE` DML, ‏`GRANT EXECUTE` לפונקציות; בדיקה מקומית שה־runtime לא יכול DML ישיר | **שער בעלים** (תפקיד וסוד חדשים, env ב־Vercel) |
| (פונקציות) | `0014_work_functions`, `0015_work_time` (+`btree_gist`), `0016_work_collab` (תגובות, checklist, התראות), `0017_work_import` | לפי ה־PRs | לכל אחד |
| contract | `0018_work_contract` | הסרת `status`/`due_date` הישנים (או הפיכתם לעמודות generated לקריאה ישנה). רק אחרי מחזור שחרור שבו אף קורא לא נוגע בהם. | שער נפרד |

## 6. API (תחת `/api/[slug]/work`)
עיקרי השינויים מגרסה 1:
- **אין `purge`.**
- **התשובה לכל כתיבה** כוללת `requestId` ו־`version`.
- **checklist:**
  - `POST tasks/[id]/checklist`
  - `PATCH checklist/[itemId]` (`done` / `title` / `position`)
  - `DELETE checklist/[itemId]` (soft)
- **move:** `POST tasks/[id]/move` מחזיר 409 `move_blocked` עם `{dependencies:[…], lockedEntries:[…]}`.
- **dependencies:** `POST tasks/[id]/dependencies` מקבל רק `kind:'blocks'` ורק באותו פרויקט. אחרת: 422 `cross_project_dependency_not_supported`.
- **עקרונות** (כמו בגרסה 1):
  - `guard`, same-origin, `requestId`, `expectedVersion`;
  - rate bucket `work_write`;
  - הדגל;
  - מיפוי שגיאות.

## 7. מסכים
כמו בגרסה 1, ובנוסף:
- **checklist במגירת הפרטים:** הוספה מהירה, סימון, סידור במקלדת. ספירת "3/5" מוצגת בשורה, וגם ב־"המשימות שלי".
- **מצב סל וארכוב:** כל רכיב שמציג משימה מציג גם אותו.

## 8. מטריצת הרשאות
כמו בגרסה 1, עם השינויים הבאים:
- **אין purge.**
- **המטריצה עצמה נאכפת ב־`work_authorize` ב־DB** (החלטה 12), ולא רק ב־route.
- **מחיקה בחבילה 1:** אין עדיין `created_by`, ולכן מחיקת משימה ב־`/tasks` הישן מותרת ל־**owner/admin בלבד** (חבר צוות מקבל 403). זה שינוי התנהגות שאושר בחבילה 1.

## 9. מעבר מ־ClickUp (מעודכן)
1. **Inventory:** קריאה בלבד, כולל checklists, תגובות, time entries בחלונות חודשיים ותתי־רשימות. הריצה resumable.
2. **מיפוי:**
   - status לפי סוג → `work_statuses`;
   - list → `type`;
   - users → `clickup_user_map`;
   - "Blocked On" → `waiting_on`;
   - הקלטות → `task_evidence`;
   - **checklists** → `task_checklist_items`.
3. **Dry-run:** הפלט נכתב ל־`work_import_items` בלבד.
4. **חריגות:**
   - **חוסמות:** סטטוס או משתמש לא ממופה, תלות מעגלית, **תלות או אב חוצי־פרויקט**.
   - **אזהרות:** תלות `relates` של ClickUp (נשמרת כקישור בתיאור ובדוח), עומק מעל 3, קבצים, משימה בכמה רשימות.
5. **חזרות:** יבוא מלא לעותק staging, ובדיקת parity של `TaskSource`.
6. **Cutover לפרויקט, עם snapshot בלתי משתנה:**
   1. הבעלים מגדיר "View only" ב־Folder (best effort), ומודיע לצוות.
   2. **קריאה מלאה A** נשמרת כ־`work_import_snapshots` (append-only): JSON מנורמל, hash כולל ו־hash לכל ישות.
   3. **קריאה מלאה B**, לפחות N דקות אחרי A (החלטת בעלים, ברירת מחדל 15). **אם hash(B) ≠ hash(A), המעבר מבוטל** ומתחיל מחדש.
   4. היבוא נעשה **מה־snapshot, לא מקריאה חיה.**
   5. אימות: ספירות לפי קטגוריה וסוג, סכום הערכות, זמן ב־ms, hash לכל משימה, checklists ותגובות.
   6. **קריאת hash אחרונה C**, מיד לפני ה־flip. אם היא שונה מ־A, המעבר מבוטל.
   7. אישור בעלים, ואז `flip` ב־`auditedAction`.
7. **אחרי ה־flip:** גלאי סחיפה מדווח בלבד; ניתוק אופציונלי בסוף.

**כללי היבוא:**
- **חזרה אחורה:** כמו בגרסה 1 (rollback של run לפני ה־flip; flip חזרה לפני כתיבה ראשונה ב־Work; אחרי כתיבה ב־Work נדרש יצוא ידני).
- **כפילויות:** unique `(business, system, external_id)`.
- **יבוא חלקי:** פרויקט במצב `partial` לא עובר flip.

**הפניה ניטרלית בחוזי השיווק (החלטה 7 של הבעלים):**
- **(א) נרמול בצד הקריאה (חבילה 1):** `planItemTaskRef(item)` מחזיר `{provider:'clickup', id}` מתוך `clickupTaskId`. כל ההתאמה בפאנל נעשית לפי `WorkRef`.
- **(ב) הרחבת חוזה** (שלב 5, בתיאום עם marketing-os והחלטת בעלים):
  - שדה אופציונלי חדש `taskRef:{provider:'clickup'|'mytiv', id}` בגרסת חוזה חדשה של C1, לצד `clickupTaskId`.
  - **הקורא מקבל את שניהם.** אם שניהם קיימים הם חייבים להתאים, אחרת invalid.
  - **artifacts קיימים** הם append-only: לא נכתבים מחדש, ונשארים תקפים לעולם.
- **(ג) אחרי ה־flip:** הפניה `{clickup, id}` נפתרת דרך `work_external_refs` למשימת Mytiv.
- **(ד)** המנוע עובר לכתוב `taskRef` ב־PR נפרד ב־marketing-os.

## 10. בדיקות
כמו בגרסה 1, ובנוסף:
- **הרשאות ב־DB:** קריאה ישירה ל־`work_*` עם actor שאינו חבר, עם חברות מבוטלת, עם role נמוך, או עם target של עסק אחר — כולן נפסלות. DML ישיר ללא `via_function` נפסל.
- **סטטוסים:** צירוף `status_key`/`status_category` סותר נפסל ב־FK.
- **אותו פרויקט:** אב או `blocks` חוצי־פרויקט נפסלים; `move` מחזיר את רשימת החוסמים.
- **`work_requests`:** replay עם actor אחר או operation אחר מחזיר 409; replay אחרי ביטול חברות מחזיר 403.
- **checklist:** CRUD, יבוא ו־replay.
- **cutover:** סימולציה ב־mock של שינוי בין A ל־B → המעבר מבוטל; שינוי בין A ל־C → המעבר מבוטל.
- **הפניית השיווק:** ספק `clickupTaskId` לבד, `taskRef` לבד, שניהם תואמים, שניהם סותרים.
- **expand/backfill:** הרצת backfill פעמיים ⇒ אותה תוצאה; ערכים פסולים בהסגר.

## 11–12. PRs ותנאי קבלה (מעודכן)
| PR | תוכן | שער |
|---|---|---|
| **חבילה 1 (עכשיו)** | ADR + הקשחת `/tasks` + `TaskSource` ניטרלי (פירוט למטה) | review לפני migration ראשון |
| 2 | סקריפט דוח נתונים ישנים (שלב 0) | הרצה על prod |
| 3 | `0012_work_expand` + dual-write ב־`/tasks` | migration ל־staging/prod |
| 4 | backfill + דוח | לפי דוח |
| 5 | `0013_work_validate` + guard triggers | דוח נקי |
| 6 | `0014_work_functions` (`work_authorize`, create/update/move/delete/restore/archive, deps, `work_requests`) + API + דגל | — |
| 7 | `0015_work_time` (טיימר, רשומות, נעילה) | `btree_gist` |
| 8 | UI primitives + List, מגירה, checklist, "המשימות שלי", טיימר | תלויות npm |
| 9 | `0016_work_collab` (תגובות, אזכורים, checklist ב־DB, התראות in-app) | — |
| 10 | Kanban + לוח שנה + דוחות זמן/עומס | — |
| 11 | `0017_work_import`: inventory, dry-run, snapshots | קריאה מ־ClickUp אמיתי |
| 12 | יבוא, אימות, `WorkSource` (מתאם Mytiv) ל־Ops, כולל Copilot/Money | — |
| 13 | כלי cutover + פיילוט `מיטיב` | לכל פרויקט |
| 14 | חוזה שיווק `taskRef` (שני הריפואים) | החלטת בעלים |
| 15 | contract migration | שער נפרד |
| 16 | קבצים פרטיים / שלב 6 | לפי החלטות |

## 13. אישורי בעלים פתוחים
1. **עומק 3** ומדיניות override.
2. **מודל הרווחיות:** תעריפים, לקוח, מי רואה עלויות.
3. **`btree_gist`** ותלויות npm.
4. **אחסון קבצים פרטי** והפרדת Preview.
5. **כל migration** ב־staging/prod.
6. **ClickUp:** inventory, מיפוי, הקפאה ובדיקתה בפועל עם member ו־token, N הדקות בין הקריאות, flip לכל פרויקט, ניתוק.
7. **אזור זמן במסכים הקיימים.**
8. **הטיפול ביתומים** אחרי הדוח.
9. **retention** של `work_requests`/`work_events`, ותכנון מחיקה פיזית.
10. **שינוי חוזה C1.**
11. **התראות במייל.**

## 14. מורכבות
| PR | גודל |
|---|---|
| חבילה 1 | M (נוגעת בכ־12 קבצי Ops, בלי שינוי התנהגות) |
| 3–5 | L (נתונים חיים) |
| 6 | XL (פונקציות + הרשאות ב־DB + concurrency) |
| 7 | L |
| 8 | L |
| 9 | M |
| 10 | L |
| 11–13 | XL |
| 14 | M (שני ריפואים) |
| 15 | M |

הנתיב הקריטי: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 → 11 → 12 → 13.

## 15. MVP (מעודכן)
**נכנס:**
- חבילה 1 ו־PRs 2–13;
- **checklist בסיסי**;
- תלות `blocks` ואב/ילד באותו פרויקט בלבד;
- soft delete, סל וארכוב;
- טיימר וזמן ידני;
- דוח זמן;
- תגובות, אזכורים והתראות in-app;
- קישורי ראיה;
- פיילוט `מיטיב`.

**נדחה:**
- `purge` ומחיקה פיזית;
- `relates` חוצה־פרויקטים;
- ערכות סטטוס;
- קבצים;
- תבניות;
- משימות חוזרות;
- Gantt;
- אוטומציות;
- לקוח חיצוני;
- מייל;
- עומסים מתקדמים;
- מודל רווחיות מלא.

---

# חבילה 1 — מפרט מימוש

### א. הכנה
1. **אימות HEADs:** `git ls-remote origin` + `gh pr view 7/8`. אם ההפניות שונות מהטבלה למעלה, עוצרים ומדווחים.
2. **worktree נפרד:** `git worktree add ~/Projects/mytiv-os-work -b auto/work-pkg1 e35a189`, בלי לגעת ב־checkout הראשי. `node_modules` מקושר כמו ב־`ibuild.sh` הקודם.
3. **commits מקומיים בענף בלבד**, בלי push ובלי PR עד ה־review.

### ב. ADR
`docs/work/ADR-0001-mytiv-work-source-of-truth.md`: סיכום §3 ו־§3.1, מקור אמת לכל פרויקט, ללא סנכרון דו־כיווני, `TaskSource` ניטרלי, expand/contract, הרשאה ב־DB, `purge` מחוץ ל־MVP, ופרוטוקול ה־snapshot.

### ג. הקשחת `/tasks` (ללא migration)
- **`lib/tasks-policy.ts` (חדש)** — ולידציה בסגנון `lib/ops-policy.ts`:
  - **allowlist:** `title` (חובה ביצירה, 1–500), `notes` (≤20000), `status ∈ {backlog,todo,in_progress,waiting,done}`, `priority ∈ {low,medium,high,urgent}`, `category` (≤100), `dueDate` (`YYYY-MM-DD` תקין או null), `leadId`, `projectId` (UUID או null).
  - **שדה אחר** (כולל `doneAt`, `businessId`, `id`) → 400 `field_not_allowed`.
  - **`doneAt`** נגזר בצד השרת ממעבר סטטוס.
- **אימות דייר:** `projectId` מחייב `getProject(businessId, id)` (`lib/db/queries/projects.ts`); `leadId` מחייב שאילתת ליד עם `business_id`. אחרת: 404 `project_not_found` / `lead_not_found`, בלי לחשוף שהמזהה קיים בעסק אחר.
- **`lib/db/queries/tasks.ts`:**
  - `createTask` שומר `projectId`.
  - `updateTask` מקבל patch מאומת בלבד, לא `Record<string,unknown>`.
  - `updateTask`/`removeTask` מחזירים null/false כשאין שורה.
- **Routes** (`app/api/[businessSlug]/tasks/route.ts`, `[id]/route.ts`):
  - same-origin בכל POST/PATCH/DELETE: `assertSameOrigin`, שיחולץ מ־`assertConfirmation` ב־`ops-policy.ts:27-28`.
  - JSON פגום → 400 `invalid_json`.
  - id שאינו UUID או לא קיים → 404 `not_found`.
  - DELETE → `assertWriter` (owner/admin); חבר צוות מקבל 403.
- **`proposals/[id]/page.tsx:145-152`:** מעביר `projectId: draft.projectId` אם קיים.
- **`tasks/page.tsx`:** אחרי 403 במחיקה מוצגת הודעה בעברית/אנגלית דרך `t()`. ללא שינוי חזותי אחר.
- **`scripts/leak-audit.ts`:**
  - **בדיקות חדשות:** create/update עם `projectId`/`leadId` של עסק אחר נפסלים; PATCH עם `businessId`/`doneAt` נפסל.
  - **הרצה:** רק מול PG מקומי (neon-shim). הסקריפט ייבדק שהוא לא קורא `.env.local` של production, ויוסף guard שמסרב ל־host לא מקומי.

### ד. `TaskSource` ניטרלי (ללא שינוי התנהגות)
- **`lib/work-source/types.ts`:**
  - `WorkProvider = 'clickup' | 'mytiv'`, `WorkRef = {provider, id}`.
  - `WorkItem`:
    - `{ref, projectKey, projectLabel, title, statusLabel, statusCategory: 'open'|'active'|'done'|'closed', statusScope (מפתח אטום לאפשרויות סטטוס), priority, assignee: WorkPerson|null, kind: 'task'|'bug'|'decision'|'other', dueDate, overdue, updatedAt, daysIdle, waitingOn: 'client'|'contractor'|'internal'|null, estimateMinutes, concurrencyToken (אטום), sourceLink: {href, label}|null}`
  - `WorkPerson = {ref: string, name}`, `StatusOption = {label, category}`.
  - `TaskSource`: `listProjectItems`, `listOpenItems`, `statusOptions`, `listPeople`, `timeByItem`.
- **`lib/work-source/clickup-adapter.ts`:** הממפה היחיד `OpsTask → WorkItem`.
  - `statusType` → `statusCategory` (open → open, custom → active, done → done, closed → closed).
  - `listId` → `statusScope`.
  - `url` → `sourceLink` (label "ClickUp").
  - id מספרי → `String`.
  - `blockedOn` Me/Client/Contractor → internal/client/contractor.
  - שעות → דקות.
  - `marker` → `concurrencyToken`.
  - הפונקציה ההפוכה לכתיבה, `toClickUpAssigneeIds`, חיה רק כאן.
- **`lib/work-source/index.ts`:** `taskSourceFor(project)` מחזיר את ClickUp בלבד (אין עדיין `work_source`).
- **צרכנים שעוברים ל־`WorkItem`:**
  - `ops/page.tsx`, `ops/projects/page.tsx`, `ops/projects/[projectId]/page.tsx`, `ops/money/page.tsx` (הערכות)
  - `components/ops/{stuck-list,task-table,client-workspace,marketing-panel,stat-tiles}.tsx`
- **פאנל השיווק:** מתאים לפי `planItemTaskRef(item)` (`lib/marketing/task-ref.ts`, חדש).
- **תוויות:** "Blocked on Me" וכו' נשמרות זהות. מיפוי התצוגה (`waitingOn` → תווית קיימת) חי ב־`lib/work-source/labels.ts`.
- **`task-table`:** שולח `assignee.add/rem` כ־`WorkPerson.ref` (מחרוזות). ה־route `ops/tasks/[taskId]` ממיר דרך המתאם, ומקבל גם מספרים לתאימות לאחור (בדיקות rollback ו־http-matrix הקיימות). פרט לזה, חוזה הכתיבה ל־ClickUp לא משתנה.
- **מחוץ לחבילה, נשארים ספציפיים ל־ClickUp ומתועדים כחוב לשלב 12:**
  - `lib/ai/ops-copilot.ts`
  - `ops/chat/confirm`, `actions/*/rollback|reconcile`
  - `ops/snapshot` ו־`ops/members` (API של הספק)
  - `assertClosure`

### ה. בדיקות ואימות
1. **בסיס לפני שינוי, להשוואה:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `tests/db-integration/run.sh` (PG מקומי בלבד).
2. **חדשות:**
   - `tests/tasks-route.vitest.ts`: allowlist, ולידציה, 404, same-origin, 403 למחיקה, דייר זר ל־project/lead.
   - `tests/db-integration/tasks-isolation.itest.ts`: SQL אמיתי, שני עסקים.
   - `tests/work-source.vitest.ts`: מיפוי כל שדה, ותאימות דו־כיוונית של assignee.
   - `tests/ops-render-parity.vitest.ts`: `renderToStaticMarkup` של `StuckList`/`TaskTable`/`ClientWorkspace`/`MarketingPanel` עם fixtures, מול snapshot שנוצר על `e35a189` לפני השינוי.
   - `tests/marketing-task-ref.vitest.ts`.
3. **הרצה חוזרת אחרי השינוי:** כל הבדיקות הקיימות, leak-audit מקומי, ו־HTTP matrices מקומיים של Ops ושל שיווק מול `dev.sh` + `clickup-mock.mjs` + עותק PG מקומי. מצופה 67/67 ו־67/67, ללא רגרסיה.
4. **בסוף:** diff (`git diff e35a189...auto/work-pkg1 --stat` + עיקרי השינויים), ממצאים, והתוכנית המעודכנת. **עצירה לפני migration ראשון.**
