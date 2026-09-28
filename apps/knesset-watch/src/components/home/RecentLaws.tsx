import Link from 'next/link';

/*
  "חוקים שעברו לאחרונה": שישה החוקים האחרונים שפורסמו ברשומות.

  התאריך היחסי ("לפני 6 חודשים") נשאר בכוונה, גם כשהוא חושף שהנתונים
  לא עודכנו זמן מה. עדיף שהמבקר יראה את זה מאשר שהאתר יסתיר.
*/

export interface RecentBill {
  id: number;
  title: string;
  date: string | null;
  macroAgenda: string | null;
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

export function RecentLaws({ bills }: { bills: RecentBill[] }) {
  if (bills.length === 0) return null;

  return (
    <section aria-labelledby="recent-laws-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-6">
        <h2 id="recent-laws-heading" className="text-page">חוקים שעברו לאחרונה</h2>
        <Link
          href="/bills?passedOnly=true"
          className="inline-flex items-center gap-2 text-ui text-ink-2 hover:text-accent transition-colors"
        >
          לכל החוקים שנכנסו לספר החוקים בכנסת הנוכחית
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 15.8333L4.16667 10L10 4.16667" />
            <path d="M15.8333 10H4.16667" />
          </svg>
        </Link>
      </div>

      <ul className="flex flex-col gap-1.5">
        {bills.map(b => (
          <li key={b.id}>
            <Link
              href={`/bill/${b.id}`}
              className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface px-4 py-3 transition-colors hover:border-accent-lit"
            >
              <span className="text-ui font-medium text-ink leading-snug">{b.title}</span>
              {b.date && (
                <time dateTime={b.date} className="shrink-0 text-meta text-mute">{relativeDate(b.date)}</time>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
