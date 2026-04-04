import { describe, it, expect } from "vitest";
import { generateLlmsTxt } from "../../src/generate/llms-txt.js";
import { scanDocs, type ScannedPage } from "../../src/core/scanner.js";
import path from "node:path";

const DOCUSAURUS_DOCS = path.resolve("tests/fixtures/docusaurus-project/docs");

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    title: "My Project",
    description: "A great project for doing things",
    url: "https://docs.example.com",
    sections: overrides.sections as Array<{ title: string; patterns: string[] }> | undefined,
  };
}

async function getPages(exclude: string[] = []): Promise<ScannedPage[]> {
  return scanDocs(DOCUSAURUS_DOCS, {
    include: ["**/*.md", "**/*.mdx"],
    exclude,
  });
}

describe("generateLlmsTxt", () => {
  it("has H1 title matching config title", async () => {
    const pages = await getPages();
    const result = generateLlmsTxt(pages, makeConfig());
    const firstLine = result.split("\n")[0];
    expect(firstLine).toBe("# My Project");
  });

  it("has blockquote with description", async () => {
    const pages = await getPages();
    const result = generateLlmsTxt(pages, makeConfig());
    expect(result).toContain("> A great project for doing things");
  });

  it("has section headings when sections configured", async () => {
    const pages = await getPages();
    const result = generateLlmsTxt(pages, makeConfig({
      sections: [
        { title: "API Reference", patterns: ["api/**"] },
        { title: "Guides", patterns: ["guides/**"] },
      ],
    }));
    expect(result).toContain("## API Reference");
    expect(result).toContain("## Guides");
  });

  it("has page entries in [Title](url): description format", async () => {
    const pages = await getPages();
    const result = generateLlmsTxt(pages, makeConfig());
    expect(result).toMatch(/- \[Getting Started\]\(https:\/\/docs\.example\.com\/getting-started\): Learn how to set up the project/);
  });

  it("groups pages by section patterns", async () => {
    const pages = await getPages();
    const result = generateLlmsTxt(pages, makeConfig({
      sections: [
        { title: "API Reference", patterns: ["api/**"] },
      ],
    }));
    const apiSection = result.split("## API Reference")[1];
    expect(apiSection).toContain("[API Overview]");
    expect(apiSection).toContain("[API Endpoints]");
  });

  it("uses first paragraph when page has no description", async () => {
    const pages = await getPages();
    const result = generateLlmsTxt(pages, makeConfig());
    const changelogLine = result.split("\n").find((l) => l.includes("[Changelog]"));
    expect(changelogLine).toBeDefined();
  });

  it("respects sidebar_position ordering", async () => {
    const pages = await getPages();
    const result = generateLlmsTxt(pages, makeConfig({
      sections: [
        { title: "API Reference", patterns: ["api/**"] },
      ],
    }));
    const apiSection = result.split("## API Reference")[1]?.split("##")[0] ?? "";
    const overviewIdx = apiSection.indexOf("API Overview");
    const endpointsIdx = apiSection.indexOf("API Endpoints");
    expect(overviewIdx).toBeLessThan(endpointsIdx);
  });

  it("excludes pages matching exclude patterns", async () => {
    const pages = await getPages(["**/reference/**"]);
    const result = generateLlmsTxt(pages, makeConfig());
    expect(result).not.toContain("Configuration Reference");
    expect(result).not.toContain("CLI Reference");
  });
});
