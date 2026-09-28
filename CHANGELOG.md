# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-28

First public release. Previously an internal copy-the-folder package, now an
installable one.

### Added

- npm package with subpath exports: `design-mode/nuxt`, `design-mode/vite`,
  `design-mode/overlay.js` and a programmatic entry point.
- `design-mode` CLI with `collect` (standalone receiver) and
  `install-command` (installs the `/design` slash command globally or into a
  project).
- Options for both integrations: `lang`, `outFile`, `enabled`,
  `collectorPort`.
- English and German overlay UI (`lang: 'auto'` follows the browser), plus
  English and German versions of the `/design` command.
- The collector now serves the overlay itself, so any dev server can opt in
  with a single script tag.
- React source files are picked up from `_debugSource` where available.
- Dependency-free test suite (`node:test`) and syntax lint, CI on Node 18, 20
  and 22.

### Changed

- Entry formatting lives in one place (`src/format.mjs`) instead of being
  duplicated across the Nuxt module, the Vite plugin and the collector.
- Generated Markdown is English, because it is read by a coding agent.
- Payloads are validated: empty comments are rejected, fields are length
  limited, control characters are stripped, and backticks in a selector or
  HTML snippet can no longer break out of their code span or fence.

### Security

- The collector binds to `127.0.0.1` instead of every interface, and replaces
  `Access-Control-Allow-Origin: *` with an allowlist of localhost origins.
- Request bodies are capped at 256 KB.

[Unreleased]: https://github.com/Malaika1985/design-mode/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Malaika1985/design-mode/releases/tag/v0.1.0
