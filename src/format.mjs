/**
 * Shared formatting + writing of design comments.
 *
 * All three receivers (Nuxt module, Vite plugin, standalone collector) go
 * through this file, so the on-disk format can never drift apart.
 *
 * The generated Markdown is always English, because it is read by an AI
 * coding agent, not by humans. The overlay UI is what gets translated.
 */
import fs from 'node:fs';
import path from 'node:path';

export const HEADING = '# Design comments';

const LIMITS = {
  comment: 2000,
  url: 500,
  selector: 500,
  tag: 50,
  id: 200,
  className: 200,
  text: 200,
  html: 1200,
  sourceFile: 500,
  componentName: 100,
};

// Control characters that would corrupt the Markdown file (tab/newline kept).
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

function clean(value, max) {
  if (typeof value !== 'string') return null;
  const s = value.replace(CONTROL_CHARS, '').trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) + '...' : s;
}

/** Inline code span with a fence long enough to survive backticks in `s`. */
function inlineCode(s) {
  const longest = (s.match(/`+/g) || []).reduce((a, b) => Math.max(a, b.length), 0);
  const ticks = '`'.repeat(longest + 1);
  const pad = s.startsWith('`') || s.endsWith('`') ? ' ' : '';
  return `${ticks}${pad}${s}${pad}${ticks}`;
}

/** Fenced block with a fence long enough to survive backticks in `s`. */
function fenced(s, lang = '') {
  const longest = (s.match(/^`{3,}/gm) || []).reduce((a, b) => Math.max(a, b.length), 0);
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}${lang}\n${s}\n${fence}`;
}

/**
 * Validate and normalise a raw payload coming from the browser.
 * Throws on anything that is not a usable comment.
 */
export function normalise(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('payload is not an object');

  const comment = clean(raw.comment, LIMITS.comment);
  if (!comment) throw new Error('comment is empty');

  const components = Array.isArray(raw.components)
    ? raw.components.map((c) => clean(c, LIMITS.componentName)).filter(Boolean).slice(0, 6)
    : [];

  const classes = Array.isArray(raw.classes)
    ? raw.classes.map((c) => clean(c, LIMITS.className)).filter(Boolean).slice(0, 20)
    : [];

  const time =
    typeof raw.time === 'string' && !Number.isNaN(Date.parse(raw.time))
      ? raw.time
      : new Date().toISOString();

  return {
    comment,
    url: clean(raw.url, LIMITS.url) || '/',
    selector: clean(raw.selector, LIMITS.selector) || '(unknown)',
    components,
    sourceFile: clean(raw.sourceFile, LIMITS.sourceFile),
    tag: clean(raw.tag, LIMITS.tag) || 'unknown',
    id: clean(raw.id, LIMITS.id),
    classes,
    text: clean(raw.text, LIMITS.text),
    html: clean(raw.html, LIMITS.html),
    time,
  };
}

/** Render one comment as a Markdown section. Accepts raw or normalised input. */
export function formatEntry(data) {
  const d = normalise(data);
  const components = d.components.length
    ? d.components.map((c) => `<${c}>`).join(' <- ')
    : '-';
  const element =
    `<${d.tag}${d.id ? ` id="${d.id}"` : ''}>` +
    (d.classes.length ? ` with classes ${d.classes.join(' ')}` : '');

  return [
    `## ${d.time} - ${d.url}`,
    ``,
    `**Comment:** ${d.comment}`,
    ``,
    `- Selector: ${inlineCode(d.selector)}`,
    `- Component(s): ${components}`,
    d.sourceFile ? `- Source file: ${inlineCode(d.sourceFile)}` : null,
    `- Element: ${inlineCode(element)}`,
    d.text ? `- Visible text: "${d.text}"` : null,
    d.html ? `- HTML snippet:\n\n${fenced(d.html, 'html')}` : null,
    ``,
    `---`,
    ``,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Append a comment to `outFile`, creating the file (and its directory) with
 * the standard heading if it does not exist yet.
 * Returns the normalised entry so callers can log it.
 */
export function appendComment(outFile, raw) {
  const entry = normalise(raw);
  const target = path.resolve(outFile);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${HEADING}\n\n`, 'utf8');
  }
  fs.appendFileSync(target, formatEntry(entry), 'utf8');
  return entry;
}
