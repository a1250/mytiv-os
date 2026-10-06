/**
 * Mytiv OS — Postgres schema (Drizzle ORM).
 * Ported from the Electron app's electron/db/schema.cjs (SQLite via sql.js).
 * Every domain table gains a mandatory business_id for multi-tenant isolation.
 * IDs are native uuid (defaultRandom) rather than the app-generated text ids
 * the Electron version used — this is a fresh Postgres database, no migration
 * of existing rows is needed.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  foreignKey,
  primaryKey,
  check,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Tenancy
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").default("Asia/Jerusalem"),
  locale: text("locale").default("en"), // en | he
  accentColor: text("accent_color").default("#6366f1"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessMemberships = pgTable(
  "business_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner | admin | member
    invitedAt: timestamp("invited_at", { withTimezone: true }).defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    /** Mytiv Work: a member who left is deactivated, never deleted — their history and assignments keep a valid FK. */
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("business_memberships_business_user_uq").on(t.businessId, t.userId)]
);

// Per-business encrypted secrets (Claude key, Google OAuth client secret, Higgsfield key).
// ciphertext/iv are AES-256-GCM, encrypted app-side with SECRETS_MASTER_KEY — see lib/crypto/secrets.ts.
export const businessSecrets = pgTable(
  "business_secrets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // ai_api_key | google_client_secret | higgsfield_api_key
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("business_secrets_business_key_uq").on(t.businessId, t.key)]
);

// Generic per-business KV settings (studio_name, owner_name, default_language, radar feeds, etc.)
// Anything secret goes in business_secrets instead.
export const settings = pgTable(
  "settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value"),
  },
  (t) => [uniqueIndex("settings_business_key_uq").on(t.businessId, t.key)]
);

// ---------------------------------------------------------------------------
// Tasks & Ops
// ---------------------------------------------------------------------------

/** Mytiv Work: the system status catalogue. Global, contains no tenant data; copied into every business. */
export const workStatusTemplates = pgTable("work_status_templates", {
  key: text("key").primaryKey(),
  category: text("category").notNull(),
  labelHe: text("label_he").notNull(),
  position: integer("position").notNull(),
}, (t) => [
  check("work_status_templates_category_ck", sql`${t.category} in ('open','active','waiting','review','done','cancelled')`),
]);

/**
 * Mytiv Work: statuses per business (ADR-0001 decision 4). The same key may exist in two businesses; a task
 * can only point at a status of its own business, with that status's category (composite FK on tasks).
 * key/category/business are immutable (trigger); renames change label_he and are appended to revisions.
 */
export const workStatuses = pgTable("work_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  templateKey: text("template_key").references(() => workStatusTemplates.key),
  category: text("category").notNull(),
  labelHe: text("label_he").notNull(),
  position: integer("position").notNull(),
  retiredAt: timestamp("retired_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("work_statuses_business_key_uq").on(t.businessId, t.key),
  uniqueIndex("work_statuses_business_id_category_uq").on(t.businessId, t.id, t.category),
  check("work_statuses_category_ck", sql`${t.category} in ('open','active','waiting','review','done','cancelled')`),
  check("work_statuses_key_ck", sql`${t.key} ~ '^[a-z][a-z0-9_]{0,39}$'`),
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes").default(""),
    status: text("status").notNull().default("todo"), // legacy: backlog | todo | in_progress | waiting | done (until the contract step)
    priority: text("priority").notNull().default("medium"), // low | medium | high | urgent
    category: text("category").default(""),
    dueDate: text("due_date"), // legacy YYYY-MM-DD text (until the contract step); due_on is the typed column
    leadId: uuid("lead_id"),
    projectId: uuid("project_id"),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    // ── Mytiv Work expand (0012): new columns only; nothing here constrains a legacy value ──
    /** Per-business status row; with status_category it must match work_statuses (composite FK). */
    statusId: uuid("status_id"),
    statusCategory: text("status_category"),
    dueOn: date("due_on"),
    startOn: date("start_on"),
    parentId: uuid("parent_id"),
    position: numeric("position"),
    ownerUserId: uuid("owner_user_id"),
    createdBy: uuid("created_by").references(() => users.id),
    type: text("type").notNull().default("task"),
    waitingOn: text("waiting_on"),
    estimateMinutes: integer("estimate_minutes"),
    billable: boolean("billable"),
    source: text("source").notNull().default("legacy"),
    externalStatus: text("external_status"),
    version: integer("version").notNull().default(1),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => users.id),
    trashBatchId: uuid("trash_batch_id"),
    // ── Mytiv Work functions (0013): fields the Work UI writes, only through the work_* DB functions ──
    /** Manual block: only on a 'waiting' task and never blank (blocked is otherwise derived from open dependencies). */
    blockedReason: text("blocked_reason"),
    nextAction: text("next_action"),
    followUpOn: date("follow_up_on"),
  },
  (t) => [
    index("tasks_business_idx").on(t.businessId),
    uniqueIndex("tasks_business_id_uq").on(t.businessId, t.id),
    index("tasks_business_project_idx").on(t.businessId, t.projectId),
    index("tasks_business_owner_idx").on(t.businessId, t.ownerUserId),
    index("tasks_business_parent_idx").on(t.businessId, t.parentId),
    foreignKey({ name: "tasks_status_fk", columns: [t.businessId, t.statusId, t.statusCategory], foreignColumns: [workStatuses.businessId, workStatuses.id, workStatuses.category] }),
    foreignKey({ name: "tasks_parent_fk", columns: [t.businessId, t.parentId], foreignColumns: [t.businessId, t.id] }),
    foreignKey({ name: "tasks_owner_member_fk", columns: [t.businessId, t.ownerUserId], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
    check("tasks_type_ck", sql`${t.type} in ('task','bug','decision')`),
    check("tasks_waiting_on_ck", sql`${t.waitingOn} is null or ${t.waitingOn} in ('client','contractor','internal')`),
    check("tasks_source_ck", sql`${t.source} in ('legacy','manual','proposal','comment','copilot','import_clickup')`),
    check("tasks_estimate_ck", sql`${t.estimateMinutes} is null or ${t.estimateMinutes} between 0 and 1000000`),
    check("tasks_version_ck", sql`${t.version} >= 1`),
    check("tasks_status_pair_ck", sql`(${t.statusId} is null) = (${t.statusCategory} is null)`),
    check("tasks_not_own_parent_ck", sql`${t.parentId} is null or ${t.parentId} <> ${t.id}`),
    check("tasks_blocked_reason_ck", sql`${t.blockedReason} is null or (${t.statusCategory} = 'waiting' and btrim(${t.blockedReason}) <> '')`),
  ]
);

/** "A waits for B" (blocks), same business and same project only (checked by work_task_update); no self edge. */
export const taskDependencies = pgTable(
  "task_dependencies",
  {
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").notNull(),
    dependsOnId: uuid("depends_on_id").notNull(),
    kind: text("kind").notNull().default("blocks"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "task_dependencies_pk", columns: [t.businessId, t.taskId, t.dependsOnId] }),
    index("task_dependencies_on_idx").on(t.businessId, t.dependsOnId),
    foreignKey({ name: "task_dependencies_task_fk", columns: [t.businessId, t.taskId], foreignColumns: [tasks.businessId, tasks.id] }).onDelete("cascade"),
    foreignKey({ name: "task_dependencies_on_fk", columns: [t.businessId, t.dependsOnId], foreignColumns: [tasks.businessId, tasks.id] }).onDelete("cascade"),
    foreignKey({ name: "task_dependencies_creator_fk", columns: [t.businessId, t.createdBy], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
    check("task_dependencies_kind_ck", sql`${t.kind} = 'blocks'`),
    check("task_dependencies_not_self_ck", sql`${t.taskId} <> ${t.dependsOnId}`),
  ]
);

/** Participants of a task (besides its owner). */
export const taskMembers = pgTable(
  "task_members",
  {
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").notNull(),
    userId: uuid("user_id").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "task_members_pk", columns: [t.businessId, t.taskId, t.userId] }),
    foreignKey({ name: "task_members_task_fk", columns: [t.businessId, t.taskId], foreignColumns: [tasks.businessId, tasks.id] }).onDelete("cascade"),
    foreignKey({ name: "task_members_member_fk", columns: [t.businessId, t.userId], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  ]
);

/**
 * The Work write ledger (plan §3.10): one row per client request id, written by the work_* function that performed
 * it, with the result it returned. A replay with the same actor + operation + payload returns that result; anything
 * else reusing the id is refused. Append-only.
 */
export const workRequests = pgTable(
  "work_requests",
  {
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    operation: text("operation").notNull(),
    targetId: uuid("target_id"),
    payloadHash: text("payload_hash").notNull(),
    result: jsonb("result").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: "work_requests_pk", columns: [t.businessId, t.requestId] }),
    foreignKey({ name: "work_requests_actor_fk", columns: [t.businessId, t.actorId], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  ]
);

/** Append-only activity of a task (who did what, when) — the drawer's history and the audit of every Work write. */
export const workEvents = pgTable(
  "work_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").notNull(),
    actorId: uuid("actor_id").notNull(),
    requestId: uuid("request_id"),
    event: text("event").notNull(),
    detail: jsonb("detail").notNull().default(sql`'{}'::jsonb`),
    version: integer("version"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("work_events_task_idx").on(t.businessId, t.taskId, t.at),
    foreignKey({ name: "work_events_task_fk", columns: [t.businessId, t.taskId], foreignColumns: [tasks.businessId, tasks.id] }).onDelete("cascade"),
    foreignKey({ name: "work_events_actor_fk", columns: [t.businessId, t.actorId], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  ]
);

/** Append-only history of every status definition change (rename, reorder, retire). */
export const workStatusRevisions = pgTable("work_status_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  statusId: uuid("status_id").notNull().references(() => workStatuses.id),
  labelHe: text("label_he").notNull(),
  position: integer("position").notNull(),
  retiredAt: timestamp("retired_at", { withTimezone: true }),
  changedBy: uuid("changed_by"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("work_status_revisions_status_idx").on(t.businessId, t.statusId)]);

// Project Hub. One row per client project; the Ops module's spine.
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    client: text("client").default(""),
    status: text("status").default("active"),
    brief: text("brief").default(""),
    budget: text("budget").default(""),
    deadline: text("deadline"),
    /**
     * The bridge to ClickUp, which stays the source of truth for tasks.
     * Replaces the hardcoded map in lib/ops-config.ts once Phase 1 lands.
     */
    clickupFolderId: text("clickup_folder_id"),
    /** Mytiv Work: which source holds this project's work. Flipped per project at cutover (ADR-0001 decision 1, 10). */
    workSource: text("work_source").notNull().default("clickup"),
    cutoverAt: timestamp("cutover_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("projects_work_source_ck", sql`${t.workSource} in ('clickup','mytiv')`),
    index("projects_business_idx").on(t.businessId),
    uniqueIndex("projects_business_id_uq").on(t.businessId, t.id),
    /**
     * Two projects claiming the same ClickUp folder would double-count every
     * task on Ops Home. Postgres treats NULLs as distinct, so any number of
     * projects may stay unlinked.
     */
    uniqueIndex("projects_business_clickup_folder_idx").on(t.businessId, t.clickupFolderId),
  ]
);

// ---------------------------------------------------------------------------
// Lead CRM
// ---------------------------------------------------------------------------

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    category: text("category").default(""),
    country: text("country").default(""),
    city: text("city").default(""),
    website: text("website").default(""),
    instagram: text("instagram").default(""),
    linkedin: text("linkedin").default(""),
    facebook: text("facebook").default(""),
    contactName: text("contact_name").default(""),
    contactRole: text("contact_role").default(""),
    email: text("email").default(""),
    phone: text("phone").default(""),
    source: text("source").default(""),
    notes: text("notes").default(""),
    relevance: integer("relevance").default(3), // 1..5
    opportunityType: text("opportunity_type").default(""),
    status: text("status").notNull().default("new"),
    nextFollowUp: text("next_follow_up"), // YYYY-MM-DD
    lastContacted: text("last_contacted"), // YYYY-MM-DD
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("leads_business_idx").on(t.businessId),
    uniqueIndex("leads_business_id_uq").on(t.businessId, t.id),
  ]
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_notes_business_lead_idx").on(t.businessId, t.leadId)]
);

// people inside company leads (Contact Finder)
export const leadContacts = pgTable(
  "lead_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    jobTitle: text("job_title").default(""),
    department: text("department").default(""),
    seniority: text("seniority").default(""),
    linkedinUrl: text("linkedin_url").default(""), // public profile URL from search results only
    email: text("email").default(""),
    emailStatus: text("email_status").default("missing"), // public_verified | company_generic | pattern_guess | missing | manual
    phone: text("phone").default(""),
    sourceUrl: text("source_url").default(""),
    sourceType: text("source_type").default(""), // search_result | company_site | press | directory | manual
    confidence: integer("confidence").default(3), // 1..5
    relevance: integer("relevance").default(3), // 1..5
    whyRelevant: text("why_relevant").default(""),
    suggestedAngle: text("suggested_angle").default(""),
    suggestedService: text("suggested_service").default(""),
    notes: text("notes").default(""),
    status: text("status").default("new"), // new | verified | contacted | replied | not_relevant
    doNotContact: boolean("do_not_contact").default(false),
    lastChecked: timestamp("last_checked", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_contacts_business_lead_idx").on(t.businessId, t.leadId)]
);

export const contactSources = pgTable(
  "contact_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").notNull().references(() => leadContacts.id, { onDelete: "cascade" }),
    sourceUrl: text("source_url").default(""),
    sourceType: text("source_type").default(""),
    rawSnippet: text("raw_snippet").default(""),
    confidence: integer("confidence").default(3),
    valid: boolean("valid").default(true), // user can mark a source invalid
    dateFound: timestamp("date_found", { withTimezone: true }),
  },
  (t) => [index("contact_sources_business_contact_idx").on(t.businessId, t.contactId)]
);

export const outreachQueue = pgTable(
  "outreach_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => leadContacts.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    channel: text("channel").default("email"), // email | linkedin_manual | other
    status: text("status").default("queued"), // queued | drafted | sent | replied | done | skipped
    suggestedSendDate: text("suggested_send_date"),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    notes: text("notes").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("outreach_queue_business_idx").on(t.businessId)]
);

// ---------------------------------------------------------------------------
// Outreach Assistant
// ---------------------------------------------------------------------------

export const outreachMessages = pgTable(
  "outreach_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => leadContacts.id),
    kind: text("kind").notNull(), // cold_email_he | cold_email_en | linkedin | followup | premium | brand_direct
    language: text("language").default("en"), // en | he
    tone: text("tone").default("professional"),
    subject: text("subject").default(""),
    body: text("body").notNull(),
    status: text("status").notNull().default("draft"), // draft | sent_manually | replied | followup_needed
    notes: text("notes").default(""),
    googleDraftId: text("google_draft_id").default(""),
    googleMessageId: text("google_message_id").default(""),
    emailThreadId: uuid("email_thread_id"),
    sendMode: text("send_mode").default(""),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    replyDetectedAt: timestamp("reply_detected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("outreach_messages_business_lead_idx").on(t.businessId, t.leadId)]
);

// ---------------------------------------------------------------------------
// AI Weekly Radar
// ---------------------------------------------------------------------------

export const newsItems = pgTable(
  "news_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    source: text("source").default(""),
    url: text("url").default(""),
    imageUrl: text("image_url").default(""),
    category: text("category").default(""),
    publishedAt: text("published_at"), // YYYY-MM-DD
    summary: text("summary").default(""),
    whyItMatters: text("why_it_matters").default(""),
    relevance: integer("relevance").default(3),
    tags: text("tags").default(""), // comma separated
    saved: boolean("saved").default(false),
    actionIdea: text("action_idea").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_items_business_idx").on(t.businessId)]
);

export const weeklyReports = pgTable(
  "weekly_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    weekStart: text("week_start"),
    weekEnd: text("week_end"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("weekly_reports_business_idx").on(t.businessId)]
);

// ---------------------------------------------------------------------------
// Prompt Builder / Prompt Library
// ---------------------------------------------------------------------------

export const promptToolProfiles = pgTable(
  "prompt_tool_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    tool: text("tool").notNull(),
    kbVersion: text("kb_version").default(""),
    notes: text("notes").default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [index("prompt_tool_profiles_business_idx").on(t.businessId)]
);

export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tool: text("tool").default("generic"),
    projectType: text("project_type").default(""),
    outputType: text("output_type").default("image"),
    fields: jsonb("fields").default({}),
    tags: text("tags").default(""),
    favorite: boolean("favorite").default(false),
    builtin: boolean("builtin").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("prompt_templates_business_idx").on(t.businessId)]
);

export const savedPrompts = pgTable(
  "saved_prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    tool: text("tool").default("generic"),
    projectType: text("project_type").default(""),
    outputType: text("output_type").default("image"),
    fields: jsonb("fields").default({}),
    output: jsonb("output").default([]),
    tags: text("tags").default(""),
    client: text("client").default(""),
    leadId: uuid("lead_id").references(() => leads.id),
    favorite: boolean("favorite").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("saved_prompts_business_idx").on(t.businessId)]
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id").notNull().references(() => savedPrompts.id, { onDelete: "cascade" }),
    output: jsonb("output").default([]),
    note: text("note").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("prompt_versions_business_prompt_idx").on(t.businessId, t.promptId)]
);

export const promptTestNotes = pgTable(
  "prompt_test_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id").notNull().references(() => savedPrompts.id, { onDelete: "cascade" }),
    resultNotes: text("result_notes").default(""),
    whatFailed: text("what_failed").default(""),
    improvedVersion: text("improved_version").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("prompt_test_notes_business_prompt_idx").on(t.businessId, t.promptId)]
);

// ---------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    clientName: text("client_name").default(""),
    clientCompany: text("client_company").default(""),
    clientEmail: text("client_email").default(""),
    brand: text("brand").default(""),
    contact: text("contact").default(""),
    leadId: uuid("lead_id").references(() => leads.id),
    /** Which client project this proposal belongs to — the Phase 4 margin join. */
    projectId: uuid("project_id").references(() => projects.id),
    type: text("type").default(""),
    status: text("status").default("draft"),
    date: text("date"), // YYYY-MM-DD
    projectOverview: text("project_overview").default(""),
    description: text("description").default(""),
    goal: text("goal").default(""),
    timeline: text("timeline").default(""),
    assetCount: text("asset_count").default(""),
    revisionRounds: text("revision_rounds").default("2"),
    usageRights: text("usage_rights").default(""),
    budget: text("budget").default(""),
    paymentTerms: text("payment_terms").default(""),
    notes: text("notes").default(""),
    validUntil: text("valid_until"), // YYYY-MM-DD
    vatRate: integer("vat_rate").default(18),
    includeVat: boolean("include_vat").default(false),
    retainerMode: boolean("retainer_mode").default(false),
    sections: jsonb("sections").default([]), // [{title, body}]
    lineItems: jsonb("line_items").default([]), // [{name, description, qty, unit_price, optional}]
    services: jsonb("services").default([]), // [{id, title, description, setupFee, monthlyFee, monthlyBreakdown, monthlyBlockTitle}]
    emailText: text("email_text").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("proposals_business_idx").on(t.businessId)]
);

export const proposalTemplates = pgTable(
  "proposal_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").default(""),
    description: text("description").default(""),
    sections: jsonb("sections").default([]),
    lineItems: jsonb("line_items").default([]),
    builtin: boolean("builtin").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("proposal_templates_business_idx").on(t.businessId)]
);

/**
 * Fixed-window rate-limit counters for the endpoints that cost real money per
 * call (Claude) or hit third parties (discovery scraping). One row per
 * business + bucket + window rather than one per request, so the table stays
 * small; Postgres is used rather than Redis because this deployment already
 * has Neon and no Upstash Redis credentials.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    bucket: text("bucket").notNull(), // ai | discovery
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [uniqueIndex("rate_limits_window_uq").on(t.businessId, t.bucket, t.windowStart)]
);

/**
 * Reusable service rows for the proposal editor — one row = one offering with
 * its pricing. Distinct from proposalTemplates, which models a whole-proposal
 * skeleton (sections + line items). Per business, because pricing and the
 * service catalogue are exactly what differs between them.
 */
export const serviceTemplates = pgTable(
  "service_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // short name shown on the "+ add" button
    title: text("title").default(""), // headline written into the proposal
    description: text("description").default(""),
    setupFee: integer("setup_fee").default(0),
    monthlyFee: integer("monthly_fee").default(0),
    monthlyBlockTitle: text("monthly_block_title").default(""),
    monthlyBreakdown: text("monthly_breakdown").default(""), // one feature per line
    position: integer("position").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("service_templates_business_idx").on(t.businessId)]
);

export const proposalVersions = pgTable(
  "proposal_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("proposal_versions_business_proposal_idx").on(t.businessId, t.proposalId)]
);

// proposal_sections / proposal_line_items existed in the SQLite schema but were
// unused by any IPC handler — intentionally dropped in the web port (sections/
// line_items are stored as JSON on the proposal row, per the v1 design note
// in the original schema.cjs). Reintroduce only if per-row querying is needed.

// ---------------------------------------------------------------------------
// Brief Analyzer
// ---------------------------------------------------------------------------

export const clientBriefs = pgTable(
  "client_briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    clientName: text("client_name").default(""),
    projectName: text("project_name").default(""),
    leadId: uuid("lead_id").references(() => leads.id),
    rawText: text("raw_text").default(""),
    budget: text("budget").default(""),
    deadline: text("deadline").default(""),
    links: text("links").default(""),
    analysis: jsonb("analysis").default({}),
    status: text("status").default("analyzed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("client_briefs_business_idx").on(t.businessId)]
);

export const briefAnalysisResults = pgTable(
  "brief_analysis_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    briefId: uuid("brief_id").notNull().references(() => clientBriefs.id, { onDelete: "cascade" }),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("brief_analysis_results_business_brief_idx").on(t.businessId, t.briefId)]
);

// brief_questions / brief_tasks / brief_risks existed in the SQLite schema but
// were unused by any IPC handler — intentionally dropped, same rationale as
// proposal_sections/proposal_line_items above.

// ---------------------------------------------------------------------------
// Inspiration Board / Moodboards
// ---------------------------------------------------------------------------

export const inspirationItems = pgTable(
  "inspiration_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").default(""),
    imageUrl: text("image_url").default(""), // Vercel Blob URL (was a local filename in the Electron version)
    category: text("category").default(""),
    tags: text("tags").default(""),
    notes: text("notes").default(""),
    whySaved: text("why_saved").default(""),
    source: text("source").default(""),
    client: text("client").default(""),
    favorite: boolean("favorite").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("inspiration_items_business_idx").on(t.businessId)]
);

export const moodboards = pgTable(
  "moodboards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("moodboards_business_idx").on(t.businessId)]
);

export const moodboardItems = pgTable(
  "moodboard_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    moodboardId: uuid("moodboard_id").notNull().references(() => moodboards.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull().references(() => inspirationItems.id, { onDelete: "cascade" }),
    position: integer("position").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("moodboard_items_business_board_idx").on(t.businessId, t.moodboardId),
    uniqueIndex("moodboard_items_board_item_uq").on(t.moodboardId, t.itemId),
  ]
);

// ---------------------------------------------------------------------------
// Weekly Review
// ---------------------------------------------------------------------------

export const weeklyReviews = pgTable(
  "weekly_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    weekStart: text("week_start"),
    weekEnd: text("week_end"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("weekly_reviews_business_idx").on(t.businessId)]
);

export const weeklyReviewActionItems = pgTable(
  "weekly_review_action_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id").notNull().references(() => weeklyReviews.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    done: boolean("done").default(false),
    taskId: uuid("task_id").references(() => tasks.id),
  },
  (t) => [index("weekly_review_action_items_business_review_idx").on(t.businessId, t.reviewId)]
);

// weekly_review_sections existed in the SQLite schema but was unused by any
// IPC handler — intentionally dropped, same rationale as the proposal/brief tables above.

// ---------------------------------------------------------------------------
// Google account, Gmail cache, Calendar (per-business)
// ---------------------------------------------------------------------------

export const googleAccounts = pgTable(
  "google_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    email: text("email").default(""),
    displayName: text("display_name").default(""),
    provider: text("provider").default("google"),
    accessTokenEnc: text("access_token_enc").default(""), // AES-256-GCM via lib/crypto/secrets.ts
    accessTokenIv: text("access_token_iv").default(""),
    refreshTokenEnc: text("refresh_token_enc").default(""),
    refreshTokenIv: text("refresh_token_iv").default(""),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }),
    scopes: text("scopes").default(""), // space-separated granted scopes
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    status: text("status").default("connected"), // connected | error | revoked
  },
  (t) => [uniqueIndex("google_accounts_business_uq").on(t.businessId)]
);

export const emailThreads = pgTable(
  "email_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    googleThreadId: text("google_thread_id").default(""),
    subject: text("subject").default(""),
    participants: text("participants").default(""), // comma separated emails/names
    latestSnippet: text("latest_snippet").default(""),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    linkedLeadId: uuid("linked_lead_id").references(() => leads.id),
    linkedContactId: uuid("linked_contact_id").references(() => leadContacts.id),
    status: text("status").default(""), // '' | replied | archived
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_threads_business_idx").on(t.businessId)]
);

export const emailMessages = pgTable(
  "email_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    googleMessageId: text("google_message_id").default(""),
    googleThreadId: text("google_thread_id").default(""),
    direction: text("direction").default("in"), // in | out
    fromEmail: text("from_email").default(""),
    fromName: text("from_name").default(""),
    toEmails: text("to_emails").default(""),
    ccEmails: text("cc_emails").default(""),
    subject: text("subject").default(""),
    snippet: text("snippet").default(""),
    bodyPreview: text("body_preview").default(""),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    unread: boolean("unread").default(false),
    linkedLeadId: uuid("linked_lead_id").references(() => leads.id),
    linkedContactId: uuid("linked_contact_id").references(() => leadContacts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_messages_business_idx").on(t.businessId)]
);

export const gmailDrafts = pgTable(
  "gmail_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    googleDraftId: text("google_draft_id").default(""), // empty = local/manual draft (mock mode)
    googleMessageId: text("google_message_id").default(""),
    googleThreadId: text("google_thread_id").default(""), // set when replying inside a thread
    leadId: uuid("lead_id").references(() => leads.id),
    contactId: uuid("contact_id").references(() => leadContacts.id),
    toEmail: text("to_email").default(""),
    subject: text("subject").default(""),
    body: text("body").default(""),
    status: text("status").default("draft"), // draft | sent | discarded
    mode: text("mode").default("manual"), // manual | mailto | gmail_draft | gmail_send
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("gmail_drafts_business_idx").on(t.businessId)]
);

export const calendarAccounts = pgTable(
  "calendar_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    googleAccountId: uuid("google_account_id").references(() => googleAccounts.id, { onDelete: "cascade" }),
    calendarId: text("calendar_id").default(""), // Google calendarId ('primary', ...)
    calendarName: text("calendar_name").default(""),
    primaryCalendar: boolean("primary_calendar").default(false),
    color: text("color").default(""),
    selected: boolean("selected").default(true),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    syncToken: text("sync_token").default(""), // Google incremental sync token
    status: text("status").default("active"),
  },
  (t) => [index("calendar_accounts_business_idx").on(t.businessId)]
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    googleEventId: text("google_event_id").default(""), // empty = local-only event
    calendarId: text("calendar_id").default("local"),
    title: text("title").notNull(),
    description: text("description").default(""),
    location: text("location").default(""),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").default(false),
    attendees: jsonb("attendees").default([]), // [{email,name}]
    googleMeetLink: text("google_meet_link").default(""),
    status: text("status").default("confirmed"), // confirmed | cancelled
    etag: text("etag").default(""),
    googleUpdatedAt: timestamp("google_updated_at", { withTimezone: true }),
    localUpdatedAt: timestamp("local_updated_at", { withTimezone: true }),
    syncState: text("sync_state").default("local"), // local | synced | pending_push | conflict | deleted_remote
    linkedTaskId: uuid("linked_task_id").references(() => tasks.id),
    linkedLeadId: uuid("linked_lead_id").references(() => leads.id),
    linkedContactId: uuid("linked_contact_id").references(() => leadContacts.id),
    linkedProjectId: uuid("linked_project_id").references(() => projects.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("calendar_events_business_idx").on(t.businessId)]
);

export const calendarSyncLog = pgTable(
  "calendar_sync_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    calendarId: text("calendar_id").default(""),
    syncType: text("sync_type").default("incremental"), // full | incremental | push
    status: text("status").default("ok"), // ok | error
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    itemsPulled: integer("items_pulled").default(0),
    itemsPushed: integer("items_pushed").default(0),
    errorMessage: text("error_message").default(""),
  },
  (t) => [index("calendar_sync_log_business_idx").on(t.businessId)]
);

// Generic offline queue: local changes waiting to be pushed to Google.
export const pendingSyncActions = pgTable(
  "pending_sync_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(), // calendar_event
    entityId: uuid("entity_id").notNull(),
    actionType: text("action_type").notNull(), // create | update | delete
    payloadJson: jsonb("payload_json").default({}),
    status: text("status").default("pending"), // pending | done | error
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    errorMessage: text("error_message").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pending_sync_actions_business_idx").on(t.businessId)]
);

// ---------------------------------------------------------------------------
// Carousel Studio
// ---------------------------------------------------------------------------

export const carouselProjects = pgTable(
  "carousel_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sourceType: text("source_type").default("manual_topic"), // ai_radar_item | ai_radar_saved_collection | manual_topic | inspiration_item | moodboard | newsletter_issue | newsletter_section (future)
    sourceId: text("source_id").default(""),
    sourcePayload: jsonb("source_payload").default({}), // JSON snapshot of the source at creation
    platform: text("platform").default("instagram"), // instagram | linkedin | both
    aspectRatio: text("aspect_ratio").default("4:5"), // 1:1 | 4:5 | 9:16
    slideCount: integer("slide_count").default(4),
    tone: text("tone").default("editorial"),
    audience: text("audience").default(""),
    status: text("status").default("draft"), // draft | ready | exported
    captionInstagram: text("caption_instagram").default(""),
    captionLinkedin: text("caption_linkedin").default(""),
    captionShort: text("caption_short").default(""),
    captionProfessional: text("caption_professional").default(""),
    hashtags: text("hashtags").default(""),
    template: text("template").default("dark_editorial"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("carousel_projects_business_idx").on(t.businessId)]
);

export const carouselSlides = pgTable(
  "carousel_slides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    carouselId: uuid("carousel_id").notNull().references(() => carouselProjects.id, { onDelete: "cascade" }),
    slideNumber: integer("slide_number").default(1),
    slideRole: text("slide_role").default(""), // hook | context | insight | application | takeaway ...
    headline: text("headline").default(""),
    subheadline: text("subheadline").default(""),
    bodyText: text("body_text").default(""),
    label: text("label").default(""),
    cta: text("cta").default(""),
    visualDirection: text("visual_direction").default(""),
    imagePrompt: text("image_prompt").default(""),
    negativePrompt: text("negative_prompt").default(""),
    layoutStyle: text("layout_style").default("text_first"), // text_first | image_first | split
    textPosition: text("text_position").default("bottom_left"),
    backgroundStyle: text("background_style").default("gradient_blue"),
    generatedImageUrl: text("generated_image_url").default(""), // Vercel Blob URL
    importedImageUrl: text("imported_image_url").default(""),
    finalExportUrl: text("final_export_url").default(""),
    sourceCredit: text("source_credit").default(""),
    notes: text("notes").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("carousel_slides_business_carousel_idx").on(t.businessId, t.carouselId)]
);

export const carouselTemplates = pgTable(
  "carousel_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").default(""),
    platform: text("platform").default("both"),
    aspectRatio: text("aspect_ratio").default("4:5"),
    style: text("style").default(""),
    layoutJson: jsonb("layout_json").default({}),
    brandJson: jsonb("brand_json").default({}),
    builtin: boolean("builtin").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("carousel_templates_business_idx").on(t.businessId)]
);

export const carouselExports = pgTable(
  "carousel_exports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    carouselId: uuid("carousel_id").notNull().references(() => carouselProjects.id, { onDelete: "cascade" }),
    exportType: text("export_type").default("slides"), // slides | caption | prompts
    filesJson: jsonb("files_json").default([]), // [{name, blobUrl}] — replaces the local folder_path
    captionCopied: boolean("caption_copied").default(false),
    exportedAt: timestamp("exported_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("carousel_exports_business_carousel_idx").on(t.businessId, t.carouselId)]
);

export const visualGenerationJobs = pgTable(
  "visual_generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    carouselId: uuid("carousel_id").references(() => carouselProjects.id, { onDelete: "cascade" }),
    slideId: uuid("slide_id").references(() => carouselSlides.id, { onDelete: "cascade" }),
    provider: text("provider").default("mock"), // mock | manual | higgsfield (CLI provider dropped in web port)
    status: text("status").default("done"), // queued | done | error
    inputPrompt: text("input_prompt").default(""),
    outputUrl: text("output_url").default(""), // Vercel Blob URL
    errorMessage: text("error_message").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("visual_generation_jobs_business_idx").on(t.businessId)]
);

// ---------------------------------------------------------------------------
// Discovery jobs (new — QStash-backed async Discover Leads / Contact Finder, see Phase 4)
// ---------------------------------------------------------------------------

export const discoveryJobs = pgTable(
  "discovery_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // lead_discovery | contact_discovery
    status: text("status").notNull().default("queued"), // queued | running | done | error
    params: jsonb("params").notNull(),
    result: jsonb("result"),
    errorMessage: text("error_message").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("discovery_jobs_business_idx").on(t.businessId)]
);

// ---------------------------------------------------------------------------
// Relation-free real type helpers (Drizzle infers these from the tables above)
// ---------------------------------------------------------------------------

export type Business = typeof businesses.$inferSelect;
export type User = typeof users.$inferSelect;
export type BusinessMembership = typeof businessMemberships.$inferSelect;

// Immutable execution claims and append-only receipts. Never store credentials or contact data.
export const opsActions = pgTable('ops_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  requestId: uuid('request_id').notNull(),
  action: text('action').notNull(),
  payloadHash: text('payload_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('ops_action_request_uq').on(t.businessId, t.requestId),
  uniqueIndex('ops_action_business_id_uq').on(t.businessId, t.id),
  foreignKey({ columns: [t.businessId, t.projectId], foreignColumns: [projects.businessId, projects.id] }),
  foreignKey({ columns: [t.businessId, t.userId], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
]);
export const opsAuditEvents = pgTable('ops_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  actionId: uuid('action_id').notNull().references(() => opsActions.id),
  event: text('event').notNull(),
  detail: jsonb('detail').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [foreignKey({ columns: [t.businessId, t.actionId], foreignColumns: [opsActions.businessId, opsActions.id] })]);

// Append-only projections; no task status or assignee columns. ClickUp owns execution.
export const marketingSnapshots = pgTable('marketing_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  revision: integer('revision').notNull(),
  // T-2.3: the binding version the plan was imported under; revisions restart at 1 per version (D2).
  bindingVersion: integer('binding_version').notNull(),
  payload: jsonb('payload').notNull(),
  importedBy: uuid('imported_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('marketing_snapshot_binding_revision_uq').on(t.businessId, t.projectId, t.bindingVersion, t.revision),
  foreignKey({ columns: [t.businessId, t.projectId], foreignColumns: [projects.businessId, projects.id] }),
  foreignKey({ columns: [t.businessId, t.importedBy], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
]);

// Marketing tenant binding (owner decision D2): the database is the ONLY runtime source of truth for
// which marketing-os tenant a (business, project) is bound to. `marketing_binding_events` is the
// append-only log (bind / revoke, each with its binding_version, actor and request id);
// `marketing_bindings` is the one current row per (business, project), which a trigger allows to change
// only in lock-step with the latest event. Writes go through the `marketing_bind` / `marketing_revoke`
// SQL functions (migration 0008): serialized per (business, project), owner-only, audited.
export const marketingBindingEvents = pgTable('marketing_binding_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  event: text('event').notNull(),
  bindingVersion: integer('binding_version').notNull(),
  marketingBusiness: text('marketing_business').notNull(),
  actorId: uuid('actor_id').notNull().references(() => users.id),
  requestId: uuid('request_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('marketing_binding_event_version_uq').on(t.businessId, t.projectId, t.bindingVersion, t.event),
  uniqueIndex('marketing_binding_event_request_uq').on(t.businessId, t.requestId),
  foreignKey({ columns: [t.businessId, t.projectId], foreignColumns: [projects.businessId, projects.id] }),
  foreignKey({ columns: [t.businessId, t.actorId], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  check('marketing_binding_event_kind', sql`${t.event} in ('bind', 'revoke')`),
  check('marketing_binding_event_version_positive', sql`${t.bindingVersion} >= 1`),
  check('marketing_binding_event_slug', sql`${t.marketingBusiness} ~ '^[a-z0-9][a-z0-9-]*$'`),
]);
export const marketingBindings = pgTable('marketing_bindings', {
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  marketingBusiness: text('marketing_business').notNull(),
  bindingVersion: integer('binding_version').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.businessId, t.projectId] }),
  foreignKey({ columns: [t.businessId, t.projectId], foreignColumns: [projects.businessId, projects.id] }),
  foreignKey({ columns: [t.businessId, t.updatedBy], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  check('marketing_binding_version_positive', sql`${t.bindingVersion} >= 1`),
  check('marketing_binding_slug', sql`${t.marketingBusiness} ~ '^[a-z0-9][a-z0-9-]*$'`),
]);

// Marketing data model (T-3.1). Engine → app artifacts are append-only projections, numbered per
// (business, project, kind, binding_version) by `marketing_import_artifact` (migration 0010); app → engine
// records (decisions, evidence) are written once, under the ACTIVE binding version, against the source
// artifact the human saw — afterwards only `exported_at` (once) and `reconciled_state` may change.
export const marketingArtifacts = pgTable('marketing_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  kind: text('kind').notNull(),
  bindingVersion: integer('binding_version').notNull(),
  revision: integer('revision').notNull(),
  sourceRevision: text('source_revision').notNull(),
  asOf: timestamp('as_of', { withTimezone: true }).notNull(),
  contentHash: text('content_hash').notNull(),
  payload: jsonb('payload').notNull(),
  importedBy: uuid('imported_by').notNull().references(() => users.id),
  requestId: uuid('request_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('marketing_artifact_revision_uq').on(t.businessId, t.projectId, t.kind, t.bindingVersion, t.revision),
  uniqueIndex('marketing_artifact_business_id_uq').on(t.businessId, t.id),
  uniqueIndex('marketing_artifact_request_uq').on(t.businessId, t.requestId),
  foreignKey({ columns: [t.businessId, t.projectId], foreignColumns: [projects.businessId, projects.id] }),
  foreignKey({ columns: [t.businessId, t.importedBy], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  check('marketing_artifact_kind', sql`${t.kind} in ('C2a','C3a','C4','C5','C7','C8','C9','C10','C11','C12','C13','C14')`),
  check('marketing_artifact_versions_positive', sql`${t.bindingVersion} >= 1 and ${t.revision} >= 1`),
  check('marketing_artifact_hash', sql`${t.contentHash} ~ '^[a-f0-9]{64}$'`),
]);
export const marketingDecisions = pgTable('marketing_decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  bindingVersion: integer('binding_version').notNull(),
  sourceArtifactId: uuid('source_artifact_id').notNull(),
  approvalId: text('approval_id').notNull(),
  contentHash: text('content_hash').notNull(),
  decision: text('decision').notNull(),
  note: text('note').notNull(),
  decidedBy: uuid('decided_by').notNull().references(() => users.id),
  requestId: uuid('request_id').notNull(),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull().defaultNow(),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  reconciledState: text('reconciled_state'),
}, (t) => [uniqueIndex('marketing_decision_request_uq').on(t.businessId, t.requestId),
  uniqueIndex('marketing_decision_item_uq').on(t.businessId, t.projectId, t.bindingVersion, t.approvalId, t.contentHash),
  foreignKey({ columns: [t.businessId, t.projectId], foreignColumns: [projects.businessId, projects.id] }),
  foreignKey({ columns: [t.businessId, t.decidedBy], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  foreignKey({ columns: [t.businessId, t.sourceArtifactId], foreignColumns: [marketingArtifacts.businessId, marketingArtifacts.id] }),
  check('marketing_decision_kind', sql`${t.decision} in ('approved','rejected')`),
  check('marketing_decision_note', sql`length(btrim(${t.note})) >= 1`),
  check('marketing_decision_hash', sql`${t.contentHash} ~ '^[a-f0-9]{64}$'`),
  check('marketing_decision_reconciled', sql`${t.reconciledState} is null or ${t.reconciledState} in ('awaiting','open','applied','stale','conflict','expired','missing','unreviewed','resolved')`),
]);
export const marketingEvidence = pgTable('marketing_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  bindingVersion: integer('binding_version').notNull(),
  kind: text('kind').notNull(),
  sourceArtifactId: uuid('source_artifact_id'),
  targetId: text('target_id').notNull(),
  approvalId: text('approval_id'),
  preconditionHash: text('precondition_hash').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  payload: jsonb('payload').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  requestId: uuid('request_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  reconciledState: text('reconciled_state'),
}, (t) => [uniqueIndex('marketing_evidence_request_uq').on(t.businessId, t.requestId),
  foreignKey({ columns: [t.businessId, t.projectId], foreignColumns: [projects.businessId, projects.id] }),
  foreignKey({ columns: [t.businessId, t.createdBy], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  foreignKey({ columns: [t.businessId, t.reviewedBy], foreignColumns: [businessMemberships.businessId, businessMemberships.userId] }),
  foreignKey({ columns: [t.businessId, t.sourceArtifactId], foreignColumns: [marketingArtifacts.businessId, marketingArtifacts.id] }),
  check('marketing_evidence_kind', sql`${t.kind} in ('publish_evidence','brain_proposal','outcome_evidence','execution_receipt')`),
  check('marketing_evidence_hash', sql`${t.preconditionHash} ~ '^[a-f0-9]{64}$'`),
  check('marketing_evidence_review', sql`${t.kind} = 'brain_proposal' or (${t.reviewedBy} is not null and ${t.reviewedAt} is not null)`),
  check('marketing_evidence_receipt_link', sql`${t.kind} <> 'execution_receipt' or (${t.approvalId} is not null and ${t.sourceArtifactId} is not null)`),
  check('marketing_evidence_reconciled', sql`${t.reconciledState} is null or ${t.reconciledState} in ('awaiting','open','applied','stale','conflict','expired','missing','unreviewed','resolved')`),
]);
/** GPT review P1-2 (round 2): a request id whose import is known NOT to have been written. Inserted only by
 *  marketing_import_readback() while holding the request's advisory lock; every artifact insert takes the same
 *  lock and refuses a fenced request id — so an in-flight or delayed original can never commit afterwards, and a
 *  `written: false` readback is definitive. Append-only. */
export const marketingImportFences = pgTable('marketing_import_fences', {
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  requestId: uuid('request_id').notNull(),
  fencedBy: uuid('fenced_by').notNull().references(() => users.id),
  fencedAt: timestamp('fenced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.businessId, t.requestId] })]);
