# design-mode

[![CI](https://github.com/Malaika1985/design-mode/actions/workflows/ci.yml/badge.svg)](https://github.com/Malaika1985/design-mode/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/design-mode.svg)](https://www.npmjs.com/package/design-mode)
[![license](https://img.shields.io/npm/l/design-mode.svg)](./LICENSE)

**Element in der Browser-Preview anklicken, Kommentar schreiben, den Coding-Agent
umsetzen lassen.**

Design-Feedback klingt meistens so: „die Überschrift auf der Preisseite klebt am
Button" — und danach sucht jemand diese Überschrift. design-mode spart diesen
Schritt: Du zeigst in der laufenden App auf das Element, das Tool notiert, *was*
du angeklickt hast (Selektor, Komponentenname **und die Quelldatei der
Komponente**), und dein Agent bekommt eine Aufgabe, mit der er sofort arbeiten
kann.

> 🇬🇧 [English version of this guide](./README.md)

```
Browser                       Projekt                 Claude Code
┌──────────────┐   POST      ┌────────────────────┐   /design   ┌──────────┐
│ 🎨 Element   │ ──────────► │ design-comments.md │ ──────────► │ ändert   │
│    anklicken │             │                    │             │ den Code │
└──────────────┘             └────────────────────┘             └──────────┘
```

Funktioniert im VS Code Simple Browser genauso wie in Chrome, weil das Overlay
einfach ein Script in deiner Dev-Seite ist. Es wird nichts verschickt: Die
Kommentare landen in einer Datei in deinem Projekt.

---

## Was gespeichert wird

Pro Klick + Kommentar landet ein Eintrag in `design-comments.md`:

- dein Kommentar (was geändert werden soll)
- Route/URL der Seite
- CSS-Selektor des Elements
- Vue-/React-Komponentenname(n) **und die Quelldatei der Komponente**
  (Vue 3 liefert sie im Dev-Modus mit — damit weiß der Agent sofort, welche
  `.vue`-Datei zu ändern ist)
- sichtbarer Text und ein HTML-Ausschnitt

```markdown
## 2026-01-14T09:12:44.081Z - /pricing

**Comment:** Überschrift klebt am Button, braucht mehr Luft

- Selector: `main > section.hero > h1.title`
- Component(s): <PricingHero> <- <PricingPage>
- Source file: `/app/components/PricingHero.vue`
- Element: `<h1> with classes title`
- Visible text: "Plans that scale with you"
```

Die Beschriftungen der Einträge sind englisch, weil die Datei von einem
KI-Agenten gelesen wird — dein Kommentartext darf natürlich deutsch sein.

---

## Installation

```sh
npm i -D design-mode
```

Danach eine Zeile im Dev-Server.

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
  plugins: [vue(), designMode({ lang: 'de' })],
})
```

### Jeder andere Dev-Server

Den Standalone-Collector nebenher laufen lassen und ein Script-Tag einbinden:

```sh
npx design-mode collect --lang de
```

```html
<script src="http://127.0.0.1:4939/overlay.js" defer></script>
```

Der Collector lauscht nur auf Loopback und akzeptiert ausschließlich Anfragen
von localhost-Origins.

In allen Varianten existieren Overlay und Endpoint **nur im Dev-Modus** — das
Nuxt-Modul beendet sich selbst, wenn `dev` nicht aktiv ist, das Vite-Plugin ist
`apply: 'serve'`.

Empfohlen in die `.gitignore`:

```
design-comments.md
design-comments.done.md
```

---

## Der `/design`-Befehl

design-mode bringt den Slash-Command mit, der die Datei liest und die
Kommentare umsetzt. Einmal global einrichten:

```sh
npx design-mode install-command --lang de   # ~/.claude/commands/design.md
npx design-mode install-command --project   # ./.claude/commands/design.md
```

Danach steht `/design` in allen Projekten zur Verfügung.

---

## Benutzung

1. App in der Preview öffnen (VS Code: `Cmd/Ctrl+Shift+P` → „Simple Browser:
   Show" → `http://localhost:3000`).
2. Unten rechts auf **🎨** klicken — Design-Mode ist an, der Cursor wird zum
   Fadenkreuz.
3. Element anklicken, Kommentar tippen, **Enter**. Beliebig viele Kommentare
   sammeln, der Badge zählt mit. **Esc** beendet den Modus.
4. In Claude Code **`/design`** eintippen. Claude liest `design-comments.md`,
   setzt jeden Eintrag um (bei erkannter Quelldatei direkt dort), verschiebt
   Erledigtes nach `design-comments.done.md` und fasst zusammen, was es
   geändert hat. Hot Reload zeigt das Ergebnis sofort.

Du kannst eingrenzen: `/design nur die Kommentare zur Startseite`.

---

## Optionen

Nuxt-Modul (`designMode: {...}`) und Vite-Plugin (`designMode({...})`) nehmen
dieselben Optionen:

| Option          | Default                | Bedeutung                                        |
| --------------- | ---------------------- | ------------------------------------------------ |
| `lang`          | `'en'`                 | Sprache des Overlays: `'en'`, `'de'` oder `'auto'` |
| `outFile`       | `'design-comments.md'` | Zieldatei, relativ zum Projekt-Root               |
| `enabled`       | `true`                 | Abschalten, ohne das Plugin zu entfernen          |
| `collectorPort` | `4939`                 | Port, auf den das Overlay zurückfällt             |

CLI:

```sh
design-mode collect [--port 4939] [--out design-comments.md] [--lang de]
design-mode install-command [--lang de] [--project] [--force]
```

---

## Aufbau

| Datei               | Rolle                                                              |
| ------------------- | ------------------------------------------------------------------ |
| `src/overlay.js`    | Das Browser-Overlay: Picker, Kommentar-Panel, POST                  |
| `src/serve.mjs`     | Optionen, Config-Injektion ins Overlay, gemeinsame Request-Logik    |
| `src/format.mjs`    | Die einzige Stelle, die einen Markdown-Eintrag rendert und schreibt |
| `src/nuxt.mjs`      | Nuxt-Modul — injiziert das Script, registriert Dev-Handler          |
| `src/vite.mjs`      | Vite-Plugin — dasselbe über `transformIndexHtml` + Middleware       |
| `src/collector.mjs` | Standalone-Empfänger für alles andere                               |
| `commands/`         | Der `/design`-Slash-Command, EN und DE                              |

design-mode hat **keine Runtime-Dependencies**. `@nuxt/kit`, `h3` und `vite`
sind optionale Peers — du brauchst nur die, die dein Setup ohnehin hat.

---

## Troubleshooting

**Kein 🎨-Button sichtbar.** Modul/Plugin eingetragen und Dev-Server neu
gestartet? Im Netzwerk-Tab muss `/__design-mode/overlay.js` mit Status 200
auftauchen.

**„Kein Empfänger erreichbar" beim Speichern.** Der Endpoint fehlt — gleiche
Ursache wie oben, oder der Standalone-Collector läuft nicht.

**Komponenten-/Dateiname fehlt bei manchen Elementen.** Kommt bei
Wrapper-Elementen außerhalb von Komponenten vor und in React-Builds ohne
Dev-Source-Infos. Selektor, Klassen und Text reichen dem Agenten fast immer.

**Nichts davon im Production-Build.** So gewollt. Wenn du das Overlay in einem
Production-Build siehst, ist das ein Bug — bitte ein Issue aufmachen.

---

## Warum überhaupt ein Plugin pro Projekt?

Die Element-Auswahl von VS Code selbst („Add element to chat" im Simple
Browser) ist fest mit Copilot Chat verdrahtet und lässt sich nicht auf einen
anderen Agenten umbiegen. Ein Klick-Picker muss deshalb in der Seite selbst
laufen — daher dieses Plugin. Eine Installation plus eine Config-Zeile, und der
`/design`-Befehl ist global.

---

## Mitmachen

Issues und PRs sind willkommen — siehe [CONTRIBUTING.md](./CONTRIBUTING.md).
Die Tests kommen ohne Dependencies aus:

```sh
npm test
npm run lint
```

## Lizenz

[MIT](./LICENSE) © Malaika1985
