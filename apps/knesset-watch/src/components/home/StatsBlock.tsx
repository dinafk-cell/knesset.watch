'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { PERIOD_SHORTCUTS, periodLabel, type Period } from '@/lib/period-context';
import { Sparkline } from '@/components/Sparkline';

/*
  "הכנסת במספרים": חמישה כרטיסים ופילטר תקופה משלהם.

  הפילטר כאן מקומי, ולא הפילטר הגלובלי מהכותרת. הגלובלי נראה כמו
  בחירת כנסת, נזכר בין ביקורים בלי שום סימן, ומשפיע רק על חלק
  מהעמודים. פילטר שיושב על הבלוק משנה בדיוק את מה שלידו, וזה כל
  מה שהוא מבטיח.
*/

export interface HomeStats {
  mks: number;
  committees: number;
  sessions: number;
  billsPassed: number;
  billsTotal: number;
  votes: number;
  trends?: { votes: number[]; billsPassed: number[]; sessions: number[] };
}

/** הגרפים כאן גדולים מברירת המחדל של Sparkline: 18 חודשים ב-160 פיקסל, לפי העיצוב */
const SPARK = { bar: 6, gap: 3, height: 44 };

/** "כנסת 25" בקיצורים, אבל בכפתור זה נקרא כשם של כנסת. כאן זה תקופה. */
function buttonLabel(period: Period): string {
  return period === 'all' ? 'הכנסת ה-25' : periodLabel(period);
}

function PeriodFilter({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-ui font-semibold text-ink hover:border-accent transition-colors"
      >
        <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" />
        </svg>
        <span className="whitespace-nowrap">{buttonLabel(period)}</span>
        <svg className={`w-3.5 h-3.5 text-mute transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="תקופה"
          className="absolute top-full left-0 mt-1 w-44 bg-surface border border-line rounded-card shadow-lg overflow-hidden z-20"
        >
          {PERIOD_SHORTCUTS.map(p => {
            const active = p.value === period;
            return (
              <li key={p.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { onChange(p.value); setOpen(false); }}
                  className={`w-full text-right px-3 py-2 text-ui transition-colors ${
                    active ? 'bg-accent-wash text-accent-ink font-medium' : 'text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {buttonLabel(p.value)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** כרטיס אחד. כל כרטיס הוא קישור למקום שבו אפשר לבדוק את המספר. */
function Card({ href, className = '', children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex flex-col rounded-card bg-surface p-4 transition-colors hover:bg-surface-2 ${className}`}
    >
      {children}
    </Link>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-label font-medium text-mute">{children}</span>;
}

function Big({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-3xl font-display font-bold leading-tight text-ink ${className}`} data-numeric>
      {children}
    </span>
  );
}

export function StatsBlock({
  stats,
  period,
  onPeriodChange,
  error,
  onRetry,
}: {
  stats: HomeStats | null;
  period: Period;
  onPeriodChange: (p: Period) => void;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="numbers-heading">
      {/* בטלפון הכותרת והפילטר נערמים; במסך רחב הם באותה שורה */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6">
        <h2 id="numbers-heading" className="text-page">הכנסת במספרים</h2>
        <PeriodFilter period={period} onChange={onPeriodChange} />
      </div>

      {error && (
        <div role="alert" className="rounded-card border border-fail/30 bg-fail-wash px-4 py-3 mb-4">
          <p className="text-ui text-ink">לא הצלחנו לטעון את נתוני הכנסת כרגע.</p>
          <button type="button" onClick={onRetry} className="text-ui font-medium text-accent underline mt-1">
            לנסות שוב
          </button>
        </div>
      )}

      {/* עד שהנתונים מגיעים: שלדים באותו גודל, כדי שהעמוד לא יקפוץ */}
      {!stats && !error && (
        <div className="grid gap-4 md:grid-cols-4 animate-pulse" aria-hidden="true">
          <div className="h-[190px] rounded-card bg-surface-2" />
          <div className="h-[190px] rounded-card bg-surface-2" />
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="h-[87px] rounded-card bg-surface-2" />
            <div className="h-[87px] rounded-card bg-surface-2" />
            <div className="col-span-2 h-[87px] rounded-card bg-surface-2" />
          </div>
        </div>
      )}

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {/* מימין: הצבעות. המספר שהכי מסמן פעילות. */}
          <Card href="/votes" className="min-h-[190px]">
            <Label>הצבעות במליאה</Label>
            <Big className="mt-1">{stats.votes.toLocaleString()}</Big>
            {stats.trends?.votes && (
              <span className="mt-auto pt-3 text-mute">
                <Sparkline values={stats.trends.votes} label="הצבעות" {...SPARK} />
              </span>
            )}
          </Card>

          {/* חוקים שעברו, מול כל ההצעות. הירוק שמור למה שעבר. */}
          <Card href="/bills?passedOnly=true" className="min-h-[190px]">
            <Label>חוקים חדשים</Label>
            <span className="mt-1 flex items-baseline gap-2 flex-wrap">
              <Big className="text-pass">{stats.billsPassed.toLocaleString()}</Big>
              {stats.billsTotal > 0 && (
                <span className="text-label text-mute" data-numeric>/ {stats.billsTotal.toLocaleString()} הצעות</span>
              )}
            </span>
            {stats.trends?.billsPassed && (
              <span className="mt-auto pt-3 text-pass">
                <Sparkline values={stats.trends.billsPassed} label="חוקים שעברו" {...SPARK} />
              </span>
            )}
          </Card>

          {/* משמאל: שלושה כרטיסים קטנים, הישיבות עם הגרף שלהן */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <Card href="/committees">
              <Label>ועדות פעילות</Label>
              <Big className="mt-1">{stats.committees.toLocaleString()}</Big>
            </Card>
            {/*
              123 ולא 120: המספר מגיע מדגל is_current, וכולל ח"כים שנכנסו
              במקום שרים שהתפטרו לפי החוק הנורווגי. ההסבר המלא ב-/did-you-know.
            */}
            <Card href="/mks">
              <Label>חברי כנסת</Label>
              <Big className="mt-1">{stats.mks.toLocaleString()}</Big>
            </Card>
            {/* הגרף צמוד לישיבות, כי הסדרה סופרת ישיבות, לא ועדות */}
            <Card href="/committees" className="col-span-2 flex-row items-center justify-between gap-4">
              <span className="flex flex-col">
                <Label>ישיבות בועדות</Label>
                <Big className="mt-1">{stats.sessions.toLocaleString()}</Big>
              </span>
              {stats.trends?.sessions && (
                <span className="text-mute">
                  <Sparkline values={stats.trends.sessions} label="ישיבות ועדה" {...SPARK} />
                </span>
              )}
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
