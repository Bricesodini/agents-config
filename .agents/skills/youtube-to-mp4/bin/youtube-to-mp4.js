#!/usr/bin/env node
/**
 * youtube-to-mp4.js — CLI orchestrateur
 *
 * Enchaîne les étapes :
 *   1. extraction des URLs confirmées depuis une playlist Markdown (optionnel),
 *   2. envoi à Downie 4 via le script `bin/downie-dl.sh`,
 *   3. Downie télécharge + post-process (mp4 par défaut).
 *
 * Usage :
 *   youtube-to-mp4.js --urls <file.txt> --dest <dir> [--postprocessing mp4|audio|permute]
 *   youtube-to-mp4.js --playlist <file.md> --dest <dir> [--postprocessing mp4|audio|permute]
 *   echo -e "url1\nurl2" | youtube-to-mp4.js --dest <dir>
 *
 * Si ni --urls ni --playlist ni stdin ne donnent d'URLs, le programme sort en erreur.
 */

'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const RE_YT = /https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}/;

function parseArgs(argv) {
  const args = { urlsFile: null, playlist: null, dest: null, post: 'mp4' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--urls': args.urlsFile = argv[++i]; break;
      case '--playlist': args.playlist = argv[++i]; break;
      case '--dest': args.dest = argv[++i]; break;
      case '--postprocessing': args.post = argv[++i]; break;
      case '-h':
      case '--help':
        console.log(
`Usage:
  youtube-to-mp4.js --urls <file.txt> --dest <dir> [--postprocessing mp4|audio|permute]
  youtube-to-mp4.js --playlist <file.md> --dest <dir> [--postprocessing mp4|audio|permute]
  echo -e "url1\\nurl2" | youtube-to-mp4.js --dest <dir>
`
        );
        process.exit(0);
      default:
        if (a.startsWith('--')) {
          console.error(`Arg inconnu : ${a}`);
          process.exit(2);
        }
    }
  }
  return args;
}

function extractFromPlaylist(playlistPath) {
  const libPath = path.join(__dirname, '..', 'lib', 'extract-confirmed-urls.js');
  if (!fs.existsSync(libPath)) {
    throw new Error(`Lib non trouvée : ${libPath}`);
  }
  if (!fs.existsSync(playlistPath)) {
    throw new Error(`Playlist introuvable : ${playlistPath}`);
  }
  return execFileSync('node', [libPath, playlistPath], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

function ensureUrls(args) {
  if (args.urlsFile) {
    if (!fs.existsSync(args.urlsFile)) throw new Error(`--urls introuvable : ${args.urlsFile}`);
    return { source: args.urlsFile, temp: args.urlsFile };
  }
  if (args.playlist) {
    const out = extractFromPlaylist(args.playlist);
    // Crée un fichier temp pour éviter de modifier l'original.
    const tempPath = path.join(require('node:os').tmpdir(), `yt-urls-${Date.now()}.txt`);
    fs.writeFileSync(tempPath, out);
    return { source: args.playlist, temp: tempPath };
  }
  if (!process.stdin.isTTY) {
    const chunks = [];
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const lines = chunks.join('').split(/\r?\n/).filter(l => RE_YT.test(l));
      const tempPath = path.join(require('node:os').tmpdir(), `yt-urls-${Date.now()}.txt`);
      fs.writeFileSync(tempPath, lines.join('\n') + '\n');
      runDownie({ ...args, temp: tempPath, source: 'stdin' });
    });
    return null;
  }
  throw new Error('Aucune source d\'URL : fournissez --urls, --playlist, ou pipez sur stdin.');
}

function runDownie(args) {
  if (!args.dest) throw new Error('--dest est requis (dossier de sortie).');
  const scriptPath = path.join(__dirname, 'downie-dl.sh');
  if (!fs.existsSync(scriptPath)) throw new Error(`Script introuvable : ${scriptPath}`);

  const urlCount = fs.readFileSync(args.temp, 'utf-8').split('\n').filter(Boolean).length;
  console.error(`▶ ${urlCount} URL(s) prête(s) → Downie`);
  console.error(`▶ Destination : ${args.dest}`);
  console.error(`▶ Post-processing : ${args.post}`);
  console.error(`▶ Source : ${args.source}`);
  console.error('');

  const result = spawnSync('bash', [scriptPath, args.temp, '--dest', args.dest, '--postprocessing', args.post], {
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

const args = parseArgs(process.argv.slice(2));
const prepared = ensureUrls(args);
if (prepared) runDownie({ ...args, ...prepared });
