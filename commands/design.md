---
description: Apply the design comments collected from the browser overlay
---

Read `design-comments.md` in the project root.

It contains design comments I left directly on individual UI elements in the
browser. Every entry has: my comment (what should change), the route/URL, a
CSS selector, the Vue/React component(s) and their source file where
detectable, and an HTML snippet of the element.

Proceed like this:

1. Implement EVERY comment. When a source file is given, start there - that is
   the component the element is rendered in. Otherwise locate it via the
   component name, CSS classes, visible text and the HTML snippet (grep helps).
   The CSS selector describes the rendered DOM, not necessarily the source.
2. When a comment is ambiguous, pick the most obvious reading and note it
   briefly in your answer.
3. Follow the project's existing conventions (styling system, component
   structure, naming).
4. Once everything is implemented: append the processed entries to
   `design-comments.done.md` and reset `design-comments.md` to just the
   heading `# Design comments`.
5. Finish with a short summary of what you changed where.

$ARGUMENTS
