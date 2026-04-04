import type { ScannedPage } from "../core/scanner.js";
import { cleanMdx } from "../utils/mdx-clean.js";

export function generateLlmsFullTxt(pages: ScannedPage[]): string {
  const sections: string[] = [];

  for (const page of pages) {
    const cleaned = cleanMdx(page.content);
    sections.push(`## ${page.title}\n\n${cleaned}`);
  }

  return sections.join("\n\n").trimEnd() + "\n";
}
