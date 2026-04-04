export type GuardStatus = "pass" | "warn" | "fail";

export interface GuardResult {
  monitor: string;
  label: string;
  status: GuardStatus;
  message: string;
  details?: Record<string, unknown>;
}
