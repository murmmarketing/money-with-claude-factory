import { Industry, getIndustry, industries } from "@/data/industries";

// Generates the REAL deliverable files from the corpus. These are what a buyer
// downloads after Checkout: an ATS-safe resume template that opens in Word, a
// formatted bullet library, a cover-letter pack, an ATS keyword list, and a
// one-page "beat the ATS" checklist.

// --- ATS-safe resume template as Word-openable HTML (.doc) ---------------------
// Single column, standard fonts, no tables/columns/graphics that break parsers.
export function resumeTemplateDoc(ind: Industry): string {
  const sampleBullets = ind.bullets.filter((b) => b.seniority !== "entry").slice(0, 4);
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${ind.name} Resume Template</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
 body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; line-height: 1.35; margin: 0.75in; }
 h1 { font-size: 20pt; margin: 0 0 2pt 0; }
 .contact { font-size: 10pt; color: #333; margin-bottom: 12pt; }
 h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #444; padding-bottom: 2pt; margin: 14pt 0 6pt 0; }
 ul { margin: 0 0 8pt 0; padding-left: 18pt; }
 li { margin-bottom: 3pt; }
 .role { font-weight: bold; }
 .meta { font-style: italic; color: #333; }
 p { margin: 0 0 6pt 0; }
</style>
</head>
<body>
<h1>[YOUR FULL NAME]</h1>
<div class="contact">[City, State] &nbsp;|&nbsp; [Phone] &nbsp;|&nbsp; [Email] &nbsp;|&nbsp; [LinkedIn URL]</div>

<h2>Professional Summary</h2>
<p>${ind.atsSummary}</p>

<h2>Core Skills</h2>
<p>${ind.atsKeywords.join(" &nbsp;&bull;&nbsp; ")}</p>

<h2>Professional Experience</h2>
<p class="role">[Job Title] &mdash; [Company Name]</p>
<p class="meta">[City, State] &nbsp;|&nbsp; [Start Month Year] &ndash; [End Month Year / Present]</p>
<ul>
${sampleBullets.map((b) => `  <li>${b.text}</li>`).join("\n")}
  <li>[Add 2&ndash;4 more bullets from your ${ind.name} bullet library, tailored to this job.]</li>
</ul>

<p class="role">[Previous Job Title] &mdash; [Company Name]</p>
<p class="meta">[City, State] &nbsp;|&nbsp; [Start Month Year] &ndash; [End Month Year]</p>
<ul>
  <li>[Bullet from your library, quantified where possible.]</li>
  <li>[Bullet from your library, quantified where possible.]</li>
  <li>[Bullet from your library, quantified where possible.]</li>
</ul>

<h2>Education & Certifications</h2>
<p>[Degree / Program] &mdash; [Institution], [Year]</p>
<p>[Relevant certification or license, if applicable]</p>

</body>
</html>`;
}

// --- Bullet library (Markdown) -------------------------------------------------
export function bulletLibrary(ind: Industry): string {
  const byCat = new Map<string, string[]>();
  for (const b of ind.bullets) {
    const key = `${b.category} (${b.seniority})`;
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(b.text);
  }
  let out = `# ${ind.name} — ATS Bullet Point Library\n\n`;
  out += `Use these as starting points. Swap in your own numbers — quantified bullets\n`;
  out += `beat vague ones every time. Aim for: Action verb + what you did + measurable result.\n\n`;
  out += `## Ready-to-paste professional summary\n\n${ind.atsSummary}\n\n`;
  for (const [cat, list] of byCat) {
    out += `## ${cat}\n\n`;
    for (const t of list) out += `- ${t}\n`;
    out += `\n`;
  }
  out += `## Strong action verbs to lead with\n\n`;
  out += `Achieved, Led, Built, Reduced, Increased, Managed, Delivered, Designed, Improved,\n`;
  out += `Streamlined, Coordinated, Resolved, Trained, Launched, Owned, Drove, Optimized,\n`;
  out += `Implemented, Negotiated, Analyzed, Automated, Mentored, Exceeded, Maintained.\n`;
  return out;
}

// --- Cover-letter pack (Markdown) ---------------------------------------------
export function coverLetterPack(ind: Industry): string {
  let out = `# ${ind.name} — Cover Letter Snippets & Template\n\n`;
  out += `## Full template (fill the brackets)\n\n`;
  out += `Dear [Hiring Manager / Name],\n\n`;
  out += `${ind.coverLetterLines[0]}\n\n`;
  out += `${ind.coverLetterLines[1]} ${ind.coverLetterLines[2]}\n\n`;
  out += `${ind.coverLetterLines[3]}\n\n`;
  out += `${ind.coverLetterLines[4]}\n\n`;
  out += `Sincerely,\n[Your Name]\n\n`;
  out += `## Swappable snippets\n\n`;
  ind.coverLetterLines.forEach((l, i) => {
    out += `${i + 1}. ${l}\n`;
  });
  out += `\n## Tips\n\n`;
  out += `- Keep it to 3 short paragraphs. Recruiters skim.\n`;
  out += `- Name the company and one specific reason you want THIS job.\n`;
  out += `- Mirror 3-4 keywords from the job description (see your keyword list).\n`;
  return out;
}

// --- ATS keyword list ----------------------------------------------------------
export function keywordList(ind: Industry): string {
  let out = `# ${ind.name} — ATS Keyword List\n\n`;
  out += `Applicant Tracking Systems rank you on keyword match. Weave these naturally into\n`;
  out += `your summary, skills, and bullets — only the ones that are genuinely true for you.\n\n`;
  out += ind.atsKeywords.map((k) => `- ${k}`).join("\n");
  out += `\n\n## Common role titles to match\n\n`;
  out += ind.roles.map((r) => `- ${r}`).join("\n");
  return out;
}

// --- One-page ATS checklist (shared across all kits) --------------------------
export function atsChecklist(): string {
  return `# Beat the ATS — One-Page Checklist

## Formatting (so the parser can read you)
- [ ] Single column. No text boxes, tables, or multi-column layouts.
- [ ] Standard fonts (Calibri, Arial, Georgia). No graphics or icons.
- [ ] Save and submit as .docx unless the posting explicitly asks for PDF.
- [ ] Real section headings: "Professional Experience", "Education", "Skills".
- [ ] No headers/footers for critical info — many parsers skip them.
- [ ] Dates as "Jan 2022 - Present". Consistent format throughout.

## Keywords (so you rank)
- [ ] Pull 8-12 keywords straight from the job description.
- [ ] Match the exact phrasing (e.g. "accounts payable", not just "AP").
- [ ] Spell out AND abbreviate once: "Applicant Tracking System (ATS)".
- [ ] Put a "Core Skills" line near the top with your top keywords.

## Content (so a human says yes after the ATS says yes)
- [ ] Every bullet: action verb + what you did + measurable result.
- [ ] Quantify everything you can (%, $, #, time saved).
- [ ] Tailor the top third of the resume to each specific job.
- [ ] Cut anything older than ~10 years unless highly relevant.
- [ ] One page for <10 years experience; two pages max otherwise.

## Before you hit submit
- [ ] Filename: FirstName-LastName-Resume.docx
- [ ] Proofread out loud. Then run a spell check. Then read it backwards.
- [ ] Paste the job description and your resume into a keyword-match check.
- [ ] Confirm your contact info is in the body, not just the header.
`;
}

// --- README that ships inside the kit -----------------------------------------
export function kitReadme(products: Industry[]): string {
  const list = products.map((p) => `- ${p.name}`).join("\n");
  return `# Your ResumeVault Kit

Thank you! Here's what's included${products.length > 1 ? " for every industry in the vault" : ""}:

${list}

## Files per industry
1. Resume template (.doc) — opens in Word/Google Docs, ATS-safe single column.
2. Bullet library (.md) — dozens of ready-to-tailor bullets + summary.
3. Cover letter pack (.md) — full template + swappable snippets.
4. Keyword list (.md) — the ATS keywords to weave in.
5. Beat-the-ATS checklist (.md) — one page, print it and tick it off.

## How to use it (15 minutes)
1. Open the resume template and replace the bracketed placeholders.
2. Open the bullet library and paste in 4-6 bullets that fit your real experience.
3. Swap the sample numbers for YOUR numbers.
4. Run through the ATS checklist before you submit.

Good luck. You've got this.
`;
}

// --- File manifest for the download page + API --------------------------------
export interface KitFile {
  id: string; // used in the download URL
  label: string;
  filename: string;
  contentType: string;
  build: (ind: Industry) => string;
}

export const KIT_FILES: KitFile[] = [
  {
    id: "resume",
    label: "Resume template (Word .doc)",
    filename: "resume-template.doc",
    contentType: "application/msword",
    build: resumeTemplateDoc
  },
  {
    id: "bullets",
    label: "Bullet point library",
    filename: "bullet-library.md",
    contentType: "text/markdown",
    build: bulletLibrary
  },
  {
    id: "cover",
    label: "Cover letter pack",
    filename: "cover-letters.md",
    contentType: "text/markdown",
    build: coverLetterPack
  },
  {
    id: "keywords",
    label: "ATS keyword list",
    filename: "keywords.md",
    contentType: "text/markdown",
    build: keywordList
  }
];

export function buildFile(fileId: string, industrySlug: string): { body: string; type: string; name: string } | null {
  if (fileId === "checklist") {
    return { body: atsChecklist(), type: "text/markdown", name: "beat-the-ats-checklist.md" };
  }
  const ind = getIndustry(industrySlug);
  if (!ind) return null;
  const spec = KIT_FILES.find((f) => f.id === fileId);
  if (!spec) return null;
  return { body: spec.build(ind), type: spec.contentType, name: `${ind.slug}-${spec.filename}` };
}

export function vaultIndustries(): Industry[] {
  return industries;
}
