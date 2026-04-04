import { describe, it, expect } from "vitest";
import { formatConsole } from "../../src/guard/reporters/console.js";
import { formatJson } from "../../src/guard/reporters/json.js";
import { formatMarkdown } from "../../src/guard/reporters/markdown.js";
import type { GuardResult } from "../../src/guard/types.js";

const SAMPLE_RESULTS: GuardResult[] = [
  { monitor: "npm", label: "SDK", status: "pass", message: "Latest: 1.0.0" },
  { monitor: "endpoint", label: "RPC", status: "fail", message: "Connection refused" },
  { monitor: "readme", label: "org/repo", status: "warn", message: "Found: breaking" },
];

describe("console reporter", () => {
  it("formats pass/warn/fail with correct icons", () => {
    const output = formatConsole(SAMPLE_RESULTS);
    expect(output).toContain("✔");
    expect(output).toContain("✖");
    expect(output).toContain("⚠");
    expect(output).toContain("1 passed");
    expect(output).toContain("1 warnings");
    expect(output).toContain("1 failed");
  });
});

describe("JSON reporter", () => {
  it("produces valid JSON array of results", () => {
    const output = formatJson(SAMPLE_RESULTS);
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].monitor).toBe("npm");
    expect(parsed[1].status).toBe("fail");
  });
});

describe("markdown reporter", () => {
  it("produces valid markdown table", () => {
    const output = formatMarkdown(SAMPLE_RESULTS);
    expect(output).toContain("| Status | Monitor | Label | Message |");
    expect(output).toContain("| ✅ pass | npm | SDK |");
    expect(output).toContain("| ❌ fail | endpoint | RPC |");
    expect(output).toContain("1 check(s) failed");
  });
});
