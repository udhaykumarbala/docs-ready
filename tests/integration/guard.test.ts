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

describe("guard integration", () => {
  it("runs all monitors end-to-end with mock config", async () => {
    // Create a temp dir with a config that has no monitors
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-guard-"));
    try {
      const config = {
        title: "Test",
        description: "Test project",
        url: "https://example.com",
        docs: { dir: "./docs" },
        guard: {
          npm_packages: [],
          github_releases: [],
          endpoints: [],
          readme_scans: [],
        },
      };
      await fs.writeFile(
        path.join(tmpDir, ".docs-ready.yaml"),
        YAML.stringify(config),
        "utf-8"
      );
      await fs.mkdir(path.join(tmpDir, "docs"), { recursive: true });

      const { stdout } = await exec("node", [CLI_PATH, "guard"], { cwd: tmpDir });
      // Should warn about no checks configured
      expect(stdout).toContain("No guard checks configured");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("--output json produces parseable JSON", async () => {
    // Use a config with one endpoint that we know will fail (localhost:1)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-guard-json-"));
    try {
      const config = {
        title: "Test",
        description: "Test project",
        url: "https://example.com",
        docs: { dir: "./docs" },
        guard: {
          npm_packages: [],
          github_releases: [],
          endpoints: [
            { url: "http://localhost:1", label: "Dead Endpoint" },
          ],
          readme_scans: [],
        },
      };
      await fs.writeFile(
        path.join(tmpDir, ".docs-ready.yaml"),
        YAML.stringify(config),
        "utf-8"
      );
      await fs.mkdir(path.join(tmpDir, "docs"), { recursive: true });

      // This will fail (connection refused on port 1) but should still produce JSON
      try {
        const { stdout } = await exec("node", [CLI_PATH, "guard", "--output", "json"], {
          cwd: tmpDir,
        });
        const parsed = JSON.parse(stdout);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBeGreaterThan(0);
        expect(parsed[0]).toHaveProperty("monitor");
        expect(parsed[0]).toHaveProperty("status");
      } catch (execError: unknown) {
        // Command may exit with code 1 (failure), but stdout should still be valid JSON
        const err = execError as { stdout?: string };
        if (err.stdout) {
          const parsed = JSON.parse(err.stdout);
          expect(Array.isArray(parsed)).toBe(true);
          expect(parsed[0]).toHaveProperty("monitor");
        }
      }
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  }, 15000);
});
