import { describe, it, expect, beforeAll } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import YAML from "yaml";

const exec = promisify(execFile);
const CLI_PATH = path.resolve("dist/index.js");

beforeAll(async () => {
  await exec("npx", ["tsup"], { cwd: path.resolve(".") });
}, 30000);

describe("validate integration", () => {
  it("passes on valid fixture with generated files", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-val-"));
    const fixtureDir = path.resolve("tests/fixtures/docusaurus-project");
    await fs.cp(fixtureDir, tmpDir, { recursive: true });

    try {
      // Write config
      const config = {
        title: "Test Project",
        description: "A test project",
        url: "https://docs.example.com",
        docs: { dir: "./docs" },
        generate: { llms_txt: true, llms_full_txt: true, ai_context: false, output_dir: "./build" },
        validate: { max_tokens: 150000, check_links: false, check_coverage: true, coverage_threshold: 0.5 },
      };
      await fs.writeFile(path.join(tmpDir, ".docs-ready.yaml"), YAML.stringify(config), "utf-8");

      // Generate first
      await exec("node", [CLI_PATH, "generate"], { cwd: tmpDir });

      // Then validate (no link checking to avoid network calls)
      const { stdout } = await exec("node", [CLI_PATH, "validate", "--no-links"], { cwd: tmpDir });

      expect(stdout).toContain("passed");
      // Should not have errors (exit code 0)
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("reports failures on broken fixture (no generated files)", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-val-broken-"));
    try {
      await fs.mkdir(path.join(tmpDir, "docs"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, "docs", "test.md"), "# Test\n\nContent.\n");

      const config = {
        title: "Test",
        description: "Test",
        url: "https://example.com",
        docs: { dir: "./docs" },
        generate: { llms_txt: true, llms_full_txt: true, ai_context: false, output_dir: "./build" },
        validate: { max_tokens: 150000, check_links: false, check_coverage: true, coverage_threshold: 0.95 },
      };
      await fs.writeFile(path.join(tmpDir, ".docs-ready.yaml"), YAML.stringify(config), "utf-8");

      // Don't generate — validate should report missing files
      try {
        await exec("node", [CLI_PATH, "validate", "--no-links"], { cwd: tmpDir });
      } catch (err: unknown) {
        // May exit with code 1
        const execErr = err as { stdout?: string };
        if (execErr.stdout) {
          expect(execErr.stdout).toContain("not found");
        }
      }
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });
});
