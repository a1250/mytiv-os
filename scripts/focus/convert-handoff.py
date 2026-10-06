"""
Converts rendered Claude Design frames (scratchpad/frames/<ID>.html) into React screens for the Focus prototype.

- Each frame: <div id=ID> label-row, app-frame (1440 desktop / 390 mobile), [annotations].
- Desktop app-frame: first child is either the standard top bar (has "Mytiv" brand -> stripped; the shared
  FocusTopBar renders it, with the active item / switcher / bell recorded per route) or a focus-mode bar
  (kept as page content; the page hides the global nav).
- Colours are normalised (rgb() -> hex) and mapped to theme variables, property-aware, so dark mode works:
  status text on a status background uses *-ink, status text on a surface uses *-text.
- Lucide <img> icons become <Icon name=…/> (lucide-react). Text is emitted as exact JS string literals.
Outputs: components/focus/reference/<ID>.tsx (visual reference only) and docs/focus/reference/screens.generated.json
(the frame registry, to compare with lib/focus/screens.ts by hand). It never writes product pages, screens or the registry.
"""
import html, json, os, re, sys
from html.parser import HTMLParser

SP, REPO = sys.argv[1], sys.argv[2]
FRAMES = os.path.join(SP, "frames")
VOID = {"img", "br", "input", "hr", "meta", "link", "source", "col", "wbr", "area"}

# ---------------------------------------------------------------- routes (owner-facing URLs)
ROUTES = {
    "D1": "/focus", "D2": "/focus/projects/umino", "D3": "/focus/projects/umino/execution",
    "D4": "/focus/approvals", "D5": "/focus/approvals/promo-1plus1", "D6": "/focus/approvals/proposal-noa",
    "D7": "/focus/approvals/content-sushi-story", "D8": "/focus/today-manager",
    "E1": "/focus/marketing/campaigns/thursday-sushi", "E2": "/focus/studio", "E3": "/focus/studio/new",
    "E4": "/focus/studio/new/directions", "E5": "/focus/studio/thursday-sushi", "E6": "/focus/studio/thursday-sushi/edit",
    "E7": "/focus/studio/thursday-sushi/publish",
    "F1": "/focus/sales", "F2": "/focus/sales/leads/noa-cohen", "F3": "/focus/sales/proposals/corporate-hosting",
    "F4": "/focus/sales/outreach", "F5": "/focus/work/all-tasks", "F6": "/focus/comms",
    "G1": "/focus/reports", "G2": "/focus/reports/hours", "G3": "/focus/reports/weekly", "G4": "/focus/reports/activity",
    "G5": "/focus/clients/umino/brain", "G6": "/focus/settings/connections",
    "H1": "/focus/projects", "H2": "/focus/clients/umino", "H3": "/focus/projects/new", "H4": "/focus/marketing/plan",
    "H5": "/focus/marketing/board", "H6": "/focus/marketing/inspiration", "H7": "/focus/marketing/trends",
    "H8": "/focus/sales/discovery", "H9": "/focus/sales/proposals", "H10": "/focus/comms/calendar",
    "H11": "/focus/marketing/briefs", "H12": "/focus/marketing/prompts", "H13": "/focus/settings/users",
    "H14": "/focus/settings/business", "H15": "/focus/notifications",
    "W1": "/focus/work", "W2": "/focus/work/list", "W3": "/focus/work/board", "W4": "/focus/work/task",
    "W5": "/focus/work/time", "W6": "/focus/work/states",
    **{f"M{i}": f"/focus/m/{i}" for i in range(1, 11)},
}
NAV_LABELS = {"היום שלי": "today", "לקוחות ופרויקטים": "projects", "שיווק ותוכן": "marketing", "מכירות": "sales",
              "עבודה": "work", "עבודה ותקשורת": "work", "תקשורת": "comms", "דוחות": "reports", "הגדרות": "settings"}
def nav_from_route(route):
    for prefix, key in [("/focus/projects", "projects"), ("/focus/clients", "projects"), ("/focus/marketing", "marketing"),
                        ("/focus/studio", "marketing"), ("/focus/sales", "sales"), ("/focus/work", "work"),
                        ("/focus/comms", "comms"), ("/focus/reports", "reports"), ("/focus/settings", "settings"),
                        ("/focus/notifications", "today"), ("/focus/approvals", "today")]:
        if route.startswith(prefix): return key
    return "today"

# ---------------------------------------------------------------- tiny DOM
class Node:
    def __init__(s, tag, attrs): s.tag, s.attrs, s.children = tag, attrs, []
class Builder(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = Node("#root", []); s.stack = [s.root]
    def handle_starttag(s, tag, attrs):
        n = Node(tag, attrs); s.stack[-1].children.append(n)
        if tag not in VOID: s.stack.append(n)
    def handle_startendtag(s, tag, attrs): s.stack[-1].children.append(Node(tag, attrs))
    def handle_endtag(s, tag):
        for i in range(len(s.stack) - 1, 0, -1):
            if s.stack[i].tag == tag: del s.stack[i:]; break
    def handle_data(s, data): s.stack[-1].children.append(data)
def parse(text):
    b = Builder(); b.feed(text); b.close(); return b.root
def elems(n): return [c for c in n.children if isinstance(c, Node)]
def text_of(n):
    return "".join(c if isinstance(c, str) else text_of(c) for c in n.children)
def style_of(n): return dict(n.attrs).get("style") or ""

# ---------------------------------------------------------------- colours
def rgb_to_hex(m):
    r, g, b = (int(float(x)) for x in m.group(1, 2, 3))
    a = m.group(4)
    if a is not None and float(a) < 1: return f"rgba({r}, {g}, {b}, {a})"
    return f"#{r:02x}{g:02x}{b:02x}"
RGB = re.compile(r"rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)")
BG = {"#ffffff": "--f-surface", "#f3f5f9": "--f-bg", "#eef1f6": "--f-surface-2", "#dde2ea": "--f-border",
      "#c3cad6": "--f-line-strong", "#5b45c9": "--f-accent", "#ece8fb": "--f-accent-weak", "#c9c1f0": "--f-accent-avatar",
      "#d4cdf5": "--f-accent-soft-2", "#f8f7fe": "--f-accent-tint", "#fbe4e1": "--f-red-bg", "#fbf0d9": "--f-amber-bg",
      "#e3f3ea": "--f-green-bg", "#e9edf3": "--f-neutral-bg"}
STATUS_BG = {"#fbe4e1", "#fbf0d9", "#e3f3ea", "#e9edf3"}
TEXT = {"#161d2e": "--f-ink", "#4d5870": "--f-muted", "#2c364b": "--f-ink-soft", "#8a93a6": "--f-faint",
        "#aeb6c7": "--f-faint-2", "#5b45c9": "--f-accent", "#3f2ea3": "--f-accent-ink"}
STATUS_TEXT = {"#b8322a": "red", "#8c5a00": "amber", "#23774a": "green", "#56617a": "neutral", "#5e3d00": "amber-strong"}
LINE = {"#dde2ea": "--f-border", "#c3cad6": "--f-line-strong", "#eef1f6": "--f-surface-2", "#5b45c9": "--f-accent",
        "#3f2ea3": "--f-accent-ink", "#c9c1f0": "--f-accent-avatar", "#ffffff": "--f-surface"}

def map_value(prop, value, on_status_bg):
    value = RGB.sub(rgb_to_hex, value)
    def rep(m):
        h = m.group(0).lower()
        if len(h) == 4: h = "#" + "".join(c * 2 for c in h[1:])
        if prop.startswith("background"):
            v = BG.get(h)
        elif prop == "color":
            if h in STATUS_TEXT:
                base = STATUS_TEXT[h]
                v = (f"--f-{base}-ink" if base != "amber-strong" else "--f-amber-ink-strong") if on_status_bg else f"--f-{base}-text"
            else:
                v = TEXT.get(h)
        elif prop.startswith(("border", "box-shadow", "outline", "fill", "stroke", "text-decoration")):
            v = LINE.get(h)
        else:
            v = None
        return f"var({v})" if v else m.group(0)
    return re.sub(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", rep, value)

def camel(prop):
    if prop.startswith("--"): return prop
    if prop.startswith("-webkit-"): prop = "Webkit-" + prop[8:]
    elif prop.startswith("-moz-"): prop = "Moz-" + prop[5:]
    parts = prop.split("-")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])

def style_obj(style, drop=()):
    decls = []
    for part in re.split(r";(?![^(]*\))", style):
        if ":" not in part: continue
        p, v = part.split(":", 1); decls.append((p.strip().lower(), v.strip()))
    bgs = [RGB.sub(rgb_to_hex, v).lower() for p, v in decls if p in ("background", "background-color")]
    on_status = any(any(s in b for s in STATUS_BG) for b in bgs)
    last = {}
    for p, v in decls:  # CSS semantics: a later declaration of the same property wins
        if p and p not in drop: last.pop(p, None); last[p] = v
    out = []
    for p, v in last.items():
        out.append(f"{json.dumps(camel(p), ensure_ascii=False) if p.startswith('--') else camel(p)}: {json.dumps(map_value(p, v, on_status), ensure_ascii=False)}")
    return "{ " + ", ".join(out) + " }" if out else None

# ---------------------------------------------------------------- JSX emit
ATTR = {"class": "className", "for": "htmlFor", "colspan": "colSpan", "rowspan": "rowSpan", "tabindex": "tabIndex",
        "readonly": "readOnly", "maxlength": "maxLength", "autocomplete": "autoComplete", "spellcheck": "spellCheck",
        "contenteditable": "contentEditable", "datetime": "dateTime"}
SKIP_ATTR = {"style"}
used_icons = set()
LUCIDE = re.compile(r"lucide-static@[\d.]+/icons/([a-z0-9-]+)\.svg")

def jsx(n, ind=0, drop_style=()):
    pad = "  " * ind
    if isinstance(n, str):
        if not n.strip():
            return None if "\n" in n else pad + '{" "}'
        t = re.sub(r"\s+", " ", n)
        if t != t.strip() or re.search(r"[{}<>&\"'`]", t) or "//" in t or "/*" in t:
            return pad + "{" + json.dumps(t, ensure_ascii=False) + "}"
        return pad + t
    a = dict(n.attrs)
    if n.tag == "img" and LUCIDE.search(a.get("src") or ""):
        name = LUCIDE.search(a["src"]).group(1); used_icons.add(name)
        st = a.get("style") or ""
        size = re.search(r"width:\s*(\d+)px", st)
        rest = style_obj(st, drop=("width", "height"))
        props = [f'name="{name}"', f"size={{{size.group(1) if size else 18}}}"]
        if a.get("alt"): props.append(f"label={json.dumps(a['alt'], ensure_ascii=False)}")
        if rest: props.append(f"style={{{rest}}}")
        return pad + "<Icon " + " ".join(props) + " />"
    tag = n.tag
    props = []
    st = a.get("style")
    if st:
        so = style_obj(st, drop=drop_style)
        if so: props.append(f"style={{{so}}}")
    for k, v in n.attrs:
        if k in SKIP_ATTR or k.startswith("on") or k.startswith("data-dc"): continue
        if k == "id": continue
        name = ATTR.get(k, k)
        if tag == "input" and k == "value": name = "defaultValue"
        if tag == "input" and k == "checked": props.append("defaultChecked"); continue
        if tag in ("textarea",) and k == "value": name = "defaultValue"
        if v is None: props.append(name); continue
        if name in ("tabIndex", "colSpan", "rowSpan", "maxLength") and v.isdigit(): props.append(f"{name}={{{v}}}"); continue
        props.append(f"{name}={json.dumps(v, ensure_ascii=False)}")
    if tag == "input" and not any(p.startswith(("defaultValue", "readOnly")) for p in props) and dict(n.attrs).get("type", "text") in ("text", "email", "search", "tel", "url", "number", "date"):
        props.append("readOnly")
    open_ = f"<{tag}" + ("" if not props else " " + " ".join(props))
    if tag in VOID: return pad + open_ + " />"
    if tag == "textarea":
        return pad + open_ + f" defaultValue={json.dumps(text_of(n), ensure_ascii=False)} readOnly />"
    kids = [k for k in (jsx(c, ind + 1) for c in n.children) if k is not None]
    if not kids: return pad + open_ + f"></{tag}>"
    return pad + open_ + ">\n" + "\n".join(kids) + "\n" + pad + f"</{tag}>"

# ---------------------------------------------------------------- frames
def classify_bar(bar):
    t = text_of(bar)
    return "nav" if "Mytiv" in t and ("יצירה" in t or "דוחות" in t) else "focus"

def nav_state(bar):
    state = {"active": None, "client": None, "bell": False, "avatar": None}
    for sp in elems(bar):
        t = re.sub(r"\s+", " ", text_of(sp)).strip()
        st = RGB.sub(rgb_to_hex, style_of(sp)).lower()
        if t.endswith("▾"): state["client"] = t[:-1].strip()
        if t in NAV_LABELS and "#ece8fb" in st: state["active"] = NAV_LABELS[t]
        if any(isinstance(c, Node) and c.tag == "img" and "bell" in dict(c.attrs).get("src", "") for c in sp.children): state["bell"] = True
        if len(t) == 1 and "#c9c1f0" in st: state["avatar"] = t
    # nav items may sit in a wrapper div (canonical TopBar)
    for wrap in elems(bar):
        for sp in elems(wrap):
            t = re.sub(r"\s+", " ", text_of(sp)).strip(); st = RGB.sub(rgb_to_hex, style_of(sp)).lower()
            if t in NAV_LABELS and "#ece8fb" in st: state["active"] = NAV_LABELS[t]
    return state

registry = []
os.makedirs(os.path.join(REPO, "components/focus/reference"), exist_ok=True)
order = sorted(os.listdir(FRAMES), key=lambda f: (f[0] != "D", f[0] != "E", f[0] != "F", f[0] != "G", f[0] != "H", f[0] != "W", f[0], int(re.sub(r"\D", "", f) or 0)))
for fname in order:
    fid = fname[:-5]
    root = parse(open(os.path.join(FRAMES, fname), encoding="utf-8").read())
    frame = elems(root)[0]
    kids = elems(frame)
    label, app, extra = kids[0], kids[1], kids[2:]
    lab = elems(label)
    title = text_of(lab[1]).strip() if len(lab) > 1 else fid
    subtitle = text_of(lab[2]).strip() if len(lab) > 2 else ""
    annotations = [re.sub(r"\s+", " ", text_of(x)).strip() for x in extra if text_of(x).strip()]
    route = ROUTES[fid]
    is_mobile = fid.startswith("M")
    used_icons_before = set(used_icons)
    if is_mobile:
        mode, nav = "mobile", None
        body = jsx(app, 3)
        root_jsx = (f'    <div className="f-focusmode f-device">\n      <div className="f-device__stage">\n{body}\n'
                    + (f'        <p className="f-device__note">{{{json.dumps(" · ".join(annotations), ensure_ascii=False)}}}</p>\n' if annotations else "")
                    + "      </div>\n    </div>")
    else:
        app_kids = app.children
        first = elems(app)[0] if elems(app) else None
        bar_kind = classify_bar(first) if first is not None and "height: 68px" in style_of(first) else None
        nav = {"active": nav_from_route(route), "client": "כל הלקוחות", "bell": False, "avatar": "ר"}
        if bar_kind == "nav":
            s = nav_state(first)
            nav = {"active": s["active"] or nav_from_route(route), "client": s["client"] or "כל הלקוחות", "bell": s["bell"], "avatar": s["avatar"] or "ר"}
            app_kids = [c for c in app.children if c is not first]
        mode = "focus" if bar_kind == "focus" else "app"
        if fid == "F6": nav["active"] = "comms"  # mail lives under תקשורת (frame shows the older combined label)
        # the app frame becomes the page surface: drop the canvas-only width/radius/shadow; fixed heights become min-heights
        app_style = style_of(app)
        app_style = re.sub(r"(?<![-\w])height:\s*([\d.]+)px", r"min-height: \1px", app_style)
        app_style += "; width: 100%"
        cls = "f-screen" + (" f-focusmode" if mode == "focus" else "")
        so = style_obj(app_style, drop=("border-radius", "box-shadow", "overflow")) or "{}"
        inner = [k for k in (jsx(c, 3) for c in app_kids) if k is not None]
        root_jsx = f'    <div className="{cls}" style={{{so}}}>\n' + "\n".join(inner) + "\n    </div>"
    icon_import = 'import { Icon } from "@/components/focus/ui/icon";\n' if used_icons - used_icons_before or "<Icon " in root_jsx else ""
    src = (f'/**\n * {fid} — {title}{(" · " + subtitle) if subtitle else ""}\n * Generated from the Claude Design handoff ({fid}) by the Focus converter — design reference on demo data,\n'
           f' * not wired to any backend. Edit freely; regenerate only if the handoff changes.\n */\n{icon_import}\n'
           f"export default function Screen{fid}() {{\n  return (\n{root_jsx}\n  );\n}}\n")
    open(os.path.join(REPO, f"components/focus/reference/{fid}.tsx"), "w", encoding="utf-8").write(src)
    registry.append({"id": fid, "title": title, "subtitle": subtitle, "route": route, "mode": mode, "nav": nav, "notes": annotations})

# registry
reg = ("/** Generated by the Focus converter: every handoff screen, its URL, page mode and top-bar state. */\n"
       "export type ScreenMode = \"app\" | \"focus\" | \"mobile\";\n"
       "export type NavKey = \"today\" | \"projects\" | \"marketing\" | \"sales\" | \"work\" | \"comms\" | \"reports\" | \"settings\";\n"
       "export type ScreenEntry = { id: string; title: string; subtitle: string; route: string; mode: ScreenMode;\n"
       "  nav: { active: NavKey; client: string; bell: boolean; avatar: string } | null; notes: string[] };\n\n"
       "export const SCREENS: ScreenEntry[] = " + json.dumps(registry, ensure_ascii=False, indent=1) + ";\n")
# the product registry (lib/focus/screens.ts) is maintained by hand — write the frame list next to the handoff instead
open(os.path.join(REPO, "docs/focus/reference/screens.generated.json"), "w", encoding="utf-8").write(json.dumps(registry, ensure_ascii=False, indent=1))
json.dump(sorted(used_icons), open(os.path.join(SP, "icons.json"), "w"))
print(f"screens: {len(registry)} | icons: {len(used_icons)} | modes:", {m: sum(r['mode'] == m for r in registry) for m in ('app', 'focus', 'mobile')})
for r in registry: print(f"  {r['id']:4} {r['mode']:6} {r['route']:45} nav={r['nav'] and (r['nav']['active'], r['nav']['client'], r['nav']['bell'])}")
