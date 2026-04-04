import { describe, it, expect } from "vitest";
import { scanDocs } from "../../src/core/scanner.js";
import path from "node:path";

const DOCUSAURUS_DOCS = path.resolve("tests/fixtures/docusaurus-project/docs");
const PLAIN_DOCS = path.resolve("tests/fixtures/plain-markdown/docs");

describe("scanDocs", () => {
  it("parses markdown frontmatter (title, description, id)", async () => {
    const pages = await scanDocs(DOCUSAURUS_DOCS, {
      include: ["**/*.md", "**/*.mdx"],
      exclude: [],
    });

    const gettingStarted = pages.find((p) => p.relativePath === "getting-started.md");
    expect(gettingStarted).toBeDefined();
    expect(gettingStarted!.title).toBe("Getting Started");
    expect(gettingStarted!.description).toBe("Learn how to set up the project");
    expect(gettingStarted!.frontmatter.id).toBe("getting-started");
    expect(gettingStarted!.frontmatter.sidebar_position).toBe(1);
  });

  it("handles .mdx files with JSX content", async () => {
    // Uses the existing mdx-example.mdx fixture (no temp file creation to avoid race conditions)
    const pages = await scanDocs(DOCUSAURUS_DOCS, {
      include: ["**/*.md", "**/*.mdx"],
      exclude: [],
    });

    const mdxPage = pages.find((p) => p.relativePath === "guides/mdx-example.mdx");
    expect(mdxPage).toBeDefined();
    expect(mdxPage!.title).toBe("MDX Example");
  });

  it("respects include/exclude glob patterns", async () => {
    const pages = await scanDocs(DOCUSAURUS_DOCS, {
      include: ["**/*.md"],
      exclude: ["**/reference/**"],
    });

    const hasReference = pages.some((p) => p.relativePath.startsWith("reference/"));
    expect(hasReference).toBe(false);
    expect(pages.length).toBeGreaterThan(0);
  });

  it("falls back to H1 heading when no frontmatter title", async () => {
    const pages = await scanDocs(PLAIN_DOCS, {
      include: ["**/*.md"],
      exclude: [],
    });

    const readme = pages.find((p) => p.relativePath === "README.md");
    expect(readme).toBeDefined();
    expect(readme!.title).toBe("My Project");
    expect(readme!.frontmatter.title).toBeUndefined();

    const faq = pages.find((p) => p.relativePath === "faq.md");
    expect(faq).toBeDefined();
    expect(faq!.title).toBe("FAQ");
  });
});
