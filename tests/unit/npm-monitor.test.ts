import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkNpmPackage } from "../../src/guard/monitors/npm.js";

describe("npm monitor", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("parses registry response and returns latest version", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: "2.1.0" }),
    });

    const result = await checkNpmPackage({ name: "commander", label: "Commander" });
    expect(result.status).toBe("pass");
    expect(result.message).toContain("2.1.0");
    expect(result.details?.latestVersion).toBe("2.1.0");
  });

  it("detects version info from registry", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: "2.0.0" }),
    });

    const result = await checkNpmPackage({ name: "my-pkg", label: "My Package" });
    expect(result.status).toBe("pass");
    expect(result.details?.latestVersion).toBe("2.0.0");
  });

  it("handles scoped packages (@org/pkg)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: "1.5.0" }),
    });

    const result = await checkNpmPackage({
      name: "@0gfoundation/0g-ts-sdk",
      label: "TypeScript SDK",
    });

    expect(result.status).toBe("pass");
    expect(result.details?.package).toBe("@0gfoundation/0g-ts-sdk");
    // Verify the URL was called with properly encoded scoped package
    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toContain("@0gfoundation");
  });

  it("handles 404 (package not found)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await checkNpmPackage({ name: "nonexistent-pkg-xyz", label: "Nonexistent" });
    expect(result.status).toBe("fail");
    expect(result.message).toContain("not found");
  });
});
