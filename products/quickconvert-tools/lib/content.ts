import fs from 'node:fs';
import path from 'node:path';

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tool?: string;
  html: string;
};

const CONTENT_DIR = path.join(process.cwd(), 'content');

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  match[1].split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    meta[key] = val;
  });
  return { meta, body: raw.slice(match[0].length) };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s: string): string {
  // Order matters: escape first, then apply inline markdown.
  let out = escapeHtml(s);
  // inline code
  out = out.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const safe = String(url).replace(/"/g, '%22');
    return `<a href="${safe}">${text}</a>`;
  });
  return out;
}

// Minimal, safe Markdown → HTML for our own trusted content files.
function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;
  let inCode = false;
  let codeBuf: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      i++;
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ol) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      i++;
      continue;
    }
    if (ul) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      i++;
      continue;
    }

    if (line.trim() === '') {
      closeList();
      i++;
      continue;
    }

    closeList();
    html.push(`<p>${inline(line)}</p>`);
    i++;
  }

  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }
  closeList();
  return html.join('\n');
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      // The first H1 is rendered as the page title separately, so strip it.
      const withoutH1 = body.replace(/^#\s+.*(\n|$)/, '');
      return {
        slug: meta.slug || f.replace(/\.md$/, ''),
        title: meta.title || f,
        description: meta.description || '',
        date: meta.date || '',
        tool: meta.tool,
        html: markdownToHtml(withoutH1),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getArticle(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}
