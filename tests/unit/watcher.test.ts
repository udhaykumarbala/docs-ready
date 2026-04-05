import { describe, it, expect } from "vitest";
import { watchDocs } from "../../src/utils/watcher.js";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

describe("watcher", () => {
  it("triggers onChange when .md file changes", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-watch-"));
    const mdFile = path.join(tmpDir, "test.md");
    await fs.writeFile(mdFile, "# Initial\n");

    let triggered = false;

    const watcher = watchDocs({
      dir: tmpDir,
      patterns: ["**/*.md"],
      debounceMs: 100,
      onChange: () => {
        triggered = true;
      },
    });

    // Modify file
    await new Promise((r) => setTimeout(r, 50));
    await fs.writeFile(mdFile, "# Updated\n");

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 300));

    watcher.close();
    await fs.rm(tmpDir, { recursive: true });

    expect(triggered).toBe(true);
  });

  it("debounces rapid changes", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-watch2-"));
    const mdFile = path.join(tmpDir, "test.md");
    await fs.writeFile(mdFile, "# Initial\n");

    let callCount = 0;

    const watcher = watchDocs({
      dir: tmpDir,
      patterns: ["**/*.md"],
      debounceMs: 200,
      onChange: () => {
        callCount++;
      },
    });

    // Rapid-fire changes
    await new Promise((r) => setTimeout(r, 50));
    await fs.writeFile(mdFile, "# Change 1\n");
    await new Promise((r) => setTimeout(r, 50));
    await fs.writeFile(mdFile, "# Change 2\n");
    await new Promise((r) => setTimeout(r, 50));
    await fs.writeFile(mdFile, "# Change 3\n");

    // Wait for debounce to settle
    await new Promise((r) => setTimeout(r, 500));

    watcher.close();
    await fs.rm(tmpDir, { recursive: true });

    // Should have been called only once due to debouncing
    expect(callCount).toBe(1);
  });
});
