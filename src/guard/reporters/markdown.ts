import type { GuardResult } from "../types.js";

const STATUS_EMOJI: Record<string, string> = {
  pass: "✅",
  warn: "⚠️",
  fail: "❌",
};

export function formatMarkdown(results: GuardResult[]): string {
  const lines: string[] = [];

  lines.push("# docs-ready Guard Report");
  lines.push("");
  lines.push("| Status | Monitor | Label | Message |");
  lines.push("|--------|---------|-------|---------|");

  for (const result of results) {
    const emoji = STATUS_EMOJI[result.status];
    lines.push(`| ${emoji} ${result.status} | ${result.monitor} | ${result.label} | ${result.message} |`);
  }

  const failed = results.filter((r) => r.status === "fail").length;
  lines.push("");
  if (failed > 0) {
    lines.push(`**${failed} check(s) failed.** Please review and update AI-facing documentation.`);
  } else {
    lines.push("All checks passed.");
  }

  return lines.join("\n");
}
