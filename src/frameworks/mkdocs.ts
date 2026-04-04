import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export interface MkDocsMetadata {
  siteName?: string;
  siteUrl?: string;
  nav?: Array<Record<string, unknown>>;
}

export async function readMkDocsConfig(projectDir: string): Promise<MkDocsMetadata> {
  const configFiles = ["mkdocs.yml", "mkdocs.yaml"];

  for (const file of configFiles) {
    const configPath = path.join(projectDir, file);
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const parsed = YAML.parse(content);
      return {
        siteName: parsed?.site_name,
        siteUrl: parsed?.site_url,
        nav: parsed?.nav,
      };
    } catch {
      continue;
    }
  }

  return {};
}
