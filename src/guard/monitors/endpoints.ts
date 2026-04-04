import { fetchWithTimeout } from "../../utils/http.js";
import type { GuardResult } from "../types.js";

export interface EndpointConfig {
  url: string;
  label: string;
  expected_status?: number[];
}

export async function checkEndpoint(config: EndpointConfig): Promise<GuardResult> {
  const expectedStatuses = config.expected_status ?? [200, 301, 302];
  const startTime = Date.now();

  try {
    const response = await fetchWithTimeout(config.url, { timeout: 10000 });
    const elapsed = Date.now() - startTime;

    if (expectedStatuses.includes(response.status)) {
      return {
        monitor: "endpoint",
        label: config.label,
        status: "pass",
        message: `${config.url} returned ${response.status} (${elapsed}ms)`,
        details: { url: config.url, statusCode: response.status, responseTime: elapsed },
      };
    }

    return {
      monitor: "endpoint",
      label: config.label,
      status: "fail",
      message: `${config.url} returned ${response.status} (expected ${expectedStatuses.join("|")})`,
      details: { url: config.url, statusCode: response.status, responseTime: elapsed },
    };
  } catch (error) {
    const err = error as Error;
    if (err.name === "AbortError") {
      return {
        monitor: "endpoint",
        label: config.label,
        status: "fail",
        message: `${config.url} timed out after 10s`,
      };
    }
    return {
      monitor: "endpoint",
      label: config.label,
      status: "fail",
      message: `${config.url} failed: ${err.message}`,
    };
  }
}
