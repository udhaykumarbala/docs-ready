import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initCommand } from "./commands/init.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getVersion(): Promise<string> {
  let dir = __dirname;
  for (let i = 0; i < 5; i++) {
    try {
      const pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf-8"));
      return pkg.version;
    } catch {
      dir = path.dirname(dir);
    }
  }
  return "0.0.0";
}

async function main(): Promise<void> {
  const version = await getVersion();

  const program = new Command();

  program
    .name("docs-ready")
    .description("Make your docs AI-ready. Keep them that way.")
    .version(version);

  program
    .command("init")
    .description("Initialize docs-ready in your project")
    .action(async () => {
      await initCommand();
    });

  program
    .command("generate")
    .description("Generate AI-facing documentation files")
    .option("--dry-run", "Show what would be generated without writing files")
    .option("--only <type>", "Generate only: llms-txt, llms-full, or ai-context")
    .action(async (opts) => {
      const { generateCommand } = await import("./commands/generate.js");
      await generateCommand({ dryRun: opts.dryRun, only: opts.only });
    });

  program
    .command("guard")
    .description("Check AI-facing docs for staleness")
    .option("--output <format>", "Output format: console, json, or markdown", "console")
    .option("--init-workflow", "Generate GitHub Actions workflow file")
    .action(async (opts) => {
      const { guardCommand } = await import("./commands/guard.js");
      await guardCommand({ output: opts.output, initWorkflow: opts.initWorkflow });
    });

  program
    .command("validate")
    .description("Lint and validate AI-facing docs")
    .option("--no-links", "Skip link checking")
    .action(async (opts) => {
      const { validateCommand } = await import("./commands/validate.js");
      await validateCommand({ checkLinks: opts.links });
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
