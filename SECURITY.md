# Security policy

## Threat model in one paragraph

design-mode is a development tool that writes a file on your machine based on
what a web page sends it. That is the whole risk surface: a page you have open
locally can append text to `design-comments.md`, and an agent will later read
that file. It is not meant to be exposed to a network, and nothing it adds may
reach a production build.

The mitigations in place:

- The Nuxt module and the Vite plugin only exist in dev mode
  (`nuxt.options.dev`, `apply: 'serve'`).
- The standalone collector binds to `127.0.0.1` only.
- The collector rejects cross-origin requests from anything that is not a
  `localhost` / `127.0.0.1` / `[::1]` origin.
- Payloads are capped (256 KB per request) and every field is length-limited
  and stripped of control characters before it is written.

Still worth knowing: `design-comments.md` contains text from a web page and is
then read by a coding agent. Treat it like any other untrusted input - read
the comments before running `/design` on a page you do not control.

## Supported versions

The latest released version is supported. This is a pre-1.0 project; fixes go
into a new release rather than into patches of older ones.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private reporting:
[Report a vulnerability](https://github.com/Malaika1985/design-mode/security/advisories/new).

Include what you can: affected version, setup (Nuxt/Vite/collector), and the
smallest reproduction you have. You can expect a first reply within a week.
Once a fix is released, you will be credited in the advisory unless you prefer
otherwise.
