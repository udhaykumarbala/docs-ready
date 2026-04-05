# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-04

### Added
- Edge case tests for empty docs, no frontmatter, non-UTF-8, empty content
- Production-ready stable release

### Changed
- Semantic versioning commitment from this point forward

## [0.9.0] - 2026-04-03

### Added

- README.md with full documentation, CLI reference, configuration guide, and comparison table
- LICENSE (MIT)
- CHANGELOG.md covering all versions from 0.1.0 through 0.9.0

## [0.8.0] - 2026-03-28

### Added

- `--watch` mode for the `generate` command -- watches docs directory and regenerates on changes
- `--quiet` global flag to suppress all output except errors
- `--verbose` global flag for debug-level logging
- `--no-color` global flag to disable colored terminal output
- Parallel execution of guard monitor checks for faster staleness detection

### Changed

- Guard HTTP requests now run concurrently instead of sequentially
- Logger module refactored to support configurable log levels

## [0.7.0] - 2026-03-20

### Added

- Framework-specific readers for Docusaurus, VitePress, and MkDocs
- Deploy configuration generators for Vercel, Netlify, and Cloudflare (CORS headers for AI files)
- Starlight framework detection support

### Changed

- `init` command now auto-detects deployment platform from project files

## [0.6.0] - 2026-03-12

### Added

- `validate` command (MVP release)
- Format validation rule -- checks `llms.txt` structure compliance
- Link validation rule -- detects dead internal and external links
- Token validation rule -- enforces configurable max token limit (default: 150,000)
- Coverage validation rule -- checks that generated docs cover a threshold percentage of source pages
- `--no-links` flag to skip link checking
- Validation exit codes for CI integration

## [0.5.0] - 2026-03-04

### Added

- `--init-workflow` flag for the `guard` command
- GitHub Actions workflow generator that creates `.github/workflows/docs-ready-guard.yml`
- Configurable workflow schedule, issue creation, and labels

## [0.4.0] - 2026-02-24

### Added

- `guard` command for staleness detection
- npm version monitor -- checks if documented package versions are outdated
- GitHub releases monitor -- checks for new releases in tracked repositories
- Endpoint health monitor -- verifies documented API endpoints are reachable
- README keyword monitor -- scans upstream READMEs for keyword drift
- Console reporter (default), JSON reporter, and Markdown reporter for guard output
- `--output` flag to select guard report format
- Guard exit codes for CI integration

## [0.3.0] - 2026-02-14

### Added

- `ai-context.md` generation with curated context for AI consumers
- Key page detection algorithm that identifies the most important documentation pages
- Content extraction with frontmatter-aware parsing
- Configurable `ai_context_config` with `key_pages` and `extra_sections` support

## [0.2.0] - 2026-02-05

### Added

- `llms.txt` generation with project title, description, URL, and structured page listing
- `llms-full.txt` generation with full concatenated documentation content
- MDX component cleaning -- strips JSX/MDX components from markdown before output
- Token counting utility with human-readable formatting
- `--dry-run` flag for the `generate` command
- `--only` flag to generate a single file type
- Configurable `sections` for grouping pages in `llms.txt`

## [0.1.0] - 2026-01-26

### Added

- CLI skeleton using Commander.js
- `init` command with interactive prompts for project title, description, and URL
- Documentation scanner with configurable include/exclude glob patterns
- Config loader supporting `.docs-ready.yaml`, `.docs-ready.yml`, and `.docs-ready.json`
- Framework detector for Docusaurus, VitePress, MkDocs, and plain Markdown
- `docusaurus-plugin-llms` detection -- disables duplicate generation when the plugin is present
- Config template system with YAML template rendering

[1.0.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/udhaykumarbala/docs-ready/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/udhaykumarbala/docs-ready/releases/tag/v0.1.0
