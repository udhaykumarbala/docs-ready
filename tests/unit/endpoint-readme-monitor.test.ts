import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkEndpoint } from "../../src/guard/monitors/endpoints.js";
import { scanReadme } from "../../src/guard/monitors/readme-keywords.js";

describe("endpoint monitor", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reports correct status codes", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
    });

    const result = await checkEndpoint({ url: "https://example.com", label: "Example" });
    expect(result.status).toBe("pass");
    expect(result.details?.statusCode).toBe(200);
  });

  it("fails on unexpected status codes", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 500,
    });

    const result = await checkEndpoint({ url: "https://example.com", label: "Example" });
    expect(result.status).toBe("fail");
    expect(result.message).toContain("500");
  });

  it("handles DNS/connection failures", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("getaddrinfo ENOTFOUND bad.example.com")
    );

    const result = await checkEndpoint({ url: "https://bad.example.com", label: "Bad" });
    expect(result.status).toBe("fail");
    expect(result.message).toContain("ENOTFOUND");
  });
});

describe("README scanner", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("detects 'breaking' keyword with context", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "# Changelog\n\n## v2.0.0\n\nThis is a breaking change that removes the old API.\n",
    });

    const result = await scanReadme({
      repo: "org/repo",
      keywords: ["breaking"],
    });
    expect(result.status).toBe("warn");
    expect(result.message).toContain("breaking");
    expect(result.details?.matches).toBeDefined();
  });

  it("handles 404 (no README)", async () => {
    const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
    // main branch 404
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    // master branch 404
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await scanReadme({
      repo: "org/repo",
      keywords: ["breaking"],
    });
    expect(result.status).toBe("warn");
    expect(result.message).toContain("No README");
  });
});
