'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePeriod, periodToDateRange } from '@/lib/period-context';
import { CLUSTER_TOPICS } from '@/lib/axis-clusters';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** כמה תחומים נבחרים כאן. זהה ל-MAX_TOPICS ב-/agenda-keywords */
const HOME_DOMAIN_PICKS = 3;

/**
 * שמונת נושאי-העל של הטקסונומיה הקנונית.
 *
 * הוחלפו מ-DOMAINS של agendas.ts: אלה נכתבו ידנית מראש, ואלה נגזרו
 * מ-7,067 הצעות חוק. הבחירה כאן ממשיכה ל-/agenda-keywords, שמציג את
 * הנושאים שבתוך התחום לפני שהוא שואל — כדי שלא ייבחרו שאלות במקום
 * המשתמשת, כפי שקרה במסלול הקודם.
 */
const PICKABLE_DOMAINS = CLUSTER_TOPICS;

interface Stats {
  mks: number;
  committees: number;
  sessions: number;
  billsPassed: number;
  billsTotal: number;
  votes: number;
}

function relativeDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'אתמול';
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
  if (diffDays < 365) return `לפני ${Math.floor(diffDays / 30)} חודשים`;
  return `לפני ${Math.floor(diffDays / 365)} שנים`;
}

interface RecentBill {
  id: number;
  title: string;
  date: string | null;
  macroAgenda: string | null;
}

const SECTIONS = [
  { label: 'ח"כים', sublabel: 'חברי הכנסת ה-25', href: '/mks' },
  { label: 'ועדות', sublabel: 'דיונים ופרוטוקולים', href: '/committees' },
  { label: 'חוקים', sublabel: 'הצעות חוק ומעקב', href: '/bills' },
  { label: 'פרוטוקולים', sublabel: 'חיפוש בתוך הדיונים', href: '/protocols' },
  { label: 'שרים', sublabel: 'חברי הממשלה', href: '/ministers' },
  { label: 'הצבעות', sublabel: 'הצבעות מליאה', href: '/votes' },
];

/** aiEnabled מגיע מ-page: דגל שרת שמאפשר לכבות את פיצ׳רי ה-AI */
export default function HomepageClient({ aiEnabled = true }: { aiEnabled?: boolean }) {
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBills, setRecentBills] = useState<RecentBill[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [homeDomains, setHomeDomains] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { period } = usePeriod();

  function toggleHomeDomain(id: string) {
    setHomeDomains(prev => {
      if (prev.includes(id)) return prev.filter(d => d !== id);
      if (prev.length >= HOME_DOMAIN_PICKS) return prev;
      return [...prev, id];
    });
  }

  /** התחומים עוברים ב-query string, והשאלון פותח ישר בשלב העמדות */
  function startQuestionnaire() {
    if (homeDomains.length === 0) return;
    router.push(`/agenda-keywords?topics=${homeDomains.join(',')}`);
  }

  const fetchData = useCallback(async () => {
    const dateRange = periodToDateRange(period);
    const params = new URLSearchParams();
    if (dateRange) { params.set('from', dateRange.from); params.set('to', dateRange.to); }
    const qs = params.toString() ? `?${params}` : '';
    /*
      קודם היה כאן .catch(() => {}) על שתי הקריאות: כשל בשרת נבלע בשקט
      והמשתמשת ראתה דף חסר בלי שום הסבר.
    */
    Promise.all([
      fetch(`${BASE_PATH}/api/homepage-stats${qs}`)
        .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(setStats),
      fetch(`${BASE_PATH}/api/pulse${qs}`)
        .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(d => setRecentBills(d.bills?.slice(0, 6) ?? [])),
    ])
      .then(() => setLoadError(false))
      .catch(() => setLoadError(true));
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2) router.push(`/ask?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/*
        ה-hero כהה. זה מה שנותן לעמוד נקודת פתיחה במקום דף לבן שמתחיל
        בכותרת, וזה גם מה שמאפשר להשתמש בזהב כטקסט — על הנייבי הוא 6.8:1,
        על רקע בהיר הוא 2.6:1 ואסור בכל גודל.
      */}
      <div className="bg-navy-deep" data-surface="dark">
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
          <h1 className="text-page sm:text-5xl text-white mb-3">אפרכסת לכנסת</h1>
          <p className="text-body text-navy-soft mb-10 max-w-xl mx-auto">
            שקיפות נתוני הכנסת ה-25 — הצבעות, פרוטוקולים, חוקים, ח&quot;כים וועדות במקום אחד.
          </p>

          {aiEnabled && (
          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-xl mx-auto">
            <div className="flex-1 flex items-center border border-white/20 rounded-control px-4 py-3 bg-white/10 focus-within:border-accent-lit transition-colors">
              <svg className="w-4 h-4 text-navy-mute shrink-0 ml-2" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="4.5"/><path d="m10 10 4 4"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="שאלו שאלה על פעילות הכנסת..."
                aria-label="חיפוש בפעילות הכנסת"
                className="flex-1 bg-transparent text-ui text-white placeholder:text-navy-mute"
                dir="rtl"
              />
            </div>
            <button
              type="submit"
              disabled={query.trim().length < 2}
              className="px-5 py-3 rounded-control bg-accent-lit text-navy-deep text-ui font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface transition-colors shrink-0"
            >
              שאל
            </button>
          </form>
          )}
        </div>
      </div>

      {loadError && (
        <div className="max-w-3xl mx-auto px-6 mt-10">
          <div role="alert" className="rounded-card border border-fail/30 bg-fail-wash px-4 py-3">
            <p className="text-ui text-ink">לא הצלחנו לטעון את נתוני הכנסת כרגע.</p>
            <button onClick={fetchData} className="text-ui font-medium text-accent underline mt-1">
              נסי לטעון שוב
            </button>
          </div>
        </div>
      )}

      {/* המספרים. כל אחד הוא קישור למקום שבו אפשר לבדוק אותו. */}
      {stats && (
        <div className="max-w-3xl mx-auto px-6 mt-12 mb-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/mks', n: stats.mks.toLocaleString(), label: 'ח"כים' },
              { href: '/committees', n: stats.committees.toLocaleString(), label: 'ועדות',
                sub: `${stats.sessions.toLocaleString()} ישיבות` },
              { href: '/bills?passedOnly=true', n: stats.billsPassed.toLocaleString(), label: 'חוקים עברו',
                sub: stats.billsTotal > 0 ? `מתוך ${stats.billsTotal.toLocaleString()} הצ"ח` : undefined },
              { href: '/votes', n: stats.votes?.toLocaleString() ?? '—', label: 'הצבעות מליאה' },
            ].map(c => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-card border border-line bg-surface p-5 text-center transition-colors hover:border-accent-lit hover:bg-surface-2"
              >
                <div className="text-3xl font-sans font-bold text-ink" data-numeric>{c.n}</div>
                <div className="text-meta font-medium text-ink-2 mt-1">{c.label}</div>
                {c.sub && <div className="text-meta text-mute mt-0.5">{c.sub}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* שאלון ההתאמה — השלב הראשון יושב כאן, והמשכו ב-/agenda-keywords */}
      <div className="max-w-3xl mx-auto px-6 mb-14">
        <div className="rounded-card border border-accent-lit bg-accent-wash p-6">
          <p className="text-meta font-medium text-accent-ink mb-1">מי עובד בשבילך</p>
          <h2 className="text-section mb-1">בחרי עד שלושה תחומים שחשובים לך</h2>
          <p className="text-ui text-ink-2 mb-4">
            נשאל אותך מה העמדה שלך בכל נושא, ונדרג את חברי הכנסת לפי מידת הפעילות שלהם —
            הצעות חוק שיזמו והצבעות שתמכו בהן.
          </p>

          <div className="flex flex-wrap gap-2" role="group" aria-label="בחירת תחומים">
            {PICKABLE_DOMAINS.map(d => {
              const selected = homeDomains.includes(d.id);
              const full = homeDomains.length >= HOME_DOMAIN_PICKS && !selected;
              return (
                <button
                  key={d.id}
                  onClick={() => toggleHomeDomain(d.id)}
                  disabled={full}
                  aria-pressed={selected}
                  className={`text-label font-medium px-3 py-2 rounded-control border transition-colors ${
                    selected
                      ? 'border-accent bg-accent text-white'
                      : full
                        ? 'border-line bg-surface text-mute opacity-50 cursor-not-allowed'
                        : 'border-line bg-surface text-ink-2 hover:border-accent hover:text-ink'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            {/*
              הכפתור הראשי נייבי ולא זהב. בעיצוב המקורי הוא היה זהב על קלף,
              1.58:1 — הפעולה הראשית בעמוד הייתה הדבר הכי קשה לקריאה בו.
            */}
            <button
              onClick={startQuestionnaire}
              disabled={homeDomains.length === 0}
              className="px-5 py-2.5 rounded-control bg-navy-deep text-white font-medium text-ui disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy transition-colors"
            >
              המשך לשאלון
            </button>
            <span className="text-label text-ink-2">
              {homeDomains.length > 0
                ? `נבחרו ${homeDomains.length} מתוך ${HOME_DOMAIN_PICKS}`
                : `בחרי עד ${HOME_DOMAIN_PICKS} תחומים כדי להתחיל`}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mb-14">
        <Link
          href="/did-you-know"
          className="flex items-baseline justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4 transition-colors hover:border-accent-lit"
        >
          <span>
            <span className="text-section block">הידעת?</span>
            <span className="text-ui text-mute">מה הנתונים באתר אומרים — ומה הם לא</span>
          </span>
          <span className="text-ui text-accent shrink-0" aria-hidden="true">←</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 mb-14">
        <h2 className="label-he mb-3">מקטעים</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-card border border-line bg-surface p-5 transition-colors hover:border-accent-lit hover:bg-surface-2 group"
            >
              <div className="text-ui font-medium text-ink group-hover:text-accent transition-colors">{s.label}</div>
              <div className="text-meta text-mute mt-0.5">{s.sublabel}</div>
            </Link>
          ))}
        </div>
      </div>

      {recentBills.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="label-he">חוקים שעברו לאחרונה</h2>
            <Link href="/bills?passedOnly=true" className="text-meta font-medium text-accent hover:underline">
              כל החוקים ←
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {recentBills.map(b => (
              <Link
                key={b.id}
                href={`/bill/${b.id}`}
                className="flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 transition-colors hover:border-accent-lit"
              >
                <span className="shrink-0 text-meta font-medium bg-pass-wash text-pass px-2 py-0.5 rounded-control mt-0.5">עבר</span>
                <div className="flex-1 min-w-0">
                  <div className="font-content text-ui font-bold text-ink leading-snug line-clamp-2">{b.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {b.date && <span className="text-meta text-mute">{relativeDate(b.date)}</span>}
                    {b.macroAgenda && (
                      <span className="text-meta text-accent-ink bg-accent-wash px-1.5 py-0.5 rounded-control">{b.macroAgenda}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
