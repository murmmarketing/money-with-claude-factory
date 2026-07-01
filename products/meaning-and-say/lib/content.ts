import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = join(process.cwd(), "content");

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  body: string; // markdown body (frontmatter stripped)
}

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  }
  return { data, body: match[2] };
}

export function getAllArticles(): Article[] {
  let files: string[] = [];
  try {
    files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const articles = files.map((file) => {
    const raw = readFileSync(join(CONTENT_DIR, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    return {
      slug: data.slug || file.replace(/\.md$/, ""),
      title: data.title || file,
      description: data.description || "",
      category: data.category || "",
      date: data.date || "",
      body
    };
  });
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getArticle(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  // links [label](href)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label, href) => `<a href="${href}">${label}</a>`
  );
  // bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic *text*
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

/**
 * Minimal, dependency-free Markdown renderer covering the subset used by our
 * articles: headings (#, ##, ###), unordered lists, and paragraphs with
 * inline bold, italic, and links. Returns safe HTML (source is our own files).
 */
export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") {
      flushPara();
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      closeList();
      const level = heading[1].length;
      // Demote H1 in body to H2 (page already has an H1).
      const tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      html.push(`<${tag}>${inline(heading[2])}</${tag}>`);
      continue;
    }

    const li = /^[-*]\s+(.*)$/.exec(line);
    if (li) {
      flushPara();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inline(li[1])}</li>`);
      continue;
    }

    para.push(line.trim());
  }
  flushPara();
  closeList();
  return html.join("\n");
}
