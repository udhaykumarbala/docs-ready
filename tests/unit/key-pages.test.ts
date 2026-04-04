import { describe, it, expect } from "vitest";
import { detectKeyPages } from "../../src/generate/key-pages.js";
import { scanDocs } from "../../src/core/scanner.js";
import path from "node:path";

const OG_DOCS = path.resolve("tests/fixtures/0g-style-project/docs");

describe("detectKeyPages", () => {
  it("detects quickstart/getting-started from path keywords", async () => {
    const pages = await scanDocs(OG_DOCS, { include: ["**/*.md"], exclude: [] });
    const keyPages = detectKeyPages(pages);
    const gettingStarted = keyPages.find((kp) => kp.page.relativePath === "getting-started.md");
    expect(gettingStarted).toBeDefined();
    expect(gettingStarted!.reasons).toContain("path-keyword");
  });

  it("detects API reference from title keywords", async () => {
    const pages = await scanDocs(OG_DOCS, { include: ["**/*.md"], exclude: [] });
    const keyPages = detectKeyPages(pages);
    const apiRef = keyPages.find((kp) => kp.page.relativePath === "api/reference.md");
    expect(apiRef).toBeDefined();
    expect(apiRef!.reasons).toContain("title-keyword");
  });

  it("detects config pages from content patterns (tables with Chain ID, RPC)", async () => {
    const pages = await scanDocs(OG_DOCS, { include: ["**/*.md"], exclude: [] });
    const keyPages = detectKeyPages(pages);
    const testnet = keyPages.find((kp) => kp.page.relativePath === "network/testnet.md");
    expect(testnet).toBeDefined();
    expect(testnet!.reasons).toContain("content-pattern");
  });
});
