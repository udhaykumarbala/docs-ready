import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../../core/config.js";
import { runGuard, getExitCode } from "../../guard/runner.js";
import { formatConsole } from "../../guard/reporters/console.js";
import { formatJson } from "../../guard/reporters/json.js";
import { formatMarkdown } from "../../guard/reporters/markdown.js";
import { log, spinner } from "../../utils/logger.js";

interface GuardOptions {
  output?: string;
  initWorkflow?: boolean;
}

export async function guardCommand(options: GuardOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  if (options.initWorkflow) {
    const { generateWorkflowYaml } = await import("../../guard/workflow.js");
    const yaml = generateWorkflowYaml(config);
    const workflowDir = path.join(cwd, ".github", "workflows");
    await fs.mkdir(workflowDir, { recursive: true });
    await fs.writeFile(path.join(workflowDir, "docs-ready-guard.yml"), yaml, "utf-8");
    log.success("Generated .github/workflows/docs-ready-guard.yml");
    return;
  }

  const totalChecks =
    config.guard.npm_packages.length +
    config.guard.github_releases.length +
    config.guard.endpoints.length +
    config.guard.readme_scans.length;

  if (totalChecks === 0) {
    log.warn("No guard checks configured. Add monitors to .docs-ready.yaml");
    return;
  }

  const spin = spinner(`Running ${totalChecks} guard checks...`);
  spin.start();

  const results = await runGuard(config);
  spin.stop();

  // Output
  const format = options.output ?? "console";
  switch (format) {
    case "json":
      console.log(formatJson(results));
      break;
    case "markdown":
      console.log(formatMarkdown(results));
      break;
    default:
      console.log(formatConsole(results));
      break;
  }

  // Exit code
  const exitCode = getExitCode(results);
  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}
