# youtube-to-mp4

A small skill that wraps **Downie 4** to bulk-download YouTube URLs into MP4 (or audio) files on macOS.

## Why this exists

When you need a folder full of retro / archival / VHS-ready video clips from a hand-curated URL list, you don't want to click 30 download buttons in Downie's UI. You want a one-liner that:

1. Reads a list of YouTube URLs (plain text, or extracted from a Markdown playlist where confirmed videos are tagged).
2. Pushes them all to Downie's internal queue.
3. Lets Downie download + post-process in parallel — natively, without ffmpeg.

That's this skill.

## Background

- Downie 4 exposes a `downie://XUOpenURL?url=...&postprocessing=mp4|audio|permute&destination=...&title=...` URL scheme (documented in `Downie 4 → Help → Automation`).
- AppleScript command `start queue` (from the `Downie.sdef` dictionary) flushes the queue.
- Combine: `open -a 'Downie 4' 'downie://...'` × N → `osascript "tell application \"Downie 4\" to start queue"`.

No prefs to configure, no UI needed, no ffmpeg pipeline.

## Usage

### Mode 1 — Playlist file

```bash
~/.agents/skills/youtube-to-mp4/bin/youtube-to-mp4.js \
  --playlist "/path/to/playlist.md" \
  --dest   "/path/to/output"
```

The parser looks for `## Morceau officiel époque confirmé (✅)` (or similar with émoji ✅ / variant) in the markdown and pulls all `youtube.com/watch?v=…` URLs in that section, deduped.

### Mode 2 — Plain URL list

```bash
~/.agents/skills/youtube-to-mp4/bin/youtube-to-mp4.js \
  --urls  /tmp/urls.txt \
  --dest  "/path/to/output" \
  --postprocessing audio
```

`urls.txt`: one URL per line, comments allowed (lines starting with `#`).

### Mode 3 — Stdin

```bash
echo "https://www.youtube.com/watch?v=ABC123DEF45" \
  | ~/.agents/skills/youtube-to-mp4/bin/youtube-to-mp4.js --dest /out
```

## What Downie produces

- MP4: `dest/<artist> - <title> (Official Music Video).mp4` — H.264 video + AAC audio. Typical 80s clips come out 640×480 / 4:3 (perfect for VHS / CRT playback).
- Audio: `dest/<artist> - <title>.m4a` — AAC audio only.
- Permute: hands off to Permute if installed (Downie → Permute integration).

## Files

| Path | Purpose |
|---|---|
| `bin/downie-dl.sh` | Bash script that calls `open -a 'Downie 4' 'downie://XUOpenURL?...'` for each URL and triggers the queue |
| `bin/youtube-to-mp4.js` | Node CLI orchestrator with three input modes |
| `lib/extract-confirmed-urls.js` | Markdown → URLs extractor (reads only the "confirmé (✅)" section) |
| `SKILL.md` | Skill description loaded by DSH |
| `examples/stranger-things.md` | An example playlist used during validation |

## Prerequisites

- macOS 12+ (Monterey or later; uses Python 3 stdlib, Bash, Node).
- `/Applications/Downie 4.app` (or `/Applications/Downie.app` for Setapp; auto-detected).
- Node 18+ on PATH.
- Python 3 on PATH (used for URL encoding inside the bash script).

## Failure modes & how to diagnose

| Symptom | Likely cause |
|---|---|
| `Downie 4 introuvable dans /Applications` | Wrong install location. Move Downie to `/Applications` or symlink it. |
| URL opens in Safari instead of Downie | Downie's URL handler is mis-associated. Re-run Downie once to register. |
| Files stay `.downiepart` forever | Download is stalled; check Downie's History (Cmd+9) for errors (auth, region-locked, etc.). |
| Empty output folder | All URLs failed; check Downie's History. |
| Files in `.webm` instead of `.mp4` | `--postprocessing` was not passed; default `mp4` should be applied. Check the `downie://` URL in the script logs. |

## Reuse on other projects

1. Drop a Markdown playlist in the same shape as `examples/stranger-things.md`: tables per season with a `Lien YouTube` column, plus a final `## Morceau officiel époque confirmé (✅)` section listing the URLs.
2. `youtube-to-mp4.js --playlist ... --dest ...`
3. Inspect `dest/`.

That's it.
