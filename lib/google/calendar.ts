/**
 * Ported from electron/services/googleCalendar.cjs — dependency-free REST
 * calls, only the token source changed (googleApi(businessId, ...)).
 */
import { googleApi } from "./oauth";

const BASE = "https://www.googleapis.com/calendar/v3";

export async function listCalendars(businessId: string) {
  const res = await googleApi(businessId, "GET", `${BASE}/users/me/calendarList`);
  return (res.items || []).map((c: any) => ({
    calendarId: c.id,
    calendarName: c.summary || c.id,
    primaryCalendar: !!c.primary,
    color: c.backgroundColor || "",
  }));
}

type LocalEvent = {
  title: string;
  description?: string;
  location?: string;
  startTime: Date | string;
  endTime: Date | string;
  allDay?: boolean;
  attendees?: { email: string; name?: string }[];
};

function fromGoogle(g: any) {
  const allDay = !!(g.start && g.start.date);
  return {
    googleEventId: g.id,
    title: g.summary || "(no title)",
    description: g.description || "",
    location: g.location || "",
    startTime: new Date(allDay ? g.start.date : g.start.dateTime),
    endTime: new Date(allDay ? (g.end ? g.end.date : g.start.date) : g.end ? g.end.dateTime : g.start.dateTime),
    allDay,
    attendees: (g.attendees || []).map((a: any) => ({ email: a.email, name: a.displayName || "" })),
    googleMeetLink: g.hangoutLink || "",
    status: g.status === "cancelled" ? "cancelled" : "confirmed",
    etag: g.etag || "",
    googleUpdatedAt: g.updated ? new Date(g.updated) : null,
  };
}

function toGoogle(ev: LocalEvent) {
  const start = new Date(ev.startTime);
  const end = new Date(ev.endTime);
  return {
    summary: ev.title,
    description: ev.description || "",
    location: ev.location || "",
    start: ev.allDay ? { date: start.toISOString().slice(0, 10) } : { dateTime: start.toISOString() },
    end: ev.allDay ? { date: end.toISOString().slice(0, 10) } : { dateTime: end.toISOString() },
    attendees: (ev.attendees || []).filter((a) => a.email).map((a) => ({ email: a.email })),
  };
}

/** With syncToken → incremental; without → windowed full pull (-90d/+365d). */
export async function pullEvents(businessId: string, calendarId: string, syncToken = "") {
  const cal = encodeURIComponent(calendarId);
  const collect = async (params: Record<string, string>) => {
    const events: ReturnType<typeof fromGoogle>[] = [];
    let pageToken = "";
    let nextSyncToken = "";
    do {
      const qs = new URLSearchParams({ ...params, ...(pageToken ? { pageToken } : {}), maxResults: "250" }).toString();
      const res = await googleApi(businessId, "GET", `${BASE}/calendars/${cal}/events?${qs}`);
      (res.items || []).forEach((g: any) => events.push(fromGoogle(g)));
      pageToken = res.nextPageToken || "";
      nextSyncToken = res.nextSyncToken || nextSyncToken;
    } while (pageToken);
    return { events, nextSyncToken };
  };

  if (syncToken) {
    try {
      return { ...(await collect({ syncToken })), fullResync: false };
    } catch (err: any) {
      if (err.status !== 410) throw err; // 410 = token expired → full resync below
    }
  }
  const timeMin = new Date(Date.now() - 90 * 86400000).toISOString();
  const timeMax = new Date(Date.now() + 365 * 86400000).toISOString();
  return { ...(await collect({ timeMin, timeMax, singleEvents: "true" })), fullResync: true };
}

export const createEvent = async (businessId: string, calendarId: string, ev: LocalEvent) =>
  fromGoogle(await googleApi(businessId, "POST", `${BASE}/calendars/${encodeURIComponent(calendarId)}/events`, toGoogle(ev)));

export const updateEvent = async (businessId: string, calendarId: string, googleEventId: string, ev: LocalEvent) =>
  fromGoogle(
    await googleApi(businessId, "PUT", `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`, toGoogle(ev))
  );

export const deleteEvent = (businessId: string, calendarId: string, googleEventId: string) =>
  googleApi(businessId, "DELETE", `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`);
