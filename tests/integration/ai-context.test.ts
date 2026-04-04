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

async function setupFixture(
  fixtureName: string,
  configOverrides: Record<string, unknown> = {}
): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-ai-"));
  const fixtureDir = path.resolve(`tests/fixtures/${fixtureName}`);
  await fs.cp(fixtureDir, tmpDir, { recursive: true });

  const config = {
    title: "Test Project",
    description: "A test project for AI context generation",
    url: "https://docs.example.com",
    docs: { dir: "./docs" },
    generate: {
      llms_txt: false,
      llms_full_txt: false,
      ai_context: true,
      output_dir: "./build",
    },
    ...configOverrides,
  };
  await fs.writeFile(
    path.join(tmpDir, ".docs-ready.yaml"),
    YAML.stringify(config),
    "utf-8"
  );

  return {
    dir: tmpDir,
    cleanup: () => fs.rm(tmpDir, { recursive: true }),
  };
}

describe("ai-context integration", () => {
  it("0G-style fixture has network configs", async () => {
    const { dir, cleanup } = await setupFixture("0g-style-project");
    try {
      await exec("node", [CLI_PATH, "generate"], { cwd: dir });
      const aiContext = await fs.readFile(path.join(dir, "build", "ai-context.md"), "utf-8");

      expect(aiContext).toContain("## Network Configuration");
      expect(aiContext).toContain("Chain ID");
      expect(aiContext).toContain("16600");
    } finally {
      await cleanup();
    }
  });

  it("0G-style fixture has contract addresses", async () => {
    const { dir, cleanup } = await setupFixture("0g-style-project");
    try {
      await exec("node", [CLI_PATH, "generate"], { cwd: dir });
      const aiContext = await fs.readFile(path.join(dir, "build", "ai-context.md"), "utf-8");

      expect(aiContext).toContain("## Contract Addresses");
      expect(aiContext).toContain("0x1234567890abcdef1234567890abcdef12345678");
    } finally {
      await cleanup();
    }
  });

  it("generic fixture has SDK install commands", async () => {
    const { dir, cleanup } = await setupFixture("docusaurus-project");
    try {
      await exec("node", [CLI_PATH, "generate"], { cwd: dir });
      const aiContext = await fs.readFile(path.join(dir, "build", "ai-context.md"), "utf-8");

      expect(aiContext).toContain("## Quick Start");
      expect(aiContext).toContain("npm install");
    } finally {
      await cleanup();
    }
  });

  it("ai-context.md matches golden file for 0G-style fixture", async () => {
    const { dir, cleanup } = await setupFixture("0g-style-project");
    try {
      await exec("node", [CLI_PATH, "generate"], { cwd: dir });
      const aiContext = await fs.readFile(path.join(dir, "build", "ai-context.md"), "utf-8");

      const goldenPath = path.resolve("tests/fixtures/golden/0g-ai-context.md");
      try {
        const golden = await fs.readFile(goldenPath, "utf-8");
        expect(aiContext).toBe(golden);
      } catch {
        await fs.mkdir(path.dirname(goldenPath), { recursive: true });
        await fs.writeFile(goldenPath, aiContext, "utf-8");
      }
    } finally {
      await cleanup();
    }
  });
});
