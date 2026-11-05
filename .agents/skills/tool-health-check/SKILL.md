---
name: tool-health-check
description: Detect availability of runtime tools (web_search, web_fetch, downie, ffmpeg, osascript, brew) before launching a sub-agent or a long task. Use when about to spawn a research agent, run a YouTube batch, or anything that depends on a tool that might be silently unavailable.
---

# Tool Health Check

A 1-call probe that detects which runtime tools are actually working. Returns an availability map and a `briefPrefix()` line that agents can prepend to their sub-agent briefs to avoid silent fallbacks.

## When to use
- Before dispatching a research sub-agent that will use `web_search`.
- Before running a Downie batch.
- At session start if the task depends on external tools.

## When NOT to use
- For user-visible diagnostics (too terse). Use it silently, surface only the degraded tools.
- For long-lived monitoring (it's a snapshot, not a watchdog).

## How it works

1. Runs 6 probes in parallel, each with a 5s default timeout:
   - `web_search` : calls `globalThis.search` if exposed by the runtime; else returns `unknown` with a manual-test hint.
   - `web_fetch` : `HEAD https://example.com/` via AbortController.
   - `downie` : `fs.statSync('/Applications/Downie 4.app')`.
   - `ffmpeg` / `osascript` / `brew` : `which <binary>` with timeout.
2. Returns `{ tool: { status, reason? } }` where `status ∈ 'ok' | 'http_402' | 'http_5xx' | 'http_4xx' | 'timeout' | 'missing' | 'unknown'`.
3. `briefPrefix(map)` formats the map into a 1-line snippet consumable at the top of a sub-agent brief.

## Quick start

```bash
# Human-readable output
~/.agents/skills/tool-health-check/bin/check.js

# Brief prefix (paste at the top of a sub-agent prompt)
~/.agents/skills/tool-health-check/bin/check.js --brief

# JSON (for scripts / pipelines)
~/.agents/skills/tool-health-check/bin/check.js --json

# Simulate a known broken tool (useful when testing briefs)
~/.agents/skills/tool-health-check/bin/check.js --simulate web_search=http_402 --brief
```

## Outputs

- `check.js` (no flag) : colored status panel + brief prefix appended.
- `check.js --brief` : 1 block of plain text, suitable for pasting.
- `check.js --json` : structured map + `_meta: { timeoutMs, elapsedMs }`.

## Files

- `lib/tool-health-check.js` — pure Node module: `probe({ simulate, timeoutMs }) → map` and `briefPrefix(map) → string`.
- `bin/check.js` — CLI wrapper with 3 output modes.

## Prerequisites

- Node 18+ (uses `fetch` and `AbortController` from stdlib).
- macOS for `osascript` and `downie` paths (the module still runs on Linux: those probes report `missing`).
- No external npm dependencies.

## Known limitations

- `web_search` is `unknown` unless the runtime exposes a callable primitive (e.g. `globalThis.search`). This is intentional: guessing would yield false positives.
- `simulate` is a debug lever. In production, only `probe()` outputs are honored.
- No retry, no caching, no history. One snapshot per call.

## Validation done

- Tested against this machine on 2026-10-16 (macOS, Node v24):
  - 5/6 tools OK (web_fetch, downie, ffmpeg, osascript, brew).
  - `web_search` = `unknown` (runtime primitive not exposed; reason suggests manual probe).
  - 6/6 simulated states produced correct brief prefix (ok, http_402, timeout, missing, http_5xx, unknown).
  - Total elapsed: ~70–210ms.
