import fs from "node:fs/promises";
import path from "node:path";

export interface VitePressMetadata {
  title?: string;
  description?: string;
}

export async function readVitePressConfig(projectDir: string): Promise<VitePressMetadata> {
  const configFiles = [".vitepress/config.ts", ".vitepress/config.js", ".vitepress/config.mts", ".vitepress/config.mjs"];

  for (const file of configFiles) {
    const configPath = path.join(projectDir, file);
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const title = extractValue(content, "title");
      const description = extractValue(content, "description");
      return { title, description };
    } catch {
      continue;
    }
  }

  return {};
}

function extractValue(content: string, key: string): string | undefined {
  const regex = new RegExp(`${key}:\\s*["'\`]([^"'\`]+)["'\`]`);
  const match = content.match(regex);
  return match?.[1];
}
