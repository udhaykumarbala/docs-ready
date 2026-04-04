import type { ValidationResult } from "../types.js";

export function validateCoverage(
  llmsTxtContent: string,
  totalPages: number,
  threshold: number
): ValidationResult {
  // Count unique links in llms.txt
  const linkRegex = /- \[.+?\]\((.+?)\)/g;
  const links = new Set<string>();
  let match;
  while ((match = linkRegex.exec(llmsTxtContent)) !== null) {
    links.add(match[1]);
  }

  const coverage = totalPages > 0 ? links.size / totalPages : 0;
  const passed = coverage >= threshold;
  const pct = Math.round(coverage * 100);

  return {
    rule: "coverage",
    severity: "error",
    passed,
    message: passed
      ? `Coverage ${pct}% (${links.size}/${totalPages} pages) meets ${Math.round(threshold * 100)}% threshold`
      : `Coverage ${pct}% (${links.size}/${totalPages} pages) below ${Math.round(threshold * 100)}% threshold`,
    details: { coverage, linkedPages: links.size, totalPages, threshold },
  };
}
