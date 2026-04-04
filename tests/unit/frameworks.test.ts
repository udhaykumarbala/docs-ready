import { describe, it, expect } from "vitest";
import { readDocusaurusConfig } from "../../src/frameworks/docusaurus.js";
import { readVitePressConfig } from "../../src/frameworks/vitepress.js";
import { readMkDocsConfig } from "../../src/frameworks/mkdocs.js";
import path from "node:path";

const FIXTURES = path.resolve("tests/fixtures");

describe("Docusaurus reader", () => {
  it("reads config for metadata (title, url)", async () => {
    const meta = await readDocusaurusConfig(path.join(FIXTURES, "docusaurus-project"));
    expect(meta.title).toBe("My Docusaurus Site");
    expect(meta.url).toBe("https://docs.example.com");
  });

  it("identifies versioned docs presence", async () => {
    const meta = await readDocusaurusConfig(path.join(FIXTURES, "docusaurus-project"));
    expect(meta.hasVersionedDocs).toBe(false);
  });
});

describe("VitePress reader", () => {
  it("reads sidebar config for title and description", async () => {
    const meta = await readVitePressConfig(path.join(FIXTURES, "vitepress-project"));
    expect(meta.title).toBe("My VitePress Site");
    expect(meta.description).toBe("A VitePress site");
  });
});

describe("MkDocs reader", () => {
  it("reads mkdocs.yml for site_name and nav", async () => {
    const meta = await readMkDocsConfig(path.join(FIXTURES, "mkdocs-project"));
    expect(meta.siteName).toBe("My MkDocs Site");
    expect(meta.siteUrl).toBe("https://docs.example.com");
    expect(meta.nav).toBeDefined();
    expect(meta.nav).toHaveLength(2);
  });
});
