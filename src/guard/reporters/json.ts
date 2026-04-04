import type { GuardResult } from "../types.js";

export function formatJson(results: GuardResult[]): string {
  return JSON.stringify(results, null, 2);
}
