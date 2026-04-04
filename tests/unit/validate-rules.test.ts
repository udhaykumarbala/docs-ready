import { describe, it, expect } from "vitest";
import { validateFormat } from "../../src/validate/rules/format.js";
import { validateTokens } from "../../src/validate/rules/tokens.js";
import { validateCoverage } from "../../src/validate/rules/coverage.js";

describe("format rule", () => {
  const VALID = `# My Project

> A great project

## Section

- [Page One](https://example.com/one): Description
- [Page Two](https://example.com/two): Another
`;

  it("passes for valid llms.txt", () => {
    const results = validateFormat(VALID);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it("fails for missing H1", () => {
    const content = "> No title here\n\n- [Page](https://example.com)\n";
    const results = validateFormat(content);
    const h1 = results.find((r) => r.message.includes("H1"));
    expect(h1?.passed).toBe(false);
  });

  it("fails for malformed links", () => {
    const content = "# Title\n\n> Desc\n\n- Broken link no brackets\n";
    const results = validateFormat(content);
    const links = results.find((r) => r.message.includes("link") || r.message.includes("No link"));
    expect(links?.passed).toBe(false);
  });
});

describe("tokens rule", () => {
  it("warns above threshold", () => {
    const content = "x".repeat(600000); // ~150K tokens
    const result = validateTokens(content, 100000);
    expect(result.passed).toBe(false);
    expect(result.severity).toBe("warning");
  });

  it("passes below threshold", () => {
    const content = "Short content";
    const result = validateTokens(content, 150000);
    expect(result.passed).toBe(true);
  });
});

describe("coverage rule", () => {
  const LLMS_TXT = `# Project

> Desc

- [Page 1](https://example.com/one)
- [Page 2](https://example.com/two)
- [Page 3](https://example.com/three)
`;

  it("calculates correct percentage", () => {
    const result = validateCoverage(LLMS_TXT, 4, 0.5);
    expect(result.details?.coverage).toBe(0.75);
    expect(result.details?.linkedPages).toBe(3);
  });

  it("fails below 95% threshold", () => {
    const result = validateCoverage(LLMS_TXT, 10, 0.95);
    expect(result.passed).toBe(false);
  });

  it("passes at 95%+", () => {
    const result = validateCoverage(LLMS_TXT, 3, 0.95);
    expect(result.passed).toBe(true);
    expect(result.details?.coverage).toBe(1);
  });
});
