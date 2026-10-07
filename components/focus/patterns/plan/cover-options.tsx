"use client";

import { useId, useState } from "react";
import type { ContentRequirement, CoverOption } from "@/lib/focus/contracts/plan";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { DemoNote } from "./plan-parts";

/**
 * The ways to cover a content requirement (design package #s6 + #s10 "החלף"): use an existing asset, AI + the
 * client's asset, ask the client (creates a task with a brief), upload, or generate new — the last shown disabled with
 * its reason when a Brain rule forbids it (a testimonial must be real). There is no design editor: editing stays text,
 * crop and format. Nothing is generated or stored in this prototype; a choice marks the asset as existing but waiting
 * for approval (a request to the client keeps it missing until it arrives).
 */
export const COVER_WORD: Record<CoverOption, string> = {
  existing: "השתמש בנכס קיים", ai_client: "AI + נכס של הלקוח", request: "בקש מהלקוח", upload: "העלה", generate: "צור חדש",
};

export function CoverOptions({ req, chosen, onChoose, onClear }: {
  req: ContentRequirement;
  chosen?: { choice: CoverOption; assetId?: string };
  onChoose: (choice: CoverOption, extra?: { assetId?: string; fileName?: string }) => void;
  onClear: () => void;
}) {
  const id = useId();
  const [file, setFile] = useState<string | null>(null);
  const rec = req.recommended;
  if (chosen) {
    const exists = chosen.choice !== "request";
    return (
      <div className="f-pl-covered" role="status">
        <b>נבחר: {COVER_WORD[chosen.choice]}</b>
        <span className="f-pl-meta">
          {chosen.choice === "request" ? "נוצרה משימה בעבודה עם בריף מוכן. הנכס נשאר חסר עד שיגיע." : "הנכס קיים וממתין לאישור — הוא עוד לא זמין לשימוש."}
        </span>
        {exists && <DemoNote>באב טיפוס לא נוצר ולא נשמר קובץ; המצב משקף את הבחירה בלבד</DemoNote>}
        <button type="button" className="f-pl-linkbtn f-hit" onClick={onClear}>שנה בחירה</button>
      </div>
    );
  }
  return (
    <div className="f-pl-cover" aria-labelledby={`${id}-h`}>
      <span id={`${id}-h`} className="f-pl-h3">איך לכסות</span>
      <div className="f-pl-cover__opt">
        <div className="f-pl-cover__row"><b>{COVER_WORD.existing}</b><span className="f-pl-meta">{req.existingCandidates.length ? `${req.existingCandidates.length} מתאימים חלקית` : "אין נכס מתאים בספרייה"}</span></div>
        {req.existingCandidates.length > 0 && (
          <ul className="f-pl-cands" aria-label="נכסים קיימים מתאימים">
            {req.existingCandidates.map((c) => (
              <li key={c.id} className="f-pl-cand">
                <span className="f-pl-tile" aria-hidden><span>{c.format}</span></span>
                <span className="f-pl-cand__text"><span>&quot;{c.label}&quot;</span><span className="f-pl-meta">{c.note}</span></span>
                <Button size="sm" variant="secondary" onClick={() => onChoose("existing", { assetId: c.id })} aria-label={`השתמש ב־${c.label}`}>בחר</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className={cx("f-pl-cover__opt", "f-pl-cover__btn", rec === "ai_client" && "f-pl-cover__opt--rec")} onClick={() => onChoose("ai_client")}>
        <span className="f-pl-cover__row"><b>{COVER_WORD.ai_client}</b>{rec === "ai_client" && <span className="f-pl-chip f-pl-chip--accent">מומלץ</span>}</span>
        <span className="f-pl-meta">{req.aiClientNote ?? "התאמת נכס קיים של הלקוח בעזרת AI. מסומן \"משופר AI\"."}</span>
      </button>
      <button type="button" className={cx("f-pl-cover__opt", "f-pl-cover__btn", rec === "request" && "f-pl-cover__opt--rec")} onClick={() => onChoose("request")}>
        <span className="f-pl-cover__row"><b>{COVER_WORD.request}</b>{rec === "request" && <span className="f-pl-chip f-pl-chip--accent">מומלץ</span>}</span>
        <span className="f-pl-meta">{req.requestNote ?? "יוצר משימה עם בריף מוכן."}</span>
      </button>
      <div className="f-pl-cover__opt">
        <div className="f-pl-cover__row"><b>{COVER_WORD.upload}</b><span className="f-pl-meta">מהמחשב · Drive יחובר בהמשך</span></div>
        <input id={`${id}-file`} type="file" className="f-sr f-pl-file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
        <label htmlFor={`${id}-file`} className="f-pl-filebtn">{file ? `נבחר: ${file}` : "בחר קובץ"}</label>
        {file && <Button size="sm" variant="secondary" onClick={() => onChoose("upload", { fileName: file })}>השתמש ב־{file}</Button>}
      </div>
      {req.generateBlockedReason
        ? <div className="f-pl-cover__opt f-pl-cover__opt--off"><b>{COVER_WORD.generate} · לא זמין</b><span>{req.generateBlockedReason}</span></div>
        : <button type="button" className="f-pl-cover__opt f-pl-cover__btn" onClick={() => onChoose("generate")}><span className="f-pl-cover__row"><b>{COVER_WORD.generate}</b></span><span className="f-pl-meta">יצירת נכס חדש לפי הדרישה, מסומן &quot;קונספט AI&quot;. אין עורך עיצוב: רק טקסט, חיתוך והתאמת פורמט.</span></button>}
      {rec && <Button variant="strong" block onClick={() => onChoose(rec)}>התחל עם {COVER_WORD[rec]}</Button>}
    </div>
  );
}
