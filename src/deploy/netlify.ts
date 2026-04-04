import fs from "node:fs/promises";
import path from "node:path";

const HEADER_BLOCK = `
# docs-ready: CORS headers for AI tool access
/llms.txt
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS

/llms-full.txt
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS

/ai-context.md
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
`;

export function generateNetlifyHeaders(existing: string = ""): string {
  if (existing.includes("docs-ready: CORS")) {
    return existing;
  }
  return existing.trimEnd() + "\n" + HEADER_BLOCK;
}

export async function writeNetlifyHeaders(projectDir: string): Promise<void> {
  const headersPath = path.join(projectDir, "_headers");
  let existing = "";
  try {
    existing = await fs.readFile(headersPath, "utf-8");
  } catch {}

  const content = generateNetlifyHeaders(existing);
  await fs.writeFile(headersPath, content, "utf-8");
}
