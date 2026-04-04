import { describe, it, expect } from "vitest";
import { generateVercelHeaders } from "../../src/deploy/vercel.js";
import { generateNetlifyHeaders } from "../../src/deploy/netlify.js";
import { generateCloudflareHeaders } from "../../src/deploy/cloudflare.js";

describe("Vercel deploy config", () => {
  it("produces valid JSON with CORS headers", () => {
    const config = generateVercelHeaders();
    expect(config.headers).toBeDefined();
    expect(config.headers!.length).toBeGreaterThanOrEqual(4);
    expect(config.headers![0].source).toBe("/llms.txt");
    expect(config.headers![0].headers[0].key).toBe("Access-Control-Allow-Origin");
  });

  it("merges without overwriting existing config", () => {
    const existing = {
      rewrites: [{ source: "/api/:path*", destination: "/api/:path*" }],
      headers: [{ source: "/custom", headers: [{ key: "X-Custom", value: "yes" }] }],
    };
    const merged = generateVercelHeaders(existing);
    expect(merged.rewrites).toEqual(existing.rewrites);
    expect(merged.headers!.length).toBe(5); // 1 existing + 4 new
    expect(merged.headers![0].source).toBe("/custom");
  });
});

describe("Netlify deploy config", () => {
  it("produces valid _headers format", () => {
    const headers = generateNetlifyHeaders();
    expect(headers).toContain("/llms.txt");
    expect(headers).toContain("Access-Control-Allow-Origin: *");
  });

  it("is idempotent", () => {
    const first = generateNetlifyHeaders("");
    const second = generateNetlifyHeaders(first);
    expect(second).toBe(first);
  });
});

describe("Cloudflare deploy config", () => {
  it("produces valid _headers format", () => {
    const headers = generateCloudflareHeaders();
    expect(headers).toContain("/llms.txt");
    expect(headers).toContain("Access-Control-Allow-Origin: *");
  });
});
