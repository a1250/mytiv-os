"use client";

import { useId, useState } from "react";
import type { ContentRequirement, CoverOption } from "@/lib/focus/contracts/plan";
import { allowedPaths, pathRefusal, recommendedPath, requestTooLate, uploadCompatible } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { DemoNote } from "./plan-parts";

/**
 * The four canonical ways to cover a content requirement (spec §9): use an existing asset, generate new, AI + the
 * client's asset, or request from the client. The requirement's authenticity class decides which are offered — the
 * others stay visible, disabled, with the reason (a testimonial is never generated or cut from other footage). An upload
 * from the computer is how material arrives under "use existing", not a fifth path. Nothing is generated or stored in
 * this prototype; a choice marks the asset as existing but waiting for approval (a client request keeps it missing).
 */
export const COVER_WORD: Record<CoverOption, string> = {
  existing: "השתמש בנכס קיים", generate: "צור חדש", ai_client: "AI + נכס של הלקוח", request: "בקש מהלקוח",
};

export function CoverOptions({ req, chosen, today, onChoose, onClear }: {
  req: ContentRequirement;
  chosen?: { choice: CoverOption; assetId?: string };
  today: number;
  onChoose: (choice: CoverOption, extra?: { assetId?: string; fileName?: string }) => void;
  onClear: () => void;
}) {
  const id = useId();
  const [file, setFile] = useState<{ name: string; type: string } | null>(null);
  const fileProblem = file ? uploadCompatible(req, file) : null;
  const video = req.assetType === "video" || req.assetType === "testimonial";
  const allowed = allowedPaths(req.authenticity);
  const rec = recommendedPath(req);
  const late = requestTooLate(req, today);
  if (chosen) {
    const exists = chosen.choice !== "request";
    return (
      <div className="f-pl-covered" role="status">
        <b>נבחר: {COVER_WORD[chosen.choice]}</b>
        <span className="f-pl-meta">
          {chosen.choice === "request" ? "נוצרה בקשה מובנית ומשימה בעבודה. הנכס נשאר חסר עד שיגיע." : "הנכס קיים וממתין לאישור — הוא עוד לא זמין לשימוש."}
        </span>
        {exists && <DemoNote>באב טיפוס לא נוצר ולא נשמר קובץ; המצב משקף את הבחירה בלבד</DemoNote>}
        <button type="button" className="f-pl-linkbtn f-hit" onClick={onClear}>שנה בחירה</button>
      </div>
    );
  }
  return (
    <div className="f-pl-cover" aria-labelledby={`${id}-h`}>
      <span id={`${id}-h`} className="f-pl-h3">איך לכסות</span>
      {/* 1. use existing — candidates from the library, or an upload from the computer */}
      <div className={cx("f-pl-cover__opt", rec === "existing" && "f-pl-cover__opt--rec")}>
        <div className="f-pl-cover__row"><b>{COVER_WORD.existing}</b>{rec === "existing" ? <span className="f-pl-chip f-pl-chip--accent">מומלץ</span> : <span className="f-pl-meta">{req.existingCandidates.length ? `${req.existingCandidates.length} מתאימים חלקית` : "אין נכס מתאים בספרייה"}</span>}</div>
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
        {req.authenticity === "brand_fixed" && !req.existingCandidates.length && <span className="f-pl-red">נכס מותג חסר בספרייה המאושרת — חסום עד שיתווסף</span>}
        {req.authenticity !== "brand_fixed" && <div className="f-pl-cover__upload">
          <span className="f-pl-meta">העלאה מהמחשב ({req.authenticity === "authentic" ? "רק חומר אמיתי שהתקבל מהלקוח" : "נכס קיים של הלקוח"}) · יישמר בתיקיית Mytiv ב־Drive כשיחובר</span>
          <input id={`${id}-file`} type="file" className="f-sr f-pl-file" accept={video ? "video/*" : "image/*"} onChange={(e) => { const f = e.target.files?.[0]; setFile(f ? { name: f.name, type: f.type } : null); }} />
          <label htmlFor={`${id}-file`} className="f-pl-filebtn">{file ? `נבחר: ${file.name}` : "בחר קובץ"}</label>
          {fileProblem && <span className="f-pl-red" role="alert">{fileProblem}</span>}
          {file && !fileProblem && <Button size="sm" variant="secondary" onClick={() => onChoose("existing", { fileName: file.name })}>השתמש ב־{file.name}</Button>}
        </div>}
      </div>
      {/* 2. AI + client asset */}
      {allowed.includes("ai_client")
        ? <button type="button" className={cx("f-pl-cover__opt", "f-pl-cover__btn", rec === "ai_client" && "f-pl-cover__opt--rec")} onClick={() => onChoose("ai_client")}>
            <span className="f-pl-cover__row"><b>{COVER_WORD.ai_client}</b>{rec === "ai_client" && <span className="f-pl-chip f-pl-chip--accent">מומלץ</span>}</span>
            <span className="f-pl-meta">{req.aiClientNote ?? "התאמת נכס קיים של הלקוח בעזרת AI (חיתוך, פורמט, רקע). מסומן \"משופר AI\"."}</span>
          </button>
        : <OffPath req={req} path="ai_client" />}
      {/* 3. request from the client */}
      {allowed.includes("request")
        ? <button type="button" className={cx("f-pl-cover__opt", "f-pl-cover__btn", rec === "request" && "f-pl-cover__opt--rec")} onClick={() => onChoose("request")}>
            <span className="f-pl-cover__row"><b>{COVER_WORD.request}</b>{rec === "request" && <span className="f-pl-chip f-pl-chip--accent">מומלץ</span>}</span>
            <span className="f-pl-meta">בקשה מובנית: מה, כמה, פורמט, עד מתי, למה ואיך לצלם. נשלחת ידנית.</span>
            {late && <span className="f-pl-amber">{late}</span>}
          </button>
        : <OffPath req={req} path="request" />}
      {/* 4. generate */}
      {allowed.includes("generate")
        ? <button type="button" className={cx("f-pl-cover__opt", "f-pl-cover__btn", rec === "generate" && "f-pl-cover__opt--rec")} onClick={() => onChoose("generate")}>
            <span className="f-pl-cover__row"><b>{COVER_WORD.generate}</b>{rec === "generate" && <span className="f-pl-chip f-pl-chip--accent">מומלץ</span>}</span>
            <span className="f-pl-meta">יצירת נכס חדש לפי הדרישה, מסומן &quot;קונספט AI&quot;. אין עורך עיצוב: רק טקסט, חיתוך והתאמת פורמט.</span>
          </button>
        : <OffPath req={req} path="generate" />}
      {rec && rec !== "existing" && <Button variant="strong" block onClick={() => onChoose(rec)}>התחל עם {COVER_WORD[rec]}</Button>}
    </div>
  );
}

/** A path the authenticity class refuses: shown disabled with the reason, never hidden. */
function OffPath({ req, path }: { req: ContentRequirement; path: CoverOption }) {
  return <div className="f-pl-cover__opt f-pl-cover__opt--off" aria-disabled><b>{COVER_WORD[path]} · לא זמין</b><span>{pathRefusal(req.authenticity, path)}</span></div>;
}
