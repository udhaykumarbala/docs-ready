import fs from "node:fs/promises";
import path from "node:path";

export interface DocusaurusMetadata {
  title?: string;
  url?: string;
  baseUrl?: string;
  hasVersionedDocs: boolean;
}

export async function readDocusaurusConfig(projectDir: string): Promise<DocusaurusMetadata> {
  const configFiles = ["docusaurus.config.ts", "docusaurus.config.js", "docusaurus.config.mts", "docusaurus.config.mjs"];

  for (const file of configFiles) {
    const configPath = path.join(projectDir, file);
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const title = extractValue(content, "title");
      const url = extractValue(content, "url");
      const baseUrl = extractValue(content, "baseUrl");

      // Check for versioned docs
      let hasVersionedDocs = false;
      try {
        await fs.access(path.join(projectDir, "versioned_docs"));
        hasVersionedDocs = true;
      } catch {}

      return { title, url, baseUrl, hasVersionedDocs };
    } catch {
      continue;
    }
  }

  return { hasVersionedDocs: false };
}

function extractValue(content: string, key: string): string | undefined {
  // Match: key: "value" or key: 'value'
  const regex = new RegExp(`${key}:\\s*["'\`]([^"'\`]+)["'\`]`);
  const match = content.match(regex);
  return match?.[1];
}
