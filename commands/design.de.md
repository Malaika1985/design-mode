---
description: Design-Kommentare aus dem Browser-Overlay umsetzen
---

Lies die Datei `design-comments.md` im Projekt-Root.

Sie enthält Design-Kommentare, die ich direkt im Browser auf einzelnen
UI-Elementen hinterlassen habe. Jeder Eintrag hat: meinen Kommentar (was
geändert werden soll), die Route/URL, einen CSS-Selektor, sofern erkennbar
die Vue-/React-Komponente(n) und deren Quelldatei, sowie einen HTML-Ausschnitt
des Elements. Die Einträge sind auf Englisch beschriftet (`Comment`,
`Selector`, `Source file`, ...), mein Kommentartext kann deutsch sein.

Gehe so vor:

1. Setze JEDEN Kommentar um. Wenn eine Quelldatei angegeben ist, fang dort an
   — das ist die Komponente, in der das Element gerendert wird. Sonst finde
   die Stelle über Komponentennamen, CSS-Klassen, den sichtbaren Text und den
   HTML-Ausschnitt (grep hilft). Der CSS-Selektor beschreibt das gerenderte
   DOM, nicht zwingend die Quelldatei.
2. Wenn ein Kommentar mehrdeutig ist, wähle die naheliegendste Interpretation
   und vermerke sie kurz in deiner Antwort.
3. Halte dich an die bestehenden Konventionen des Projekts (Styling-System,
   Komponentenstruktur, Naming).
4. Wenn alles umgesetzt ist: hänge die abgearbeiteten Einträge an
   `design-comments.done.md` an und leere `design-comments.md` bis auf die
   Überschrift `# Design comments`.
5. Fasse am Ende kurz zusammen, was du wo geändert hast.

$ARGUMENTS
