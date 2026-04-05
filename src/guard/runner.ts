import type { GuardResult } from "./types.js";
import { checkNpmPackage } from "./monitors/npm.js";
import { checkGitHubRelease } from "./monitors/github.js";
import { checkEndpoint } from "./monitors/endpoints.js";
import { scanReadme } from "./monitors/readme-keywords.js";
import type { DocsReadyConfig } from "../core/config.js";

export async function runGuard(config: DocsReadyConfig, concurrency = 5): Promise<GuardResult[]> {
  const tasks: Array<() => Promise<GuardResult>> = [];

  for (const pkg of config.guard.npm_packages) {
    tasks.push(() => checkNpmPackage(pkg));
  }
  for (const release of config.guard.github_releases) {
    tasks.push(() => checkGitHubRelease(release));
  }
  for (const endpoint of config.guard.endpoints) {
    tasks.push(() => checkEndpoint(endpoint));
  }
  for (const scan of config.guard.readme_scans) {
    tasks.push(() => scanReadme(scan));
  }

  return runWithConcurrency(tasks, concurrency);
}

async function runWithConcurrency(
  tasks: Array<() => Promise<GuardResult>>,
  concurrency: number
): Promise<GuardResult[]> {
  const results: GuardResult[] = [];
  const executing = new Set<Promise<void>>();

  for (const task of tasks) {
    const p = task().then((result) => {
      results.push(result);
    });
    executing.add(p);
    p.finally(() => executing.delete(p));

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

export function getExitCode(results: GuardResult[]): number {
  return results.some((r) => r.status === "fail") ? 1 : 0;
}
