# Nuxt example

A full Nuxt app is too heavy to keep in this repository, so here is the wiring
instead. Drop it into any existing Nuxt 3 or 4 project.

```sh
npm i -D @malaika1985/design-mode
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@malaika1985/design-mode/nuxt'],

  // all optional
  designMode: {
    lang: 'auto',                 // 'en' | 'de' | 'auto'
    outFile: 'design-comments.md',
    enabled: true,
  },
})
```

```sh
npm run dev
```

The module is a no-op outside of dev mode, so it is safe to leave in the
config. What makes Nuxt the best case for this tool: Vue 3 exposes each
component's source file in dev builds, so the recorded comment already points
at the `.vue` file that has to change.

To develop against a local checkout of design-mode:

```sh
cd /path/to/design-mode && npm link
cd /path/to/your-nuxt-app && npm link @malaika1985/design-mode
```
