export function extractContractAddresses(content: string): string[] {
  const regex = /0x[a-fA-F0-9]{40}/g;
  const matches = content.match(regex);
  return matches ?? [];
}

export function extractCodeBlocks(content: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  const regex = /```(\w+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const lang = match[1];
    const code = match[2].trim();
    if (!blocks.has(lang)) {
      blocks.set(lang, []);
    }
    blocks.get(lang)!.push(code);
  }

  return blocks;
}

export function extractTables(content: string): string[] {
  const tables: string[] = [];
  const lines = content.split("\n");
  let current: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      current.push(line);
    } else {
      if (inTable && current.length >= 2) {
        tables.push(current.join("\n"));
      }
      current = [];
      inTable = false;
    }
  }

  if (inTable && current.length >= 2) {
    tables.push(current.join("\n"));
  }

  return tables;
}

export interface ExtractedLink {
  text: string;
  url: string;
  category: "github" | "npm" | "external";
}

export function extractLinks(content: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const text = match[1];
    const url = match[2];
    let category: ExtractedLink["category"] = "external";
    if (url.includes("github.com")) {
      category = "github";
    } else if (url.includes("npmjs.com") || url.includes("npm.im")) {
      category = "npm";
    }
    links.push({ text, url, category });
  }

  return links;
}

export function deduplicateBlocks(blocks: Map<string, string[]>): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const [lang, codeList] of blocks) {
    result.set(lang, [...new Set(codeList)]);
  }
  return result;
}
