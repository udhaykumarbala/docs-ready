import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { glob } from "glob";

export interface ScannedPage {
  filePath: string;
  relativePath: string;
  title: string;
  description: string | null;
  frontmatter: Record<string, unknown>;
  content: string;
}

export interface ScanOptions {
  include: string[];
  exclude: string[];
}

export async function scanDocs(docsDir: string, options: ScanOptions): Promise<ScannedPage[]> {
  const resolvedDir = path.resolve(docsDir);
  const allFiles: string[] = [];

  for (const pattern of options.include) {
    const matches = await glob(pattern, {
      cwd: resolvedDir,
      ignore: options.exclude,
      nodir: true,
      absolute: false,
    });
    allFiles.push(...matches);
  }

  const uniqueFiles = [...new Set(allFiles)];
  const pages: ScannedPage[] = [];

  for (const relativePath of uniqueFiles) {
    const filePath = path.join(resolvedDir, relativePath);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    const title = resolveTitle(frontmatter, content, relativePath);
    const description = (frontmatter.description as string) ?? null;

    pages.push({
      filePath,
      relativePath: relativePath.replace(/\\/g, "/"),
      title,
      description,
      frontmatter,
      content,
    });
  }

  pages.sort((a, b) => {
    const posA = (a.frontmatter.sidebar_position as number) ?? Infinity;
    const posB = (b.frontmatter.sidebar_position as number) ?? Infinity;
    if (posA !== posB) return posA - posB;
    return a.relativePath.localeCompare(b.relativePath);
  });

  return pages;
}

function resolveTitle(
  frontmatter: Record<string, unknown>,
  content: string,
  relativePath: string
): string {
  if (typeof frontmatter.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  const basename = path.basename(relativePath, path.extname(relativePath));
  return basename.charAt(0).toUpperCase() + basename.slice(1).replace(/[-_]/g, " ");
}
