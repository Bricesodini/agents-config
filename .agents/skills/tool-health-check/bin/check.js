#!/usr/bin/env node
// bin/check.js — CLI pour tool-health-check
//
// Usage :
//   check.js                                   # probe tous les outils (5s timeout par défaut)
//   check.js --timeout 10000                   # timeout custom
//   check.js --json                            # sortie JSON brut
//   check.js --brief                           # sortie "brief prefix" (à injecter en 1re ligne de brief)
//   check.js --simulate web_search=http_402    # simule un statut (utile pour tester les briefs)

'use strict';

const { probe, briefPrefix } = require('../lib/tool-health-check.js');

function parseArgs(argv) {
  const args = { timeout: 5000, json: false, brief: false, simulate: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--timeout') args.timeout = parseInt(argv[++i], 10);
    else if (a === '--json') args.json = true;
    else if (a === '--brief') args.brief = true;
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: check.js [--timeout MS] [--json] [--brief] [--simulate tool=status ...]`);
      process.exit(0);
    } else if (a.startsWith('--simulate')) {
      const spec = a.includes('=') ? a.slice('--simulate='.length) : argv[++i];
      const [tool, status] = spec.split('=');
      args.simulate[tool] = status;
    }
  }
  return args;
}

function color(c) {
  if (!process.stdout.isTTY) return (s) => s;
  return (s) => `\x1b[${c}m${s}\x1b[0m`;
}

const green = color('32');
const red = color('31');
const yellow = color('33');
const dim = color('2');

const STATUS_RENDER = {
  ok: (s) => green('✓ OK'),
  http_402: (s) => red('✗ HTTP 402'),
  http_5xx: (s) => red(`✗ ${s.status.toUpperCase()}`),
  http_4xx: (s) => red(`✗ ${s.status.toUpperCase()}`),
  timeout: (s) => yellow('⏱ TIMEOUT'),
  missing: (s) => yellow('⚠ MISSING'),
  unknown: (s) => dim('? UNKNOWN'),
};

function render(map) {
  const lines = [];
  for (const [tool, info] of Object.entries(map)) {
    const indicator = (STATUS_RENDER[info.status] || STATUS_RENDER.unknown)(info);
    const reason = info.reason ? `  ${dim('— ' + info.reason)}` : '';
    lines.push(`  ${tool.padEnd(13)} ${indicator}${reason}`);
  }
  const okCount = Object.values(map).filter((i) => i.status === 'ok').length;
  const total = Object.keys(map).length;
  return `${okCount}/${total} outils OK\n` + lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const start = Date.now();
  const map = await probe({ simulate: args.simulate, timeoutMs: args.timeout });
  const elapsed = Date.now() - start;

  if (args.json) {
    console.log(JSON.stringify({ ...map, _meta: { timeoutMs: args.timeout, elapsedMs: elapsed } }, null, 2));
    return;
  }

  if (args.brief) {
    console.log(briefPrefix(map));
    return;
  }

  console.log(`tool-health-check (${elapsed}ms)\n`);
  console.log(render(map));
  console.log(`\n${dim('Inject this in sub-agent briefs:')}`);
  console.log(briefPrefix(map));
}

main().catch((err) => {
  console.error(`✗ tool-health-check failed: ${err.message}`);
  process.exit(1);
});
