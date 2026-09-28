# Contributing

Thanks for taking a look. This is a small project on purpose - the whole
thing is about 700 lines - so the bar for a change is mostly "does it keep it
small and obvious".

## Getting set up

```sh
git clone https://github.com/Malaika1985/design-mode.git
cd design-mode
npm install      # installs nothing: there are no dependencies
npm test
npm run lint
```

Node 18.17 or newer. Tests use the built-in `node:test` runner, lint is
`node --check` over every shipped file. There is no build step - what is in
`src/` is what ships.

## Trying a change in a real project

```sh
cd design-mode && npm link
cd ../your-app && npm link @mailaika1985/design-mode
```

Then add `@mailaika1985/design-mode/nuxt` or `@mailaika1985/design-mode/vite` to that app's config and
restart its dev server.

## Ground rules for changes

- **Zero runtime dependencies.** If a change needs a dependency, open an issue
  first and make the case. The optional peers (`@nuxt/kit`, `h3`, `vite`)
  exist only because the integrations run inside those tools.
- **Dev only, always.** Nothing this package adds may end up in a production
  build. The Nuxt module returns early when `dev` is false, the Vite plugin is
  `apply: 'serve'`, and the collector binds to loopback.
- **One format, one place.** Every receiver writes entries through
  `src/format.mjs`. Do not inline a second copy of the Markdown layout.
- **`src/overlay.js` is browser code** that is served verbatim, never bundled
  or transpiled. Keep it conservative: no modules, no optional chaining in
  hot paths, no build-time syntax.
- **Tests for behaviour changes.** Anything about the written format, option
  handling or the collector's HTTP surface should be covered.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
`docs:`, `test:`, `chore:`, `refactor:`. The changelog is written from them.

## Pull requests

- One topic per PR, small enough to read in a sitting.
- Say what you changed and why, and how you verified it (which dev server,
  which framework).
- `npm test && npm run lint` must pass; CI runs both on Node 18, 20 and 22.
- Docs are bilingual: user-facing changes go into both `README.md` and
  `README.de.md`. If you only speak one of the two, say so in the PR - a
  translation can be added on top.

## Releasing (maintainers)

1. Update `CHANGELOG.md`.
2. `npm version <patch|minor|major>`
3. `git push --follow-tags`
4. The `release` workflow publishes to npm from the tag (needs the `NPM_TOKEN`
   repository secret).
