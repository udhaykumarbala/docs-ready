# docs-ready

**Make your docs AI-ready. Keep them that way.**

`docs-ready` generates `llms.txt`, `llms-full.txt`, and `ai-context.md` from your existing documentation, then guards them against staleness and validates them for format compliance.

Born from real production work making [0G Labs](https://0g.ai) docs AI-ready.

---

## Install

```bash
# Run directly
npx docs-ready

# Or install globally
npm install -g docs-ready
```

Requires Node.js 18+.

## Quick Start

```bash
# 1. Initialize config
docs-ready init

# 2. Generate AI-facing files
docs-ready generate

# 3. Check for staleness
docs-ready guard

# 4. Validate output
docs-ready validate
```

`init` detects your framework and deployment platform, then writes a `.docs-ready.yaml` config file. `generate` produces the output files. `guard` monitors upstream sources for version bumps, endpoint changes, and keyword drift. `validate` lints the generated files for format, dead links, token limits, and coverage.

---

## Three Pillars

### Generate

Produces three AI-facing files from your documentation source:

| File | Purpose |
|------|---------|
| `llms.txt` | Structured index of your docs with title, description, and page listing |
| `llms-full.txt` | Full content of every doc page, concatenated and cleaned |
| `ai-context.md` | Curated context page with key pages, summaries, and extra sections |

MDX components are cleaned automatically. Token counts are reported for each file.

### Guard

Monitors upstream sources and flags when your AI docs may be stale:

- **npm monitor** -- checks if documented npm package versions are outdated
- **GitHub releases monitor** -- checks for new releases in tracked repositories
- **Endpoint monitor** -- verifies that documented API endpoints are still reachable
- **README keyword monitor** -- scans upstream READMEs for keyword drift

Results can be output as console text, JSON, or markdown. Guard checks run in parallel for speed.

### Validate

Lints AI-facing docs for compliance:

- **Format** -- checks that `llms.txt` follows the expected structure
- **Links** -- verifies internal and external links are not dead
- **Tokens** -- ensures total token count stays within the configured limit (default: 150,000)
- **Coverage** -- checks that generated docs cover a sufficient percentage of source pages

---

## Configuration

`docs-ready init` generates a `.docs-ready.yaml` file. You can also use `.docs-ready.yml` or `.docs-ready.json`.

```yaml
# --- Project metadata (required) ---
title: "My Project"
description: "Project documentation"
url: "https://docs.example.com"

# --- Documentation source ---
docs:
  dir: "./docs"
  include:
    - "**/*.md"
    - "**/*.mdx"
  exclude:
    - "**/node_modules/**"
    - "**/_*"

# --- Generation ---
generate:
  llms_txt: true
  llms_full_txt: true
  ai_context: true
  output_dir: "./build"
  sections:                        # optional: group pages into sections
    - title: "Getting Started"
      patterns: ["getting-started/**"]
  ai_context_config:               # optional: customize ai-context.md
    key_pages:
      - path: "intro.md"
        section: "Overview"
    extra_sections:
      - title: "Architecture"
        source: "architecture.md"

# --- Guard ---
guard:
  npm_packages:
    - name: "@0glabs/sdk"
      label: "0G SDK"
  github_releases:
    - repo: "0glabs/0g-chain"
      label: "0G Chain"
  endpoints:
    - url: "https://api.example.com/v1/health"
      label: "API Health"
      expected_status: [200]
  readme_scans:
    - repo: "0glabs/0g-chain"
      keywords: ["install", "quickstart", "api"]
  workflow:
    enabled: true
    schedule: "0 9 */3 * *"
    create_issues: true
    labels: ["ai-context-review", "documentation"]

# --- Deployment ---
deploy:
  platform: "vercel"               # vercel | netlify | cloudflare | none
  cors:
    enabled: true
    origins: ["*"]

# --- Validation ---
validate:
  max_tokens: 150000
  check_links: true
  check_coverage: true
  coverage_threshold: 0.95
```

---

## CLI Reference

### Global Flags

| Flag | Description |
|------|-------------|
| `--quiet` | Only show errors |
| `--verbose` | Show debug logging |
| `--no-color` | Disable colored output |
| `--version` | Print version |
| `--help` | Show help |

### `docs-ready init`

Initialize a `.docs-ready.yaml` config file. Auto-detects framework, docs directory, and deployment platform.

```bash
docs-ready init
```

### `docs-ready generate`

Generate AI-facing documentation files based on your config.

```bash
docs-ready generate
docs-ready generate --dry-run
docs-ready generate --only llms-txt
docs-ready generate --watch
```

| Flag | Description |
|------|-------------|
| `--dry-run` | Show what would be generated without writing files |
| `--only <type>` | Generate only one file: `llms-txt`, `llms-full`, or `ai-context` |
| `--watch` | Watch for changes and regenerate automatically |

### `docs-ready guard`

Run staleness checks against upstream sources.

```bash
docs-ready guard
docs-ready guard --output json
docs-ready guard --output markdown
docs-ready guard --init-workflow
```

| Flag | Description |
|------|-------------|
| `--output <format>` | Output format: `console` (default), `json`, or `markdown` |
| `--init-workflow` | Generate a GitHub Actions workflow at `.github/workflows/docs-ready-guard.yml` |

### `docs-ready validate`

Lint and validate generated AI-facing docs.

```bash
docs-ready validate
docs-ready validate --no-links
```

| Flag | Description |
|------|-------------|
| `--no-links` | Skip link checking |

---

## Frameworks Supported

`docs-ready init` auto-detects the following frameworks and sets the correct docs directory:

| Framework | Docs Directory |
|-----------|---------------|
| Docusaurus | `docs/` |
| VitePress | `docs/` or custom |
| MkDocs | `docs/` |
| Starlight | `src/content/docs/` |
| Plain Markdown | `./` or custom |

Framework-specific readers handle sidebar configs, frontmatter conventions, and file organization for each.

---

## Deployment

`docs-ready` generates platform-specific configuration to serve AI-facing files with proper CORS headers so LLMs can fetch them.

### Vercel

Adds rewrite rules and CORS headers to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/llms.txt",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Content-Type", "value": "text/plain; charset=utf-8" }
      ]
    }
  ]
}
```

### Netlify

Adds headers to `_headers` or `netlify.toml`:

```
/llms.txt
  Access-Control-Allow-Origin: *
  Content-Type: text/plain; charset=utf-8
```

### Cloudflare

Adds rules to `_headers` for Cloudflare Pages:

```
/llms.txt
  Access-Control-Allow-Origin: *
  Content-Type: text/plain; charset=utf-8
```

---

## Comparison

| Feature | docs-ready | docusaurus-plugin-llms | afdocs |
|---------|-----------|----------------------|--------|
| `llms.txt` generation | Yes | Yes | Yes |
| `llms-full.txt` generation | Yes | Yes | Yes |
| `ai-context.md` generation | Yes | No | No |
| Staleness monitoring (guard) | Yes | No | No |
| Validation / linting | Yes | No | No |
| GitHub Actions workflow | Yes | No | No |
| Framework support | Docusaurus, VitePress, MkDocs, Starlight, plain MD | Docusaurus only | Multiple |
| Watch mode | Yes | Via Docusaurus | No |
| Deploy config generation | Vercel, Netlify, Cloudflare | No | No |
| Config format | YAML / JSON | Docusaurus plugin config | YAML |

`docusaurus-plugin-llms` is a good choice if you only use Docusaurus and only need file generation. `docs-ready` covers the full lifecycle: generate, guard against staleness, and validate compliance. If you already use `docusaurus-plugin-llms` for generation, `docs-ready init` detects it and disables duplicate generation -- you can still use guard and validate.

---

## Origin Story

`docs-ready` was built while making the [0G Labs](https://0g.ai) documentation AI-ready. The generate step came first, then guard was added after discovering that AI context files silently went stale when upstream SDKs released new versions. Validate was added to catch format regressions in CI. The tool was extracted into a standalone package so any docs team can use it.

---

## Contributing

Contributions are welcome. See the [GitHub repository](https://github.com/udhaykumarbala/docs-ready) for issues and pull requests.

```bash
git clone https://github.com/udhaykumarbala/docs-ready.git
cd docs-ready
npm install
npm run dev
npm test
```

## License

[MIT](./LICENSE)
