import path from "node:path";
import { minimatch } from "minimatch";
import type { ScannedPage } from "../core/scanner.js";

export interface LlmsTxtConfig {
  title: string;
  description: string;
  url: string;
  sections?: Array<{ title: string; patterns: string[] }>;
}

export function generateLlmsTxt(pages: ScannedPage[], config: LlmsTxtConfig): string {
  const lines: string[] = [];

  // H1 title
  lines.push(`# ${config.title}`);
  lines.push("");

  // Blockquote description
  lines.push(`> ${config.description}`);
  lines.push("");

  if (config.sections && config.sections.length > 0) {
    const assigned = new Set<string>();

    for (const section of config.sections) {
      const matched = pages.filter((page) =>
        section.patterns.some((pattern) => minimatch(page.relativePath, pattern))
      );
      if (matched.length === 0) continue;

      lines.push(`## ${section.title}`);
      lines.push("");
      for (const page of matched) {
        lines.push(formatEntry(page, config.url));
        assigned.add(page.relativePath);
      }
      lines.push("");
    }

    const ungrouped = pages.filter((p) => !assigned.has(p.relativePath));
    if (ungrouped.length > 0) {
      lines.push("## Optional");
      lines.push("");
      for (const page of ungrouped) {
        lines.push(formatEntry(page, config.url));
      }
      lines.push("");
    }
  } else {
    const groups = groupByDirectory(pages);

    for (const [dir, groupPages] of groups) {
      const sectionTitle = dir === "."
        ? "General"
        : dir.charAt(0).toUpperCase() + dir.slice(1).replace(/[-_]/g, " ");
      lines.push(`## ${sectionTitle}`);
      lines.push("");
      for (const page of groupPages) {
        lines.push(formatEntry(page, config.url));
      }
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

function formatEntry(page: ScannedPage, baseUrl: string): string {
  const url = pageUrl(page, baseUrl);
  const desc = page.description ?? extractFirstParagraph(page.content);
  if (desc) {
    return `- [${page.title}](${url}): ${desc}`;
  }
  return `- [${page.title}](${url})`;
}

function pageUrl(page: ScannedPage, baseUrl: string): string {
  const normalized = baseUrl.replace(/\/$/, "");
  const slug = page.relativePath
    .replace(/\.mdx?$/, "")
    .replace(/\/index$/, "")
    .replace(/^README$/i, "");
  if (!slug) return normalized + "/";
  return `${normalized}/${slug}`;
}

function extractFirstParagraph(content: string): string | null {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("```")) continue;
    if (trimmed.startsWith("<")) continue;
    if (trimmed.startsWith("import ")) continue;
    return trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;
  }
  return null;
}

function groupByDirectory(pages: ScannedPage[]): Map<string, ScannedPage[]> {
  const groups = new Map<string, ScannedPage[]>();
  for (const page of pages) {
    const dir = path.dirname(page.relativePath);
    const topDir = dir === "." ? "." : dir.split("/")[0];
    if (!groups.has(topDir)) {
      groups.set(topDir, []);
    }
    groups.get(topDir)!.push(page);
  }
  return groups;
}
