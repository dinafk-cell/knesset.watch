'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLOR } from '@/lib/ui/colors';

interface TimelineChartProps {
  data: { month: string; agenda: string; count: number }[];
}

/**
 * צבע לכל נושא-על.
 *
 * הפלטה הקודמת הייתה מוקשחת לאחד-עשר שמות נושא שאינם קיימים — הם היו
 * מהטקסונומיה הידנית הישנה, ולכן כל עמודה נפלה לאפור ברירת המחדל. גם
 * ההערות בה היו שגויות: '#f59e0b' סומן Violet והוא כתום, '#ec4899'
 * סומן Amber והוא ורוד.
 *
 * כאן שמונת הנושאים האמיתיים, מ-axis-clusters. תרשים מוערם צריך גוונים
 * שנבדלים זה מזה, ולכן זו המשפחה היחידה באתר שמותר לה לצאת מהשלישייה
 * נייבי-זהב-קלף. הם נבחרו עמומים ובהירות עולה כדי שיישבו על הקלף
 * ושהעמודות ייבדלו גם בהדפסה בגווני אפור.
 */
const AGENDA_COLORS: Record<string, string> = {
  'משפט, ממשל ודמוקרטיה':            COLOR.navy,      // #0E2140
  'כלכלה, מיסים ויוקר המחיה':        '#2E6B45',       // ירוק עמוק
  'בריאות ורווחה':                   '#7A5195',       // סגול עמום
  'עבודה, זכויות ושוויון':           '#BC5090',       // ורוד-סגול
  'חינוך, תרבות ודת':                COLOR.accent,    // #8A6615
  'ביטחון, חוץ ויחסי ישראל–פלסטינים': '#93331F',       // חמרה
  'דיור, תחבורה ותשתיות':            '#3D6B8A',       // תכלת עמוק
  'סביבה, חקלאות ושלטון מקומי':      '#6B7A3D',       // זית
};

export default function TimelineChart({ data }: TimelineChartProps) {
  const { chartData, keys } = useMemo(() => {
    const monthsMap = new Map<string, Record<string, string | number>>();
    const uniqueAgendas = new Set<string>();

    data.forEach(d => {
      if (!monthsMap.has(d.month)) monthsMap.set(d.month, { name: d.month });
      monthsMap.get(d.month)![d.agenda] = d.count;
      uniqueAgendas.add(d.agenda);
    });

    return {
      chartData: Array.from(monthsMap.values())
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
      keys: Array.from(uniqueAgendas),
    };
  }, [data]);

  /*
    קודם הוחזר null על מערך ריק, והמסך נשאר חלק בלי שום הסבר. וזה מה
    שקרה תמיד, כי השאילתה קראה עמודה ריקה.
  */
  if (chartData.length === 0) {
    return (
      <div className="w-full rounded-card border border-line bg-surface p-8 text-center" dir="rtl">
        <p className="text-ui text-ink-2">אין נתוני חקיקה לתקופה שנבחרה.</p>
        <p className="text-meta text-mute mt-1">נסי לבחור טווח תאריכים רחב יותר.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-card border border-line bg-surface p-4 pt-10" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLOR.line} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12.5, fill: COLOR.mute }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val: string) => {
              const [y, m] = val.split('-');
              return `${m}/${y.slice(2)}`;
            }}
          />
          <YAxis tick={{ fontSize: 12.5, fill: COLOR.mute }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: COLOR.surface2 }}
            contentStyle={{
              borderRadius: '0.75rem',
              border: `1px solid ${COLOR.line}`,
              background: COLOR.surface,
              fontFamily: 'var(--font-heebo)',
              fontSize: '13px',
              textAlign: 'right',
              direction: 'rtl',
            }}
            itemStyle={{ fontWeight: 500 }}
          />
          {/* משקל 900 על עברית קטנה סותם את האותיות; 500 מספיק לתווית */}
          <Legend wrapperStyle={{ fontFamily: 'var(--font-heebo)', fontSize: '12.5px', fontWeight: 500 }} />
          {keys.map(agenda => (
            <Bar key={agenda} dataKey={agenda} stackId="a" fill={AGENDA_COLORS[agenda] ?? COLOR.mute} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
