# AGENTS.md

Notes for coding agents working on this repository. Humans: see
[CONTRIBUTING.md](./CONTRIBUTING.md), it says the same thing at more length.

## What this is

A dev-only tool. You click an element in a running app, write what should
change, and the comment plus its selector, component name and source file is
appended to `design-comments.md`. An agent then reads that file (via the
`/design` command in `commands/`) and does the work.

## Commands

```sh
npm test                                   # node:test, no dependencies
npm run lint                               # node --check over every JS file
npm i --no-save @nuxt/kit h3 && npm test   # also runs the Nuxt module tests
npm pack --dry-run                         # what would be published
```

There is no build step and no `node_modules` in a default checkout. That is
intentional, not an oversight.

## Rules that are not negotiable

- **Zero runtime dependencies.** `@nuxt/kit`, `h3` and `vite` are optional
  peers because the integrations run inside those tools. Nothing else.
- **Nothing reaches a production build.** `src/nuxt.mjs` returns early unless
  `nuxt.options.dev`, `src/vite.mjs` is `apply: 'serve'`, and
  `src/collector.mjs` binds to `127.0.0.1` with a localhost-only CORS
  allowlist. Tests cover all three - do not weaken them.
- **One writer.** Every integration writes entries through
  `src/format.mjs`. Never inline a second copy of the Markdown layout; that
  duplication is exactly what the 0.1.0 refactor removed.
- **`src/overlay.js` is shipped verbatim to the browser.** It is never bundled
  or transpiled. Keep it plain, conservative browser JS with no imports.
- **The generated Markdown is English** even when the UI is German, because an
  agent reads it. `commands/design.md` and `commands/design.de.md` must stay
  in sync about the field names.

## Layout

| Path                | What lives there                                     |
| ------------------- | ---------------------------------------------------- |
| `src/overlay.js`    | Browser overlay: picker, panel, POST                  |
| `src/format.mjs`    | Validation, Markdown rendering, file append           |
| `src/serve.mjs`     | Options, overlay config injection, shared HTTP bits   |
| `src/nuxt.mjs`      | Nuxt module                                           |
| `src/vite.mjs`      | Vite plugin                                           |
| `src/collector.mjs` | Standalone receiver                                   |
| `bin/design-mode.mjs` | CLI: `collect`, `install-command`                   |
| `commands/`         | The `/design` slash command, EN and DE                |
| `test/`             | `node:test` suites, one per module                    |

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- User-facing changes go into `README.md` **and** `README.de.md`.
- Behaviour changes go into `CHANGELOG.md` under `## [Unreleased]`.
- Anything touching the written format, option handling or the collector's
  HTTP surface needs a test.
