"use client";

import Link from "next/link";
import { useState } from "react";
import type { AccountRole, UserAccount } from "@/lib/focus/contracts/settings";
import { PERMISSION_LEGEND, PERMISSION_WORD, PERMISSIONS, ROLE_LABEL, SETTINGS_NAV, USERS } from "@/lib/focus/fixtures/settings";
import { fmtAgo } from "@/lib/focus/format";
import { PageHeader, ViewOnlyStrip } from "@/components/focus/patterns/page";
import { PermissionMatrix, SettingsFrame, SettingsNav } from "@/components/focus/patterns/comms/settings";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { Avatar, Bdi } from "@/components/focus/ui/misc";
import { PlannedTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Users & permissions (handoff H13). Role per user is a real select with undo, revoking access is confirmed and
 * undoable, the permission matrix is a table (symbol + word), and "הזמן משתמש" validates and adds the person locally
 * as "הוזמן · ממתין" — no e-mail is sent (that capability is planned).
 */
const ROLES: AccountRole[] = ["owner", "manager", "viewer"];
const roleWord = (u: Pick<UserAccount, "role" | "gender">) => ROLE_LABEL[u.role][u.gender];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Invite = { name: string; email: string; role: Exclude<AccountRole, "owner">; gender: "f" | "m" };

export default function CommsUsersScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, state, viewer } = demo;
  const canManage = state.role === "owner";
  const [users, setUsers] = useState<UserAccount[]>(USERS);
  const [inviting, setInviting] = useState(false);
  const [revoking, setRevoking] = useState<UserAccount | null>(null);

  const replace = (u: UserAccount) => setUsers((xs) => xs.map((x) => (x.id === u.id ? u : x)));

  const changeRole = (u: UserAccount, role: AccountRole) => {
    if (role === u.role) return;
    replace({ ...u, role });
    toast.push({ title: `${u.name}: ${roleWord(u)} ← ${ROLE_LABEL[role][u.gender]}`, detail: "ההרשאות מתעדכנות מיד בכל המסכים.", undo: { onUndo: () => replace(u) } });
  };

  const revoke = (u: UserAccount) => {
    setRevoking(null);
    replace({ ...u, status: "revoked" });
    toast.push({ title: `הגישה של ${u.name} בוטלה`, detail: "לא נמחק מידע. אפשר להחזיר גישה בכל רגע.", undo: { onUndo: () => replace(u) } });
  };

  const invite = (i: Invite) => {
    const u: UserAccount = { id: `inv-${i.email}`, name: i.name.trim(), initial: i.name.trim().charAt(0), email: i.email.trim(), gender: i.gender, role: i.role, status: "invited", lastActiveAt: null };
    setUsers((xs) => [...xs, u]);
    setInviting(false);
    toast.push({ title: `${u.name} נוסף/ה כ"הוזמן · ממתין"`, detail: "לא נשלח מייל. שליחת הזמנות עדיין מתוכננת.", undo: { onUndo: () => setUsers((xs) => xs.filter((x) => x.id !== u.id)) } });
  };

  const cancelInvite = (u: UserAccount) => {
    const at = users.findIndex((x) => x.id === u.id);
    setUsers((xs) => xs.filter((x) => x.id !== u.id));
    toast.push({ title: `ההזמנה של ${u.name} בוטלה`, undo: { onUndo: () => setUsers((xs) => [...xs.slice(0, at), u, ...xs.slice(at)]) } });
  };

  const counted = users.filter((u) => u.status !== "revoked").length;

  return (
    <div className="f-cm-spage">
      <SettingsFrame
        nav={<SettingsNav items={SETTINGS_NAV} current="users" />}
        aside={
          <aside className="f-cm-settings__aside">
            <PermissionMatrix title="מה כל תפקיד יכול לעשות" rows={PERMISSIONS} roles={ROLES} roleLabel={(r) => ROLE_LABEL[r].column} words={PERMISSION_WORD} legend={PERMISSION_LEGEND} />
          </aside>
        }
      >
        <PageHeader
          className="f-cm-settings__head"
          title={`משתמשים · ${counted}`}
          status="רק בעלים יכול להזמין, לשנות תפקיד ולבטל גישה."
          actions={canManage ? <Button variant="primary" onClick={() => setInviting(true)}>+ הזמן משתמש</Button> : undefined}
        />
        {!canManage && <ViewOnlyStrip who={USERS.find((u) => u.role === "owner")?.name ?? "הבעלים"} />}

        <table className="f-cm-users">
          <caption className="f-sr">משתמשים והרשאות</caption>
          <thead className="f-cm-users__head">
            <tr><th scope="col">משתמש</th><th scope="col">תפקיד</th><th scope="col">פעילות אחרונה</th><th scope="col">פעולה</th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === viewer.id;
              return (
                <tr key={u.id} className={cx("f-cm-users__row", u.status === "revoked" && "f-cm-users__row--revoked")}>
                  <td className="f-cm-users__who">
                    <Avatar initial={u.initial} />
                    <span className="f-cm-users__name">
                      <b>{u.name}{u.title && <> · {u.title}</>}{isMe && <span className="f-meta-sm"> (את/ה)</span>}</b>
                      <Bdi className="f-cm-users__email">{u.email}</Bdi>
                    </span>
                  </td>
                  <td className="f-cm-users__role">
                    {u.role === "owner" || !canManage || u.status === "revoked" ? (
                      <span className="f-cm-users__rolepill">{roleWord(u)}</span>
                    ) : (
                      <SelectField
                        label={`התפקיד של ${u.name}`} labelClassName="f-sr" className="f-cm-users__select" inputClassName="f-input--sm"
                        value={u.role} onChange={(e) => changeRole(u, e.target.value as AccountRole)}
                        options={(["manager", "viewer"] as const).map((r) => ({ value: r, label: ROLE_LABEL[r][u.gender] }))}
                      />
                    )}
                  </td>
                  <td className="f-cm-users__seen">
                    {u.status === "invited" ? <span className="f-cm-users__state"><span aria-hidden>…</span> הוזמן · ממתין</span>
                      : u.status === "revoked" ? <span className="f-cm-users__state"><span aria-hidden>⊘</span> הגישה בוטלה</span>
                      : u.lastActiveAt ? fmtAgo(u.lastActiveAt, now) : "פעיל עכשיו"}
                  </td>
                  <td className="f-cm-users__act">
                    {u.role === "owner" ? <span className="f-meta" aria-label="אין פעולה">—</span>
                      : u.status === "revoked" ? (canManage ? <Button variant="link" size="sm" className="f-hit" onClick={() => replace({ ...u, status: "active" })}>החזר גישה</Button> : null)
                      : u.status === "invited" ? (canManage ? <Button variant="link" size="sm" className="f-hit" onClick={() => cancelInvite(u)}>בטל הזמנה</Button> : null)
                      : u.activityHref ? <Link href={u.activityHref} className="f-link f-hit">צפה בפעילות</Link>
                      : canManage ? <Button variant="link" size="sm" className="f-hit" onClick={() => setRevoking(u)}>בטל גישה</Button> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.some((u) => u.status === "invited") && (
          <p className="f-cm-users__note"><PlannedTag /> שליחת הזמנה במייל. משתמשים שהוזמנו מופיעים כ&quot;הוזמן · ממתין&quot; ולא קיבלו מייל.</p>
        )}
      </SettingsFrame>

      <Dialog open={!!revoking} onClose={() => setRevoking(null)} labelledBy="cm-revoke-title" className="f-cm-modal">
        {revoking && (
          <div className="f-cm-dlg">
            <h2 id="cm-revoke-title" className="f-cm-dlg__title">לבטל את הגישה של {revoking.name}?</h2>
            <p className="f-cm-dlg__text">{revoking.name} לא תוכל/יוכל להיכנס ל־Mytiv. הדוחות והפעילות שלה/ו נשמרים, ואפשר להחזיר גישה בכל רגע.</p>
            <div className="f-cm-dlg__actions">
              <Button variant="primary" onClick={() => revoke(revoking)}>בטל גישה</Button>
              <Button variant="neutral" onClick={() => setRevoking(null)}>השאר גישה</Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={inviting} onClose={() => setInviting(false)} labelledBy="cm-invite-title" className="f-cm-modal" initialFocus="input">
        {inviting && <InviteForm existing={users.map((u) => u.email.toLowerCase())} onCancel={() => setInviting(false)} onInvite={invite} />}
      </Dialog>
    </div>
  );
}

function InviteForm({ existing, onCancel, onInvite }: { existing: string[]; onCancel: () => void; onInvite: (i: Invite) => void }) {
  const [v, setV] = useState<Invite>({ name: "", email: "", role: "viewer", gender: "f" });
  const [errors, setErrors] = useState<Partial<Record<keyof Invite, string>>>({});
  const set = <K extends keyof Invite>(k: K, val: Invite[K]) => { setV((x) => ({ ...x, [k]: val })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };
  const submit = () => {
    const e: Partial<Record<keyof Invite, string>> = {};
    if (!v.name.trim()) e.name = "יש לכתוב שם.";
    if (!v.email.trim()) e.email = "יש לכתוב כתובת מייל.";
    else if (!EMAIL.test(v.email.trim())) e.email = "כתובת המייל לא תקינה. למשל: name@company.co.il";
    else if (existing.includes(v.email.trim().toLowerCase())) e.email = "למשתמש עם המייל הזה כבר יש גישה.";
    setErrors(e);
    if (!Object.keys(e).length) onInvite(v);
  };
  return (
    <form className="f-cm-dlg" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <h2 id="cm-invite-title" className="f-cm-dlg__title">הזמנת משתמש</h2>
      <TextField label="שם" required value={v.name} onChange={(e) => set("name", e.target.value)} error={errors.name} autoComplete="off" />
      <TextField label="מייל" type="email" required dir="ltr" value={v.email} onChange={(e) => set("email", e.target.value)} error={errors.email} help="אליה תישלח ההזמנה כשהשליחה תהיה זמינה." autoComplete="off" />
      <div className="f-cm-dlg__row">
        <SelectField label="תפקיד" value={v.role} onChange={(e) => set("role", e.target.value as Invite["role"])}
          options={[{ value: "manager", label: "מנהל/ת" }, { value: "viewer", label: "צופה" }]} help="מה כל תפקיד יכול לעשות — בטבלה שליד." />
        <SelectField label="פנייה" value={v.gender} onChange={(e) => set("gender", e.target.value as Invite["gender"])}
          options={[{ value: "f", label: "בלשון נקבה" }, { value: "m", label: "בלשון זכר" }]} help="לניסוח התפקיד בממשק." />
      </div>
      <p className="f-cm-dlg__note"><PlannedTag /> שליחת ההזמנה במייל. בינתיים המשתמש יתווסף לרשימה כ&quot;הוזמן · ממתין&quot; ולא יישלח מייל.</p>
      <div className="f-cm-dlg__actions">
        <Button type="submit" variant="primary">הוסף להזמנות</Button>
        <Button variant="neutral" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
}
