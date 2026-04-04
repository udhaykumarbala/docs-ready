import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateLinks } from "../../src/validate/rules/links.js";

describe("links rule", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("detects dead links (404)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const content = "- [Page](https://example.com/dead)";
    const results = await validateLinks(content);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain("404");
  });

  it("passes for live links (200)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
    });

    const content = "- [Page](https://example.com/live)";
    const results = await validateLinks(content);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it("handles timeout", async () => {
    const err = new Error("timeout");
    err.name = "AbortError";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const content = "- [Page](https://example.com/slow)";
    const results = await validateLinks(content);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain("timeout");
  });
});
