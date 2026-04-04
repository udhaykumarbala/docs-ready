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

describe("workflow integration", () => {
  it("generated YAML passes yaml.parse() without errors", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-wf-"));
    try {
      const config = {
        title: "Test",
        description: "Test project",
        url: "https://example.com",
        docs: { dir: "./docs" },
        guard: {
          npm_packages: [{ name: "my-pkg", label: "My Pkg" }],
          github_releases: [],
          endpoints: [{ url: "https://api.example.com", label: "API" }],
          readme_scans: [],
          workflow: {
            enabled: true,
            schedule: "0 9 */3 * *",
            create_issues: true,
            labels: ["ai-context-review"],
          },
        },
      };
      await fs.writeFile(path.join(tmpDir, ".docs-ready.yaml"), YAML.stringify(config), "utf-8");
      await fs.mkdir(path.join(tmpDir, "docs"), { recursive: true });

      await exec("node", [CLI_PATH, "guard", "--init-workflow"], { cwd: tmpDir });

      const workflowPath = path.join(tmpDir, ".github", "workflows", "docs-ready-guard.yml");
      const content = await fs.readFile(workflowPath, "utf-8");
      const parsed = YAML.parse(content);
      expect(parsed.name).toBe("docs-ready guard");
      expect(parsed.on.schedule[0].cron).toBe("0 9 */3 * *");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("matches expected structure for config with labels", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-wf2-"));
    try {
      const config = {
        title: "Test",
        description: "Test",
        url: "https://example.com",
        docs: { dir: "./docs" },
        guard: {
          npm_packages: [],
          github_releases: [],
          endpoints: [],
          readme_scans: [],
          workflow: {
            enabled: true,
            schedule: "0 12 * * *",
            create_issues: true,
            labels: ["docs", "freshness"],
          },
        },
      };
      await fs.writeFile(path.join(tmpDir, ".docs-ready.yaml"), YAML.stringify(config), "utf-8");
      await fs.mkdir(path.join(tmpDir, "docs"), { recursive: true });

      const { stdout } = await exec("node", [CLI_PATH, "guard", "--init-workflow"], { cwd: tmpDir });
      expect(stdout).toContain("Generated");

      const content = await fs.readFile(
        path.join(tmpDir, ".github", "workflows", "docs-ready-guard.yml"),
        "utf-8"
      );
      expect(content).toContain('"0 12 * * *"');
      expect(content).toContain('"docs"');
      expect(content).toContain('"freshness"');
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });
});
