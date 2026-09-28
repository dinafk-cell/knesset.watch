import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import AppSidebar from "@/components/AppSidebar";
import { PeriodProvider } from "@/lib/period-context";
import { aiFeaturesEnabled } from "@/lib/feature-flags";

/*
  משפחה אחת לכל האתר: Heebo.

  קודם עמדו כאן Rubik לכותרות ו-Assistant לגוף, ולפני כן Frank Ruhl Libre
  ו-Heebo. ההצעה מחזירה את Heebo כפונט יחיד, לפי העיצוב החדש: הוא עוצב
  לעברית מלכתחילה, קריא גם בגדלים הקטנים של הממשק, ומשפחה אחת במקום
  שתיים היא מערכת פשוטה יותר. ההיררכיה עוברת דרך משקל וגודל, כמו קודם.

  נטען במשקלים מפורשים בלבד. בלי זה next/font מושך את כל הטווח הרציף.
*/
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "אפרכסת לכנסת",
  description: "שקיפות נתוני הכנסת בזמן אמת",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const aiEnabled = aiFeaturesEnabled();
  return (
    /*
      משתני next/font חייבים לשבת על <html>, לא על <body>.
      @theme מתקמפל ל-:root — שהוא <html> — ולכן var(--font-heebo)
      בתוכו לא נפתר כשהמשתנה מוגדר על <body>, ההגדרה כולה נפסלת,
      וכל האתר נופל לגופן ברירת המחדל של המערכת.
    */
    <html
      lang="he"
      dir="rtl"
      className={heebo.variable}
    >
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-ui focus:font-medium focus:text-white"
        >
          דלגי לתוכן הראשי
        </a>
        <PeriodProvider>
          <div className="flex min-h-screen" dir="rtl">
            <AppSidebar aiEnabled={aiEnabled} />
            <div className="flex-1 flex flex-col min-w-0">
              <SiteHeader />
              <main id="main" className="flex-1">{children}</main>
            </div>
          </div>
        </PeriodProvider>
      </body>
    </html>
  );
}
