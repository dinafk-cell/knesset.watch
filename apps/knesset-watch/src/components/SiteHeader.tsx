'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeriod, PERIOD_SHORTCUTS, periodLabel } from '@/lib/period-context';
import { NAV_GROUPS, HOME_LINK, FOOTER_LINK, isNavActive, type NavLink } from '@/lib/nav';
import { UnifiedSearch } from '@/components/UnifiedSearch';

// ── Calendar helpers ──────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
// Sunday=0 in JS; Hebrew week starts Sunday
function firstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const HE_DOW = ['א','ב','ג','ד','ה','ו','ש'];

function PeriodSelector() {
  const { period, setPeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate]   = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setRangeStart(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(dateStr: string) {
    if (!rangeStart) {
      setRangeStart(dateStr);
    } else {
      const [from, to] = rangeStart <= dateStr ? [rangeStart, dateStr] : [dateStr, rangeStart];
      setPeriod(`custom:${from}:${to}`);
      setRangeStart(null);
      setOpen(false);
    }
  }

  function inRange(dateStr: string) {
    if (!rangeStart) return false;
    const end = hoverDate ?? rangeStart;
    const [lo, hi] = rangeStart <= end ? [rangeStart, end] : [end, rangeStart];
    return dateStr >= lo && dateStr <= hi;
  }

  // Build calendar grid
  const firstDay = firstWeekday(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const label = periodLabel(period);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => { setOpen(o => !o); setRangeStart(null); }}
        className="flex items-center gap-1 text-meta font-medium px-3 py-2 rounded-control border border-line hover:border-accent bg-surface transition-colors"
      >
        <span>{label}</span>
        <svg className={`w-2.5 h-2.5 text-mute transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l4 4 4-4"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 bg-surface border border-line rounded-card shadow-lg z-50 p-3 w-64" dir="rtl">
          {/* Shortcuts */}
          <div className="flex flex-wrap gap-1 mb-3">
            {PERIOD_SHORTCUTS.map(p => (
              <button
                key={p.value}
                onClick={() => { setPeriod(p.value); setOpen(false); setRangeStart(null); }}
                className={`text-meta font-medium px-2 py-1.5 rounded-full transition-colors ${
                  period === p.value
                    ? 'bg-navy-deep text-white'
                    : 'bg-surface text-ink-2 hover:bg-line'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-line-soft mb-3"/>

          {/* Range picking hint */}
          {rangeStart ? (
            <p className="text-meta text-accent mb-2 text-center">בחר תאריך סיום</p>
          ) : (
            <p className="text-meta text-mute mb-2 text-center">בחר טווח תאריכים</p>
          )}

          {/* Month header */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={nextMonth} aria-label="החודש הבא" className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-2 text-mute">
              <svg viewBox="0 0 6 10" className="w-2 h-3" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 1L1 5l4 4"/></svg>
            </button>
            <span className="text-meta font-medium">{HE_MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={prevMonth} aria-label="החודש הקודם" className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-2 text-mute">
              <svg viewBox="0 0 6 10" className="w-2 h-3" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4-4 4"/></svg>
            </button>
          </div>

          {/* Day of week header */}
          <div className="grid grid-cols-7 mb-1">
            {HE_DOW.map(d => (
              <div key={d} className="text-meta font-medium text-mute text-center py-0.5">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`}/>;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isStart = dateStr === rangeStart;
              const inRng   = inRange(dateStr);
              const today   = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
              const isToday = dateStr === today;
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(dateStr)}
                  onMouseEnter={() => rangeStart && setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={`text-meta font-medium h-8 w-full flex items-center justify-center rounded transition-colors
                    ${isStart ? 'bg-navy-deep text-white' : ''}
                    ${!isStart && inRng ? 'bg-accent-wash text-accent' : ''}
                    ${!isStart && !inRng ? 'hover:bg-surface-2 text-ink-2' : ''}
                    ${isToday && !isStart && !inRng ? 'font-medium text-accent' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


/** פריט בתפריט המובייל. אותו סימון פעיל כמו בסיידבר, בגרסה של רשימה. */
function MobileLink({ link, pathname, onClick, className = '' }: { link: NavLink; pathname: string; onClick: () => void; className?: string }) {
  const active = isNavActive(pathname, link.prefixes);
  return (
    <Link
      href={link.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`block text-ui py-2.5 px-3 rounded-control border-r-2 transition-colors ${
        active
          ? 'bg-accent-wash text-accent-ink font-medium border-accent'
          : 'text-ink-2 border-transparent hover:bg-surface-2'
      } ${className}`}
    >
      {link.label}
    </Link>
  );
}

/** aiEnabled מגיע מ-layout: דגל שרת שמאפשר לכבות את פיצ'רי ה-AI */
export default function SiteHeader({ aiEnabled = true }: { aiEnabled?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close mobile menu on route change
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  if (pathname === '/login') return null;

  /*
    בעמוד הבית ההירו מחליף את הכותרת: הלוגו והחיפוש יושבים בו, והמספרים
    מקבלים פילטר תקופה משלהם. לכן בדסקטופ הכותרת לא מוצגת שם בכלל,
    ובטלפון, שבו הסיידבר מוסתר, היא נשארת רק בשביל הלוגו וכפתור התפריט.
  */
  const isHome = pathname === '/';

  return (
    <header
      className={`sticky top-0 z-30 w-full bg-paper/90 backdrop-blur border-b border-line ${isHome ? 'md:hidden' : ''}`}
      dir="rtl"
    >
      <div className="px-4 h-11 flex items-center gap-4">
        {/* Logo — mobile only (desktop shows in sidebar) */}
        <Link
          href="/"
          className="md:hidden flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
          aria-label="אפרכסת לכנסת — דף הבית"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, אין מה לאופטם */}
          <img
            src="/logo-wordmark.svg"
            alt=""
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex-1" />
        {!isHome && <PeriodSelector />}
        {!isHome && <UnifiedSearch aiEnabled={aiEnabled} size="bar" className="w-36 sm:w-60 md:w-72" />}
        {/* Hamburger button — mobile only */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-control hover:bg-surface-2 transition-colors shrink-0"
          aria-label={menuOpen ? 'סגור תפריט' : 'פתח תפריט'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? (
            <svg className="w-5 h-5 text-ink-2" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l12 12M16 4L4 16"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-ink-2" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14"/>
            </svg>
          )}
        </button>
      </div>

      {/*
        תפריט מובייל, מוזן מאותו מקור כמו הסיידבר: ראשי, הקבוצות,
        ו"חדשים במשכן?". "שאל AI" ירד מכאן ומהסיידבר: תיבת החיפוש מכסה אותו.
      */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-line bg-surface"
          dir="rtl"
        >
          <nav className="px-4 py-3 flex flex-col gap-4" aria-label="ניווט ראשי">
            <MobileLink link={HOME_LINK} pathname={pathname} onClick={closeMenu} />
            {NAV_GROUPS.map(({ group, links }) => (
              <div key={group}>
                <p className="text-ui font-bold text-ink px-3 mb-1.5">{group}</p>
                {links.map(link => (
                  <MobileLink key={link.href} link={link} pathname={pathname} onClick={closeMenu} />
                ))}
              </div>
            ))}
            <div className="border-t border-line-soft pt-3">
              <MobileLink link={FOOTER_LINK} pathname={pathname} onClick={closeMenu} />
            </div>
          </nav>
        </div>
      )}

    </header>
  );
}
