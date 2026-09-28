/**
 * "הציון הוא שקלול של כל מה שבחרת."
 *
 * הציון הסופי הוא ממוצע על כל הסוגיות שנבחרו, ולכן בחירה רחבה מדללת:
 * מי שחזק מאוד בנושא אחד מתוך שישה יקבל ציון בינוני, ומהתוצאה אי אפשר
 * לדעת אם הוא בינוני בכולם או מצוין באחד.
 *
 * ההודעה יושבת בכל מקום שבו בוחרים — עמוד הבית, שלב התחומים ושלב
 * הנושאים — ולא בתוצאות. בתוצאות כבר אי אפשר לפעול לפיה.
 *
 * הניסוח נמנע מפועל בגוף שני, כי בעברית הוא מחייב לבחור מין: "שתבחרי"
 * או "שתבחר". מקור עקיף — "שנבחרו", "אפשר לבחור" — פונה לכולם.
 * כינויי שייכות כמו "לך" ו"לבך" נכתבים ממילא זהה בשני המינים.
 *
 * שתי צורות, אותו טקסט: box היא התיבה הזהובה של השאלון, plain היא
 * הערת שוליים עם אייקון מידע, לעמוד הבית שבו התיבה הייתה כבדה מדי
 * ליד רשימת התחומים.
 */
const TEXT = (
  <>
    הציון של כל ח&quot;כ הוא ממוצע על כל הנושאים שנבחרו. אם יש נושא שחשוב
    לך יותר מהאחרים - כדאי לבחור אותו לבדו, אחרת ח&quot;כ שחזק דווקא בו
    יקבל ציון בינוני בגלל הנושאים האחרים.
  </>
);

export function WeightingNotice({
  className = '',
  variant = 'box',
}: {
  className?: string;
  variant?: 'box' | 'plain';
}) {
  if (variant === 'plain') {
    return (
      <div className={className}>
        <p className="flex items-center gap-2 text-ui font-medium text-mute">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8V12" />
            <path d="M12 16H12.01" />
          </svg>
          לתשומת לבך
        </p>
        <p className="mt-2 text-label leading-relaxed text-mute">{TEXT}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-card border border-accent-lit bg-accent-wash px-4 py-3 ${className}`}>
      <p className="text-ui text-ink-2 leading-relaxed">
        <strong className="text-ink font-semibold">לתשומת לבך:</strong>{' '}
        {TEXT}
      </p>
    </div>
  );
}
