import type { CSSProperties } from "react";
import {
  Bell, CheckCheck, ChevronDown, ChevronLeft, CircleCheck, Ellipsis, Eye, Folder, Link, ListChecks, Lock, Mail,
  Megaphone, Menu, Pause, Phone, Play, Redo2, RefreshCw, Search, SquareCheck, Sun, Undo2, X, type LucideIcon,
} from "lucide-react";

/**
 * The handoff uses Lucide (lucide-static@0.344.0, stroke 2, 18/20px). Same icons from lucide-react, keyed by the
 * handoff's names; a few were renamed in lucide-react v1 (check-circle-2 → CircleCheck, more-horizontal → Ellipsis…).
 * Icons follow the text colour (currentColor), so they work in dark mode. An icon without text gets aria-label.
 */
const ICONS: Record<string, LucideIcon> = {
  bell: Bell, "check-check": CheckCheck, "check-circle-2": CircleCheck, "check-square": SquareCheck,
  "chevron-down": ChevronDown, "chevron-left": ChevronLeft, eye: Eye, folder: Folder, link: Link,
  "list-checks": ListChecks, lock: Lock, mail: Mail, megaphone: Megaphone, menu: Menu, "more-horizontal": Ellipsis,
  pause: Pause, phone: Phone, play: Play, "redo-2": Redo2, "refresh-cw": RefreshCw, search: Search, sun: Sun,
  "undo-2": Undo2, x: X,
};

export function Icon({ name, size = 18, label, style }: { name: string; size?: number; label?: string; style?: CSSProperties }) {
  const C = ICONS[name];
  if (!C) return <span aria-hidden style={{ display: "inline-block", width: size, height: size, flex: "none" }} />;
  return label
    ? <C size={size} strokeWidth={2} role="img" aria-label={label} style={{ flex: "none", ...style }} />
    : <C size={size} strokeWidth={2} aria-hidden style={{ flex: "none", ...style }} />;
}
