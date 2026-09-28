'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS, HOME_LINK, FOOTER_LINK, isNavActive, type NavLink } from '@/lib/nav';

/*
  הסיידבר, לפי הצעת העיצוב: בהיר, על אותו קלף כמו העמוד, בלי קו מפריד.
  ההפרדה מהתוכן עוברת דרך רווח ולא דרך צבע. הפריט הפעיל מסומן בפס נייבי
  בצד ימין ובמשקל, לא בצבע בלבד.

  הלוגו מופיע רק בעמודים הפנימיים: בעמוד הבית הוא יושב בהירו, ושני
  לוגואים באותו מסך זה אחד יותר מדי. כשהפס העליון (לוגו + חיפוש) יעלה
  לכל העמודים, הלוגו יעבור אליו וירד מכאן.

  "שאל AI" ירד: תיבת החיפוש מכסה אותו, בעמוד הבית ובכותרת.
*/

function SideLink({ link, pathname, className = '' }: { link: NavLink; pathname: string; className?: string }) {
  const active = isNavActive(pathname, link.prefixes);
  return (
    <Link
      href={link.href}
      aria-current={active ? 'page' : undefined}
      className={`block leading-tight transition-colors ${
        active
          ? 'border-r-4 border-navy pr-[15px] font-bold text-ink'
          : 'text-ink hover:text-accent'
      } ${className}`}
    >
      {link.label}
    </Link>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  const isHome = pathname === '/';

  return (
    <aside
      className="hidden md:flex flex-col gap-10 w-56 shrink-0 sticky top-0 h-screen overflow-y-auto px-10 py-10"
      dir="rtl"
    >
      {!isHome && (
        <Link
          href="/"
          className="block hover:opacity-70 transition-opacity"
          aria-label="אפרכסת לכנסת - דף הבית"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, אין מה לאופטם */}
          <img src="/logo-wordmark.svg" alt="" className="h-7 w-auto" />
        </Link>
      )}

      <nav className="flex-1 flex flex-col gap-10 text-body" aria-label="ניווט ראשי">
        <SideLink link={HOME_LINK} pathname={pathname} />
        {NAV_GROUPS.map(({ group, links }) => (
          <div key={group} className="flex flex-col gap-5">
            {/* לעברית אין אותיות רישיות; הכותרת מסומנת במשקל, לא ב-tracking */}
            <p className="font-bold text-ink">{group}</p>
            {links.map(link => (
              <SideLink key={link.href} link={link} pathname={pathname} />
            ))}
          </div>
        ))}
      </nav>

      <SideLink
        link={FOOTER_LINK}
        pathname={pathname}
        className="text-ui underline decoration-dotted underline-offset-4"
      />
    </aside>
  );
}
