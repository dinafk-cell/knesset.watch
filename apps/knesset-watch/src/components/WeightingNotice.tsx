/**
 * "הציון הוא שקלול של כל מה שבחרת."
 *
 * הציון הסופי הוא ממוצע על כל הסוגיות שנבחרו, ולכן בחירה רחבה מדללת:
 * מי שחזק מאוד בנושא אחד מתוך שישה יקבל ציון בינוני, ומהתוצאה אי אפשר
 * לדעת אם הוא בינוני בכולם או מצוין באחד.
 *
 * ההודעה יושבת בכל מקום שבו בוחרים — עמוד הבית, שלב התחומים ושלב
 * הנושאים — ולא בתוצאות. בתוצאות כבר אי אפשר לפעול לפיה.
 */
export function WeightingNotice({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-card border border-accent-lit bg-accent-wash px-4 py-3 ${className}`}>
      <p className="text-ui text-ink-2 leading-relaxed">
        <strong className="text-ink font-semibold">שימי לב:</strong>{' '}
        הציון של כל ח&quot;כ הוא שקלול של כל הנושאים שתבחרי יחד. אם יש נושא שחשוב
        לך יותר מהאחרים — כדאי לבחור אותו לבדו, אחרת התוצאה תמצע אותו עם השאר.
      </p>
    </div>
  );
}
