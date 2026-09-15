import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BASE_PATH: '',
  },
  transpilePackages: ['@minimal-db/ui', '@minimal-db/db'],
  // Prevent Next.js from bundling native modules — they must stay as-is
  serverExternalPackages: ['better-sqlite3'],
  /*
    קובץ ה-SQLite נשקל 82MB, ולכן הוא נארז רק למי שבאמת קורא ממנו.

    הניסיון הקודם השתמש בתבנית גורפת כדי לכסות גם עמודי שרת, וזה הכניס את
    הקובץ לכל 77 הפונקציות במקום ל-48. הבנייה עברה, אבל שלב
    'Deploying outputs' נכשל בלי שורת שגיאה בלוג.

    תשעת העמודים למטה הם היחידים שקוראים מהמסד ב-server component.
    כל השאר מושכים דרך /api ואינם צריכים עותק.
  */
  outputFileTracingIncludes: {
    '/api/**/*': ['./knesset.db'],
    '/agenda/[topic]': ['./knesset.db'],
    '/bill/[id]': ['./knesset.db'],
    '/committee/[name]': ['./knesset.db'],
    '/committees': ['./knesset.db'],
    '/faction/[name]': ['./knesset.db'],
    '/ministers': ['./knesset.db'],
    '/ministry/[name]': ['./knesset.db'],
    '/office/[slug]': ['./knesset.db'],
    '/session/[id]': ['./knesset.db'],
  },
};

export default nextConfig;
