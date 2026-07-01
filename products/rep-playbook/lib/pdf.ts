/**
 * Dependency-free PDF generator. Produces genuinely valid, multi-page PDFs from
 * the guide content in lib/content.ts using the two built-in PDF core fonts
 * (Helvetica / Helvetica-Bold), with real glyph-width tables for accurate word
 * wrapping and automatic page breaks. No @react-pdf/renderer, no headless
 * browser, no native deps — so `npm run build` stays clean and downloads are
 * generated on demand in a Node route.
 *
 * The output opens in any PDF reader. Text is WinAnsi-encoded so curly quotes,
 * en/em dashes and the £/€/× symbols used in the guide render correctly.
 */

import type { Block, Chapter, CheatSheet } from './content';

// ---- page geometry (A4, points) -------------------------------------------
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M_LEFT = 56;
const M_RIGHT = 56;
const M_TOP = 58;
const M_BOTTOM = 64;
const USABLE_W = PAGE_W - M_LEFT - M_RIGHT;

// brand colors (0..1 rgb) — matches brand/brand.json
const BROWN: RGB = [0.757, 0.263, 0.165]; // #C1432A rust accent
const INK: RGB = [0.129, 0.11, 0.086]; // #211C16
const MUTED: RGB = [0.369, 0.329, 0.259]; // #5E5442
const CALLOUT_BG: RGB = [0.953, 0.918, 0.847]; // #F3EAD8
const RULE: RGB = [0.89, 0.847, 0.761]; // #E3D8C2

type RGB = [number, number, number];

// ---- glyph width tables (per 1000 em), ASCII 32..126 ----------------------
// prettier-ignore
const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
// prettier-ignore
const W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

// map a unicode char -> WinAnsi byte, or -1 to drop
function toWin(ch: string): number {
  const c = ch.charCodeAt(0);
  if (c >= 32 && c <= 126) return c;
  switch (ch) {
    case '–': return 0x96; // – en dash
    case '—': return 0x97; // — em dash
    case '‘': return 0x91; // ‘
    case '’': return 0x92; // ’
    case '“': return 0x93; // “
    case '”': return 0x94; // ”
    case '…': return 0x85; // …
    case '•': return 0x95; // •
    case '£': return 0xa3; // £
    case '€': return 0x80; // €
    case '×': return 0xd7; // ×
    case '¥': return 0xa5; // ¥
    case 'é': return 0xe9; // é
    case '™': return 0x99; // ™
    case '°': return 0xb0; // °
    case '·': return 0xb7; // ·
    case '\n': case '\t': case '\r': return 32;
    default:
      if (c >= 160 && c <= 255) return c;
      return 0x3f; // '?'
  }
}

function byteWidth(byte: number, bold: boolean): number {
  const table = bold ? W_BOLD : W_REG;
  if (byte >= 32 && byte <= 126) return table[byte - 32];
  switch (byte) {
    case 0x96: return 556;
    case 0x97: return 1000;
    case 0x91: case 0x92: return bold ? 238 : 222;
    case 0x93: case 0x94: return 500;
    case 0x85: return 1000;
    case 0x95: return 350;
    case 0xa3: case 0x80: case 0xa5: case 0xe9: return 556;
    case 0xd7: return 584;
    case 0x99: return 1000;
    case 0xb0: return 400;
    case 0xb7: return 278;
    default: return 556;
  }
}

// convert a JS string into WinAnsi bytes (as a latin1 string) + escape for PDF
function encodeString(s: string): { bytes: string; width1000: (bold: boolean) => number } {
  let out = '';
  const codes: number[] = [];
  for (const ch of s) {
    const b = toWin(ch);
    codes.push(b);
    if (b === 0x28 || b === 0x29 || b === 0x5c) out += '\\';
    out += String.fromCharCode(b);
  }
  return {
    bytes: out,
    width1000: (bold: boolean) => codes.reduce((a, b) => a + byteWidth(b, bold), 0),
  };
}

function measure(s: string, size: number, bold: boolean): number {
  let total = 0;
  for (const ch of s) total += byteWidth(toWin(ch), bold);
  return (total / 1000) * size;
}

function wrap(text: string, maxWidth: number, size: number, bold: boolean): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (measure(trial, size, bold) <= maxWidth || !line) {
      // if a single word is too long, hard-break it
      if (!line && measure(word, size, bold) > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          if (measure(chunk + ch, size, bold) > maxWidth && chunk) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
      } else {
        line = trial;
      }
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ---- document builder -----------------------------------------------------
class Doc {
  private pages: string[] = [];
  private cur = '';
  private y = PAGE_H - M_TOP;
  private pageStarted = false;

  private startPage() {
    if (this.pageStarted) this.pages.push(this.cur);
    this.cur = '';
    this.y = PAGE_H - M_TOP;
    this.pageStarted = true;
  }

  private ensure(space: number) {
    if (!this.pageStarted) {
      this.startPage();
      return;
    }
    if (this.y - space < M_BOTTOM) this.startPage();
  }

  private rect(x: number, yTop: number, w: number, h: number, color: RGB) {
    // PDF rects use bottom-left origin; yTop is our top-of-rect
    this.cur += `${color[0]} ${color[1]} ${color[2]} rg\n${x.toFixed(2)} ${(yTop - h).toFixed(
      2
    )} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
  }

  private hline(x1: number, x2: number, yPos: number, color: RGB, wLine = 0.7) {
    this.cur += `${color[0]} ${color[1]} ${color[2]} RG ${wLine} w\n${x1.toFixed(2)} ${yPos.toFixed(
      2
    )} m ${x2.toFixed(2)} ${yPos.toFixed(2)} l S\n`;
  }

  private text(x: number, yBaseline: number, s: string, size: number, bold: boolean, color: RGB) {
    if (!s) return;
    const enc = encodeString(s);
    const font = bold ? 'F2' : 'F1';
    this.cur += `BT /${font} ${size} Tf ${color[0]} ${color[1]} ${color[2]} rg ${x.toFixed(
      2
    )} ${yBaseline.toFixed(2)} Td (${enc.bytes}) Tj ET\n`;
  }

  // draw wrapped paragraph text at current cursor; returns nothing (advances y)
  private paragraph(
    text: string,
    opts: { size: number; bold?: boolean; color?: RGB; lead?: number; indent?: number; width?: number } = {
      size: 10.5,
    }
  ) {
    const size = opts.size;
    const bold = !!opts.bold;
    const color = opts.color || INK;
    const lead = opts.lead ?? size * 1.42;
    const indent = opts.indent ?? 0;
    const width = opts.width ?? USABLE_W - indent;
    const lines = wrap(text, width, size, bold);
    for (const ln of lines) {
      this.ensure(lead);
      this.y -= lead;
      this.text(M_LEFT + indent, this.y, ln, size, bold, color);
    }
  }

  gap(h: number) {
    this.y -= h;
  }

  h2(text: string) {
    this.ensure(30);
    this.gap(12);
    this.paragraph(text, { size: 15, bold: true, color: BROWN, lead: 19 });
    this.gap(3);
  }

  h3(text: string) {
    this.ensure(22);
    this.gap(8);
    this.paragraph(text, { size: 12, bold: true, color: INK, lead: 15 });
    this.gap(2);
  }

  para(text: string) {
    this.paragraph(text, { size: 10.5, color: INK, lead: 15 });
    this.gap(6);
  }

  bullets(items: string[], numbered: boolean) {
    const size = 10.5;
    const lead = 15;
    const markerW = numbered ? 22 : 16;
    items.forEach((item, i) => {
      const marker = numbered ? `${i + 1}.` : '•';
      const lines = wrap(item, USABLE_W - markerW, size, false);
      lines.forEach((ln, idx) => {
        this.ensure(lead);
        this.y -= lead;
        if (idx === 0) this.text(M_LEFT + 2, this.y, marker, size, numbered, BROWN);
        this.text(M_LEFT + markerW, this.y, ln, size, false, INK);
      });
      this.gap(3);
    });
    this.gap(4);
  }

  callout(title: string | undefined, body: string) {
    const size = 10;
    const lead = 14;
    const padX = 12;
    const padY = 10;
    const innerW = USABLE_W - padX * 2 - 6;
    const titleLines = title ? wrap(title, innerW, 10.5, true) : [];
    const bodyLines = wrap(body, innerW, size, false);
    const contentH =
      padY * 2 + titleLines.length * 13 + (titleLines.length ? 4 : 0) + bodyLines.length * lead;
    this.ensure(contentH + 8);
    this.gap(6);
    const topY = this.y;
    // background box + left accent bar
    this.rect(M_LEFT, topY, USABLE_W, contentH, CALLOUT_BG);
    this.rect(M_LEFT, topY, 4, contentH, BROWN);
    let ty = topY - padY;
    for (const ln of titleLines) {
      ty -= 13;
      this.text(M_LEFT + padX + 6, ty, ln, 10.5, true, BROWN);
    }
    if (titleLines.length) ty -= 4;
    for (const ln of bodyLines) {
      ty -= lead;
      this.text(M_LEFT + padX + 6, ty, ln, size, false, INK);
    }
    this.y = topY - contentH;
    this.gap(8);
  }

  table(headers: string[], rows: string[][]) {
    const cols = headers.length;
    const size = 9.5;
    const lead = 13;
    const cellPad = 5;
    // weighted widths: first column a bit narrower for 2-col, even otherwise
    let widths: number[];
    if (cols === 2) widths = [USABLE_W * 0.32, USABLE_W * 0.68];
    else if (cols === 4) widths = [USABLE_W * 0.4, USABLE_W * 0.2, USABLE_W * 0.2, USABLE_W * 0.2];
    else widths = new Array(cols).fill(USABLE_W / cols);

    const drawRow = (cells: string[], bold: boolean) => {
      const wrapped = cells.map((c, i) =>
        wrap(c ?? '', widths[i] - cellPad * 2, size, bold)
      );
      const rowLines = Math.max(...wrapped.map((w) => w.length), 1);
      const rowH = rowLines * lead + 6;
      this.ensure(rowH);
      this.gap(2);
      const topY = this.y;
      if (bold) this.rect(M_LEFT, topY, USABLE_W, rowH, [0.93, 0.9, 0.83]);
      let x = M_LEFT;
      for (let i = 0; i < cols; i++) {
        let cy = topY - 4;
        for (const ln of wrapped[i]) {
          cy -= lead;
          this.text(x + cellPad, cy, ln, size, bold, bold ? BROWN : INK);
        }
        x += widths[i];
      }
      this.y = topY - rowH;
      this.hline(M_LEFT, M_LEFT + USABLE_W, this.y, RULE, 0.5);
    };

    this.gap(6);
    drawRow(headers, true);
    for (const r of rows) drawRow(r, false);
    this.gap(8);
  }

  block(b: Block) {
    switch (b.t) {
      case 'h2': this.h2(b.text); break;
      case 'h3': this.h3(b.text); break;
      case 'p': this.para(b.text); break;
      case 'ul': this.bullets(b.items, false); break;
      case 'ol': this.bullets(b.items, true); break;
      case 'callout': this.callout(b.title, b.text); break;
      case 'table': this.table(b.headers, b.rows); break;
    }
  }

  cover(title: string, subtitle: string, kicker: string) {
    this.startPage();
    this.gap(150);
    this.paragraph(kicker, { size: 12, bold: true, color: BROWN, lead: 16 });
    this.gap(14);
    this.paragraph(title, { size: 30, bold: true, color: INK, lead: 36 });
    this.gap(16);
    this.hline(M_LEFT, M_LEFT + 120, this.y, BROWN, 2);
    this.gap(20);
    this.paragraph(subtitle, { size: 13, color: MUTED, lead: 19 });
    this.gap(40);
    this.paragraph('The Rep Playbook — the field manual for buying reps without getting scammed.', {
      size: 10,
      color: MUTED,
      lead: 14,
    });
    this.paragraph('Figures are 2026 estimates for planning only. Confirm live costs and customs with your agent and local authority.', {
      size: 9,
      color: MUTED,
      lead: 13,
    });
  }

  pageBreak() {
    this.startPage();
  }

  finalize(): Buffer {
    if (this.pageStarted) this.pages.push(this.cur);
    return serialize(this.pages);
  }
}

// add page-number footers, then assemble the PDF file bytes
function serialize(pageStreams: string[]): Buffer {
  const total = pageStreams.length;
  const streams = pageStreams.map((s, i) => {
    const label = `The Rep Playbook   —   ${i + 1} / ${total}`;
    const enc = encodeString(label);
    const footer = `BT /F1 8 Tf 0.55 0.53 0.48 rg ${M_LEFT} 40 Td (${enc.bytes}) Tj ET\n`;
    return s + footer;
  });

  const objects: string[] = [];
  // 1 catalog, 2 pages, 3 F1, 4 F2, then pairs of (page, content)
  const pageObjNums: number[] = [];
  let nextObj = 5;
  const contentObjs: { num: number; body: string }[] = [];
  for (const st of streams) {
    const contentNum = nextObj++;
    const pageNum = nextObj++;
    contentObjs.push({ num: contentNum, body: st });
    pageObjNums.push(pageNum);
  }

  const kids = pageObjNums.map((n) => `${n} 0 R`).join(' ');

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pageObjNums.length} >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  contentObjs.forEach((c, i) => {
    const pageNum = pageObjNums[i];
    // content stream length is in bytes (latin1)
    const len = Buffer.from(c.body, 'latin1').length;
    objects[c.num] = `<< /Length ${len} >>\nstream\n${c.body}\nendstream`;
    objects[pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${c.num} 0 R >>`;
  });

  // assemble with xref
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = header;
  const offsets: number[] = [];
  const maxObj = objects.length - 1;
  for (let i = 1; i <= maxObj; i++) {
    offsets[i] = Buffer.from(body, 'latin1').length;
    body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.from(body, 'latin1').length;
  let xref = `xref\n0 ${maxObj + 1}\n`;
  xref += `0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  body += xref + trailer;
  return Buffer.from(body, 'latin1');
}

// ---- public builders ------------------------------------------------------

export function buildGuidePdf(chapters: Chapter[]): Buffer {
  const doc = new Doc();
  doc.cover(
    'The Rep Playbook',
    'Everything you wish someone told you before your first rep haul — finds, agents, QC, sizing, shipping, customs and legit-checking, in one field manual.',
    'THE COMPLETE FIELD MANUAL'
  );
  chapters.forEach((ch) => {
    doc.pageBreak();
    doc.h2(`Chapter ${ch.number}. ${ch.title}`);
    doc.para(ch.summary);
    ch.blocks.forEach((b) => doc.block(b));
  });
  return doc.finalize();
}

export function buildCheatSheetsPdf(sheets: CheatSheet[]): Buffer {
  const doc = new Doc();
  doc.cover(
    'The Rep Playbook — Cheat Sheets',
    'Four printable one-page references: QC red-flags, agent vetting, sizing conversion and customs by country. Keep them open while you order.',
    'PRINTABLE CHEAT SHEETS'
  );
  sheets.forEach((s) => {
    doc.pageBreak();
    doc.h2(s.title);
    doc.para(s.summary);
    s.blocks.forEach((b) => doc.block(b));
  });
  return doc.finalize();
}

export function buildSingleCheatSheetPdf(sheet: CheatSheet): Buffer {
  const doc = new Doc();
  doc.cover(`The Rep Playbook`, sheet.summary, sheet.title.toUpperCase());
  doc.pageBreak();
  doc.h2(sheet.title);
  sheet.blocks.forEach((b) => doc.block(b));
  return doc.finalize();
}
