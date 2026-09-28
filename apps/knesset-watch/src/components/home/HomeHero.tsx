'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UnifiedSearch } from '@/components/UnifiedSearch';

/*
  ההירו של עמוד הבית: איור, לוגו, מה האתר עושה, ותיבת החיפוש המאוחדת.

  קודם עמד כאן בלוק כהה עם שם האתר בגדול. השם כבר יושב בלוגו שלידו,
  ותת-הכותרת ("כל הנתונים במקום אחד") לא אמרה למבקר מה לעשות. עכשיו
  המקום הכי בולט בעמוד עונה על שתי שאלות: מה זה, ומה מקלידים.

  האיור יושב מאחורי הכול ב-object-cover, מעוגן לשמאל כדי שהבניין
  יישאר רחוק מעמודת הטקסט שבצד ימין גם כשהמסך מתקצר. בתחתית יש
  דעיכה לרקע העמוד, כמו בעיצוב.
*/

/**
 * דוגמאות לשאלות. תיבה ריקה לא מלמדת מה מותר לשאול.
 * הדוגמאות לפי נושא ולא לפי שם של פוליטיקאי: באתר שרוצה להיתפס
 * כלא-מפלגתי, שאלה על אדם ספציפי כברירת מחדל נראית כמו הכוונה.
 */
const EXAMPLE_QUESTIONS = [
  'אילו חוקים עברו בתמיכת האופוזיציה?',
  'במה דנה ועדת הכספים לאחרונה?',
  'מהם החוקים שעברו בתחום החינוך?',
  'מהן ההצבעות הצמודות ביותר השנה?',
  'כיצד הצביעו הסיעות בנושא שכר המינימום?',
  'אילו הצעות חוק הוגשו בנושא הביטחון השנה?',
];

export function HomeHero({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden min-h-[440px] md:min-h-[540px]" aria-label="פתיחה">
      {/* הרקע: האיור + דעיכה לקלף. aria-hidden כי הוא קישוט, לא מידע. */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/hero-knesset.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-left opacity-80"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent from-30% to-paper" />
      </div>

      <div className="relative mx-auto max-w-[900px] px-6 pb-12 md:pb-16 flex flex-col">
        {/* הלוגו תלוי מהקצה העליון, כמו בעיצוב */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-b-3xl bg-surface px-5 py-3 md:px-7 md:py-4 shadow-sm hover:shadow-md transition-shadow"
            aria-label="אפרכסת לכנסת - דף הבית"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG, אין מה לאופטם */}
            <img src="/logo-wordmark.svg" alt="" className="h-8 md:h-11 w-auto" />
          </Link>
        </div>

        <p className="mt-10 md:mt-14 max-w-[440px] text-ui md:text-[15px] font-semibold leading-relaxed text-ink">
          אפרכסת לכנסת עוקבת אחרי מה שחברי הכנסת עושים בפועל: איך הצביעו, אילו
          חוקים יזמו ובאילו ועדות השתתפו. הכול מתוך הנתונים הרשמיים של הכנסת,
          ובשפה פשוטה. בשלב זה, כל הנתונים באתר הם של הכנסת ה-25, מאז שהושבעה
          בנובמבר 2022.
        </p>

        <UnifiedSearch aiEnabled={aiEnabled} size="hero" className="mt-8 md:mt-10" />

        {aiEnabled && (
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="שאלות לדוגמה">
            {EXAMPLE_QUESTIONS.map((question, i) => (
              /* בטלפון יש מקום לשלוש. השאר חוזרות ממסך בינוני. */
              <li key={question} className={i >= 3 ? 'hidden sm:block' : ''}>
                <button
                  type="button"
                  onClick={() => router.push(`/ask?q=${encodeURIComponent(question)}`)}
                  className="rounded-full bg-navy px-4 py-1.5 text-label font-medium text-white hover:bg-navy-deep transition-colors"
                >
                  {question}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
