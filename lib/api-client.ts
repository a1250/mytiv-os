/**
 * The web replacement for the Electron app's `window.v4` bridge
 * (src/lib/api.js -> electron/preload.cjs). Same namespace/method shape,
 * so ported page components only need to swap their import — no call-site
 * rewrites. Backed by Route Handlers under app/api/[businessSlug]/**, most
 * of which land in Phase 1+ (this file defines the full target shape now;
 * routes that don't exist yet will 404 until their phase is built).
 */

async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) });
const patch = <T>(path: string, data?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data ?? {}) });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

async function uploadFile(path: string, file: File, folder: string): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch(path, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text().catch(() => "")}`);
  return res.json();
}

export function createApiClient(businessSlug: string) {
  const base = `/api/${businessSlug}`;

  return {
    tasks: {
      list: () => get(`${base}/tasks`),
      create: (data: unknown) => post(`${base}/tasks`, data),
      update: (id: string, data: unknown) => patch(`${base}/tasks/${id}`, data),
      remove: (id: string) => del(`${base}/tasks/${id}`),
    },
    leads: {
      list: () => get(`${base}/leads`),
      get: (id: string) => get(`${base}/leads/${id}`),
      create: (data: unknown) => post(`${base}/leads`, data),
      update: (id: string, data: unknown) => patch(`${base}/leads/${id}`, data),
      remove: (id: string) => del(`${base}/leads/${id}`),
      listNotes: (leadId: string) => get(`${base}/leads/${leadId}/notes`),
      addNote: (leadId: string, body: string) => post(`${base}/leads/${leadId}/notes`, { body }),
      discover: (params: unknown) => post(`${base}/leads/discover`, params),
    },
    contacts: {
      discover: (params: unknown) => post(`${base}/contacts/discover`, params),
      listByLead: (leadId: string) => get(`${base}/contacts?leadId=${leadId}`),
      create: (data: unknown) => post(`${base}/contacts`, data),
      update: (id: string, data: unknown) => patch(`${base}/contacts/${id}`, data),
      remove: (id: string) => del(`${base}/contacts/${id}`),
      listSources: (contactId: string) => get(`${base}/contacts/${contactId}/sources`),
      markSourceInvalid: (sourceId: string) => patch(`${base}/contacts/sources/${sourceId}`, { valid: false }),
      createLeadFromContact: (data: unknown) => post(`${base}/contacts/create-lead`, data),
      addToOutreachQueue: (contactId: string, data: unknown) => post(`${base}/contacts/${contactId}/queue`, data),
    },
    queue: {
      list: () => get(`${base}/queue`),
      update: (id: string, data: unknown) => patch(`${base}/queue/${id}`, data),
      remove: (id: string) => del(`${base}/queue/${id}`),
    },
    outreach: {
      list: (leadId?: string) => get(`${base}/outreach${leadId ? `?leadId=${leadId}` : ""}`),
      create: (data: unknown) => post(`${base}/outreach`, data),
      update: (id: string, data: unknown) => patch(`${base}/outreach/${id}`, data),
      remove: (id: string) => del(`${base}/outreach/${id}`),
    },
    radar: {
      list: () => get(`${base}/radar`),
      create: (data: unknown) => post(`${base}/radar`, data),
      update: (id: string, data: unknown) => patch(`${base}/radar/${id}`, data),
      remove: (id: string) => del(`${base}/radar/${id}`),
      refresh: () => post(`${base}/radar/refresh`),
      defaultFeeds: () => get(`${base}/radar/default-feeds`),
    },
    prompts: {
      listTemplates: () => get(`${base}/prompts/templates`),
      createTemplate: (data: unknown) => post(`${base}/prompts/templates`, data),
      updateTemplate: (id: string, data: unknown) => patch(`${base}/prompts/templates/${id}`, data),
      removeTemplate: (id: string) => del(`${base}/prompts/templates/${id}`),
      listSaved: () => get(`${base}/prompts/saved`),
      getSaved: (id: string) => get(`${base}/prompts/saved/${id}`),
      createSaved: (data: unknown) => post(`${base}/prompts/saved`, data),
      updateSaved: (id: string, data: unknown) => patch(`${base}/prompts/saved/${id}`, data),
      removeSaved: (id: string) => del(`${base}/prompts/saved/${id}`),
      listVersions: (promptId: string) => get(`${base}/prompts/saved/${promptId}/versions`),
      addVersion: (promptId: string, data: unknown) => post(`${base}/prompts/saved/${promptId}/versions`, data),
      listTestNotes: (promptId: string) => get(`${base}/prompts/saved/${promptId}/test-notes`),
      addTestNote: (promptId: string, data: unknown) => post(`${base}/prompts/saved/${promptId}/test-notes`, data),
    },
    proposals: {
      list: () => get(`${base}/proposals`),
      get: (id: string) => get(`${base}/proposals/${id}`),
      create: (data: unknown) => post(`${base}/proposals`, data),
      update: (id: string, data: unknown) => patch(`${base}/proposals/${id}`, data),
      duplicate: (id: string) => post(`${base}/proposals/${id}/duplicate`),
      listVersions: (id: string) => get(`${base}/proposals/${id}/versions`),
      remove: (id: string) => del(`${base}/proposals/${id}`),
      listTemplates: () => get(`${base}/proposals/templates`),
    },
    briefs: {
      list: () => get(`${base}/briefs`),
      get: (id: string) => get(`${base}/briefs/${id}`),
      create: (data: unknown) => post(`${base}/briefs`, data),
      update: (id: string, data: unknown) => patch(`${base}/briefs/${id}`, data),
      remove: (id: string) => del(`${base}/briefs/${id}`),
    },
    inspiration: {
      list: () => get(`${base}/inspiration`),
      create: (data: unknown) => post(`${base}/inspiration`, data),
      update: (id: string, data: unknown) => patch(`${base}/inspiration/${id}`, data),
      remove: (id: string) => del(`${base}/inspiration/${id}`),
      fetchMeta: (url: string) => post(`${base}/inspiration/fetch-meta`, { url }),
    },
    upload: {
      image: (file: File, folder: "logo" | "inspiration" | "carousel") => uploadFile(`${base}/upload`, file, folder),
    },
    moodboards: {
      list: () => get(`${base}/moodboards`),
      get: (id: string) => get(`${base}/moodboards/${id}`),
      create: (data: unknown) => post(`${base}/moodboards`, data),
      update: (id: string, data: unknown) => patch(`${base}/moodboards/${id}`, data),
      remove: (id: string) => del(`${base}/moodboards/${id}`),
      addItem: (boardId: string, itemId: string) => post(`${base}/moodboards/${boardId}/items`, { itemId }),
      removeItem: (boardId: string, itemId: string) => del(`${base}/moodboards/${boardId}/items/${itemId}`),
    },
    reviews: {
      list: () => get(`${base}/reviews`),
      get: (id: string) => get(`${base}/reviews/${id}`),
      create: (data: unknown) => post(`${base}/reviews`, data),
      remove: (id: string) => del(`${base}/reviews/${id}`),
    },
    reports: {
      list: () => get(`${base}/reports`),
      get: (id: string) => get(`${base}/reports/${id}`),
      create: (data: unknown) => post(`${base}/reports`, data),
      remove: (id: string) => del(`${base}/reports/${id}`),
    },
    settings: {
      getAll: () => get(`${base}/settings`),
      set: (key: string, value: unknown) => patch(`${base}/settings`, { key, value }),
      // chooseLogo/clearLogo -> <input type="file"> upload to Blob + settings.set("logo_url", blobUrl)
    },
    system: {
      version: () => get<{ version: string }>(`${base}/system/version`),
      stats: () => get(`${base}/system/stats`),
      resetDemoData: () => post(`${base}/system/reset-demo-data`),
    },
    ai: {
      status: () => get(`${base}/ai/status`),
      test: () => post(`${base}/ai/test`),
      complete: (params: unknown) => post(`${base}/ai/complete`, params),
    },
    carousel: {
      list: () => get(`${base}/carousel`),
      get: (id: string) => get(`${base}/carousel/${id}`),
      create: (data: unknown) => post(`${base}/carousel`, data),
      update: (id: string, data: unknown) => patch(`${base}/carousel/${id}`, data),
      remove: (id: string) => del(`${base}/carousel/${id}`),
      updateSlide: (slideId: string, data: unknown) => patch(`${base}/carousel/slides/${slideId}`, data),
      listTemplates: () => get(`${base}/carousel/templates`),
      saveTemplate: (data: unknown) => post(`${base}/carousel/templates`, data),
      // export is now client-side (JSZip) — no server round-trip needed, see Phase 3
    },
    visual: {
      status: () => get(`${base}/visual/status`),
      generateSlide: (data: unknown) => post(`${base}/visual/generate`, data),
      generateBatch: (carouselId: string) => post(`${base}/visual/generate-batch`, { carouselId }),
      checkPath: (path: string) => post(`${base}/visual/check-path`, { path }),
      discoverModels: () => get(`${base}/visual/models`),
      // saveManualUpload/importBatch/readImage -> <input type="file"> + Blob URL fetch (Phase 3)
    },
    google: {
      connect: () => { window.location.href = `${base}/google/oauth/start`; },
      disconnect: () => post(`${base}/google/disconnect`),
      status: () => get(`${base}/google/status`),
      test: () => post(`${base}/google/test`),
    },
    gmail: {
      list: (tab: string) => get(`${base}/gmail?tab=${tab}`),
      readThread: (threadId: string) => get(`${base}/gmail/threads/${threadId}`),
      createDraft: (data: unknown) => post(`${base}/gmail/drafts`, data),
      listDrafts: () => get(`${base}/gmail/drafts`),
      updateDraft: (id: string, data: unknown) => patch(`${base}/gmail/drafts/${id}`, data),
      discardDraft: (id: string) => del(`${base}/gmail/drafts/${id}`),
      sendDraft: (id: string) => post(`${base}/gmail/drafts/${id}/send`),
      markSentManually: (id: string) => post(`${base}/gmail/drafts/${id}/mark-sent`),
      archive: (messageId: string) => post(`${base}/gmail/messages/${messageId}/archive`),
      markRead: (messageId: string) => post(`${base}/gmail/messages/${messageId}/read`),
      linkThread: (threadId: string, data: unknown) => patch(`${base}/gmail/threads/${threadId}/link`, data),
      threadsForLead: (leadId: string) => get(`${base}/gmail/threads?leadId=${leadId}`),
      sync: () => post(`${base}/gmail/sync`),
    },
    calendar: {
      listEvents: (from?: string, to?: string) => get(`${base}/calendar/events?from=${from ?? ""}&to=${to ?? ""}`),
      getEvent: (id: string) => get(`${base}/calendar/events/${id}`),
      createEvent: (data: unknown) => post(`${base}/calendar/events`, data),
      updateEvent: (id: string, data: unknown) => patch(`${base}/calendar/events/${id}`, data),
      deleteEvent: (id: string) => del(`${base}/calendar/events/${id}`),
      pushEvent: (id: string) => post(`${base}/calendar/events/${id}/push`),
      listCalendars: () => get(`${base}/calendar/calendars`),
      pendingCount: () => get<{ count: number }>(`${base}/calendar/pending-count`),
      sync: () => post(`${base}/calendar/sync`),
      getConflict: (eventId: string) => get(`${base}/calendar/events/${eventId}/conflict`),
      resolveConflict: (eventId: string, resolution: "google" | "local") =>
        post(`${base}/calendar/events/${eventId}/resolve-conflict`, { resolution }),
      createFromTask: (taskId: string) => post(`${base}/calendar/events/from-task`, { taskId }),
    },
    jobs: {
      get: (id: string) => get(`${base}/jobs/${id}`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
