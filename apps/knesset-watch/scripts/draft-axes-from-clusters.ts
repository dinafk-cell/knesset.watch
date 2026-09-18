/**
 * שלב 2: ניסוח צירים לאשכולות, לסקירה של דינה.
 *
 * הסקריפט אינו כותב למסד ואינו נוגע בקטלוג הצירים. הוא מייצר טיוטה
 * בלבד — קובץ JSONL וקובץ CSV — ורק אחרי שדינה עוברת עליהם יורץ
 * שלב 3 שמחיל אותם.
 *
 * ── על המכסה ─────────────────────────────────────────────────────────
 *
 * המכסה החינמית של Gemini היא 20 בקשות ליום לכל מודל. לכן:
 *
 *   retries = 0   ניסיון חוזר הוא בקשה נוספת שנגרעת מהמכסה. בהרצת
 *                 קיצור השאלות ניסיונות חוזרים על 503 בלעו את המכסה
 *                 היומית כולה. עדיף שאשכול אחד ייכשל וימתין למחר.
 *
 *   JSONL         כל תשובה נכתבת מיד. הרצה שנעצרת על מכסה שומרת את
 *                 מה שהספיקה, והרצה חוזרת מדלגת על מה שכבר יש.
 *
 * ── על סירוב ─────────────────────────────────────────────────────────
 *
 * המודל רשאי להחזיר coherent: false. זה נדרש: האשכול הגדול ביותר
 * מכיל נספי כבאות, שירות לאומי והטבות לניצולי שואה יחד, ואין שאלה
 * אחת שמכסה את שלושתם. עדיף סירוב מפורש מציר מעורפל שמשתמשת תיתקל בו.
 *
 *   npx tsx scripts/draft-axes-from-clusters.ts --dry-run   מראה מה יישלח
 *   npx tsx scripts/draft-axes-from-clusters.ts             מנסח
 *   npx tsx scripts/draft-axes-from-clusters.ts --top 5     רק החמישה הגדולים
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { geminiFetch, geminiUrl, GEMINI_MODEL, DailyQuotaError } from '../src/lib/gemini-fetch';
import { buildClusters, MIN_CLUSTER, THRESHOLD, type OrphanRow } from './lib/orphan-clustering';

const DB_PATH = path.join(process.cwd(), 'knesset.db');
const DRAFTS = path.join(process.cwd(), 'axis-drafts.jsonl');
const REVIEW = path.join(process.cwd(), 'axis-drafts.csv');

const dryRun = process.argv.includes('--dry-run');
const topArg = process.argv.indexOf('--top');
const TOP = topArg >= 0 ? Number(process.argv[topArg + 1]) : 20;

const NOSAMPLE = 14;

interface Draft {
  clusterIndex: number;
  billCount: number;
  billIds: number[];
  coherent: boolean;
  reason?: string;
  topic?: string;
  subtopic?: string;
  question?: string;
  pro?: string;
  con?: string;
}

function apiKey(): string {
  for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
    if (line.startsWith('GEMINI_API_KEY=')) return line.slice('GEMINI_API_KEY='.length).trim();
  }
  throw new Error('אין GEMINI_API_KEY ב-.env.local');
}

/*
  הפרומפט מבקש במפורש שאלה שיש עליה מחלוקת אמיתית, כי ציר שכל הכנסת
  מסכימה עליו אינו מבדיל בין ח"כים ואינו שווה כלום בשאלון. הוא גם
  מבקש ניסוח סימטרי — שני הצדדים כעמדה לגיטימית — כמו בכל 168 הצירים
  הקיימים.
*/
function buildPrompt(bills: OrphanRow[]): string {
  const sample = bills.slice(0, NOSAMPLE)
    .map((b, i) => `${i + 1}. ${b.title}\n   ${b.text.slice(0, 260)}`).join('\n\n');
  return `להלן ${bills.length} הצעות חוק מהכנסת ה-25 שקובצו יחד לפי דמיון בתוכן המדיניות שלהן.

${sample}

המשימה: לנסח ציר מחלוקת פוליטי אחד שההצעות האלה נופלות עליו.

דרישות:
- השאלה חייבת להיות כזו שיש עליה מחלוקת אמיתית בכנסת. אם כל הסיעות מסכימות, אין ציר.
- שני הצדדים מנוסחים כעמדה לגיטימית, בגוף שלישי, בלי לרמוז איזה צד צודק.
- השאלה מתחילה ב"האם", עד 12 מילים.
- כל עמדה: משפט אחד, עד 28 מילים, שמסביר גם למה מחזיקים בה.

אם ההצעות אינן חולקות שאלה אחת — למשל אם הן משלושה תחומים שונים —
החזר coherent: false והסבר קצר. אל תמציא ציר מעורפל שיאחד אותן בכוח.

החזר JSON בלבד, בלי טקסט נוסף:
{"coherent": true, "topic": "...", "subtopic": "...", "question": "האם ...?", "pro": "...", "con": "..."}
או
{"coherent": false, "reason": "..."}`;
}

function parseDraft(text: string): Partial<Draft> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as Partial<Draft>; } catch { return null; }
}

async function askGemini(bills: OrphanRow[], key: string, label: string): Promise<Partial<Draft> | null> {
  const res = await geminiFetch(
    geminiUrl('generateContent', key),
    {
      contents: [{ parts: [{ text: buildPrompt(bills) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    },
    { retries: 0, timeoutMs: 45_000, label },
  );
  if (!res.ok) { console.log(`    ✗ ${res.status}`); return null; }
  const body = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  };
  const cand = body.candidates?.[0];
  /*
    finishReason נבדק לפני התוכן. התעלמות ממנו היא מה שגרם בעבר
    לשמירת תשובה קטועה בת 15 תווים בקאש לצמיתות.
  */
  if (cand?.finishReason && cand.finishReason !== 'STOP') {
    console.log(`    ✗ נקטע: ${cand.finishReason}`);
    return null;
  }
  const text = (cand?.content?.parts ?? []).map(p => p.text ?? '').join('');
  return parseDraft(text);
}

async function main(): Promise<void> {
  const db = new Database(DB_PATH, { readonly: true });
  console.log(`מודל: ${GEMINI_MODEL}\n`);

  const { kept, groups, skipped } = await buildClusters(db);
  if (skipped.length) console.log(`⚠ ${skipped.length} הצעות ללא וקטור, מחוץ לניתוח`);

  const big = groups.filter(g => g.length >= MIN_CLUSTER).slice(0, TOP);
  const covered = big.reduce((s, g) => s + g.length, 0);
  console.log(`${big.length} האשכולות הגדולים בסף ${THRESHOLD} · ${covered} הצעות\n`);

  const done = new Map<number, Draft>();
  if (fs.existsSync(DRAFTS)) {
    for (const line of fs.readFileSync(DRAFTS, 'utf8').split('\n').filter(Boolean)) {
      const d = JSON.parse(line) as Draft;
      done.set(d.clusterIndex, d);
    }
    console.log(`${done.size} אשכולות כבר מנוסחים בקובץ, מדלג עליהם\n`);
  }

  if (dryRun) {
    const first = big[0].map(i => kept[i]);
    console.log('═══ הפרומפט של האשכול הראשון ═══\n');
    console.log(buildPrompt(first).slice(0, 1800));
    console.log(`\n--dry-run — ${big.length - done.size} בקשות היו נשלחות.`);
    db.close();
    return;
  }

  const key = apiKey();
  let quotaHit = false;
  let failed = 0;

  for (let ci = 0; ci < big.length && !quotaHit; ci++) {
    if (done.has(ci)) continue;
    const bills = big[ci].map(i => kept[i]);
    console.log(`  אשכול ${ci + 1}/${big.length} · ${bills.length} הצעות · ${bills[0].domain}`);

    let parsed: Partial<Draft> | null = null;
    try {
      parsed = await askGemini(bills, key, `cluster-${ci}`);
    } catch (e) {
      if (e instanceof DailyQuotaError) {
        console.log(`\n  המכסה היומית נגמרה (${e.quotaValue ?? '20'}). מה שנוסח נשמר.`);
        quotaHit = true;
        break;
      }
      throw e;
    }

    /*
      תקלת תעבורה אינה החלטה. 503, תשובה קטועה או JSON שבור מחזירים
      null, ואסור לרשום אותם כ"נדחה" — הרישום נשמר לקובץ, וההרצה
      החוזרת מדלגת על מה שכבר רשום. אשכול שנפל על 503 היה נקבר לנצח
      כאילו הוחלט שאינו קוהרנטי. כשאין תשובה פשוט לא כותבים, והאשכול
      יידון שוב בהרצה הבאה.
    */
    if (!parsed || typeof parsed.coherent !== 'boolean') {
      console.log('    ↻ ללא תשובה תקפה — יידון שוב בהרצה הבאה');
      failed++;
      continue;
    }

    const draft: Draft = {
      clusterIndex: ci,
      billCount: bills.length,
      billIds: bills.map(b => b.billId),
      coherent: parsed.coherent,
      reason: parsed.reason,
      topic: parsed.topic, subtopic: parsed.subtopic,
      question: parsed.question, pro: parsed.pro, con: parsed.con,
    };
    fs.appendFileSync(DRAFTS, JSON.stringify(draft) + '\n');
    done.set(ci, draft);

    console.log(draft.coherent
      ? `    ✓ ${draft.question}`
      : `    — נדחה: ${draft.reason?.slice(0, 70) ?? 'ללא נימוק'}`);
    await new Promise(r => setTimeout(r, 1_500));
  }

  const all = [...done.values()].sort((a, b) => a.clusterIndex - b.clusterIndex);
  const good = all.filter(d => d.coherent);
  console.log(`\n═══ סיכום ═══`);
  console.log(`  נוסחו   : ${all.length}/${big.length}`);
  console.log(`  צירים   : ${good.length}`);
  console.log(`  נדחו    : ${all.length - good.length}`);
  if (failed) console.log(`  נכשלו   : ${failed}  (לא נרשמו — יידונו שוב)`);
  if (quotaHit) console.log(`  נעצר על המכסה. הרצה חוזרת מחר תמשיך מהנקודה הזו.`);
  console.log(`  הצעות שיקבלו ציר: ${good.reduce((s, d) => s + d.billCount, 0)}`);

  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  const lines = [['אשכול', 'הצעות', 'תקין', 'שאלה', 'בעד', 'נגד', 'נושא', 'תת-נושא', 'נימוק לדחייה']
    .map(esc).join(',')];
  for (const d of all) {
    lines.push([d.clusterIndex + 1, d.billCount, d.coherent ? 'כן' : 'לא',
      d.question, d.pro, d.con, d.topic, d.subtopic, d.reason].map(esc).join(','));
  }
  fs.writeFileSync(REVIEW, '﻿' + lines.join('\n') + '\n');
  console.log(`\nנכתב: ${path.basename(REVIEW)} · ${path.basename(DRAFTS)}`);
  console.log('לא נכתב דבר למסד ולא לקטלוג הצירים.');
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
