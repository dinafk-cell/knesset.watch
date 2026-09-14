import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BASE_PATH: '',
  },
  transpilePackages: ['@minimal-db/ui', '@minimal-db/db'],
  // Prevent Next.js from bundling native modules — they must stay as-is
  serverExternalPackages: ['better-sqlite3'],
  /*
    קובץ ה-SQLite חייב להיארז גם לעמודי שרת, לא רק למסלולי API.
    /bill/[id], /agendas ו-/committee/[name] קוראים מהמסד ישירות
    ב-server component, ובלי הרשומה הזאת הם נפרסים בלעדיו.
  */
  outputFileTracingIncludes: {
    '/api/**/*': ['./knesset.db'],
    '/**/*': ['./knesset.db'],
  },
};

export default nextConfig;
