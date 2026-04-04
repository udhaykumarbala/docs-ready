import fs from "node:fs/promises";
import path from "node:path";

const CORS_HEADERS = [
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
];

const PATTERNS = ["llms.txt", "llms-full.txt", "ai-context.md", "*.md"];

interface VercelConfig {
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  [key: string]: unknown;
}

export function generateVercelHeaders(existingConfig: VercelConfig = {}): VercelConfig {
  const config = { ...existingConfig };
  const headers = config.headers ? [...config.headers] : [];

  for (const pattern of PATTERNS) {
    const source = `/${pattern}`;
    // Don't duplicate if already exists
    if (!headers.some((h) => h.source === source)) {
      headers.push({ source, headers: CORS_HEADERS });
    }
  }

  config.headers = headers;
  return config;
}

export async function writeVercelConfig(projectDir: string): Promise<void> {
  const configPath = path.join(projectDir, "vercel.json");
  let existing: VercelConfig = {};
  try {
    const content = await fs.readFile(configPath, "utf-8");
    existing = JSON.parse(content);
  } catch {}

  const merged = generateVercelHeaders(existing);
  await fs.writeFile(configPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
}
