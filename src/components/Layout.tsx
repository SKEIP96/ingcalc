import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  Cable,
  CircuitBoard,
  Gauge,
  History,
  Info,
  LayoutDashboard,
  Menu,
  Moon,
  Plug,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { APP_NAME, appSubtitle, FACULTY_LABEL, footerLine, footerNote, studentName, universityName } from "../config.ts";
import { useI18n } from "../context/LanguageContext.tsx";
import { useTheme } from "../context/ThemeContext.tsx";
import type { MessageKey } from "../i18n/messages.ts";

const NAV: Array<{ to: string; end: boolean; icon: typeof LayoutDashboard; key: MessageKey }> = [
  { to: "/", end: true, icon: LayoutDashboard, key: "navHome" },
  { to: "/ohm", end: false, icon: Zap, key: "navOhm" },
  { to: "/circuite", end: false, icon: Activity, key: "navCircuits" },
  { to: "/consum", end: false, icon: Plug, key: "navEnergy" },
  { to: "/rezistente", end: false, icon: Cable, key: "navResistance" },
  { to: "/randament", end: false, icon: Gauge, key: "navEfficiency" },
  { to: "/istoric", end: false, icon: History, key: "navHistory" },
  { to: "/despre", end: false, icon: Info, key: "navAbout" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, m } = useI18n();
  const current = NAV.find((item) => item.to === location.pathname);
  const title = current ? m[current.key] : m.pageUnknown;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = location.pathname === "/" ? `${APP_NAME} — ${appSubtitle(locale)}` : `${title} · ${APP_NAME}`;
  }, [locale, location.pathname, title]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#continut">
        {m.skip}
      </a>
      {open ? (
        <button className="fixed inset-0 z-40 bg-slate-950/60 md:hidden" aria-label={m.closeMenu} onClick={() => setOpen(false)} />
      ) : null}
      <aside className={`sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col p-4 transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-start justify-between gap-3 px-2">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <CircuitBoard aria-hidden="true" /> {APP_NAME}
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{m.sidebarTag}</p>
          </div>
          <button className="icon-btn md:hidden" type="button" aria-label={m.closeMenu} onClick={() => setOpen(false)}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={m.navLabel} className="grid gap-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                <Icon size={18} aria-hidden="true" />
                <span>{m[item.key]}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto px-2 pt-4 text-sm text-[var(--muted)]">
          <p>{studentName(locale)}</p>
          <p>{universityName(locale)}</p>
          <p>{FACULTY_LABEL}</p>
        </div>
      </aside>
      <div className="min-h-dvh md:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--sidebar)] px-4 py-3 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <button className="icon-btn md:hidden" type="button" aria-expanded={open} aria-label={m.openMenu} onClick={() => setOpen(true)}>
              <Menu size={18} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--muted)]">{APP_NAME}</p>
              <p className="truncate font-semibold">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="seg" role="radiogroup" aria-label={m.langLabel}>
              <button type="button" role="radio" aria-checked={locale === "ro"} onClick={() => setLocale("ro")}>RO</button>
              <button type="button" role="radio" aria-checked={locale === "ru"} onClick={() => setLocale("ru")}>RU</button>
            </div>
            <button className="icon-btn" type="button" aria-label={theme === "dark" ? m.themeLight : m.themeDark} onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
          </div>
        </header>
        <main id="continut" className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-sm text-[var(--muted)] md:px-8">
          <p>{footerLine(locale)}</p>
          <p>{footerNote(locale)}</p>
        </footer>
      </div>
    </div>
  );
}
