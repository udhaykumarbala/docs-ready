import type { ScannedPage } from "../core/scanner.js";

export interface KeyPageResult {
  page: ScannedPage;
  reasons: string[];
}

const PATH_KEYWORDS = [
  "getting-started", "quickstart", "quick-start", "setup", "install",
  "tutorial", "overview", "introduction", "api", "sdk", "reference",
  "config", "configuration", "network", "deploy", "migration",
];

const TITLE_KEYWORDS = [
  "getting started", "quickstart", "quick start", "setup", "install",
  "tutorial", "overview", "introduction", "api reference", "sdk",
  "reference", "config", "configuration", "network", "deploy", "migration",
];

const CONTENT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /0x[a-fA-F0-9]{40}/, label: "contract-address" },
  { pattern: /chain\s*id/i, label: "chain-id" },
  { pattern: /rpc\s*(url|endpoint)/i, label: "rpc-url" },
  { pattern: /npm install\s+\S+/, label: "npm-install" },
  { pattern: /go get\s+\S+/, label: "go-get" },
  { pattern: /pip install\s+\S+/, label: "pip-install" },
];

export function detectKeyPages(pages: ScannedPage[]): KeyPageResult[] {
  const results: KeyPageResult[] = [];

  for (const page of pages) {
    const reasons: string[] = [];
    const pathLower = page.relativePath.toLowerCase();
    const titleLower = page.title.toLowerCase();

    if (PATH_KEYWORDS.some((kw) => pathLower.includes(kw))) {
      reasons.push("path-keyword");
    }

    if (TITLE_KEYWORDS.some((kw) => titleLower.includes(kw))) {
      reasons.push("title-keyword");
    }

    if (CONTENT_PATTERNS.some((cp) => cp.pattern.test(page.content))) {
      reasons.push("content-pattern");
    }

    if (reasons.length > 0) {
      results.push({ page, reasons });
    }
  }

  return results;
}
