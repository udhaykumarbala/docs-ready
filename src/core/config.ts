import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export interface DocsReadyConfig {
  title: string;
  description: string;
  url: string;
  docs: {
    dir: string;
    include: string[];
    exclude: string[];
  };
  generate: {
    llms_txt: boolean;
    llms_full_txt: boolean;
    ai_context: boolean;
    output_dir: string;
    sections?: Array<{ title: string; patterns: string[] }>;
    ai_context_config?: {
      key_pages?: Array<{ path: string; section: string }>;
      extra_sections?: Array<{ title: string; source?: string; auto_extract?: boolean }>;
    };
  };
  guard: {
    npm_packages: Array<{ name: string; label: string }>;
    github_releases: Array<{ repo: string; label: string }>;
    endpoints: Array<{ url: string; label: string; expected_status?: number[] }>;
    readme_scans: Array<{ repo: string; keywords: string[] }>;
    workflow: {
      enabled: boolean;
      schedule: string;
      create_issues: boolean;
      labels: string[];
    };
  };
  deploy: {
    platform: "vercel" | "netlify" | "cloudflare" | "none";
    cors: { enabled: boolean; origins: string[] };
  };
  validate: {
    max_tokens: number;
    check_links: boolean;
    check_coverage: boolean;
    coverage_threshold: number;
  };
}

const DEFAULTS: Omit<DocsReadyConfig, "title" | "description" | "url"> = {
  docs: {
    dir: "./docs",
    include: ["**/*.md", "**/*.mdx"],
    exclude: ["**/node_modules/**", "**/_*"],
  },
  generate: {
    llms_txt: true,
    llms_full_txt: true,
    ai_context: true,
    output_dir: "./build",
  },
  guard: {
    npm_packages: [],
    github_releases: [],
    endpoints: [],
    readme_scans: [],
    workflow: {
      enabled: true,
      schedule: "0 9 */3 * *",
      create_issues: true,
      labels: ["ai-context-review", "documentation"],
    },
  },
  deploy: {
    platform: "none",
    cors: { enabled: true, origins: ["*"] },
  },
  validate: {
    max_tokens: 150000,
    check_links: true,
    check_coverage: true,
    coverage_threshold: 0.95,
  },
};

const CONFIG_FILES = [
  { name: ".docs-ready.yaml", parser: "yaml" as const },
  { name: ".docs-ready.yml", parser: "yaml" as const },
  { name: ".docs-ready.json", parser: "json" as const },
  { name: ".docs-ready.toml", parser: "toml" as const },
];

export async function loadConfig(dir: string, configPath?: string): Promise<DocsReadyConfig> {
  let raw: Record<string, unknown> | undefined;

  if (configPath) {
    const content = await fs.readFile(configPath, "utf-8");
    raw = parseConfig(content, configPath);
  } else {
    for (const { name, parser } of CONFIG_FILES) {
      const fullPath = path.join(dir, name);
      try {
        const content = await fs.readFile(fullPath, "utf-8");
        if (parser === "toml") {
          throw new Error("TOML support requires a TOML parser. Use .yaml or .json instead.");
        }
        raw = parseConfig(content, fullPath);
        break;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw err;
      }
    }
  }

  if (!raw) {
    throw new Error(
      "No config file found. Run `docs-ready init` to create one, or create .docs-ready.yaml manually."
    );
  }

  validate(raw);
  return applyDefaults(raw);
}

function parseConfig(content: string, filePath: string): Record<string, unknown> {
  if (filePath.endsWith(".json")) {
    return JSON.parse(content);
  }
  const parsed = YAML.parse(content);
  if (parsed === null || typeof parsed !== "object") {
    throw new Error(`Failed to parse config file: ${filePath}`);
  }
  return parsed;
}

function validate(raw: Record<string, unknown>): void {
  const missing: string[] = [];
  if (!raw.title || typeof raw.title !== "string") missing.push("title");
  if (!raw.description || typeof raw.description !== "string") missing.push("description");
  if (!raw.url || typeof raw.url !== "string") missing.push("url");

  if (missing.length > 0) {
    throw new Error(
      `Missing required config fields: ${missing.join(", ")}. ` +
      `Add them to your .docs-ready.yaml file.`
    );
  }
}

function applyDefaults(raw: Record<string, unknown>): DocsReadyConfig {
  const docs = raw.docs as Record<string, unknown> | undefined;
  const generate = raw.generate as Record<string, unknown> | undefined;
  const guard = raw.guard as Record<string, unknown> | undefined;
  const deploy = raw.deploy as Record<string, unknown> | undefined;
  const validateConf = raw.validate as Record<string, unknown> | undefined;
  const guardWorkflow = (guard?.workflow as Record<string, unknown>) ?? {};

  return {
    title: raw.title as string,
    description: raw.description as string,
    url: raw.url as string,
    docs: {
      dir: (docs?.dir as string) ?? DEFAULTS.docs.dir,
      include: (docs?.include as string[]) ?? DEFAULTS.docs.include,
      exclude: (docs?.exclude as string[]) ?? DEFAULTS.docs.exclude,
    },
    generate: {
      llms_txt: (generate?.llms_txt as boolean) ?? DEFAULTS.generate.llms_txt,
      llms_full_txt: (generate?.llms_full_txt as boolean) ?? DEFAULTS.generate.llms_full_txt,
      ai_context: (generate?.ai_context as boolean) ?? DEFAULTS.generate.ai_context,
      output_dir: (generate?.output_dir as string) ?? DEFAULTS.generate.output_dir,
      sections: generate?.sections as DocsReadyConfig["generate"]["sections"],
      ai_context_config: generate?.ai_context_config as DocsReadyConfig["generate"]["ai_context_config"],
    },
    guard: {
      npm_packages: (guard?.npm_packages as DocsReadyConfig["guard"]["npm_packages"]) ?? DEFAULTS.guard.npm_packages,
      github_releases: (guard?.github_releases as DocsReadyConfig["guard"]["github_releases"]) ?? DEFAULTS.guard.github_releases,
      endpoints: (guard?.endpoints as DocsReadyConfig["guard"]["endpoints"]) ?? DEFAULTS.guard.endpoints,
      readme_scans: (guard?.readme_scans as DocsReadyConfig["guard"]["readme_scans"]) ?? DEFAULTS.guard.readme_scans,
      workflow: {
        enabled: (guardWorkflow.enabled as boolean) ?? DEFAULTS.guard.workflow.enabled,
        schedule: (guardWorkflow.schedule as string) ?? DEFAULTS.guard.workflow.schedule,
        create_issues: (guardWorkflow.create_issues as boolean) ?? DEFAULTS.guard.workflow.create_issues,
        labels: (guardWorkflow.labels as string[]) ?? DEFAULTS.guard.workflow.labels,
      },
    },
    deploy: {
      platform: (deploy?.platform as DocsReadyConfig["deploy"]["platform"]) ?? DEFAULTS.deploy.platform,
      cors: {
        enabled: ((deploy?.cors as Record<string, unknown>)?.enabled as boolean) ?? DEFAULTS.deploy.cors.enabled,
        origins: ((deploy?.cors as Record<string, unknown>)?.origins as string[]) ?? DEFAULTS.deploy.cors.origins,
      },
    },
    validate: {
      max_tokens: (validateConf?.max_tokens as number) ?? DEFAULTS.validate.max_tokens,
      check_links: (validateConf?.check_links as boolean) ?? DEFAULTS.validate.check_links,
      check_coverage: (validateConf?.check_coverage as boolean) ?? DEFAULTS.validate.check_coverage,
      coverage_threshold: (validateConf?.coverage_threshold as number) ?? DEFAULTS.validate.coverage_threshold,
    },
  };
}
