import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../../core/config.js";
import { scanDocs } from "../../core/scanner.js";
import { generateLlmsTxt } from "../../generate/llms-txt.js";
import { generateLlmsFullTxt } from "../../generate/llms-full.js";
import { estimateTokens, formatTokens } from "../../utils/tokens.js";
import { log, spinner } from "../../utils/logger.js";

interface GenerateOptions {
  dryRun?: boolean;
  only?: string;
  watch?: boolean;
}

export async function generateCommand(options: GenerateOptions = {}): Promise<void> {
  const cwd = process.cwd();

  const config = await loadConfig(cwd);

  const spin = spinner("Scanning documentation...");
  spin.start();
  const docsDir = path.resolve(cwd, config.docs.dir);
  const pages = await scanDocs(docsDir, {
    include: config.docs.include,
    exclude: config.docs.exclude,
  });
  spin.stop();

  if (pages.length === 0) {
    log.warn(`No documentation files found in ${config.docs.dir}`);
    return;
  }

  log.info(`Found ${pages.length} documentation pages`);

  const outputDir = path.resolve(cwd, config.generate.output_dir);

  // Generate llms.txt
  if (config.generate.llms_txt && options.only !== "llms-full") {
    const llmsTxt = generateLlmsTxt(pages, {
      title: config.title,
      description: config.description,
      url: config.url,
      sections: config.generate.sections,
    });

    if (options.dryRun) {
      log.info("[dry-run] Would write llms.txt");
      log.dim(`  ${llmsTxt.length} chars, ${formatTokens(estimateTokens(llmsTxt))}`);
    } else {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(path.join(outputDir, "llms.txt"), llmsTxt, "utf-8");
      log.success(`Generated llms.txt (${formatTokens(estimateTokens(llmsTxt))})`);
    }
  }

  // Generate llms-full.txt
  if (config.generate.llms_full_txt && options.only !== "llms-txt") {
    const llmsFullTxt = generateLlmsFullTxt(pages);

    if (options.dryRun) {
      log.info("[dry-run] Would write llms-full.txt");
      log.dim(`  ${llmsFullTxt.length} chars, ${formatTokens(estimateTokens(llmsFullTxt))}`);
    } else {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(path.join(outputDir, "llms-full.txt"), llmsFullTxt, "utf-8");
      log.success(`Generated llms-full.txt (${formatTokens(estimateTokens(llmsFullTxt))})`);
    }
  }

  // Generate ai-context.md
  if (config.generate.ai_context && options.only !== "llms-txt" && options.only !== "llms-full") {
    const { generateAiContext } = await import("../../generate/ai-context.js");
    const aiContext = generateAiContext(pages, {
      title: config.title,
      description: config.description,
      aiContextConfig: config.generate.ai_context_config ? {
        key_pages: config.generate.ai_context_config.key_pages,
        extra_sections: config.generate.ai_context_config.extra_sections?.map((s) => ({
          title: s.title,
          content: s.source ?? "",
        })),
      } : undefined,
    });

    if (options.dryRun) {
      log.info("[dry-run] Would write ai-context.md");
      log.dim(`  ${aiContext.length} chars, ${formatTokens(estimateTokens(aiContext))}`);
    } else {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(path.join(outputDir, "ai-context.md"), aiContext, "utf-8");
      log.success(`Generated ai-context.md (${formatTokens(estimateTokens(aiContext))})`);
    }
  }

  // Watch mode
  if (options.watch) {
    log.info("Watching for changes... (press Ctrl+C to stop)");
    const { watchDocs } = await import("../../utils/watcher.js");
    watchDocs({
      dir: docsDir,
      patterns: config.docs.include,
      onChange: async () => {
        log.info("Changes detected, regenerating...");
        await generateCommand({ ...options, watch: false });
      },
    });
    // Keep process alive
    await new Promise(() => {});
  }
}
