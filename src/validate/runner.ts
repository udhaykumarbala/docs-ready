import fs from "node:fs/promises";
import path from "node:path";
import type { DocsReadyConfig } from "../core/config.js";
import type { ScannedPage } from "../core/scanner.js";
import type { ValidationResult } from "./types.js";
import { validateFormat } from "./rules/format.js";
import { validateTokens } from "./rules/tokens.js";
import { validateCoverage } from "./rules/coverage.js";
import { validateLinks } from "./rules/links.js";

export async function runValidation(
  config: DocsReadyConfig,
  pages: ScannedPage[],
  outputDir: string
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Read generated files
  const llmsTxtPath = path.join(outputDir, "llms.txt");
  const llmsFullTxtPath = path.join(outputDir, "llms-full.txt");
  const aiContextPath = path.join(outputDir, "ai-context.md");

  let llmsTxt: string | null = null;
  let llmsFullTxt: string | null = null;
  let aiContext: string | null = null;

  try { llmsTxt = await fs.readFile(llmsTxtPath, "utf-8"); } catch {}
  try { llmsFullTxt = await fs.readFile(llmsFullTxtPath, "utf-8"); } catch {}
  try { aiContext = await fs.readFile(aiContextPath, "utf-8"); } catch {}

  // Format check on llms.txt
  if (llmsTxt) {
    results.push(...validateFormat(llmsTxt));
  } else {
    results.push({
      rule: "format",
      severity: "warning",
      passed: false,
      message: "llms.txt not found — run `docs-ready generate` first",
    });
  }

  // Token check on llms-full.txt
  if (llmsFullTxt) {
    results.push(validateTokens(llmsFullTxt, config.validate.max_tokens));
  }

  // Coverage check
  if (llmsTxt && config.validate.check_coverage) {
    results.push(validateCoverage(llmsTxt, pages.length, config.validate.coverage_threshold));
  }

  // Link check
  if (config.validate.check_links) {
    const contentToCheck = [llmsTxt, aiContext].filter(Boolean).join("\n");
    if (contentToCheck) {
      results.push(...await validateLinks(contentToCheck));
    }
  }

  return results;
}

export function getValidationExitCode(results: ValidationResult[]): number {
  return results.some((r) => r.severity === "error" && !r.passed) ? 1 : 0;
}
