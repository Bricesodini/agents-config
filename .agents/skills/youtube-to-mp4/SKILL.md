---
name: youtube-to-mp4
description: Download a list of YouTube URLs to MP4 (or audio) using Downie 4 via AppleScript / custom URL scheme. Use when the user wants to batch-download YouTube videos for local use (VHS-style playback, archival, retro ambience, personal library), or when they want a reusable pipeline from a Markdown playlist of confirmed video URLs to a folder of MP4s.
---

# YouTube → MP4 via Downie 4

Bulk-download a list of YouTube URLs to **MP4** (or audio MP3) using Downie 4's custom URL scheme. Native post-processing, no ffmpeg required.

## When to use
- User has a list of YouTube URLs they want on disk as MP4s (e.g. for retro / VHS / local playback).
- User has a Markdown playlist where confirmed videos are tagged in a "Morceau officiel époque confirmé (✅)" section.
- User wants a **reusable** workflow (run again on another project's playlist).
- macOS only (uses `open` against `/Applications/Downie 4.app`).

## When NOT to use
- User wants high-quality ffmpeg-only conversion pipeline (no Downie). Use yt-dlp + ffmpeg.
- User wants to scrape YouTube search results programmatically — this skill expects URLs already chosen.
- User wants non-YouTube sources (Vimeo, Dailymotion, etc.) — should work but Downie's site coverage varies.

## How it works

1. **Extract**: parse the playlist Markdown file and pull every confirmed YouTube URL (de-duped, sorted).
2. **Push**: send each URL to Downie's internal queue via its custom URL scheme `downie://XUOpenURL?url=…&postprocessing=mp4|audio|permute&destination=…&title=…`.
3. **Start**: trigger `start queue` over AppleScript so Downie begins downloading + post-processing in parallel.

No ffmpeg pipeline needed — Downie does the download, the conversion to MP4 (or audio-only extraction), and the file placement.

## Quick start

```bash
# From a playlist Markdown file (auto-extracts URLs in the "confirmé (✅)" section)
~/.agents/skills/youtube-to-mp4/bin/youtube-to-mp4.js \
  --playlist "/path/to/playlist.md" \
  --dest   "/path/to/output/folder"

# From an explicit list
~/.agents/skills/youtube-to-mp4/bin/youtube-to-mp4.js \
  --urls  /tmp/urls.txt \
  --dest  "/path/to/output/folder" \
  --postprocessing audio   # mp4 | audio | permute

# Or via stdin
echo "https://www.youtube.com/watch?v=..." \
  | ~/.agents/skills/youtube-to-mp4/bin/youtube-to-mp4.js --dest /some/folder
```

## Inputs

| Flag | Required | Notes |
|---|---|---|
| `--playlist <path>` | one of three | Markdown playlist; only URLs in the "Morceau officiel époque confirmé (✅)" section are pulled |
| `--urls <path>` | one of three | Plain-text file, 1 URL per line |
| stdin (pipe) | one of three | Plain-text stream, 1 URL per line |
| `--dest <dir>` | **yes** | Output directory. Auto-created if missing. Must be writable. |
| `--postprocessing <kind>` | no (default `mp4`) | `mp4` / `audio` / `permute` |

## Outputs

- `dest/<artist> - <title>.mp4` (or `.m4a` if `--postprocessing audio`).
- No log file: Downie's own History window (`Cmd+9`) shows what was processed.
- No JSON: this skill is intentionally transparent; inspect the destination folder.

## Files

- `bin/downie-dl.sh` — bash core that wraps the `downie://XUOpenURL?…` open calls + AppleScript queue start.
- `bin/youtube-to-mp4.js` — Node CLI wrapper with three input modes (playlist / urls / stdin).
- `lib/extract-confirmed-urls.js` — Markdown → confirmed-URLs parser.
- `examples/stranger-things.md` — example playlist used to validate the skill.

## Prerequisites

- macOS 12+ with `/Applications/Downie 4.app` installed (downloaded separately).
- Node.js 18+ on PATH (uses only built-ins: `node:fs`, `node:child_process`, `node:path`).
- Python 3 on PATH (used by `downie-dl.sh` for URL-encoding).

## Validation done

- Prototype validated on October 16, 2025 with 3 URLs (The Clash, Kate Bush, The Police) → 3 MP4 files in `/tmp/dest_test_video/`, 640×480 H.264/AAC, ~45–54 MB each, no UI dialog, destination custom respected.
- 18-URL batch executed against the Stranger Things playlist (workspace `recherche musiques/`); see the same workspace for output.

## Known limitations

- Cannot verify URL existence before sending (Downie handles bad URLs gracefully — they go to the History view as "failed", no crash).
- The Markdown parser expects the "Morceau officiel époque confirmé (✅)" section header. If your playlist uses a different wording, pass `--urls` with a plain list instead.
- Will silently skip URLs that don't match the YouTube `watch?v=` pattern. If you have other formats (youtu.be short links, embed URLs, channel URLs), normalize them first.
