import { estimateTokens } from "../../utils/tokens.js";
import type { ValidationResult } from "../types.js";

export function validateTokens(content: string, maxTokens: number): ValidationResult {
  const count = estimateTokens(content);
  const passed = count <= maxTokens;
  return {
    rule: "tokens",
    severity: "warning",
    passed,
    message: passed
      ? `Token count ~${count} is within limit (${maxTokens})`
      : `Token count ~${count} exceeds limit of ${maxTokens}`,
    details: { estimatedTokens: count, maxTokens },
  };
}
