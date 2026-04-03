import { describe, it, expect } from "vitest";
import { loadConfig } from "../../src/core/config.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-test-"));
  try {
    await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true });
  }
}

describe("loadConfig", () => {
  it("validates required fields (title, description, url)", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(
        path.join(dir, ".docs-ready.yaml"),
        "docs:\n  dir: ./docs\n"
      );
      await expect(loadConfig(dir)).rejects.toThrow(/title/i);
    });
  });

  it("applies defaults for optional fields", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(
        path.join(dir, ".docs-ready.yaml"),
        'title: "Test"\ndescription: "A test project"\nurl: "https://example.com"\n'
      );
      const config = await loadConfig(dir);
      expect(config.title).toBe("Test");
      expect(config.docs.dir).toBe("./docs");
      expect(config.docs.include).toEqual(["**/*.md", "**/*.mdx"]);
      expect(config.docs.exclude).toEqual(["**/node_modules/**", "**/_*"]);
      expect(config.generate.llms_txt).toBe(true);
      expect(config.generate.llms_full_txt).toBe(true);
      expect(config.generate.ai_context).toBe(true);
      expect(config.generate.output_dir).toBe("./build");
    });
  });

  it("rejects invalid YAML with clear error", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(
        path.join(dir, ".docs-ready.yaml"),
        "title: [\ninvalid yaml"
      );
      await expect(loadConfig(dir)).rejects.toThrow();
    });
  });

  it("supports .docs-ready.json alternative", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(
        path.join(dir, ".docs-ready.json"),
        JSON.stringify({
          title: "JSON Test",
          description: "A JSON config test",
          url: "https://example.com",
        })
      );
      const config = await loadConfig(dir);
      expect(config.title).toBe("JSON Test");
    });
  });
});
