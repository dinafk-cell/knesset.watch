/**
 * מקור האמת היחיד לניווט האתר.
 *
 * לפני זה היו שלוש רשימות נפרדות שלא הסכימו ביניהן (סיידבר, כותרת
 * מובייל, ומגירה בתוך /mks), וחלק מהעמודים היו נגישים בדסקטופ בלבד.
 *
 * המבנה לפי הצעת העיצוב (ספטמבר 2026):
 *
 *   ראשי
 *   אנשים          ח"כים, שרים
 *   עבודת הכנסת    חוקים, הצבעות, ועדות, פרוטוקולים
 *   ניתוחים וכלים  מי עובדים בשבילך?, רשת קשרים
 *   חדשים במשכן?   (בתחתית, קטן)
 *
 * ירדו מהרשימה, לא מהאתר: /pulse, /track-record, /agendas, /ask.
 * העמודים חיים ומקושרים ממקומות אחרים, רק בלי פריט בניווט:
 *   - חקיקה אחרונה וחוקים שעברו יושבים תחת "חוקים".
 *   - מעקב חקיקה הוא תצוגה של מה שעמוד הח"כ כבר מציג.
 *   - קטלוג האג'נדות מגיע מהשאלון ומעמוד ה-AI. שני פריטים שכנים
 *     שמדברים על אג'נדות מייצרים את השאלה "מה ההבדל?".
 *   - ה-AI מגיע מתיבת החיפוש, שיש בה שורה "שאלו את ה-AI".
 */

export interface NavLink {
  href: string;
  label: string;
  /** קידומות מסלול שמדליקות את המצב הפעיל */
  prefixes: string[];
}

export interface NavGroup {
  group: string;
  links: NavLink[];
}

/** עמוד הבית. עד עכשיו הדרך היחידה לחזור אליו הייתה הלוגו, ורוב המשתמשים לא יודעים את זה. */
export const HOME_LINK: NavLink = { href: '/', label: 'ראשי', prefixes: ['/'] };

export const NAV_GROUPS: NavGroup[] = [
  {
    group: 'אנשים',
    links: [
      { href: '/mks',       label: 'ח"כים', prefixes: ['/mks', '/mk/'] },
      { href: '/ministers', label: 'שרים',   prefixes: ['/ministers', '/office/', '/ministry/'] },
    ],
  },
  {
    group: 'עבודת הכנסת',
    links: [
      { href: '/bills',      label: 'חוקים',       prefixes: ['/bills', '/bill/', '/pulse'] },
      { href: '/votes',      label: 'הצבעות',     prefixes: ['/votes', '/vote/'] },
      { href: '/committees', label: 'ועדות',       prefixes: ['/committees', '/committee/', '/faction/'] },
      { href: '/protocols',  label: 'פרוטוקולים',  prefixes: ['/protocols', '/session/'] },
    ],
  },
  {
    group: 'ניתוחים וכלים',
    links: [
      /* הפיצ'ר של הבחירות. עד עכשיו לא הופיע בניווט בכלל, רק בעמוד הבית. */
      { href: '/agenda-keywords', label: 'מי עובדים בשבילך?', prefixes: ['/agenda-keywords', '/agenda-match', '/agendas', '/agenda/'] },
      // תצוגה של /mks, לא מסלול. prefixes ריק כדי שלא יסומן כפעיל בכל עמוד.
      { href: '/mks?groupBy=alliances', label: 'רשת קשרים', prefixes: [] },
    ],
  },
];

/**
 * "חדשים במשכן?": ההסברים למי שחדש באתר או בכנסת. בינתיים מוביל לעמוד
 * "הידעת?" הקיים; העמוד המלא (על הכנסת + על הנתונים) הוא שלב ב'.
 */
export const FOOTER_LINK: NavLink = { href: '/did-you-know', label: 'חדשים במשכן?', prefixes: ['/did-you-know'] };

/** כל היעדים בשורה אחת — לבדיקות ולמקומות שלא צריכים קיבוץ */
export const ALL_NAV_LINKS: NavLink[] = [
  HOME_LINK,
  ...NAV_GROUPS.flatMap(g => g.links),
  FOOTER_LINK,
];

export function isNavActive(pathname: string, prefixes: string[]): boolean {
  // '/' הוא קידומת של כל מסלול, ולכן "ראשי" נבדק בהתאמה מלאה בלבד
  return prefixes.some(p => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p)));
}
