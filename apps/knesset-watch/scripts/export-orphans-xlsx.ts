/**
 * ייצוא ההצעות היתומות לקובץ אקסל לסיווג ידני.
 *
 * ── מה יש בקובץ ──────────────────────────────────────────────────────
 *
 * גיליון "לסיווג" — שורה לכל הצעה, עם שלוש עמודות ריקות למילוי:
 * נושא ראשי, אשכול וסוגייה. שלושתן רשימות נפתחות, כדי שהערך שייכתב
 * יתאים בדיוק לקיים באתר ולא יידרש ניקוי אחר כך.
 *
 * ── סדר השורות ───────────────────────────────────────────────────────
 *
 * קודם 140 ההצעות שהמודל כבר הציע להן ציר בביטחון בינוני. הן לא
 * נכתבו למסד כי בינוני אינו מספיק לכתיבה אוטומטית, אבל כהצעה לאדם
 * שמאשר או פוסל הן שוות הרבה — זו העבודה המהירה ביותר בקובץ.
 *
 * אחריהן השאר, מקובצות לפי תחום. הצעות דומות יושבות זו לצד זו, וכך
 * אפשר לסווג קבוצה שלמה ברצף במקום לקפוץ בין נושאים.
 *
 * ── גיליון הצירים ────────────────────────────────────────────────────
 *
 * כל 181 הצירים עם שתי העמדות המלאות, ממוינים לפי נושא ואשכול. זה
 * מה שהרשימות הנפתחות מצביעות עליו, וגם המקום לראות מה כל ציר אומר
 * לפני שבוחרים בו.
 *
 *   npx tsx scripts/export-orphans-xlsx.ts
 */

import Database from 'better-sqlite3';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { CLUSTERS } from '../src/lib/axis-clusters';

const DB_PATH = path.join(process.cwd(), 'knesset.db');
const MATCHES = path.join(process.cwd(), 'orphan-matches.jsonl');
const OUT = path.join(process.cwd(), 'הצעות-לסיווג.xlsx');

interface Match { billId: number; issueId: string | null; side: string | null; confidence?: string; why?: string }

async function main(): Promise<void> {
  const db = new Database(DB_PATH, { readonly: true });

  const axes = CLUSTERS.flatMap(c => c.questions.map(q => ({
    topic: c.topic, cluster: c.label, issueId: q.issueId, question: q.question,
    pro: q.stances[0].label, con: q.stances[1].label,
  }))).sort((a, b) => a.topic.localeCompare(b.topic, 'he') || a.cluster.localeCompare(b.cluster, 'he'));

  const topics = [...new Set(axes.map(a => a.topic))].sort((a, b) => a.localeCompare(b, 'he'));
  const clusters = [...new Set(axes.map(a => a.cluster))].sort((a, b) => a.localeCompare(b, 'he'));
  const questions = axes.map(a => a.question);

  /* ההצעה של המודל בביטחון בינוני — לא נכתבה למסד, אבל שווה כהצעה */
  const suggested = new Map<number, Match>();
  if (fs.existsSync(MATCHES)) {
    for (const line of fs.readFileSync(MATCHES, 'utf8').split('\n').filter(Boolean)) {
      const m = JSON.parse(line) as Match;
      if (m.issueId && m.confidence !== 'high') suggested.set(m.billId, m);
    }
  }
  const byId = new Map(axes.map(a => [a.issueId, a]));

  const rows = db.prepare(`
    SELECT i.bill_id AS billId, b.title AS title,
           COALESCE(i.policy_change,'') AS change,
           COALESCE(NULLIF(TRIM(i.domain_candidate),''),'(ללא תחום)') AS domain,
           COALESCE(i.issue_candidate,'') AS issue
    FROM bill_policy_issue i JOIN bill b ON b.id = i.bill_id
    WHERE NOT EXISTS (SELECT 1 FROM bill_political_classification c WHERE c.bill_id = i.bill_id)
      AND EXISTS (SELECT 1 FROM bill_initiator bi WHERE bi.bill_id = i.bill_id)
    GROUP BY i.bill_id`).all() as Array<Record<string, string | number>>;

  const initStmt = db.prepare(`SELECT p.first_name||' '||p.last_name AS n, p.faction_name AS f
    FROM bill_initiator bi JOIN mk_person p ON p.person_id = bi.mk_id WHERE bi.bill_id = ?`);

  const data = rows.map(r => {
    const inits = initStmt.all(Number(r.billId)) as Array<{ n: string; f: string }>;
    const s = suggested.get(Number(r.billId));
    const ax = s?.issueId ? byId.get(s.issueId) : undefined;
    return {
      billId: Number(r.billId),
      title: String(r.title),
      change: String(r.change),
      issue: String(r.issue),
      domain: String(r.domain),
      initiators: inits.map(x => x.n).join(', '),
      faction: [...new Set(inits.map(x => x.f))].join(', '),
      sugTopic: ax?.topic ?? '',
      sugCluster: ax?.cluster ?? '',
      sugQuestion: ax?.question ?? '',
      sugSide: s?.side === 'pro' ? 'בעד' : s?.side === 'con' ? 'נגד' : '',
      sugWhy: s?.why ?? '',
      hasSug: Boolean(ax),
    };
  }).sort((a, b) =>
    Number(b.hasSug) - Number(a.hasSug) ||
    a.domain.localeCompare(b.domain, 'he') ||
    a.billId - b.billId);

  const wb = new ExcelJS.Workbook();
  wb.views = [{ x: 0, y: 0, width: 26000, height: 18000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];

  // ── גיליון הצירים, ראשון כי הרשימות הנפתחות מצביעות עליו ──
  const ref = wb.addWorksheet('רשימת הצירים', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });
  ref.columns = [
    { header: 'נושא ראשי', key: 'topic', width: 28 },
    { header: 'אשכול', key: 'cluster', width: 26 },
    { header: 'סוגייה (הציר)', key: 'question', width: 60 },
    { header: 'עמדה בעד', key: 'pro', width: 70 },
    { header: 'עמדה נגד', key: 'con', width: 70 },
  ];
  for (const a of axes) ref.addRow(a);
  ref.getRow(1).font = { bold: true };
  ref.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E2140' } };
  ref.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ref.eachRow((r, i) => { if (i > 1) r.alignment = { vertical: 'top', wrapText: true }; });

  /* רשימות עזר בגיליון מוסתר; ולידציה לא יכולה להצביע על טווח בגיליון אחר בלי זה */
  const lists = wb.addWorksheet('רשימות');
  lists.state = 'veryHidden';
  topics.forEach((t, i) => { lists.getCell(i + 1, 1).value = t; });
  clusters.forEach((c, i) => { lists.getCell(i + 1, 2).value = c; });
  questions.forEach((q, i) => { lists.getCell(i + 1, 3).value = q; });
  ['בעד', 'נגד'].forEach((s, i) => { lists.getCell(i + 1, 4).value = s; });

  // ── הגיליון הראשי ──
  const ws = wb.addWorksheet('לסיווג', { views: [{ rightToLeft: true, state: 'frozen', xSplit: 0, ySplit: 1 }] });
  ws.columns = [
    { header: 'מזהה', key: 'billId', width: 11 },
    { header: 'כותרת', key: 'title', width: 52 },
    { header: 'מה ההצעה עושה', key: 'change', width: 66 },
    { header: 'תחום', key: 'domain', width: 20 },
    { header: 'יוזמים', key: 'initiators', width: 26 },
    { header: 'סיעה', key: 'faction', width: 20 },
    { header: '◀ נושא ראשי', key: 'topic', width: 26 },
    { header: '◀ אשכול', key: 'cluster', width: 24 },
    { header: '◀ סוגייה', key: 'question', width: 52 },
    { header: '◀ צד', key: 'side', width: 10 },
    { header: 'הערה', key: 'note', width: 30 },
    { header: 'הצעת המערכת', key: 'sug', width: 46 },
    { header: 'נימוק המערכת', key: 'sugWhy', width: 46 },
  ];

  for (const d of data) {
    ws.addRow({
      billId: d.billId, title: d.title, change: d.change, domain: d.domain,
      initiators: d.initiators, faction: d.faction,
      topic: '', cluster: '', question: '', side: '', note: '',
      sug: d.sugQuestion ? `${d.sugQuestion}  [${d.sugSide}]` : '',
      sugWhy: d.sugWhy,
    });
  }

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E2140' } };
  head.alignment = { vertical: 'middle', horizontal: 'right' };
  head.height = 22;

  const last = data.length + 1;
  const val = (col: string, listCol: string, n: number) => {
    for (let r = 2; r <= last; r++) {
      ws.getCell(`${col}${r}`).dataValidation = {
        type: 'list', allowBlank: true,
        formulae: [`רשימות!$${listCol}$1:$${listCol}$${n}`],
      };
    }
  };
  val('G', 'A', topics.length);
  val('H', 'B', clusters.length);
  val('I', 'C', questions.length);
  val('J', 'D', 2);

  /* ההצעות של המערכת מסומנות, כדי שיהיה ברור איפה העבודה המהירה */
  for (let r = 2; r <= last; r++) {
    const row = ws.getRow(r);
    row.alignment = { vertical: 'top', wrapText: true };
    for (const c of ['G', 'H', 'I', 'J']) {
      ws.getCell(`${c}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF4E1' } };
    }
    if (data[r - 2].hasSug) {
      for (const c of ['L', 'M']) {
        ws.getCell(`${c}${r}`).font = { color: { argb: 'FF8A6615' } };
      }
    }
  }
  ws.autoFilter = { from: 'A1', to: `M${last}` };

  await wb.xlsx.writeFile(OUT);
  const withSug = data.filter(d => d.hasSug).length;
  console.log(`נכתב: ${path.basename(OUT)}`);
  console.log(`  ${data.length} הצעות`);
  console.log(`  ${withSug} מהן עם הצעת מערכת בראש הקובץ`);
  console.log(`  ${axes.length} צירים ברשימות הנפתחות`);
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
