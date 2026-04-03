import fs from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { detectFramework } from "../../frameworks/detector.js";
import { log, spinner } from "../../utils/logger.js";

interface InitOptions {
  cwd?: string;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = path.join(cwd, ".docs-ready.yaml");

  // Check if config already exists
  try {
    await fs.access(configPath);
    log.warn(".docs-ready.yaml already exists. Use --force to overwrite.");
    return;
  } catch {
    // Config doesn't exist, proceed
  }

  const spin = spinner("Detecting project structure...");
  spin.start();

  // Detect framework
  const framework = await detectFramework(cwd);
  spin.stop();

  log.info(`Detected framework: ${framework.name}`);
  log.info(`Docs directory: ${framework.docsDir}`);

  // Detect deployment platform
  const platform = await detectPlatform(cwd);
  if (platform !== "none") {
    log.info(`Detected platform: ${platform}`);
  }

  // Detect docusaurus-plugin-llms
  const hasLlmsPlugin = await detectLlmsPlugin(cwd);
  if (hasLlmsPlugin) {
    log.warn("Detected docusaurus-plugin-llms — disabling llms.txt/llms-full.txt generation.");
  }

  // Prompt for project info
  const rl = createInterface({ input: stdin, output: stdout });
  const title = await rl.question("Project title: ");
  const description = await rl.question("Description: ");
  const url = await rl.question("Docs URL (e.g. https://docs.example.com): ");
  rl.close();

  // Render config from template (try file first, fall back to inline)
  const templateData: Record<string, string> = {
    title: title || "My Project",
    description: description || "Project documentation",
    url: url || "https://docs.example.com",
    docsDir: framework.docsDir,
    llmsTxt: String(!hasLlmsPlugin),
    llmsFullTxt: String(!hasLlmsPlugin),
    platform,
  };

  const template = await loadTemplate();
  const rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) => templateData[key] ?? "");

  await fs.writeFile(configPath, rendered, "utf-8");
  log.success("Created .docs-ready.yaml");
  log.dim("Next: run `docs-ready generate` to create AI-facing files.");
}

async function loadTemplate(): Promise<string> {
  // Try to load the template file (works when installed as npm package)
  const candidates = [
    path.join(path.dirname(new URL(import.meta.url).pathname), "../../templates/config.yaml.tmpl"),
    path.join(path.dirname(new URL(import.meta.url).pathname), "../templates/config.yaml.tmpl"),
  ];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, "utf-8");
    } catch {
      // Try next
    }
  }

  // Inline fallback
  return `# docs-ready configuration
title: "{{title}}"
description: "{{description}}"
url: "{{url}}"
docs:
  dir: "{{docsDir}}"
  include:
    - "**/*.md"
    - "**/*.mdx"
  exclude:
    - "**/node_modules/**"
    - "**/_*"
generate:
  llms_txt: {{llmsTxt}}
  llms_full_txt: {{llmsFullTxt}}
  ai_context: true
  output_dir: "./build"
deploy:
  platform: "{{platform}}"
`;
}

async function detectPlatform(
  cwd: string
): Promise<"vercel" | "netlify" | "cloudflare" | "none"> {
  const checks: Array<{ file: string; platform: "vercel" | "netlify" | "cloudflare" }> = [
    { file: "vercel.json", platform: "vercel" },
    { file: "netlify.toml", platform: "netlify" },
    { file: "_headers", platform: "cloudflare" },
    { file: "wrangler.toml", platform: "cloudflare" },
  ];

  for (const { file, platform } of checks) {
    try {
      await fs.access(path.join(cwd, file));
      return platform;
    } catch {
      // Not found, continue
    }
  }

  return "none";
}

async function detectLlmsPlugin(cwd: string): Promise<boolean> {
  try {
    const pkgPath = path.join(cwd, "package.json");
    const content = await fs.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(content);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    return "docusaurus-plugin-llms" in allDeps;
  } catch {
    return false;
  }
}
