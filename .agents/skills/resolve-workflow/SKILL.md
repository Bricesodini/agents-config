---
name: resolve-workflow
description: Use when the user asks for anything against DaVinci Resolve (inspect, add marker, prepare shoot, import media, export, list LUTs/DCTLs, run a Python script in Resolve). Triggers: "DaVinci Resolve", "Resolve timeline", "Media Pool", "timeline marker", "add marker", "export from Resolve", "LUT", "DCTL", "Resolve API", "Resolve Python". Drive the workflow through the native ResolveMCP server; never invent a parallel bridge. Always guard mutations by stable uniqueId, never by name alone.
---

# Resolve workflow

## Stack

- DaVinci Resolve Studio 21.1 (running locally)
- `ResolveMCP` binary at `/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Applications/ResolveMCP`
- Wrapper `bin/dvr` (in the `Davinci resolve` repo) speaks JSON-RPC over stdio to `ResolveMCP`
- Python sandbox: `run_script` (fs/network blocked) or `run_script_unsafe` (full system access)

No third-party Resolve bridge. No `samuelgursky/davinci-resolve-mcp`. The MCP server Blackmagic ships **is** the bridge.

## Decision tree — which tool

Read the user's intent, then pick the cheapest tool that satisfies it:

| Intent | Tool | Notes |
|---|---|---|
| Is Resolve running? | `get_resolve_status` | also returned for free by every initialize |
| Launch Resolve | `launch_resolve` | 60s timeout, blocks until ready |
| Browse the scripting API | `search_scripting_api`, `get_scripting_api`, `get_scripting_docs` | discover the real API names — never guess |
| Inspect current state | `run_script` with `lib/resolve_inspect.py` | read-only, structured JSON, this repo |
| Extract transcript (Phase A) | `run_script` with `lib/extract_transcript.py` | outputs `out/transcript_normalized.json` |
| Add or update a review marker | `run_script` with `lib/add_review_marker.py` | idempotent via `customData`, guarded by uniqueId |
| Run a custom workflow | `run_script` with a Python body | default sandbox, fs/network off |
| Workflow needs fs or network | `run_script_unsafe` | explicitly justified, never default |
| Manage LUTs / DCTLs | `list_luts`, `list_dctls`, `generate_lut`, `update_dctl`, `delete_*` | sandboxed by ResolveMCP to the `…/LUT/MCP` folder |
| See what changed recently | `get_whats_new` | pass last known version or ISO date |

## Mandatory pattern: READ → ASSERT → WRITE → VERIFY → REPORT

Every mutating workflow must follow this sequence. Anything else is guessing.

1. **READ** — call `resolve_inspect`. Capture `project.uniqueId`,
   `project.timeline.uniqueId`, current marker count, etc.
2. **ASSERT** — verify the target matches what the caller asked for.
   **Always check `expectedProjectId` / `expectedTimelineId` first** —
   these are stable uniqueIds exposed by `Project.GetUniqueId()` and
   `Timeline.GetUniqueId()`. Names can be renamed or duplicated; uniqueIds
   cannot.
3. **WRITE** — perform exactly one mutation. Use `customData` (machine
   identity, hidden in UI) when the operation has a logical identity
   (review marker, batch import slot, etc.) so the operation can be
   detected and made idempotent.
4. **VERIFY** — re-read state. Compute a diff against the READ snapshot.
   If the diff does not match the intent, report and refuse.
5. **REPORT** — return a stable envelope: `{ok, changed, target, guard,
   operation, before, after, diff, warnings, errors}`. The `ok` key is
   `False` if any error happened or any guard aborted.

The first mutating workflow in this repo, `add_review_marker.py`, is the
canonical implementation of this pattern. Read it before writing any new
mutating workflow.

## run_script contract

`run_script` runs Python 3.14 with `resolve` and `project` pre-injected.
**`timeline` is not injected** — call `project.GetCurrentTimeline()`.
To return data, assign `result = {...}`. `print()` output is also captured
but the JSON route is the one DSH parses.

Keep scripts **read-only by default**. If the task needs the filesystem,
switch to `run_script_unsafe` and write the justification in the workflow
log.

Default timeout is 10s; raise to 30s only when the script does heavy
enumeration. Cap at 60s (server max).

## Known API signatures (verified in `.pyi` 21.1)

Don't re-discover these:

```python
Timeline.AddMarker(
    frameId: int, color: MarkerColor, name: str,
    note: str, duration: int, customData: str | None = None,
) -> bool

Timeline.GetMarkerByCustomData(customData: str) -> MarkerInfo | None
Timeline.DeleteMarkerByCustomData(customData: str) -> bool
Timeline.GetMarkers() -> dict[int, MarkerInfo]

MarkerColor = Literal[
    'Blue', 'Cyan', 'Green', 'Yellow', 'Red', 'Pink', 'Purple',
    'Fuchsia', 'Rose', 'Lavender', 'Sky', 'Mint', 'Lemon',
    'Sand', 'Cocoa', 'Cream',
]

MarkerInfo = TypedDict(total=False):
    color: MarkerColor; duration: int; note: str;
    name: str; customData: str

Project.GetUniqueId() -> str
Timeline.GetUniqueId() -> str
MediaPool.GetUniqueId() -> str
```

For anything else, run `bin/dvr search <pattern> DaVinciResolveScript.pyi`
before guessing.

## Forbidden

- Touching the user's project without an `inspect` snapshot taken in the
  same session.
- Guarding by `expectedProjectName` / `expectedTimelineName` only —
  always include the uniqueId version. Names alone are not safe.
- Inventing API names. Verify with `search_scripting_api` before calling
  anything.
- Wrapping Resolve with a parallel MCP server. Blackmagic already ships one.
- Writing outside `/Library/Application Support/Blackmagic Design/DaVinci
  Resolve/LUT/MCP` when using the LUT/DCTL tools.
- Assuming `External scripting` preference state without checking it.
- Treating `run_script` failure as silent — always parse and surface the
  `errors` list to the caller.

## Editorial pipeline (Phases A → B → C)

The repo carries an editorial pipeline on top of the Resolve bridge.
Three phases; only Phase A and Phase C touch Resolve. Phase B is
offline (Python + DSH skills).

```
Phase A (live, read-only)
  transcript_normalized.json = resolve_inspect(extract_transcript)

Phase B (offline)
  units_seed.json     = storymap_segment.py
  units.json          = DSH skill `storymap-segment` (LLM)
  arcs.json           = DSH skill `storymap-arcs`    (LLM)
  pivots.json         = DSH skill `storymap-arcs`    (LLM)
  redundancies.json   = DSH skill `storymap-arcs`    (LLM)
  story_map.json      = DSH skill `storymap-build`   (LLM composition)
  story_map_review    = DSH skill `storymap-review`  (LLM adversarial, optional)
  edit_plan.json      = DSH skill `editplan-build`   (LLM selection) + editplan_build.py
  integrity_report    = editplan_integrity.py + DSH skill `editplan-integrity`

Phase C (live, mutating) — out of scope for the current round
  new Resolve timeline = execute_edit_plan.py
```

### What lives where

| Layer | Lives in | Why |
|---|---|---|
| Resolve API access | `bin/dvr` + `lib/*.py` (run via `run_script`) | Existing, validated |
| Transcript snapshot | `lib/extract_transcript.py` | Live, read-only, generic |
| Mechanical segmentation seed | `lib/storymap_segment.py` | Pure Python, no LLM |
| Unit validation / merge | `lib/storymap_integrate.py` | Pure Python, referential integrity only |
| Mechanical edit-plan builder | `lib/editplan_build.py` | Pure Python, frames / duration / mustInclude / dedup |
| Integrity check | `lib/editplan_integrity.py` | Pure Python, mechanical sanity |
| LLM: cut into discourse units | DSH skill `storymap-segment` | semantic judgment |
| LLM: identify arcs / pivots / redundancies | DSH skill `storymap-arcs` | semantic judgment |
| LLM: compose story_map.json | DSH skill `storymap-build` | composition only |
| LLM: adversarial review | DSH skill `storymap-review` | subagent preferred |
| LLM: pick units + order for a brief | DSH skill `editplan-build` | editorial judgment |
| LLM: review the plan | DSH skill `editplan-integrity` | optional prose critique |
| Pilot the editor through the pipeline | DSH skill `resolve-editorial-pilot` (user-invoked) | `/ask-matt`-style |

The repo never references a specific LLM provider. All LLM calls are
made by DSH at runtime; the Python modules only consume the JSON the
DSH skills produce.

### Subagent policy

- Use a subagent only when isolation / fresh context adds value.
- Specifically: `storymap-segment` for transcripts > ~30 min;
  `storymap-arcs` for very long transcripts; `storymap-review`
  always (adversarial isolation is the point); `editplan-build` for
  very large story maps.
- Do not use a subagent for mechanical Python work or short
  compositions.
- The subagent receives only the artefacts it needs to do its
  mission and returns a structured JSON.

### User-question policy

`ASK ONLY WHEN THE ANSWER CHANGES THE EDITORIAL DECISION.`

The user-invoked skill `resolve-editorial-pilot` is the gatekeeper
for that policy. Other skills never ask the user anything
themselves — they either decide or surface the gap in
`warnings`/`info`.

## Pointers

- API discovery: `bin/dvr search <pattern> DaVinciResolveScript.pyi`
- Whole stub to a file: `bin/dvr api DaVinciResolveScript.pyi --as-file`
- Doc TOC: `bin/dvr docs TOC`
- Live inspect runner: `python3 scripts/run_inspect.py`
- Add review marker: `python3 scripts/run_add_review_marker.py --params '<json>'`
- Contract tests: `python3 -m pytest tests/ -v`

## Schemas (read these first when working on Phase B)

- `schemas/story_map.schema.md`
- `schemas/brief.schema.md`
- `schemas/edit_plan.schema.md`
- `schemas/integrity_report.schema.md`

## Editorial pipeline artefacts (`out/`, gitignored)

- `transcript_normalized.json` — Phase A output
- `units_seed.json` — Phase B mechanical seed
- `units.json`, `arcs.json`, `pivots.json`, `redundancies.json` — LLM-authored
- `story_map.json` — Phase B structural output
- `story_map_review.json` — optional adversarial review
- `edit_plan.json` — one specific cut
- `integrity_report.json` — post-edit sanity check