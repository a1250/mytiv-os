/**
 * Focus UI — data honesty: "unknown" is never 0, "unavailable" is never empty, an error is never an empty list;
 * certainty marks; deterministic formatting; editor history and live checks.
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Metric, Reading } from "@/lib/focus/contracts/common";
import { dataOf, type Loadable } from "@/lib/focus/contracts/loadable";
import { daysBetween, fmtAgo, fmtDate, fmtDays, fmtDuration, fmtLongDate, fmtMoney, fmtWaiting } from "@/lib/focus/format";
import { blockingErrors, editorReducer, initEditor, liveChecks } from "@/lib/focus/state/editor";
import { DESIGNS } from "@/lib/focus/fixtures/studio";
import { metricNote } from "@/components/focus/patterns/metrics";
import { ReadingValue } from "@/components/focus/ui/status";
import { LoadableView } from "@/components/focus/ui/feedback";

const NOW = "2026-10-01T08:10:00+03:00";
const metric = (reading: Reading): Metric => ({ id: "m", label: "m", reading, source: { system: "instagram", label: "Instagram" }, unit: "count" });
const html = (reading: Reading) => renderToStaticMarkup(createElement(ReadingValue, { reading, unit: "count" }));

describe("unknown vs zero", () => {
  it("renders a known zero as 0 and unknown / unavailable as — (never 0)", () => {
    expect(html({ kind: "known", value: 0 })).toContain(">0<");
    expect(html({ kind: "unknown", reason: "לא דווח" })).toContain("—");
    expect(html({ kind: "unknown", reason: "לא דווח" })).not.toMatch(/>0</);
    expect(html({ kind: "unavailable", since: NOW, reason: "תקלה" })).toContain("לא זמין");
  });
  it("marks estimates with ≈ and explains them", () => {
    expect(html({ kind: "estimated", value: 96, basis: "חסר יום" })).toContain("≈");
    expect(metricNote(metric({ kind: "estimated", value: 96, basis: "חסר יום" }), NOW)).toEqual({ text: "מוערך · חסר יום", tone: "estimated" });
  });
  it("explains unavailable and unknown readings instead of a number", () => {
    expect(metricNote(metric({ kind: "unavailable", since: "2026-09-27T03:00:00+03:00", reason: "תקלה" }), NOW).text).toBe("לא זמין · מ־27.9");
    expect(metricNote(metric({ kind: "unknown", reason: "לא דווח" }), NOW).tone).toBe("unavailable");
  });
});

describe("unavailable vs empty vs error", () => {
  const list = (d: string[]) => createElement("ul", null, d.map((x) => createElement("li", { key: x }, x)));
  // LoadableView is a hook-free function component: call it directly to render one state
  const render = (value: Loadable<string[]>) => renderToStaticMarkup(LoadableView<string[]>({ value, children: list }));
  it("each state renders differently and only ready/partial render the list", () => {
    const ready = render({ state: "ready", data: ["a"] });
    const empty = render({ state: "empty", title: "אין פריטים" });
    const error = render({ state: "error", message: "לא הצלחנו לטעון", retryable: true });
    const unavailable = render({ state: "unavailable", reason: "Instagram לא זמין", since: "2026-09-27T03:00:00+03:00" });
    expect(ready).toContain("<li>a</li>");
    for (const s of [empty, error, unavailable]) expect(s).not.toContain("<li>");
    expect(empty).toContain("אין פריטים");
    // an error is its own variant and is announced as an alert when it appears (a load-time one opts out)
    expect(error).toContain("f-banner--error");
    expect(error).toContain('role="alert"');
    expect(unavailable).toContain("27.9");
    expect(new Set([empty, error, unavailable]).size).toBe(3);
  });
  it("a partial read hides counts and says what is missing", () => {
    const p = render({ state: "partial", data: ["a"], missing: "חסרות 3 משימות." });
    expect(p).toContain("<li>a</li>");
    expect(p).toContain("הספירות מוסתרות");
  });
  it("dataOf gives no data for error or unavailable", () => {
    expect(dataOf({ state: "error", message: "x", retryable: false })).toBeNull();
    expect(dataOf({ state: "unavailable", reason: "x" })).toBeNull();
    expect(dataOf({ state: "ready", data: 1 })).toBe(1);
  });
});

describe("formatting (deterministic, RTL rules)", () => {
  it("formats dates, money and durations", () => {
    expect(fmtDate("2026-10-08")).toBe("8.10.2026");
    expect(fmtLongDate(NOW)).toBe("יום חמישי, 1 באוקטובר 2026");
    expect(fmtMoney(8750)).toBe("8,750 ₪");
    expect(fmtDuration(42 * 60_000 + 18_000)).toBe("00:42:18");
  });
  it("counts days and waiting time on the Jerusalem calendar", () => {
    expect(daysBetween("2026-09-29T23:30:00+03:00", NOW)).toBe(2);
    expect(fmtDays(1)).toBe("יום");
    expect(fmtDays(2)).toBe("יומיים");
    expect(fmtWaiting("2026-09-28T09:30:00+03:00", NOW)).toBe("3 ימים");
    expect(fmtAgo("2026-10-01T08:06:00+03:00", NOW)).toBe("לפני 4 דק׳");
  });
});

describe("studio editor history and checks", () => {
  const story = DESIGNS[0].variants[0];
  it("undo / redo restore layer visibility", () => {
    let s = initEditor(story);
    s = editorReducer(s, { type: "toggleVisible", id: "headline" });
    expect(s.present.find((l) => l.id === "headline")!.visible).toBe(false);
    s = editorReducer(s, { type: "undo" });
    expect(s.present.find((l) => l.id === "headline")!.visible).toBe(true);
    s = editorReducer(s, { type: "redo" });
    expect(s.present.find((l) => l.id === "headline")!.visible).toBe(false);
  });
  it("showing the required logo clears the brand warning; warnings never block", () => {
    const s = initEditor(story);
    expect(liveChecks(DESIGNS[0].checks, s.present).some((c) => c.level === "warning")).toBe(true);
    const shown = editorReducer(s, { type: "toggleVisible", id: "logo" });
    expect(liveChecks(DESIGNS[0].checks, shown.present).some((c) => c.level === "warning")).toBe(false);
    expect(blockingErrors(DESIGNS[0].checks)).toBe(0);
  });
});
