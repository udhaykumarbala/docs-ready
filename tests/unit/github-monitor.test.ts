import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkGitHubRelease } from "../../src/guard/monitors/github.js";

describe("GitHub monitor", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("parses release tag from releases API", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ tag_name: "v1.2.3", published_at: "2025-12-01T10:00:00Z" }),
    });

    const result = await checkGitHubRelease({ repo: "org/repo", label: "Test Repo" });
    expect(result.status).toBe("pass");
    expect(result.message).toContain("v1.2.3");
    expect(result.details?.tag).toBe("v1.2.3");
  });

  it("falls back to tags API when no releases exist", async () => {
    const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
    // First call: releases returns 404
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    // Second call: tags returns data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ name: "v0.9.0" }],
    });

    const result = await checkGitHubRelease({ repo: "org/repo", label: "Test Repo" });
    expect(result.status).toBe("pass");
    expect(result.message).toContain("v0.9.0");
  });

  it("handles 403 rate limit gracefully", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 403,
    });

    const result = await checkGitHubRelease({ repo: "org/repo", label: "Test Repo" });
    expect(result.status).toBe("warn");
    expect(result.message).toContain("rate limit");
  });
});
