import c9Schema from '../contracts/C9.schema.json';
import c10Schema from '../contracts/C10.schema.json';
import c11Schema from '../contracts/C11.schema.json';
import c12Schema from '../contracts/C12.schema.json';
import c14Schema from '../contracts/C14.schema.json';
import { requireDateOrTimestamp, requireNonEmpty, requireSafeRef, requireTimestamp, requireUnique, rows, trimmed, violation } from './rules';
import { contract, type Envelope } from './spec';
import type { Confidence } from './c5-c8';

// Canonical source: marketing-os `schemas/contracts/c9-c14.ts` (C9–C12, C14; C13 lives with C4).

/** C9 — IngestManifest v1 (Home freshness panel). `as_of` null only while UNKNOWN (nothing ingested). */
export type IngestSource = { source: string; as_of: string | null; rows: number; schema_result: 'pass' | 'fail'; status: 'FRESH' | 'STALE' | 'UNKNOWN' };
export type IngestManifest = Envelope & { as_of: string; sources: IngestSource[] };

/** C10 — IntegrationStatus v1 (verification metadata only — never a credential). */
export type Integration = { id: string; name: string; class: 'A' | 'B' | 'C' | 'D' | 'E'; status: 'verified' | 'unverified'; verified_at: string | null; verified_by: string | null };
export type IntegrationStatus = Envelope & { integrations: Integration[] };

/** C11 — SkillsStatus v1 (Skills Lab, read-only). */
export type SkillStatusEntry = { skill: string; status: string; golden_count: number; last_replay_score: number | null };
export type SkillsStatus = Envelope & { skills: SkillStatusEntry[] };

/** C12 — CampaignArtifacts v1 (Campaigns & Content). Every asset ref carries its provenance label. */
export type CampaignPlan = {
  id: string; objective: string; audiences: string[]; creative_matrix?: string[]; budget_envelope: number;
  kpis?: string[]; tracking_spec: string; build_state: 'draft' | 'paused' | 'active' | 'archived';
};
export type ContentEntry = { id: string; date: string; channel: string; status: string };
export type ManualPublishPack = { id: string; campaign_id?: string; instructions: string };
export type AssetRef = { ref: string; provenance: 'real' | 'ai_enhanced' | 'ai_concept'; disclosure?: string };
export type CampaignArtifacts = Envelope & {
  campaigns?: CampaignPlan[]; content_calendar?: ContentEntry[]; manual_publish_packs?: ManualPublishPack[]; asset_refs?: AssetRef[];
};

/** C14 — MonthlyPlan v1 (parent of the C8 weekly plans). `owner` and `approvalRef` are REFERENCE ONLY
 *  (MKT-GOV05): an approvalRef is a pointer for display — it never authorizes anything, and nothing in
 *  validation resolves or trusts it beyond checking it is a safe ref. */
export type PlanObjective = {
  id: string; text: string; sourceRef: string; sourceRevision: string; asOf: string; confidence: Confidence;
  owner?: string; approvalRef?: string;
};
export type KpiTarget = { kpi: string; target: number; confidence: Confidence };
export type MonthlyPlan = Envelope & {
  month: string; objectives: PlanObjective[]; budget_pool: number; themes?: string[]; kpi_targets?: KpiTarget[];
  review_cadence: 'weekly' | 'monthly' | 'quarterly';
};

export const C9_C14_CONTRACTS = {
  C9: contract<IngestManifest>({
    schema: c9Schema, envelope: true, bound: false,
    check: (m) => {
      requireTimestamp(m.as_of, '/as_of');
      m.sources.forEach((s, i) => {
        requireNonEmpty(s.source, `/sources/${i}/source`);
        if (s.as_of !== null) requireTimestamp(s.as_of, `/sources/${i}/as_of`);
        if (s.status !== 'UNKNOWN' && s.as_of === null) violation(`/sources/${i}/as_of`, `a ${s.status} source must have an as_of`);
        if (s.status === 'UNKNOWN' && s.rows !== 0) violation(`/sources/${i}/rows`, 'an UNKNOWN source has no rows');
      });
      requireUnique(m.sources, (s) => trimmed(s.source), '/sources', 'source');
    },
  }),
  C10: contract<IntegrationStatus>({
    schema: c10Schema, envelope: true, bound: false,
    check: (s) => {
      s.integrations.forEach((it, i) => {
        const p = `/integrations/${i}`;
        requireNonEmpty(it.id, `${p}/id`);
        requireNonEmpty(it.name, `${p}/name`);
        if (it.verified_at !== null) requireTimestamp(it.verified_at, `${p}/verified_at`);
        if (it.verified_by !== null) requireNonEmpty(it.verified_by, `${p}/verified_by`);
        const verified = it.status === 'verified';
        if (verified && (it.verified_at === null || it.verified_by === null)) violation(p, 'a verified integration requires verified_at and verified_by');
        if (!verified && (it.verified_at !== null || it.verified_by !== null)) violation(p, 'an unverified integration must not carry verified_at/verified_by');
      });
      requireUnique(s.integrations, (it) => trimmed(it.id), '/integrations', 'integration id');
    },
  }),
  C11: contract<SkillsStatus>({
    schema: c11Schema, envelope: true, bound: false,
    check: (s) => {
      s.skills.forEach((sk, i) => {
        requireNonEmpty(sk.skill, `/skills/${i}/skill`);
        if (sk.status === 'PRODUCTION' && sk.golden_count < 1) violation(`/skills/${i}/golden_count`, 'a PRODUCTION skill requires at least one golden example');
        if (sk.status === 'PRODUCTION' && sk.last_replay_score === null) violation(`/skills/${i}/last_replay_score`, 'a PRODUCTION skill requires a replay score');
      });
      requireUnique(s.skills, (sk) => trimmed(sk.skill), '/skills', 'skill');
    },
  }),
  C12: contract<CampaignArtifacts>({
    schema: c12Schema, envelope: true, bound: false,
    check: (a) => {
      const campaigns = rows(a.campaigns), calendar = rows(a.content_calendar), packs = rows(a.manual_publish_packs);
      campaigns.forEach((c, i) => {
        const p = `/campaigns/${i}`;
        for (const f of ['id', 'objective', 'tracking_spec'] as const) requireNonEmpty(c[f], `${p}/${f}`);
        for (const f of ['audiences', 'creative_matrix', 'kpis'] as const) rows(c[f]).forEach((v, j) => requireNonEmpty(v, `${p}/${f}/${j}`));
      });
      calendar.forEach((e, i) => {
        for (const f of ['id', 'channel', 'status'] as const) requireNonEmpty(e[f], `/content_calendar/${i}/${f}`);
        requireDateOrTimestamp(e.date, `/content_calendar/${i}/date`);
      });
      packs.forEach((pk, i) => {
        requireNonEmpty(pk.id, `/manual_publish_packs/${i}/id`);
        requireNonEmpty(pk.instructions, `/manual_publish_packs/${i}/instructions`);
        if (pk.campaign_id !== undefined) requireNonEmpty(pk.campaign_id, `/manual_publish_packs/${i}/campaign_id`);
      });
      rows(a.asset_refs).forEach((r, i) => {
        requireSafeRef(r.ref, `/asset_refs/${i}/ref`);
        if (r.disclosure !== undefined) requireNonEmpty(r.disclosure, `/asset_refs/${i}/disclosure`);
      });
      requireUnique(campaigns, (c) => trimmed(c.id), '/campaigns', 'campaign id');
      requireUnique(calendar, (e) => trimmed(e.id), '/content_calendar', 'content entry id');
      requireUnique(packs, (pk) => trimmed(pk.id), '/manual_publish_packs', 'publish pack id');
      const campaignIds = new Set(campaigns.map((c) => trimmed(c.id)));
      packs.forEach((pk, i) => {
        if (pk.campaign_id !== undefined && !campaignIds.has(trimmed(pk.campaign_id))) violation(`/manual_publish_packs/${i}/campaign_id`, `references unknown campaign "${pk.campaign_id}"`);
      });
    },
  }),
  C14: contract<MonthlyPlan>({
    schema: c14Schema, envelope: true, bound: false,
    check: (m) => {
      m.objectives.forEach((o, i) => {
        const p = `/objectives/${i}`;
        for (const f of ['id', 'text', 'sourceRevision'] as const) requireNonEmpty(o[f], `${p}/${f}`);
        requireSafeRef(o.sourceRef, `${p}/sourceRef`);
        requireTimestamp(o.asOf, `${p}/asOf`);
        if (o.owner !== undefined) requireNonEmpty(o.owner, `${p}/owner`);
        // Reference only (MKT-GOV05): validated as a safe pointer, never resolved or trusted.
        if (o.approvalRef !== undefined) requireSafeRef(o.approvalRef, `${p}/approvalRef`);
      });
      rows(m.themes).forEach((t, i) => requireNonEmpty(t, `/themes/${i}`));
      rows(m.kpi_targets).forEach((k, i) => requireNonEmpty(k.kpi, `/kpi_targets/${i}/kpi`));
      requireUnique(m.objectives, (o) => trimmed(o.id), '/objectives', 'objective id');
      requireUnique(rows(m.kpi_targets), (k) => trimmed(k.kpi), '/kpi_targets', 'kpi target');
    },
  }),
};
