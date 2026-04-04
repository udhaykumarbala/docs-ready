import { describe, it, expect } from "vitest";
import { getExitCode } from "../../src/guard/runner.js";
import type { GuardResult } from "../../src/guard/types.js";

describe("guard runner", () => {
  it("exit code 0 when all pass", () => {
    const results: GuardResult[] = [
      { monitor: "npm", label: "A", status: "pass", message: "ok" },
      { monitor: "npm", label: "B", status: "warn", message: "ok" },
    ];
    expect(getExitCode(results)).toBe(0);
  });

  it("exit code 1 when any fail", () => {
    const results: GuardResult[] = [
      { monitor: "npm", label: "A", status: "pass", message: "ok" },
      { monitor: "endpoint", label: "B", status: "fail", message: "down" },
    ];
    expect(getExitCode(results)).toBe(1);
  });
});
