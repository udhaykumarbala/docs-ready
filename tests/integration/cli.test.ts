import { describe, it, expect, beforeAll } from "vitest";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import YAML from "yaml";

const exec = promisify(execFile);
const PROJECT_ROOT = path.resolve(".");
const CLI_PATH = path.resolve("dist/index.js");

beforeAll(async () => {
  // Build the project before running integration tests
  await exec("npx", ["tsup"], { cwd: PROJECT_ROOT });
}, 30000);

// Prompt patterns in order that the init command asks them
const PROMPTS = ["Project title: ", "Description: ", "Docs URL"];

/**
 * Run the CLI init command with interactive prompt answers.
 * Waits for each prompt to appear in stdout before sending the corresponding answer.
 */
function runInitWithAnswers(
  cwd: string,
  answers: string[]
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [CLI_PATH, "init"], {
      cwd,
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let answerIndex = 0;

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();

      // Check if the current expected prompt has appeared
      while (
        answerIndex < answers.length &&
        answerIndex < PROMPTS.length &&
        stdout.includes(PROMPTS[answerIndex])
      ) {
        child.stdin.write(answers[answerIndex] + "\n");
        answerIndex++;
      }

      if (answerIndex >= answers.length) {
        child.stdin.end();
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, code });
    });

    child.on("error", reject);

    // Safety timeout
    setTimeout(() => {
      child.kill();
      reject(new Error("CLI timed out"));
    }, 10000);
  });
}

describe("CLI integration", () => {
  it("--version prints version from package.json", async () => {
    const { stdout } = await exec("node", [CLI_PATH, "--version"]);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("init generates valid .docs-ready.yaml", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-init-"));

    try {
      const result = await runInitWithAnswers(tmpDir, [
        "Test Project",
        "A test project",
        "https://test.example.com",
      ]);

      expect(result.code).toBe(0);

      const configContent = await fs.readFile(
        path.join(tmpDir, ".docs-ready.yaml"),
        "utf-8"
      );
      const config = YAML.parse(configContent);

      expect(config.title).toBe("Test Project");
      expect(config.description).toBe("A test project");
      expect(config.url).toBe("https://test.example.com");
      expect(config.docs.dir).toBe("./docs");
      expect(config.generate.llms_txt).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  }, 15000);

  it("init detects Docusaurus fixture project correctly", async () => {
    // Copy fixture to tmpDir to avoid mutating the fixture directory
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-docusaurus-"));
    const fixtureDir = path.resolve("tests/fixtures/docusaurus-project");
    await fs.cp(fixtureDir, tmpDir, { recursive: true });

    try {
      const result = await runInitWithAnswers(tmpDir, [
        "Docusaurus Test",
        "A Docusaurus site",
        "https://docs.example.com",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("docusaurus");

      const configContent = await fs.readFile(
        path.join(tmpDir, ".docs-ready.yaml"),
        "utf-8"
      );
      const config = YAML.parse(configContent);
      expect(config.docs.dir).toBe("./docs");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  }, 15000);
});
