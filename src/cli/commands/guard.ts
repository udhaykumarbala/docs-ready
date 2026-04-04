import { loadConfig } from "../../core/config.js";
import { runGuard, getExitCode } from "../../guard/runner.js";
import { formatConsole } from "../../guard/reporters/console.js";
import { formatJson } from "../../guard/reporters/json.js";
import { formatMarkdown } from "../../guard/reporters/markdown.js";
import { log, spinner } from "../../utils/logger.js";

interface GuardOptions {
  output?: string;
}

export async function guardCommand(options: GuardOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

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
