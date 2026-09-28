'use client';

import { useState, useEffect, useCallback } from 'react';
import { periodToDateRange, type Period } from '@/lib/period-context';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeQuestionnaire } from '@/components/home/HomeQuestionnaire';
import { StatsBlock, type HomeStats } from '@/components/home/StatsBlock';
import { RecentLaws, type RecentBill } from '@/components/home/RecentLaws';

/*
  עמוד הבית, בסדר שמספר סיפור:

    1. ההירו: מה האתר, ותיבת החיפוש המאוחדת (חיפוש + AI).
    2. השאלון: מה חשוב לך. הפיצ'ר של הבחירות, ולכן ראשון.
    3. הכנסת במספרים: מה הכנסת עושה, עם פילטר תקופה משלו.
    4. חוקים שעברו לאחרונה: מה קרה עכשיו.

  ירדו מכאן: גריד "מקטעים" (שכפל את הסיידבר), בלוק AI נפרד (התיבה
  בהירו מכסה אותו), ו"הידעת?" (עובר לעמוד "חדשים במשכן?").

  הפילטר של המספרים הוא state מקומי, לא ה-PeriodProvider הגלובלי:
  הוא לא נזכר בין ביקורים ולא משנה עמודים אחרים.
*/

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** aiEnabled מגיע מ-page: דגל שרת שמאפשר לכבות את פיצ'רי ה-AI */
export default function HomepageClient({ aiEnabled = true }: { aiEnabled?: boolean }) {
  const [period, setPeriod] = useState<Period>('all');
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [recentBills, setRecentBills] = useState<RecentBill[]>([]);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    const dateRange = periodToDateRange(period);
    const params = new URLSearchParams();
    if (dateRange) { params.set('from', dateRange.from); params.set('to', dateRange.to); }
    const qs = params.toString() ? `?${params}` : '';
    /*
      כשל בשרת לא נבלע בשקט: הבלוק מציג הודעה וכפתור לנסות שוב.
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

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <HomeHero aiEnabled={aiEnabled} />

      <div className="mx-auto max-w-[900px] px-6 pt-8 md:pt-10 flex flex-col gap-16 md:gap-20">
        <HomeQuestionnaire />
        <StatsBlock
          stats={stats}
          period={period}
          onPeriodChange={setPeriod}
          error={loadError}
          onRetry={fetchData}
        />
        <RecentLaws bills={recentBills} />
      </div>
    </div>
  );
}
