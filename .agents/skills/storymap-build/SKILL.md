---
name: storymap-build
description: Use after `storymap-arcs` has produced `arcs.json`, `pivots.json`, `redundancies.json` and `storymap-segment` has produced `units.json`. Triggers: "build the story map", "compose the story_map.json", "merge units and arcs". Composes the three files into a single `story_map.json` ready to feed `editplan-build`. Pure composition — no editorial decision.
---

# storymap-build

## Purpose

Compose `units.json` + `arcs.json` + `pivots.json` + `redundancies.json`
into a single `story_map.json` that downstream steps consume.

## Inputs

- `out/units.json`
- `out/arcs.json`
- `out/pivots.json`
- `out/redundancies.json`
- `out/transcript_normalized.json` (for source metadata)

## Output

- `out/story_map.json` — conform to `schemas/story_map.schema.md`.

## What you do

1. Copy `source` from `transcript_normalized.json` into the top-level
   `source` block (projectName, projectUniqueId, timelineName,
   timelineUniqueId, fps, timelineTotalDurationSec,
   spokenContentDurationSec, interviewerSpeaker, intervieweeSpeaker).
2. Stamp `arcId` onto each unit by looking up which arc contains it
   (a unit belongs to exactly one arc unless it is purely contextual).
3. Write the merged `units`, `arcs`, `pivots`, `redundancies` blocks.
4. Surface any LLM-detected issues in `warnings`.

## What you do NOT do

- Reorder arcs.
- Drop units.
- Edit text.
- Compute durations (Python does this in `editplan_build.py`).

## When to delegate to a subagent

This is composition, not reasoning. Run it in the current agent's
context — no subagent needed unless the transcript is enormous and
the composition needs a fresh window.

## Pointers

- Schema: `schemas/story_map.schema.md`
- Previous steps: `storymap-segment`, `storymap-arcs`
- Optional adversarial review: `storymap-review`
- Next step: `editplan-build` (which combines story_map.json + a brief)