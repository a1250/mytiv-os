/**
 * Simplified for Phase 2: one primary calendar per business (no multi-calendar
 * selection UI yet), sync is a full pull+upsert (incremental sync_token still
 * stored and used when present). Conflict UI (electron/ipc/calendar.cjs's
 * getConflict/resolveConflict) lands later if divergent edits become a real
 * problem in practice — not needed for a single-person, single-device setup.
 */
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../index";
import { calendarEvents, calendarAccounts } from "../schema";
import * as gcal from "../../google/calendar";

export async function listEvents(businessId: string, from?: string, to?: string) {
  const conditions = [eq(calendarEvents.businessId, businessId)];
  if (from) conditions.push(gte(calendarEvents.startTime, new Date(from)));
  if (to) conditions.push(lte(calendarEvents.startTime, new Date(to)));
  return db
    .select()
    .from(calendarEvents)
    .where(and(...conditions));
}

export async function createEvent(
  businessId: string,
  data: { title: string; description?: string; location?: string; startTime: string; endTime: string; allDay?: boolean }
) {
  const [local] = await db
    .insert(calendarEvents)
    .values({
      businessId,
      title: data.title,
      description: data.description ?? "",
      location: data.location ?? "",
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      allDay: data.allDay ?? false,
      syncState: "local",
    })
    .returning();

  try {
    const pushed = await gcal.createEvent(businessId, "primary", {
      title: data.title,
      description: data.description,
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      allDay: data.allDay,
    });
    const [synced] = await db
      .update(calendarEvents)
      .set({ googleEventId: pushed.googleEventId, syncState: "synced", etag: pushed.etag, updatedAt: new Date() })
      .where(eq(calendarEvents.id, local.id))
      .returning();
    return synced;
  } catch {
    return local; // not connected, or push failed — stays "local", picked up by the next sync
  }
}

export async function removeEvent(businessId: string, id: string) {
  const [existing] = await db.select().from(calendarEvents).where(and(eq(calendarEvents.businessId, businessId), eq(calendarEvents.id, id))).limit(1);
  if (!existing) return;
  if (existing.googleEventId) {
    try {
      await gcal.deleteEvent(businessId, "primary", existing.googleEventId);
    } catch {
      /* best effort */
    }
  }
  await db.delete(calendarEvents).where(and(eq(calendarEvents.businessId, businessId), eq(calendarEvents.id, id)));
}

/** Full pull from the primary Google calendar, upserted by google_event_id. */
export async function syncCalendar(businessId: string) {
  let [account] = await db.select().from(calendarAccounts).where(eq(calendarAccounts.businessId, businessId)).limit(1);
  if (!account) {
    [account] = await db
      .insert(calendarAccounts)
      .values({ businessId, calendarId: "primary", calendarName: "Primary", primaryCalendar: true, status: "active" })
      .returning();
  }

  const { events, nextSyncToken } = await gcal.pullEvents(businessId, "primary", account.syncToken || "");

  for (const ev of events) {
    const [existing] = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.businessId, businessId), eq(calendarEvents.googleEventId, ev.googleEventId)))
      .limit(1);

    const values = {
      businessId,
      googleEventId: ev.googleEventId,
      calendarId: "primary",
      title: ev.title,
      description: ev.description,
      location: ev.location,
      startTime: ev.startTime,
      endTime: ev.endTime,
      allDay: ev.allDay,
      attendees: ev.attendees,
      googleMeetLink: ev.googleMeetLink,
      status: ev.status,
      etag: ev.etag,
      googleUpdatedAt: ev.googleUpdatedAt,
      syncState: "synced" as const,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(calendarEvents).set(values).where(eq(calendarEvents.id, existing.id));
    } else {
      await db.insert(calendarEvents).values(values);
    }
  }

  await db
    .update(calendarAccounts)
    .set({ syncToken: nextSyncToken, lastSyncAt: new Date() })
    .where(eq(calendarAccounts.id, account.id));

  return { pulled: events.length };
}
