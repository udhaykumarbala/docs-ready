import { describe, it, expect } from "vitest";
import { generateLlmsFullTxt } from "../../src/generate/llms-full.js";
import { scanDocs } from "../../src/core/scanner.js";
import path from "node:path";

const DOCUSAURUS_DOCS = path.resolve("tests/fixtures/docusaurus-project/docs");

describe("generateLlmsFullTxt", () => {
  it("concatenates pages with H2 separators", async () => {
    const pages = await scanDocs(DOCUSAURUS_DOCS, {
      include: ["**/*.md", "**/*.mdx"],
      exclude: [],
    });
    const result = generateLlmsFullTxt(pages);

    expect(result).toContain("## Getting Started");
    expect(result).toContain("## API Overview");
    expect(result).toContain("Welcome to the project.");
  });

  it("strips frontmatter from concatenated content", async () => {
    const pages = await scanDocs(DOCUSAURUS_DOCS, {
      include: ["**/*.md"],
      exclude: [],
    });
    const result = generateLlmsFullTxt(pages);

    expect(result).not.toMatch(/^---$/m);
    expect(result).not.toContain("sidebar_position:");
  });

  it("cleans MDX imports, JSX, and converts admonitions", async () => {
    const pages = await scanDocs(DOCUSAURUS_DOCS, {
      include: ["**/*.mdx"],
      exclude: [],
    });
    const result = generateLlmsFullTxt(pages);

    expect(result).not.toContain('import Tabs from');
    expect(result).not.toContain("<Tabs>");
    expect(result).not.toContain("<TabItem");
    expect(result).toContain("> **Note:**");
    expect(result).toContain("Regular content after components.");
  });
});
