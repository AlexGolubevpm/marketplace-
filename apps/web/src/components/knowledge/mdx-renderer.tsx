/**
 * Server-safe markdown renderer with whitelisted custom components.
 * Supports a subset of Markdown + custom block syntax:
 *   :::callout type="warning"  ... :::
 *   :::notice ... :::
 *   :::steps ... :::
 *   :::checklist ... :::
 *   :::compare ... :::
 */
import { type ReactNode } from "react";

// ── Whitelisted custom components ─────────────────────────────────────────────
function CallToAction({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 rounded-2xl bg-red-50 border border-red-100 p-6 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1 text-gray-800">{children}</div>
      <a
        href="/get-quote"
        className="shrink-0 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Получить расчёт
      </a>
    </div>
  );
}

function Notice({
  children,
  type = "info",
}: {
  children: ReactNode;
  type?: "info" | "warning" | "danger" | "success";
}) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-red-50 border-red-200 text-red-900",
    success: "bg-green-50 border-green-200 text-green-900",
  };
  const icons = { info: "ℹ️", warning: "⚠️", danger: "🚨", success: "✅" };
  return (
    <div className={`my-6 rounded-xl border p-4 ${styles[type]}`}>
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="my-6 space-y-3 list-none counter-reset-steps pl-0">
      {children}
    </ol>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="my-6 space-y-2 list-none pl-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-gray-700">
          <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CompareTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-semibold text-gray-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-gray-600 border-t border-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Markdown parser ────────────────────────────────────────────────────────────
function parseInline(text: string): string {
  return (
    text
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono text-red-600">$1</code>')
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-red-600 hover:text-red-700 underline underline-offset-2">$1</a>'
      )
  );
}

function parseLine(line: string): string | null {
  // Headings
  const h3 = line.match(/^### (.+)/);
  if (h3) return `<h3 class="text-xl font-bold text-gray-900 mt-8 mb-3" id="${slugifyHeading(h3[1])}">${parseInline(h3[1])}</h3>`;
  const h2 = line.match(/^## (.+)/);
  if (h2) return `<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4" id="${slugifyHeading(h2[1])}">${parseInline(h2[1])}</h2>`;
  const h1 = line.match(/^# (.+)/);
  if (h1) return `<h1 class="text-3xl font-bold text-gray-900 mt-6 mb-4" id="${slugifyHeading(h1[1])}">${parseInline(h1[1])}</h1>`;

  // Horizontal rule
  if (/^---+$/.test(line)) return '<hr class="my-8 border-gray-200">';

  // Blockquote
  if (line.startsWith("> ")) {
    return `<blockquote class="my-4 pl-4 border-l-4 border-red-300 text-gray-600 italic">${parseInline(line.slice(2))}</blockquote>`;
  }

  return null;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => {
      const m: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
        ж: "zh", з: "z", и: "i", й: "j", к: "k", л: "l", м: "m",
        н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
        ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
        ы: "y", э: "e", ю: "yu", я: "ya",
      };
      return m[c] || c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractHeadings(
  content: string
): Array<{ id: string; text: string; level: 2 | 3 }> {
  const headings: Array<{ id: string; text: string; level: 2 | 3 }> = [];
  for (const line of content.split("\n")) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) headings.push({ id: slugifyHeading(h2[1]), text: h2[1], level: 2 });
    else if (h3) headings.push({ id: slugifyHeading(h3[1]), text: h3[1], level: 3 });
  }
  return headings;
}

// ── Custom block parser ────────────────────────────────────────────────────────
type Block =
  | { kind: "html"; html: string }
  | { kind: "cta"; content: string }
  | { kind: "notice"; noticeType: string; content: string }
  | { kind: "steps"; items: string[] }
  | { kind: "checklist"; items: string[] }
  | { kind: "compare"; headers: string[]; rows: string[][] }
  | { kind: "code"; lang: string; content: string }
  | { kind: "table"; headers: string[]; rows: string[][] };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Custom block start: :::name [attr="val"]
    const blockStart = line.match(/^:::(\w+)(?:\s+(.*))?$/);
    if (blockStart) {
      const blockName = blockStart[1];
      const attrs = blockStart[2] ?? "";
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && lines[i] !== ":::") {
        bodyLines.push(lines[i]);
        i++;
      }
      const bodyContent = bodyLines.join("\n");

      switch (blockName) {
        case "callout":
        case "cta":
          blocks.push({ kind: "cta", content: bodyContent });
          break;
        case "notice": {
          const typeMatch = attrs.match(/type="?(\w+)"?/);
          blocks.push({
            kind: "notice",
            noticeType: typeMatch?.[1] ?? "info",
            content: bodyContent,
          });
          break;
        }
        case "steps": {
          const items = bodyLines
            .filter((l) => /^\d+\.\s/.test(l))
            .map((l) => l.replace(/^\d+\.\s/, ""));
          blocks.push({ kind: "steps", items });
          break;
        }
        case "checklist": {
          const items = bodyLines
            .filter((l) => /^[-*]\s/.test(l))
            .map((l) => l.replace(/^[-*]\s/, ""));
          blocks.push({ kind: "checklist", items });
          break;
        }
        case "compare": {
          const tableLines = bodyLines.filter((l) => l.includes("|"));
          const headers = tableLines[0]
            ?.split("|")
            .map((c) => c.trim())
            .filter(Boolean) ?? [];
          const rows = tableLines
            .slice(2) // skip header separator
            .map((l) => l.split("|").map((c) => c.trim()).filter(Boolean));
          blocks.push({ kind: "compare", headers, rows });
          break;
        }
        default:
          // Render as HTML passthrough (ignored custom blocks)
          blocks.push({ kind: "html", html: `<!-- unknown block: ${blockName} -->` });
      }
      i++; // skip closing :::
      continue;
    }

    // Fenced code block
    const codeStart = line.match(/^```(\w*)/);
    if (codeStart) {
      const lang = codeStart[1] ?? "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeHtml = codeLines
        .join("\n")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      blocks.push({
        kind: "html",
        html: `<pre class="my-6 overflow-x-auto rounded-xl bg-gray-950 p-5 text-sm text-gray-100"><code class="language-${lang} font-mono">${codeHtml}</code></pre>`,
      });
      i++; // skip closing ```
      continue;
    }

    // Markdown table
    if (line.includes("|") && lines[i + 1]?.match(/^[\s|:-]+$/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0]
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      const rows = tableLines
        .slice(2)
        .map((l) => l.split("|").map((c) => c.trim()).filter(Boolean));
      blocks.push({ kind: "compare", headers, rows });
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^[-*] /, "")));
        i++;
      }
      blocks.push({
        kind: "html",
        html: `<ul class="my-4 space-y-2 list-none pl-0">${items.map((it) => `<li class="flex items-start gap-2 text-gray-700"><span class="mt-1 text-red-500">•</span><span>${it}</span></li>`).join("")}</ul>`,
      });
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let n = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\d+\. /, "")));
        i++;
        n++;
      }
      blocks.push({
        kind: "html",
        html: `<ol class="my-4 space-y-2 list-none pl-0">${items.map((it, idx) => `<li class="flex items-start gap-3 text-gray-700"><span class="shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mt-0.5">${idx + 1}</span><span>${it}</span></li>`).join("")}</ol>`,
      });
      continue;
    }

    // Single-line markdown
    const parsed = parseLine(line);
    if (parsed) {
      blocks.push({ kind: "html", html: parsed });
      i++;
      continue;
    }

    // Paragraph accumulation
    if (line.trim()) {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].match(/^[#>```|:*\d]/)) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        blocks.push({
          kind: "html",
          html: `<p class="my-4 text-gray-700 leading-relaxed">${parseInline(paraLines.join(" "))}</p>`,
        });
      } else {
        i++;
      }
      continue;
    }

    i++;
  }

  return blocks;
}

// ── Main renderer ──────────────────────────────────────────────────────────────
export function MdxRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="prose-knowledge">
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case "html":
            return (
              <div
                key={idx}
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            );
          case "cta":
            return (
              <CallToAction key={idx}>
                <p>{block.content}</p>
              </CallToAction>
            );
          case "notice":
            return (
              <Notice key={idx} type={block.noticeType as any}>
                <span>{block.content}</span>
              </Notice>
            );
          case "steps":
            return (
              <Steps key={idx}>
                {block.items.map((item, si) => (
                  <li key={si} className="flex items-start gap-3 text-gray-700">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                      {si + 1}
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </Steps>
            );
          case "checklist":
            return <Checklist key={idx} items={block.items} />;
          case "compare":
            return (
              <CompareTable key={idx} headers={block.headers} rows={block.rows} />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
