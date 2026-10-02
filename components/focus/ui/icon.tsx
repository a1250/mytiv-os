import type { CSSProperties } from "react";
import {
  Bell, Calendar, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock, Ellipsis, Eye, EyeOff, Folder,
  GripVertical, Image, Link, ListChecks, Lock, Mail, Megaphone, Menu, Monitor, Moon, Paperclip, Pause, Phone, Play,
  Plus, Redo2, RefreshCw, Search, Sparkles, Square, SquareCheck, Sun, Type, Undo2, X, type LucideIcon,
} from "lucide-react";

/**
 * Icons — Lucide (handoff: lucide-static@0.344.0, stroke 2, 18/20px) via the codebase's lucide-react, keyed by the
 * handoff's names; a few were renamed in lucide-react v1 (check-circle-2 → CircleCheck, more-horizontal → Ellipsis…).
 * Icons follow currentColor (dark mode works). An icon that is the only content of a control needs `label`.
 */
const ICONS = {
  bell: Bell, calendar: Calendar, "check-check": CheckCheck, "check-circle-2": CircleCheck, "check-square": SquareCheck,
  "chevron-down": ChevronDown, "chevron-left": ChevronLeft, "chevron-right": ChevronRight, clock: Clock, eye: Eye,
  "eye-off": EyeOff, folder: Folder, grip: GripVertical, image: Image, link: Link, "list-checks": ListChecks, lock: Lock,
  mail: Mail, megaphone: Megaphone, menu: Menu, monitor: Monitor, moon: Moon, "more-horizontal": Ellipsis,
  paperclip: Paperclip, pause: Pause, phone: Phone, play: Play, plus: Plus, "redo-2": Redo2, "refresh-cw": RefreshCw,
  search: Search, sparkles: Sparkles, square: Square, sun: Sun, type: Type, "undo-2": Undo2, x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18, label, className, style }: { name: IconName; size?: number; label?: string; className?: string; style?: CSSProperties }) {
  const C: LucideIcon = ICONS[name];
  return label
    ? <C size={size} strokeWidth={2} role="img" aria-label={label} className={className} style={{ flex: "none", ...style }} />
    : <C size={size} strokeWidth={2} aria-hidden className={className} style={{ flex: "none", ...style }} />;
}
