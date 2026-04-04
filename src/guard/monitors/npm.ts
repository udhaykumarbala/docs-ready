import { fetchWithTimeout } from "../../utils/http.js";
import type { GuardResult } from "../types.js";

export interface NpmPackageConfig {
  name: string;
  label: string;
}

export async function checkNpmPackage(config: NpmPackageConfig): Promise<GuardResult> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(config.name).replace("%40", "@")}/latest`;

  try {
    const response = await fetchWithTimeout(url, { timeout: 10000 });

    if (response.status === 404) {
      return {
        monitor: "npm",
        label: config.label,
        status: "fail",
        message: `Package ${config.name} not found on npm`,
      };
    }

    if (!response.ok) {
      return {
        monitor: "npm",
        label: config.label,
        status: "warn",
        message: `npm registry returned ${response.status}`,
      };
    }

    const data = await response.json() as { version: string };
    return {
      monitor: "npm",
      label: config.label,
      status: "pass",
      message: `Latest version: ${data.version}`,
      details: { latestVersion: data.version, package: config.name },
    };
  } catch (error) {
    return {
      monitor: "npm",
      label: config.label,
      status: "warn",
      message: `Failed to check npm: ${(error as Error).message}`,
    };
  }
}
