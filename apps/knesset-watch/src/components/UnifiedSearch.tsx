'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';

/*
  תיבת חיפוש אחת לכל סוגי הקלט.

  לפני זה היו שני מנועים שנראו זהים מבחוץ: חיפוש ישויות בכותרת
  (/api/search) ועמוד "שאל AI" נפרד. מי שהקליד שאלה בחיפוש קיבל
  "לא נמצאו תוצאות", ומי שהקליד שם של ח"כ בעמוד ה-AI קיבל תשובה
  ארוכה במקום קישור. כאן שני המסלולים חיים בתיבה אחת: תוצאות
  מיידיות תוך כדי הקלדה, ושורה אחרונה "שאלו את ה-AI" למי שבאמת
  שאל שאלה.

  כשה-AI כבוי (AI_FEATURES_ENABLED=false) התיבה היא חיפוש רגיל בלבד:
  בלי שורת ה-AI, ועם פלייסהולדר שלא מבטיח שאלות.
*/

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

interface SearchHit {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
}

const TYPE_LABEL: Record<string, string> = {
  mk: 'ח"כ',
  committee: 'ועדה',
  bill: 'חוק',
  session: 'ישיבה',
  vote: 'הצבעה',
  minister: 'שר',
  protocol: 'פרוטוקול',
  query: 'שאילתה',
};

/**
 * Enter על טקסט: שאלה הולכת ל-AI, שם הולך לתוצאות החיפוש.
 * שאלה היא מה שנגמר בסימן שאלה או ארוך מארבע מילים. שם של ח"כ או
 * של חוק כמעט תמיד קצר מזה. ההיוריסטיקה לא מושלמת, ולכן שורת ה-AI
 * ברשימה תמיד זמינה גם למי שהיא טעתה לגביו.
 */
function looksLikeQuestion(q: string): boolean {
  return q.endsWith('?') || q.split(/\s+/).length >= 4;
}

export function UnifiedSearch({
  aiEnabled,
  size = 'bar',
  className = '',
}: {
  aiEnabled: boolean;
  /** hero: התיבה הגדולה בעמוד הבית. bar: הגרסה הדקה לכותרת. */
  size?: 'hero' | 'bar';
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const router = useRouter();

  const q = query.trim();
  const canSubmit = q.length >= 2;

  // תוצאות מיידיות, עם השהיה של רבע שנייה כדי לא לירות בקשה על כל תו.
  // גם הניקוי כשהטקסט קצר מדי עובר דרך הטיימר: עדכון state ישירות
  // בגוף האפקט מייצר רינדור נוסף מיותר, וה-lint של React אוסר את זה.
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (q.length < 2) { setResults([]); setOpen(false); return; }
      setLoading(true);
      try {
        const res = await fetch(`${BASE_PATH}/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json() as { results: SearchHit[] };
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, q.length < 2 ? 0 : 250);
    return () => clearTimeout(timer);
  }, [q]);

  // לחיצה מחוץ לתיבה סוגרת את הרשימה
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function go(url: string) {
    setOpen(false);
    setQuery('');
    router.push(url);
  }

  const askUrl = `/ask?q=${encodeURIComponent(q)}`;
  const searchUrl = `/search?q=${encodeURIComponent(q)}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    go(aiEnabled && looksLikeQuestion(q) ? askUrl : searchUrl);
  }

  const hero = size === 'hero';
  const placeholder = aiEnabled
    ? 'חפשו ח"כ, חוק, ועדה או שאלו את האפרכסת שאלה חופשית...'
    : 'חיפוש ח"כ, חוק או ועדה...';

  return (
    <div ref={containerRef} className={`relative ${className}`} dir="rtl">
      <form
        onSubmit={submit}
        className={`flex items-center bg-surface border border-line transition-colors focus-within:border-accent ${
          hero ? 'h-14 md:h-16 rounded-full px-5 md:px-6 shadow-md gap-3' : 'h-9 rounded-control px-2.5 gap-2'
        }`}
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } }}
          placeholder={placeholder}
          aria-label="חיפוש באתר"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className={`flex-1 min-w-0 bg-transparent text-ink placeholder:text-mute ${hero ? 'text-body' : 'text-meta font-medium placeholder:font-normal'}`}
        />
        {loading ? (
          <svg className={`${hero ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-mute animate-spin shrink-0`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="חיפוש"
            className={`shrink-0 flex items-center justify-center rounded-full text-mute hover:text-ink disabled:hover:text-mute transition-colors ${hero ? 'w-9 h-9' : 'w-6 h-6'}`}
          >
            <svg className={hero ? 'w-6 h-6' : 'w-3.5 h-3.5'} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5" />
              <path d="m10 10 4 4" />
            </svg>
          </button>
        )}
      </form>

      {open && q.length >= 2 && (
        <div
          id={listId}
          className={`absolute top-full mt-2 right-0 left-0 bg-surface border border-line rounded-card shadow-lg overflow-hidden z-50 ${hero ? '' : 'min-w-72'}`}
        >
          {results.slice(0, 8).map(hit => (
            <button
              key={`${hit.type}-${hit.id}`}
              type="button"
              onClick={() => go(hit.url)}
              className="w-full text-right flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors"
            >
              <span className="text-meta font-medium text-mute w-12 shrink-0 text-center">
                {TYPE_LABEL[hit.type] ?? hit.type}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-ui font-medium text-ink truncate">{hit.title}</span>
                {hit.subtitle && <span className="block text-meta text-mute truncate">{hit.subtitle}</span>}
              </span>
            </button>
          ))}

          {results.length === 0 && !loading && (
            <p className="px-4 py-3 text-meta text-mute">לא נמצאו ח&quot;כים, חוקים או ועדות בשם הזה.</p>
          )}

          {/* השורות הקבועות: כל התוצאות, ושאלה ל-AI כשהוא דלוק */}
          <div className="border-t border-line-soft">
            {results.length > 0 && (
              <button
                type="button"
                onClick={() => go(searchUrl)}
                className="w-full text-right px-4 py-2.5 text-meta font-medium text-accent hover:bg-surface-2 transition-colors"
              >
                כל התוצאות ←
              </button>
            )}
            {aiEnabled && (
              <button
                type="button"
                onClick={() => go(askUrl)}
                className="w-full text-right flex items-center gap-2 px-4 py-2.5 text-ui font-medium text-accent-ink bg-accent-wash hover:bg-surface-2 transition-colors"
              >
                <span aria-hidden="true">✦</span>
                <span className="min-w-0 truncate">שאלו את ה-AI: &quot;{q}&quot;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
