import { fetchWithTimeout } from "../../utils/http.js";
import { githubHeaders } from "../../utils/http.js";
import type { GuardResult } from "../types.js";

export interface GitHubReleaseConfig {
  repo: string;
  label: string;
}

export async function checkGitHubRelease(config: GitHubReleaseConfig): Promise<GuardResult> {
  const headers = githubHeaders();

  // Try releases API first
  try {
    const releaseUrl = `https://api.github.com/repos/${config.repo}/releases/latest`;
    const response = await fetchWithTimeout(releaseUrl, { timeout: 10000, headers });

    if (response.status === 403) {
      return {
        monitor: "github",
        label: config.label,
        status: "warn",
        message: "GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.",
      };
    }

    if (response.ok) {
      const data = await response.json() as { tag_name: string; published_at: string };
      return {
        monitor: "github",
        label: config.label,
        status: "pass",
        message: `Latest release: ${data.tag_name} (${data.published_at.split("T")[0]})`,
        details: { tag: data.tag_name, publishedAt: data.published_at, repo: config.repo },
      };
    }

    // No releases — fall back to tags API
    if (response.status === 404) {
      return await checkTags(config, headers);
    }

    return {
      monitor: "github",
      label: config.label,
      status: "warn",
      message: `GitHub API returned ${response.status}`,
    };
  } catch (error) {
    return {
      monitor: "github",
      label: config.label,
      status: "warn",
      message: `Failed to check GitHub: ${(error as Error).message}`,
    };
  }
}

async function checkTags(
  config: GitHubReleaseConfig,
  headers: Record<string, string>
): Promise<GuardResult> {
  try {
    const tagsUrl = `https://api.github.com/repos/${config.repo}/tags?per_page=1`;
    const response = await fetchWithTimeout(tagsUrl, { timeout: 10000, headers });

    if (!response.ok) {
      return {
        monitor: "github",
        label: config.label,
        status: "warn",
        message: `No releases or tags found for ${config.repo}`,
      };
    }

    const tags = await response.json() as Array<{ name: string }>;
    if (tags.length === 0) {
      return {
        monitor: "github",
        label: config.label,
        status: "warn",
        message: `No releases or tags found for ${config.repo}`,
      };
    }

    return {
      monitor: "github",
      label: config.label,
      status: "pass",
      message: `Latest tag: ${tags[0].name}`,
      details: { tag: tags[0].name, repo: config.repo },
    };
  } catch {
    return {
      monitor: "github",
      label: config.label,
      status: "warn",
      message: `Failed to check tags for ${config.repo}`,
    };
  }
}
