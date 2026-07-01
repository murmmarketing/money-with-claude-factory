import { NextResponse } from 'next/server';
import { requireOwner } from '../../../lib/entitlement';
import { CHAPTERS, CHEAT_SHEETS, getCheatSheet } from '../../../lib/content';
import {
  buildGuidePdf,
  buildCheatSheetsPdf,
  buildSingleCheatSheetPdf,
} from '../../../lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Entitlement-gated download. PDFs are generated on demand (never a public
 * static URL) and only served to a logged-in owner. Supported docs:
 *   ?doc=guide         -> the full ~book (all chapters)
 *   ?doc=cheatsheets   -> all four cheat-sheets in one PDF
 *   ?doc=<sheet-slug>  -> a single cheat-sheet
 */
export async function GET(req: Request) {
  const gate = await requireOwner();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const url = new URL(req.url);
  const doc = (url.searchParams.get('doc') || 'guide').toLowerCase();

  let pdf: Buffer;
  let filename: string;

  if (doc === 'guide' || doc === 'all') {
    pdf = buildGuidePdf(CHAPTERS);
    filename = 'the-rep-playbook.pdf';
  } else if (doc === 'cheatsheets' || doc === 'cheat-sheets') {
    pdf = buildCheatSheetsPdf(CHEAT_SHEETS);
    filename = 'rep-playbook-cheat-sheets.pdf';
  } else {
    const sheet = getCheatSheet(doc);
    if (!sheet) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    pdf = buildSingleCheatSheetPdf(sheet);
    filename = `rep-playbook-${sheet.slug}.pdf`;
  }

  return new NextResponse(pdf as any, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, no-store',
      'content-length': String(pdf.length),
    },
  });
}
