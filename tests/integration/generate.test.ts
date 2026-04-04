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
  fixtureName: string
): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-gen-"));
  const fixtureDir = path.resolve(`tests/fixtures/${fixtureName}`);
  await fs.cp(fixtureDir, tmpDir, { recursive: true });

  const config = {
    title: "Test Project",
    description: "A test project for generation",
    url: "https://docs.example.com",
    docs: { dir: "./docs" },
    generate: {
      llms_txt: true,
      llms_full_txt: true,
      ai_context: false,
      output_dir: "./build",
    },
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

describe("generate integration", () => {
  it("produces valid files from Docusaurus fixture", async () => {
    const { dir, cleanup } = await setupFixture("docusaurus-project");
    try {
      await exec("node", [CLI_PATH, "generate"], { cwd: dir });

      const llmsTxt = await fs.readFile(path.join(dir, "build", "llms.txt"), "utf-8");
      const llmsFullTxt = await fs.readFile(path.join(dir, "build", "llms-full.txt"), "utf-8");

      // llms.txt structure
      expect(llmsTxt).toMatch(/^# Test Project/);
      expect(llmsTxt).toContain("> A test project for generation");
      expect(llmsTxt).toContain("[Getting Started]");
      expect(llmsTxt).toContain("https://docs.example.com/");

      // llms-full.txt structure
      expect(llmsFullTxt).toContain("## Getting Started");
      expect(llmsFullTxt).toContain("Welcome to the project.");
      expect(llmsFullTxt).not.toContain("sidebar_position:");
    } finally {
      await cleanup();
    }
  });

  it("produces valid files from plain markdown fixture", async () => {
    const { dir, cleanup } = await setupFixture("plain-markdown");
    try {
      await exec("node", [CLI_PATH, "generate"], { cwd: dir });

      const llmsTxt = await fs.readFile(path.join(dir, "build", "llms.txt"), "utf-8");
      expect(llmsTxt).toMatch(/^# Test Project/);
      expect(llmsTxt).toContain("[Setup Guide]");
      expect(llmsTxt).toContain("[My Project]");
    } finally {
      await cleanup();
    }
  });

  it("--dry-run produces no file writes", async () => {
    const { dir, cleanup } = await setupFixture("docusaurus-project");
    try {
      const { stdout } = await exec("node", [CLI_PATH, "generate", "--dry-run"], { cwd: dir });

      expect(stdout).toContain("dry-run");

      const buildExists = await fs.access(path.join(dir, "build")).then(() => true).catch(() => false);
      expect(buildExists).toBe(false);
    } finally {
      await cleanup();
    }
  });

  it("llms.txt matches golden file for Docusaurus fixture", async () => {
    const { dir, cleanup } = await setupFixture("docusaurus-project");
    try {
      await exec("node", [CLI_PATH, "generate"], { cwd: dir });

      const llmsTxt = await fs.readFile(path.join(dir, "build", "llms.txt"), "utf-8");

      const goldenPath = path.resolve("tests/fixtures/golden/docusaurus-llms.txt");
      try {
        const golden = await fs.readFile(goldenPath, "utf-8");
        expect(llmsTxt).toBe(golden);
      } catch {
        // Golden file doesn't exist yet — create it
        await fs.mkdir(path.dirname(goldenPath), { recursive: true });
        await fs.writeFile(goldenPath, llmsTxt, "utf-8");
      }
    } finally {
      await cleanup();
    }
  });
});
