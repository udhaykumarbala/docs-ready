import { describe, it, expect, beforeAll } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import YAML from "yaml";
import { generateVercelHeaders } from "../../src/deploy/vercel.js";

const exec = promisify(execFile);
const CLI_PATH = path.resolve("dist/index.js");

beforeAll(async () => {
  await exec("npx", ["tsup"], { cwd: path.resolve(".") });
}, 30000);

function runInitWithAnswers(
  cwd: string,
  answers: string[]
): Promise<{ stdout: string; code: number | null }> {
  const { spawn } = require("node:child_process");
  return new Promise((resolve, reject) => {
    const child = spawn("node", [CLI_PATH, "init"], { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let answerIndex = 0;
    const PROMPTS = ["Project title: ", "Description: ", "Docs URL"];

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
      while (answerIndex < answers.length && answerIndex < PROMPTS.length && stdout.includes(PROMPTS[answerIndex])) {
        child.stdin.write(answers[answerIndex] + "\n");
        answerIndex++;
      }
      if (answerIndex >= answers.length) child.stdin.end();
    });

    child.on("close", (code: number | null) => resolve({ stdout, code }));
    child.on("error", reject);
    setTimeout(() => { child.kill(); reject(new Error("timeout")); }, 10000);
  });
}

describe("framework + deploy integration", () => {
  it("init on Docusaurus fixture produces correct config", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-fw-"));
    const fixtureDir = path.resolve("tests/fixtures/docusaurus-project");
    await fs.cp(fixtureDir, tmpDir, { recursive: true });

    try {
      const { stdout } = await runInitWithAnswers(tmpDir, ["My Project", "A project", "https://docs.example.com"]);
      expect(stdout).toContain("docusaurus");

      const config = YAML.parse(await fs.readFile(path.join(tmpDir, ".docs-ready.yaml"), "utf-8"));
      expect(config.docs.dir).toBe("./docs");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("init on VitePress fixture produces correct config", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-fw-"));
    const fixtureDir = path.resolve("tests/fixtures/vitepress-project");
    await fs.cp(fixtureDir, tmpDir, { recursive: true });

    try {
      const { stdout } = await runInitWithAnswers(tmpDir, ["VP Project", "A VitePress site", "https://vp.example.com"]);
      expect(stdout).toContain("vitepress");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("init on MkDocs fixture produces correct config", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-ready-fw-"));
    const fixtureDir = path.resolve("tests/fixtures/mkdocs-project");
    await fs.cp(fixtureDir, tmpDir, { recursive: true });

    try {
      const { stdout } = await runInitWithAnswers(tmpDir, ["MkDocs Project", "A MkDocs site", "https://mkdocs.example.com"]);
      expect(stdout).toContain("mkdocs");
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });

  it("Vercel merge preserves existing config", () => {
    const existing = {
      rewrites: [{ source: "/api/:path*", destination: "/api/:path*" }],
      headers: [{ source: "/custom", headers: [{ key: "X-Custom", value: "yes" }] }],
    };
    const merged = generateVercelHeaders(existing);
    expect(merged.rewrites).toEqual(existing.rewrites);
    expect(merged.headers!.length).toBe(5);
    expect(merged.headers![0].source).toBe("/custom");
  });
});
