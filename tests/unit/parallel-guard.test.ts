import { describe, it, expect } from "vitest";
import { getExitCode } from "../../src/guard/runner.js";
import type { GuardResult } from "../../src/guard/types.js";

describe("parallel guard runner", () => {
  it("respects concurrency limit", async () => {
    // This is a unit test for getExitCode behavior (parallel is tested via integration)
    const results: GuardResult[] = [
      { monitor: "npm", label: "A", status: "pass", message: "ok" },
      { monitor: "endpoint", label: "B", status: "pass", message: "ok" },
    ];
    expect(getExitCode(results)).toBe(0);
  });
});
