import type { ClientRef, Person } from "@/lib/focus/contracts/common";

/** Demo team and clients (handoff content: the agency Mytiv and its client UMINO). Placeholders, not real people. */
export const PEOPLE = {
  ron: { id: "u-ron", name: "רון", initial: "ר", email: "ron@demo.example", role: "owner" },
  dana: { id: "u-dana", name: "דנה", initial: "ד", email: "dana@demo.example", role: "manager" },
  yoav: { id: "u-yoav", name: "יואב", initial: "י", email: "yoav@demo.example", role: "member" },
  shira: { id: "u-shira", name: "שירה", initial: "ש", email: "shira@example.co.il", role: "viewer" },
} satisfies Record<string, Person>;

export const PEOPLE_BY_ID: Record<string, Person> = Object.fromEntries(Object.values(PEOPLE).map((p) => [p.id, p]));
export const personName = (id: string | null | undefined) => (id ? PEOPLE_BY_ID[id]?.name ?? "—" : "ללא אחראי");

export const CLIENTS = {
  umino: { id: "c-umino", name: "UMINO" },
  gal: { id: "c-gal", name: "גל פילאטיס" },
  shalosh: { id: "c-shalosh", name: "בית קפה שלוש" },
  mytiv: { id: "c-mytiv", name: "Mytiv" },
} satisfies Record<string, ClientRef>;

/** The viewer in the demo (owner). Switchable later via the role picker. */
export const VIEWER = PEOPLE.ron;
