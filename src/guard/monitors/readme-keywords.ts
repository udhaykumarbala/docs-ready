import { fetchWithTimeout, githubHeaders } from "../../utils/http.js";
import type { GuardResult } from "../types.js";

export interface ReadmeScanConfig {
  repo: string;
  keywords: string[];
}

export async function scanReadme(config: ReadmeScanConfig): Promise<GuardResult> {
  const url = `https://raw.githubusercontent.com/${config.repo}/main/README.md`;

  try {
    const response = await fetchWithTimeout(url, { timeout: 10000, headers: githubHeaders() });

    if (response.status === 404) {
      // Try master branch
      const fallbackUrl = `https://raw.githubusercontent.com/${config.repo}/master/README.md`;
      const fallback = await fetchWithTimeout(fallbackUrl, { timeout: 10000, headers: githubHeaders() });
      if (!fallback.ok) {
        return {
          monitor: "readme",
          label: config.repo,
          status: "warn",
          message: `No README found for ${config.repo}`,
        };
      }
      return await analyzeReadme(await fallback.text(), config);
    }

    if (!response.ok) {
      return {
        monitor: "readme",
        label: config.repo,
        status: "warn",
        message: `Failed to fetch README: ${response.status}`,
      };
    }

    return await analyzeReadme(await response.text(), config);
  } catch (error) {
    return {
      monitor: "readme",
      label: config.repo,
      status: "warn",
      message: `Failed to scan README: ${(error as Error).message}`,
    };
  }
}

async function analyzeReadme(content: string, config: ReadmeScanConfig): Promise<GuardResult> {
  const found: Array<{ keyword: string; context: string }> = [];

  for (const keyword of config.keywords) {
    const regex = new RegExp(keyword, "gi");
    let match;
    while ((match = regex.exec(content)) !== null) {
      const start = Math.max(0, match.index - 25);
      const end = Math.min(content.length, match.index + keyword.length + 25);
      const context = content.slice(start, end).replace(/\n/g, " ");
      found.push({ keyword, context });
    }
  }

  if (found.length > 0) {
    return {
      monitor: "readme",
      label: config.repo,
      status: "warn",
      message: `Found ${found.length} keyword(s): ${found.map((f) => f.keyword).join(", ")}`,
      details: { matches: found, repo: config.repo },
    };
  }

  return {
    monitor: "readme",
    label: config.repo,
    status: "pass",
    message: `No concerning keywords found in README`,
  };
}
