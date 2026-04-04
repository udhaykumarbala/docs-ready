import { describe, it, expect } from "vitest";
import { generateWorkflowYaml } from "../../src/guard/workflow.js";
import YAML from "yaml";
import type { DocsReadyConfig } from "../../src/core/config.js";

function makeConfig(overrides: Partial<DocsReadyConfig["guard"]["workflow"]> = {}): DocsReadyConfig {
  return {
    title: "Test",
    description: "Test project",
    url: "https://example.com",
    docs: { dir: "./docs", include: ["**/*.md"], exclude: [] },
    generate: { llms_txt: true, llms_full_txt: true, ai_context: true, output_dir: "./build" },
    guard: {
      npm_packages: [{ name: "my-pkg", label: "My Package" }],
      github_releases: [{ repo: "org/repo", label: "Repo" }],
      endpoints: [{ url: "https://api.example.com", label: "API" }],
      readme_scans: [],
      workflow: {
        enabled: true,
        schedule: "0 9 */3 * *",
        create_issues: true,
        labels: ["ai-context-review", "documentation"],
        ...overrides,
      },
    },
    deploy: { platform: "none", cors: { enabled: true, origins: ["*"] } },
    validate: { max_tokens: 150000, check_links: true, check_coverage: true, coverage_threshold: 0.95 },
  };
}

describe("generateWorkflowYaml", () => {
  it("renders valid YAML", () => {
    const yaml = generateWorkflowYaml(makeConfig());
    // Should parse without error
    const parsed = YAML.parse(yaml);
    expect(parsed).toBeDefined();
    expect(parsed.name).toBe("docs-ready guard");
  });

  it("injects cron schedule from config", () => {
    const yaml = generateWorkflowYaml(makeConfig({ schedule: "0 6 * * 1" }));
    expect(yaml).toContain('"0 6 * * 1"');
  });

  it("injects labels from config", () => {
    const yaml = generateWorkflowYaml(makeConfig({ labels: ["custom-label", "docs"] }));
    expect(yaml).toContain('"custom-label"');
    expect(yaml).toContain('"docs"');
  });

  it("includes install and guard steps", () => {
    const yaml = generateWorkflowYaml(makeConfig());
    expect(yaml).toContain("npm install -g docs-ready");
    expect(yaml).toContain("docs-ready guard --output markdown");
  });

  it("includes issue creation on failure", () => {
    const yaml = generateWorkflowYaml(makeConfig());
    expect(yaml).toContain("Create issue on failure");
    expect(yaml).toContain("GUARD_FAILED");
  });

  it("includes close previous issues step", () => {
    const yaml = generateWorkflowYaml(makeConfig());
    expect(yaml).toContain("Close previous docs-ready issues");
  });
});
