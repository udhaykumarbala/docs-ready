import { fetchWithTimeout } from "../../utils/http.js";
import type { ValidationResult } from "../types.js";

export async function validateLinks(content: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const urls = new Set<string>();
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    urls.add(match[2]);
  }

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, { timeout: 10000 });
      if (response.ok || response.status === 301 || response.status === 302) {
        results.push({
          rule: "links",
          severity: "error",
          passed: true,
          message: `${url} — ${response.status} OK`,
        });
      } else {
        results.push({
          rule: "links",
          severity: "error",
          passed: false,
          message: `${url} — ${response.status}`,
          details: { url, statusCode: response.status },
        });
      }
    } catch (error) {
      const err = error as Error;
      results.push({
        rule: "links",
        severity: "warning",
        passed: false,
        message: `${url} — ${err.name === "AbortError" ? "timeout" : err.message}`,
        details: { url, error: err.message },
      });
    }
  }

  return results;
}
