export type Severity = "error" | "warning" | "off";

export interface ValidationResult {
  rule: string;
  severity: Severity;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}
