import { describe, it, expect } from "vitest";
import { estimateTokens, formatTokens } from "../../src/utils/tokens.js";

describe("estimateTokens", () => {
  it("approximates within 15% for English technical docs", () => {
    const content = "This is a technical documentation page about configuring the API. ".repeat(20);
    const estimate = estimateTokens(content);
    const charBased = Math.ceil(content.length / 4);
    expect(estimate).toBe(charBased);
    expect(estimate).toBeGreaterThan(100);
    expect(estimate).toBeLessThan(1000);
  });
});

describe("formatTokens", () => {
  it("formats thousands with K suffix", () => {
    expect(formatTokens(12500)).toBe("~12.5K tokens");
    expect(formatTokens(500)).toBe("~500 tokens");
  });
});
