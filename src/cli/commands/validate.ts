import path from "node:path";
import { loadConfig } from "../../core/config.js";
import { scanDocs } from "../../core/scanner.js";
import { runValidation, getValidationExitCode } from "../../validate/runner.js";
import { log, spinner } from "../../utils/logger.js";

interface ValidateOptions {
  checkLinks?: boolean;
}

export async function validateCommand(options: ValidateOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  // Override check_links if --no-links was passed
  if (options.checkLinks === false) {
    config.validate.check_links = false;
  }

  const spin = spinner("Scanning documentation...");
  spin.start();
  const docsDir = path.resolve(cwd, config.docs.dir);
  const pages = await scanDocs(docsDir, {
    include: config.docs.include,
    exclude: config.docs.exclude,
  });
  spin.stop();

  const outputDir = path.resolve(cwd, config.generate.output_dir);

  const spin2 = spinner("Running validation...");
  spin2.start();
  const results = await runValidation(config, pages, outputDir);
  spin2.stop();

  // Print results
  for (const result of results) {
    if (result.passed) {
      log.success(`[${result.rule}] ${result.message}`);
    } else if (result.severity === "warning") {
      log.warn(`[${result.rule}] ${result.message}`);
    } else {
      log.error(`[${result.rule}] ${result.message}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  log.info(`\nValidation: ${passed} passed, ${failed} issues`);

  const exitCode = getValidationExitCode(results);
  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}
