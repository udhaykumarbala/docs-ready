import fs from "node:fs/promises";
import path from "node:path";

export interface FrameworkResult {
  name: "docusaurus" | "vitepress" | "mkdocs" | "starlight" | "generic";
  configFile: string | null;
  docsDir: string;
}

const DETECTORS: Array<{
  name: FrameworkResult["name"];
  files: string[];
  docsDir: string;
}> = [
  {
    name: "docusaurus",
    files: [
      "docusaurus.config.ts",
      "docusaurus.config.js",
      "docusaurus.config.mts",
      "docusaurus.config.mjs",
    ],
    docsDir: "./docs",
  },
  {
    name: "vitepress",
    files: [
      ".vitepress/config.ts",
      ".vitepress/config.js",
      ".vitepress/config.mts",
      ".vitepress/config.mjs",
    ],
    docsDir: "./docs",
  },
  {
    name: "mkdocs",
    files: ["mkdocs.yml", "mkdocs.yaml"],
    docsDir: "./docs",
  },
  {
    name: "starlight",
    files: ["astro.config.mjs", "astro.config.ts", "astro.config.js"],
    docsDir: "./src/content/docs",
  },
];

export async function detectFramework(projectDir: string): Promise<FrameworkResult> {
  for (const detector of DETECTORS) {
    for (const file of detector.files) {
      const fullPath = path.join(projectDir, file);
      try {
        await fs.access(fullPath);

        if (detector.name === "starlight") {
          const content = await fs.readFile(fullPath, "utf-8");
          if (!content.includes("starlight")) {
            continue;
          }
        }

        return {
          name: detector.name,
          configFile: fullPath,
          docsDir: detector.docsDir,
        };
      } catch {
        // File doesn't exist, try next
      }
    }
  }

  return {
    name: "generic",
    configFile: null,
    docsDir: "./docs",
  };
}
