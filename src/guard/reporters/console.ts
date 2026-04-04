import chalk from "chalk";
import type { GuardResult } from "../types.js";

const ICONS: Record<string, string> = {
  pass: chalk.green("✔"),
  warn: chalk.yellow("⚠"),
  fail: chalk.red("✖"),
};

export function formatConsole(results: GuardResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    const icon = ICONS[result.status];
    lines.push(`${icon} [${result.monitor}] ${result.label}: ${result.message}`);
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const failed = results.filter((r) => r.status === "fail").length;
  lines.push("");
  lines.push(`Results: ${passed} passed, ${warned} warnings, ${failed} failed`);

  return lines.join("\n");
}
