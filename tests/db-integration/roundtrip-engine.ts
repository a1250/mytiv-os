// Engine-side helper for roundtrip.itest.ts — run with the ENGINE's tsx, cwd = a marketing-os checkout:
//   npx tsx <this file> seed | transition <tenant> <task> <status> | note <tenant> <approval> | brain-audit <tenant> <approval> | drop <tenant>
// It only calls the engine's own library functions (the same ones its tests use) on a throwaway tenant
// copied from the fictional `_fixture-demo` brain; it never touches another tenant. Prints JSON.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lib = async (m: string): Promise<any> => import(path.join(root, 'core/lib', `${m}.ts`));
const [cmd, ...args] = process.argv.slice(2);
const SAFE = /^rt[a-z0-9]+$/; // only the round-trip's own tenants

async function main(): Promise<unknown> {
  const { BUSINESSES_DIR, DATA_DIR } = await lib('tenant');
  if (cmd === 'seed') {
    const tenant = `rt${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const dst = path.join(BUSINESSES_DIR, tenant);
    fs.cpSync(path.join(BUSINESSES_DIR, '_fixture-demo', 'brain'), path.join(dst, 'brain'), { recursive: true });
    for (const sub of ['work/approvals/pending', 'work/approvals/approved', 'work/approvals/rejected', 'assets', 'manual-runs', 'learning', 'memory']) fs.mkdirSync(path.join(dst, sub), { recursive: true });
    // Two TRACKED brain fields (C3a exports value hashes only for tracked fields): one owner-verified, one not.
    const hours = path.join(dst, 'brain', 'hours.yaml');
    const src = fs.readFileSync(hours, 'utf8');
    if (!src.includes('  field_verification: {}\n')) throw new Error('fixture hours.yaml changed shape');
    fs.writeFileSync(hours, src.replace('  field_verification: {}\n', '  field_verification:\n    kitchen_last_order_minutes_before_close:\n      owner_verified: true\n      source_verified: false\n    weekly.fri:\n      owner_verified: false\n      source_verified: false\n'));
    const { addTask, transition } = await lib('workboard');
    const { createApproval } = await lib('approvals');
    const { businessSlug } = await lib('artifact-exporters');
    const dod = ['live post URL recorded', 'reservations measured for the campaign window'];
    const task = addTask(tenant, { title: 'Terrace happy-hour reel', requested_by: 'cmo', owner: 'creative-director', definition_of_done: dod });
    for (const s of ['accepted', 'in_progress', 'qa_pending', 'approval_pending']) transition(tenant, task.id, s, 'orchestrator');
    const card = { action_class: 'RED', why: 'Fill mid-week terrace capacity', rollback_note: 'Archive the post' };
    const publish = createApproval(tenant, { ...card, artifact_id: 'art-reel', task_id: task.id, action_type: 'publish_organic_new', title: 'Publish terrace reel' }, 'Caption: terrace happy hour, Sun–Thu 17:00–19:00.').id;
    const campaign = createApproval(tenant, { ...card, artifact_id: 'art-campaign', action_type: 'campaign_activate', title: 'Activate terrace campaign' }, 'Budget within the approved brief.').id;
    const rejectMe = createApproval(tenant, { ...card, artifact_id: 'art-story', action_type: 'publish_organic_new', title: 'Publish story teaser' }, 'Story teaser.').id;
    const staleMe = createApproval(tenant, { ...card, artifact_id: 'art-promo', action_type: 'campaign_activate', title: 'Activate promo' }, 'Promo.').id;
    const rejectCamp = createApproval(tenant, { ...card, artifact_id: 'art-weekend', action_type: 'campaign_activate', title: 'Activate weekend campaign' }, 'Weekend budget.').id;
    return { tenant, slug: businessSlug(tenant), taskId: task.id, dod, publish, campaign, rejectMe, staleMe, rejectCamp };
  }
  const tenant = args[0];
  if (!tenant || !SAFE.test(tenant)) throw new Error(`refusing: not a round-trip tenant: ${tenant}`);
  if (cmd === 'transition') {
    const { transition } = await lib('workboard');
    return { status: transition(tenant, args[1], args[2], 'orchestrator').status };
  }
  if (cmd === 'note') { // an engine-side edit of a pending approval AFTER the app's export: its content_hash moves
    const { addNote } = await lib('approvals');
    addNote(tenant, args[1], 'orchestrator', 'Budget revised after the export.');
    return { ok: true };
  }
  if (cmd === 'brain-audit') { // the committed brain.updated audit id of an applied brain_update approval (for rollback.ts)
    const { readAudit } = await lib('audit');
    const rec = readAudit(tenant).filter((r: { event: string; ref?: string }) => r.event === 'brain.updated' && r.ref === args[1]);
    if (rec.length !== 1) throw new Error(`expected one brain.updated for ${args[1]}, found ${rec.length}`);
    return { auditId: rec[0].id };
  }
  if (cmd === 'drop') {
    fs.rmSync(path.join(BUSINESSES_DIR, tenant), { recursive: true, force: true });
    fs.rmSync(path.join(DATA_DIR, tenant), { recursive: true, force: true });
    return { ok: true };
  }
  throw new Error(`usage: seed | transition <tenant> <task> <status> | note <tenant> <approval> | brain-audit <tenant> <approval> | drop <tenant>`);
}

main().then((r) => process.stdout.write(JSON.stringify(r)), (e) => { process.stderr.write(String(e instanceof Error ? e.message : e)); process.exit(1); });
