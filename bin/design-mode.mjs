#!/usr/bin/env node
/**
 * design-mode CLI
 *
 *   design-mode collect [--port 4939] [--out design-comments.md] [--lang en]
 *   design-mode install-command [--lang en] [--project]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startCollector } from '../src/collector.mjs';
import { DEFAULT_PORT } from '../src/serve.mjs';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

const HELP = `design-mode ${pkg.version}

Comment on UI elements in the browser, let your coding agent implement them.

Usage
  design-mode collect [options]          Run the standalone comment collector
  design-mode install-command [options]  Install the /design slash command

Options for collect
  --port <n>     Port to listen on (default ${DEFAULT_PORT})
  --out <file>   Output file (default design-comments.md in the current directory)
  --lang <l>     Overlay language: en | de | auto (default en)

Options for install-command
  --lang <l>     Command language: en | de (default en)
  --project      Install into ./.claude/commands instead of ~/.claude/commands
  --force        Overwrite an existing design.md

Docs: ${pkg.homepage}
`;

/** Minimal flag parser: --key value and --flag. */
function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      rest.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { flags, rest };
}

function fail(message) {
  console.error(`design-mode: ${message}`);
  process.exit(1);
}

async function collect(flags) {
  const port = flags.port ? Number(flags.port) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail(`invalid port "${flags.port}"`);

  let server;
  try {
    server = await startCollector({
      port,
      outFile: typeof flags.out === 'string' ? flags.out : undefined,
      lang: typeof flags.lang === 'string' ? flags.lang : undefined,
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') fail(`port ${port} is already in use`);
    fail(error.message);
  }

  const { outFile } = server.designMode;
  console.log(`design-mode collector listening on http://127.0.0.1:${port}`);
  console.log(`comments are appended to ${outFile}`);
  console.log(`add to your page: <script src="http://127.0.0.1:${port}/overlay.js" defer></script>`);

  const stop = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

function installCommand(flags) {
  const lang = typeof flags.lang === 'string' ? flags.lang : 'en';
  if (!['en', 'de'].includes(lang)) fail(`unknown lang "${lang}" (expected en or de)`);

  const source = path.join(pkgRoot, 'commands', lang === 'de' ? 'design.de.md' : 'design.md');
  const targetDir = flags.project
    ? path.resolve(process.cwd(), '.claude', 'commands')
    : path.join(os.homedir(), '.claude', 'commands');
  const target = path.join(targetDir, 'design.md');

  if (fs.existsSync(target) && !flags.force) {
    fail(`${target} already exists - re-run with --force to overwrite`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`design-mode: installed ${target}`);
  console.log('run /design in Claude Code to apply collected comments');
}

const { flags, rest } = parseArgs(process.argv.slice(2));
const command = rest[0];

if (flags.version || flags.v || command === 'version') {
  console.log(pkg.version);
} else if (!command || flags.help || flags.h || command === 'help') {
  console.log(HELP);
} else if (command === 'collect') {
  await collect(flags);
} else if (command === 'install-command') {
  installCommand(flags);
} else {
  console.error(`design-mode: unknown command "${command}"\n`);
  console.log(HELP);
  process.exit(1);
}
