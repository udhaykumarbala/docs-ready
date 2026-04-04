import type { ValidationResult } from "../types.js";

export function validateFormat(content: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const lines = content.split("\n");

  // Check H1 title
  const hasH1 = lines.some((l) => /^# .+/.test(l));
  results.push({
    rule: "format",
    severity: "error",
    passed: hasH1,
    message: hasH1 ? "H1 title present" : "Missing H1 title (required by llmstxt.org spec)",
  });

  // Check blockquote description
  const hasBlockquote = lines.some((l) => /^> .+/.test(l));
  results.push({
    rule: "format",
    severity: "error",
    passed: hasBlockquote,
    message: hasBlockquote ? "Blockquote description present" : "Missing blockquote description",
  });

  // Check link format: - [Title](url) or - [Title](url): description
  const linkLines = lines.filter((l) => l.trim().startsWith("- ["));
  const malformed = linkLines.filter((l) => !/^- \[.+\]\(.+\)/.test(l.trim()));
  const linksOk = malformed.length === 0 && linkLines.length > 0;
  results.push({
    rule: "format",
    severity: "error",
    passed: linksOk,
    message: linksOk
      ? `${linkLines.length} link entries correctly formatted`
      : malformed.length > 0
        ? `${malformed.length} malformed link entries`
        : "No link entries found",
  });

  return results;
}
