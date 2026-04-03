import { describe, it, expect } from "vitest";
import { detectFramework } from "../../src/frameworks/detector.js";
import path from "node:path";

const FIXTURES = path.resolve("tests/fixtures");

describe("detectFramework", () => {
  it("identifies Docusaurus from docusaurus.config.ts", async () => {
    const result = await detectFramework(path.join(FIXTURES, "docusaurus-project"));
    expect(result.name).toBe("docusaurus");
    expect(result.configFile).toContain("docusaurus.config.ts");
  });

  it("identifies VitePress from .vitepress/config.ts", async () => {
    const result = await detectFramework(path.join(FIXTURES, "vitepress-project"));
    expect(result.name).toBe("vitepress");
    expect(result.configFile).toContain(".vitepress/config.ts");
  });

  it("identifies MkDocs from mkdocs.yml", async () => {
    const fixtureDir = path.join(FIXTURES, "mkdocs-project");
    const fs = await import("node:fs/promises");
    await fs.mkdir(fixtureDir, { recursive: true });
    await fs.writeFile(path.join(fixtureDir, "mkdocs.yml"), "site_name: Test\n");

    const result = await detectFramework(fixtureDir);
    expect(result.name).toBe("mkdocs");

    await fs.rm(fixtureDir, { recursive: true });
  });

  it("falls back to generic for plain markdown", async () => {
    const result = await detectFramework(path.join(FIXTURES, "plain-markdown"));
    expect(result.name).toBe("generic");
    expect(result.configFile).toBeNull();
  });
});
