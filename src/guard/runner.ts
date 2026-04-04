import type { GuardResult } from "./types.js";
import { checkNpmPackage } from "./monitors/npm.js";
import { checkGitHubRelease } from "./monitors/github.js";
import { checkEndpoint } from "./monitors/endpoints.js";
import { scanReadme } from "./monitors/readme-keywords.js";
import type { DocsReadyConfig } from "../core/config.js";

export async function runGuard(config: DocsReadyConfig): Promise<GuardResult[]> {
  const results: GuardResult[] = [];

  // npm monitors
  for (const pkg of config.guard.npm_packages) {
    results.push(await checkNpmPackage(pkg));
  }

  // GitHub release monitors
  for (const release of config.guard.github_releases) {
    results.push(await checkGitHubRelease(release));
  }

  // Endpoint monitors
  for (const endpoint of config.guard.endpoints) {
    results.push(await checkEndpoint(endpoint));
  }

  // README scans
  for (const scan of config.guard.readme_scans) {
    results.push(await scanReadme(scan));
  }

  return results;
}

export function getExitCode(results: GuardResult[]): number {
  return results.some((r) => r.status === "fail") ? 1 : 0;
}
