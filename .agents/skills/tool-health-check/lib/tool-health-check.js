// lib/tool-health-check.js
//
// Module pur Node — détection de la disponibilité des outils runtime.
//
// Contrat d'API (lift direct du prototype tool-health-check.html) :
//   probe({ simulate = {}, timeoutMs = 5000 }) -> availabilityMap
//   briefPrefix(map)                           -> string
//
// availabilityMap = { <tool>: { status, reason? } }
//   status ∈ 'ok' | 'http_402' | 'http_5xx' | 'http_4xx' | 'timeout' | 'missing' | 'unknown'
//
// Le module n'écrit rien sur disque. Il n'envoie pas d'UI. C'est pur.
//
// Pré-requis runtime :
//   - Node 18+ (utilise AbortController, disponible en stdlib depuis Node 16)
//   - Le binaire `osascript` est attendu présent sur macOS ; absent ailleurs
//
// Pas de dépendance externe. Pas de bundler. Pas de framework.

'use strict';

const { execFile, execFileSync } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs');
const path = require('node:path');

const execFileP = promisify(execFile);

// ─── Helpers ───────────────────────────────────────────────────────────────

const REASON = {
  ok: undefined,
  http_402: (msg) => msg || 'HTTP 402 — paywall or quota exhausted',
  http_5xx: (code) => `HTTP ${code} — server error`,
  http_4xx: (code) => `HTTP ${code} — client error`,
  timeout: (ms) => `timed out after ${ms}ms`,
  missing: (what) => `${what} introuvable`,
  unknown: (msg) => msg || 'unknown error',
};

// ─── Probes ────────────────────────────────────────────────────────────────

/**
 * Teste la présence d'un binaire local via `which` ou `command -v`.
 */
async function probeBinary(name, { timeoutMs = 5000 } = {}) {
  try {
    const stdout = await execFileP('/usr/bin/which', [name], { timeout: timeoutMs });
    const found = stdout.stdout.trim();
    if (!found) return { status: 'missing', reason: REASON.missing(name) };
    return { status: 'ok' };
  } catch (err) {
    if (err.killed || err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      return { status: 'timeout', reason: REASON.timeout(timeoutMs) };
    }
    if (err.code === 1) {
      // which retourne code 1 quand non trouvé
      return { status: 'missing', reason: REASON.missing(name) };
    }
    return { status: 'unknown', reason: REASON.unknown(err.message) };
  }
}

/**
 * Teste la présence d'un fichier ou dossier (typiquement un .app bundle).
 */
async function probePath(p, label) {
  try {
    const stat = fs.statSync(p);
    return { status: 'ok' };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { status: 'missing', reason: REASON.missing(label || p) };
    }
    return { status: 'unknown', reason: REASON.unknown(err.message) };
  }
}

/**
 * Teste web_fetch via un HEAD sur example.com (toujours joignable, RFC 2606).
 * Utilise le fetch natif de Node (Node 18+) avec AbortController pour le timeout.
 */
async function probeWebFetch({ timeoutMs = 5000 } = {}) {
  if (typeof fetch !== 'function') {
    return { status: 'unknown', reason: REASON.unknown('fetch indisponible (Node < 18)') };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://example.com/', {
      method: 'HEAD',
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.status >= 200 && res.status < 400) {
      return { status: 'ok' };
    }
    if (res.status === 402) {
      return { status: 'http_402', reason: REASON.http_402('HTTP 402 inattendu sur example.com') };
    }
    if (res.status >= 500) {
      return { status: 'http_5xx', reason: REASON.http_5xx(res.status) };
    }
    if (res.status >= 400) {
      return { status: 'http_4xx', reason: REASON.http_4xx(res.status) };
    }
    return { status: 'unknown', reason: REASON.unknown(`status ${res.status}`) };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { status: 'timeout', reason: REASON.timeout(timeoutMs) };
    }
    return { status: 'unknown', reason: REASON.unknown(err.message) };
  }
}

/**
 * Teste web_search. Sans contrat clair sur l'API runtime DeepSeek Harness,
 * on essaie un appel symbolique. Si le runtime expose `globalThis.search`,
 * on l'invoque avec un ping. Sinon, on retourne 'unknown' avec une raison
 * documentée — l'appelant doit interpréter.
 *
 * Stratégie conservatrice : on NE déduit PAS qu'il fonctionne juste parce
 * que `fetch` fonctionne. Et on NE déduit PAS qu'il est KO juste parce
 * qu'on ne peut pas le tester.
 */
async function probeWebSearch({ timeoutMs = 5000 } = {}) {
  // Si un runtime injecte une primitive search(), on l'utilise comme signal.
  // Sinon, on retourne 'unknown' avec une raison qui incite à tester manuellement.
  const probe = globalThis.__deepseek_search_probe__ || globalThis.search;
  if (typeof probe === 'function') {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await Promise.race([
        probe({ queries: ['ping'], timeoutMs }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
      ]);
      clearTimeout(timer);
      if (res && res.status) return { status: 'ok' };
      return { status: 'unknown', reason: REASON.unknown('réponse vide du probe') };
    } catch (err) {
      clearTimeout(timer);
      if (err.message === 'timeout' || err.name === 'AbortError') {
        return { status: 'timeout', reason: REASON.timeout(timeoutMs) };
      }
      // Cherche un marqueur HTTP 402 dans le message
      if (/402|paywall|insufficient.*balance/i.test(err.message)) {
        return { status: 'http_402', reason: REASON.http_402('détecté via message d\'erreur runtime') };
      }
      return { status: 'unknown', reason: REASON.unknown(err.message) };
    }
  }
  return {
    status: 'unknown',
    reason: 'web_search : pas de primitive runtime exposée. Tester manuellement (1 query courte) et vérifier le code de retour.',
  };
}

// ─── Aggregation ───────────────────────────────────────────────────────────

/**
 * Lance tous les probes en parallèle. Chaque probe gère son propre timeout.
 * Retourne une availability map typée.
 *
 * @param {Object} opts
 * @param {Object} [opts.simulate]    - { web_search: 'http_402', downie: 'missing', ... } — utile pour tester
 * @param {number} [opts.timeoutMs=5000]
 * @returns {Promise<Object>}
 */
async function probe({ simulate = {}, timeoutMs = 5000 } = {}) {
  const tasks = {
    web_search: simulate.web_search !== undefined
      ? Promise.resolve(stringToStatus(simulate.web_search, 'web_search'))
      : probeWebSearch({ timeoutMs }),
    web_fetch: simulate.web_fetch !== undefined
      ? Promise.resolve(stringToStatus(simulate.web_fetch, 'web_fetch'))
      : probeWebFetch({ timeoutMs }),
    downie: simulate.downie !== undefined
      ? Promise.resolve(stringToStatus(simulate.downie, 'Downie 4.app'))
      : probePath('/Applications/Downie 4.app', 'Downie 4.app'),
    ffmpeg: simulate.ffmpeg !== undefined
      ? Promise.resolve(stringToStatus(simulate.ffmpeg, 'ffmpeg'))
      : probeBinary('ffmpeg', { timeoutMs }),
    osascript: simulate.osascript !== undefined
      ? Promise.resolve(stringToStatus(simulate.osascript, 'osascript'))
      : probeBinary('osascript', { timeoutMs }),
    brew: simulate.brew !== undefined
      ? Promise.resolve(stringToStatus(simulate.brew, 'brew'))
      : probeBinary('brew', { timeoutMs }),
  };

  const keys = Object.keys(tasks);
  const values = await Promise.all(Object.values(tasks));
  const map = {};
  for (let i = 0; i < keys.length; i++) {
    map[keys[i]] = values[i];
  }
  return map;
}

function stringToStatus(s, label) {
  switch (s) {
    case 'ok': return { status: 'ok' };
    case 'http_402': return { status: 'http_402', reason: REASON.http_402() };
    case 'http_5xx': return { status: 'http_5xx', reason: REASON.http_5xx(500) };
    case 'http_4xx': return { status: 'http_4xx', reason: REASON.http_4xx(400) };
    case 'timeout': return { status: 'timeout', reason: REASON.timeout(5000) };
    case 'missing': return { status: 'missing', reason: REASON.missing(label) };
    default: return { status: 'unknown', reason: REASON.unknown(s) };
  }
}

// ─── briefPrefix ───────────────────────────────────────────────────────────

/**
 * Convertit une availability map en première ligne d'un brief de sous-agent.
 * Consommable par un LLM comme contexte initial.
 *
 * Format :
 *   [tool-health-check 2025-10-16T...]
 *   ok: 4/6 (web_fetch, ffmpeg, osascript, brew)
 *   degraded: web_search=http_402 (reason), downie=missing (reason)
 *   fallback: web_search KO → rely on web_fetch; downie KO → yt-dlp + ffmpeg
 *
 * @param {Object} map - availability map retournée par probe()
 * @returns {string}
 */
function briefPrefix(map) {
  const ok = [];
  const degraded = [];
  for (const [tool, info] of Object.entries(map)) {
    if (info.status === 'ok') {
      ok.push(tool);
    } else {
      const reason = info.reason ? ` (${info.reason})` : '';
      degraded.push(`${tool}=${info.status}${reason}`);
    }
  }
  const total = Object.keys(map).length;
  const lines = [];
  lines.push(`[tool-health-check ${new Date().toISOString()}]`);
  lines.push(`ok: ${ok.length}/${total} (${ok.join(', ') || 'aucun'})`);
  if (degraded.length > 0) {
    lines.push(`degraded: ${degraded.join('; ')}`);
    const fallback = fallbackStrategy(map);
    if (fallback) lines.push(`fallback: ${fallback}`);
  }
  return lines.join('\n');
}

/**
 * Génère des suggestions de fallback selon les outils KO.
 * Logique grossière mais lisible — l'amélioration se fait plus tard.
 */
function fallbackStrategy(map) {
  const parts = [];
  if (map.web_search && map.web_search.status !== 'ok') {
    parts.push('web_search KO → rely on web_fetch + user-provided URLs');
  }
  if (map.web_fetch && map.web_fetch.status !== 'ok') {
    parts.push('web_fetch KO → warn the user, ask for manual paste of URLs');
  }
  if (map.downie && map.downie.status !== 'ok') {
    parts.push('downie KO → yt-dlp + ffmpeg fallback');
  }
  if (map.ffmpeg && map.ffmpeg.status !== 'ok') {
    parts.push('ffmpeg KO → raw bytes only (no remux possible)');
  }
  if (map.osascript && map.osascript.status !== 'ok') {
    parts.push('osascript KO → batch tools unavailable, manual UI required');
  }
  if (map.brew && map.brew.status !== 'ok') {
    parts.push('brew KO → skip system-package checks');
  }
  return parts.join('; ');
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = { probe, briefPrefix };
