"use client";

/**
 * Ported from the Electron app's src/components/Sidebar.jsx. Adds the
 * business switcher (new — this is the direct UI answer to "manage Mytiv and
 * other businesses I'm connected to from one dashboard").
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, FUTURE_MODULES } from "@/lib/registry";
import { useStudio } from "./studio-provider";
import { BusinessSwitcher, type BusinessOption } from "./business-switcher";

export function Sidebar({ businesses }: { businesses: BusinessOption[] }) {
  const { settings, t, businessSlug } = useStudio();
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        {settings.logo_url ? (
          <img src={settings.logo_url as string} alt="logo" className="brand-logo" />
        ) : null}
        <div className="brand-text">
          <div className="brand-name">{settings.studio_name || "Mytiv"}</div>
          <div className="brand-sub">OS</div>
        </div>
      </div>

      <BusinessSwitcher businesses={businesses} currentSlug={businessSlug} />

      <nav className="nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="nav-section">{t(section.label)}</div>
            {section.items.map((item) => {
              const href = `/${businessSlug}/${item.path}`;
              const isActive = pathname === href || (item.path === "" && pathname === `/${businessSlug}`);
              return (
                <Link key={item.id} href={href} className={`nav-item ${isActive ? "active" : ""}`}>
                  {t(item.label)}
                </Link>
              );
            })}
          </div>
        ))}
        {FUTURE_MODULES.map((item) => (
          <span key={item.id} className="nav-item soon">
            {t(item.label)} <em>soon</em>
          </span>
        ))}
      </nav>

      <Link href={`/${businessSlug}/settings`} className="nav-item settings-link">
        {t("Settings")}
      </Link>
    </aside>
  );
}
