#!/usr/bin/env node
/**
 * extract-confirmed-urls.js
 *
 * Lit un fichier Markdown de playlist (au format `stranger-things-playlist.md`
 * ou équivalent) et extrait les URLs YouTube confirmées dans la section
 * "Phase X — résultats" du fichier, dans la sous-section "Morceau officiel
 * époque confirmé (✅)".
 *
 * Pourquoi pas un parser Markdown générique ?
 * - Parce que le format de la playlist est lui-même output d'une skill :
 *   on contrôle les deux bouts et on évite d'embarquer marked / cheerio.
 * - Parce qu'on veut UNIQUEMENT les URLs validées, pas celles marquées
 *   "_à vérifier_" — il faut donc cibler la section "confirmé".
 *
 * Usage :
 *   node extract-confirmed-urls.js <playlist.md> [--out urls.txt]
 *   node extract-confirmed-urls.js <playlist.md>   # affiche sur stdout
 *
 * Sortie : une URL par ligne, dédupliquée, triée.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

function fail(msg, code = 1) {
  console.error(`✗ ${msg}`);
  process.exit(code);
}

const RE_YT = /https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}/g;

function extractConfirmedUrls(markdown) {
  // Cible la section "Morceau officiel époque confirmé (✅)" jusqu'à la prochaine sous-section.
  // Robuste aux variations de label "Morceau/Morceaux", émoji ✅ ou ✅/OK, etc.
  const startRe = /^#{2,4}\s+Morcea?ux? officiel.+confirmé.*$/m;
  const endRe = /^#{2,4}\s+/gm;

  const startMatch = startRe.exec(markdown);
  if (!startMatch) return [];

  const afterStart = startMatch.index + startMatch[0].length;
  // Cherche la prochaine ligne "##/###/####" après le start
  endRe.lastIndex = afterStart;
  const endMatch = endRe.exec(markdown);
  const sectionEnd = endMatch ? endMatch.index : markdown.length;

  const section = markdown.slice(afterStart, sectionEnd);
  const urls = new Set();
  for (const m of section.matchAll(RE_YT)) {
    urls.add(m[0]);
  }
  return [...urls].sort();
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    fail('Usage: extract-confirmed-urls.js <playlist.md> [--out urls.txt]', 2);
  }
  const playlistPath = args[0];
  if (!fs.existsSync(playlistPath)) {
    fail(`Fichier introuvable : ${playlistPath}`, 1);
  }
  const md = fs.readFileSync(playlistPath, 'utf-8');
  const urls = extractConfirmedUrls(md);

  const outIdx = args.indexOf('--out');
  if (outIdx !== -1 && outIdx + 1 < args.length) {
    const outPath = args[outIdx + 1];
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, urls.join('\n') + '\n');
    console.error(`✓ ${urls.length} URL(s) unique(s) → ${outPath}`);
  } else {
    if (urls.length === 0) {
      console.error('⚠ Aucune URL confirmée trouvée dans la playlist.');
      console.error('  Vérifiez que la section "Morceau officiel époque confirmé (✅)" existe.');
    }
    process.stdout.write(urls.join('\n') + (urls.length ? '\n' : ''));
  }
}

main();
