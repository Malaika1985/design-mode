# design-mode

[![CI](https://github.com/Malaika1985/design-mode/actions/workflows/ci.yml/badge.svg)](https://github.com/Malaika1985/design-mode/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/design-mode.svg)](https://www.npmjs.com/package/design-mode)
[![license](https://img.shields.io/npm/l/design-mode.svg)](./LICENSE)

**Click a UI element in your dev server, write what should change, let your
coding agent do it.**

Design feedback usually travels as "the heading on the pricing page is too
close to the button" - and then someone has to find that heading. design-mode
removes that step: you point at the element in the running app, the tool
records *what* you clicked (selector, component name **and the component's
source file**), and your agent gets a task it can act on directly.

> 🇩🇪 [Deutsche Version dieser Anleitung](./README.de.md)

```
browser                       project                 Claude Code
┌──────────────┐   POST      ┌────────────────────┐   /design   ┌──────────┐
│ 🎨 click an  │ ──────────► │ design-comments.md │ ──────────► │ edits    │
│    element   │             │                    │             │ the code │
└──────────────┘             └────────────────────┘             └──────────┘
```

It works in the VS Code Simple Browser exactly like in Chrome, because the
overlay is just a script in your dev page. Nothing is sent anywhere: the
comments land in a file inside your project.

---

## What gets recorded

Every click + comment appends one entry to `design-comments.md`:

- your comment (what should change)
- the route/URL of the page
- a CSS selector for the element
- the Vue/React component name(s) **and the component's source file**
  (Vue 3 exposes it in dev mode - this is what lets the agent jump straight
  to the right `.vue` file)
- the visible text and an HTML snippet

```markdown
## 2026-01-14T09:12:44.081Z - /pricing

**Comment:** heading is too close to the button, needs more air

- Selector: `main > section.hero > h1.title`
- Component(s): <PricingHero> <- <PricingPage>
- Source file: `/app/components/PricingHero.vue`
- Element: `<h1> with classes title`
- Visible text: "Plans that scale with you"
```

---

## Install

```sh
npm i -D design-mode
```

Then wire it into your dev server - one line.

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['design-mode/nuxt'],
  designMode: { lang: 'de' }, // optional
})
```

### Vite (Vue, React, Svelte, plain)

```js
// vite.config.js
import designMode from 'design-mode/vite'

export default defineConfig({
  plugins: [vue(), designMode()],
})
```

### Any other dev server

Run the standalone collector next to it and add one script tag:

```sh
npx design-mode collect
```

```html
<script src="http://127.0.0.1:4939/overlay.js" defer></script>
```

The collector binds to loopback only and accepts requests from localhost
origins alone.

In every case the overlay and the endpoint exist **in dev only** - the Nuxt
module returns early when `dev` is false, and the Vite plugin is
`apply: 'serve'`.

Add the output files to your `.gitignore`:

```
design-comments.md
design-comments.done.md
```

---

## The `/design` command

design-mode ships the slash command that reads the file and implements the
comments. Install it once, globally:

```sh
npx design-mode install-command          # ~/.claude/commands/design.md
npx design-mode install-command --lang de
npx design-mode install-command --project  # ./.claude/commands/design.md
```

From then on `/design` is available in every project.

---

## Using it

1. Open your app in a preview (VS Code: `Cmd/Ctrl+Shift+P` -> "Simple
   Browser: Show" -> `http://localhost:3000`).
2. Click **🎨** in the bottom right - design mode is armed, the cursor
   becomes a crosshair.
3. Click an element, type your comment, hit **Enter**. Collect as many as you
   like; the badge counts them. **Esc** leaves the mode.
4. In Claude Code, run **`/design`**. It reads `design-comments.md`,
   implements every entry (starting from the source file where one was
   detected), moves the finished entries to `design-comments.done.md` and
   summarises what it changed. Hot reload shows the result immediately.

You can narrow it down: `/design only the comments on the landing page`.

---

## Options

Both the Nuxt module (`designMode: {...}`) and the Vite plugin
(`designMode({...})`) take the same options:

| Option          | Default                | Meaning                                           |
| --------------- | ---------------------- | ------------------------------------------------- |
| `lang`          | `'en'`                 | Overlay UI language: `'en'`, `'de'` or `'auto'`   |
| `outFile`       | `'design-comments.md'` | Output file, relative to the project root          |
| `enabled`       | `true`                 | Turn the tool off without removing the plugin      |
| `collectorPort` | `4939`                 | Port the overlay falls back to                     |

CLI:

```sh
design-mode collect [--port 4939] [--out design-comments.md] [--lang en]
design-mode install-command [--lang en] [--project] [--force]
```

---

## How it works

| File                | Role                                                               |
| ------------------- | ------------------------------------------------------------------ |
| `src/overlay.js`    | The browser overlay: picker, comment panel, POST                    |
| `src/serve.mjs`     | Option resolution, overlay config injection, shared request plumbing |
| `src/format.mjs`    | The single place that renders and writes a Markdown entry           |
| `src/nuxt.mjs`      | Nuxt module - injects the script, registers dev server handlers     |
| `src/vite.mjs`      | Vite plugin - same thing via `transformIndexHtml` + middleware      |
| `src/collector.mjs` | Standalone HTTP receiver for everything else                        |
| `commands/`         | The `/design` slash command, EN and DE                              |

design-mode has **zero runtime dependencies**. `@nuxt/kit`, `h3` and `vite`
are optional peers - you only need the ones your setup already has.

---

## Troubleshooting

**No 🎨 button.** Is the module/plugin registered and the dev server
restarted? `/__design-mode/overlay.js` must return 200 in the network tab.

**"No receiver reachable" when saving.** The endpoint is missing - same cause
as above, or you are using the standalone collector and it is not running.

**Component/file name missing for some elements.** Happens on wrapper
elements outside of any component, and in React builds without dev source
info. The selector, classes and text are almost always enough for the agent.

**Nothing in production.** By design. If you see the overlay in a production
build, that is a bug - please open an issue.

---

## Why a per-project plugin?

VS Code's own element picker ("Add element to chat" in the Simple Browser) is
wired to Copilot Chat and cannot be redirected to another agent. A click
picker therefore has to run inside the page itself - which is what this is.
One install plus one config line, and the `/design` command is global.

---

## Contributing

Issues and PRs are welcome - see [CONTRIBUTING.md](./CONTRIBUTING.md). The
test suite is dependency-free:

```sh
npm test
npm run lint
```

## License

[MIT](./LICENSE) © Malaika1985
