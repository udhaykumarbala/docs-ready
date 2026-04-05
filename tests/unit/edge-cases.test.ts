import { describe, it, expect } from "vitest";
import { scanDocs } from "../../src/core/scanner.js";
import { generateLlmsTxt } from "../../src/generate/llms-txt.js";
import { generateLlmsFullTxt } from "../../src/generate/llms-full.js";
import { generateAiContext } from "../../src/generate/ai-context.js";
import { loadConfig } from "../../src/core/config.js";
import { cleanMdx } from "../../src/utils/mdx-clean.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("edge cases", () => {
  it("handles empty docs directory", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-empty-"));
    await fs.mkdir(path.join(tmpDir, "docs"));

    try {
      const pages = await scanDocs(path.join(tmpDir, "docs"), {
        include: ["**/*.md"],
        exclude: [],
      });
      expect(pages).toHaveLength(0);

      // Generators should handle empty pages gracefully
      const llmsTxt = generateLlmsTxt(pages, {
        title: "Test",
        description: "Test",
        url: "https://example.com",
      });
      expect(llmsTxt).toContain("# Test");

      const fullTxt = generateLlmsFullTxt(pages);
      expect(fullTxt).toBeDefined();

      const aiContext = generateAiContext(pages, {
        title: "Test",
        description: "Test",
      });
      expect(aiContext).toContain("# Test");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("handles docs with no frontmatter at all", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-nofm-"));
    const docsDir = path.join(tmpDir, "docs");
    await fs.mkdir(docsDir);
    await fs.writeFile(path.join(docsDir, "page.md"), "# Just a heading\n\nSome content.\n");

    try {
      const pages = await scanDocs(docsDir, { include: ["**/*.md"], exclude: [] });
      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe("Just a heading");
      expect(pages[0].description).toBeNull();
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("handles non-UTF-8 content gracefully", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-utf8-"));
    const docsDir = path.join(tmpDir, "docs");
    await fs.mkdir(docsDir);
    // Write file with BOM and special characters
    const content = "\uFEFF---\ntitle: Spëcial Chàracters\n---\n\n# Spëcial Chàracters\n\nContent with émojis 🎉 and ñ.\n";
    await fs.writeFile(path.join(docsDir, "special.md"), content);

    try {
      const pages = await scanDocs(docsDir, { include: ["**/*.md"], exclude: [] });
      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe("Spëcial Chàracters");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("handles file with only frontmatter, no content", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-fmonly-"));
    const docsDir = path.join(tmpDir, "docs");
    await fs.mkdir(docsDir);
    await fs.writeFile(path.join(docsDir, "empty.md"), "---\ntitle: Empty Page\ndescription: Nothing here\n---\n");

    try {
      const pages = await scanDocs(docsDir, { include: ["**/*.md"], exclude: [] });
      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe("Empty Page");

      const fullTxt = generateLlmsFullTxt(pages);
      expect(fullTxt).toContain("## Empty Page");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("handles config with no optional sections", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-minconfig-"));
    await fs.writeFile(
      path.join(tmpDir, ".docs-ready.yaml"),
      'title: "Minimal"\ndescription: "Just the basics"\nurl: "https://example.com"\n'
    );

    try {
      const config = await loadConfig(tmpDir);
      expect(config.title).toBe("Minimal");
      expect(config.docs.dir).toBe("./docs");
      expect(config.generate.llms_txt).toBe(true);
      expect(config.guard.npm_packages).toEqual([]);
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("cleanMdx handles empty/whitespace-only content", () => {
    expect(cleanMdx("")).toBe("\n");
    expect(cleanMdx("   \n\n  ")).toBe("\n");
  });
});
