---
name: storymap-review
description: Use after `storymap-build` has produced `story_map.json`. Triggers: "review the story map", "adversarial check", "second pass on the story map", "is the story map trustworthy". Reads `story_map.json` and emits a critique: missing arcs, mis-grouped units, weak pivots, suspect redundancies. Does NOT mutate `story_map.json` — only diagnoses.
---

# storymap-review

## Purpose

Adversarial review of `story_map.json`. Produces a structured critique
that the editor (human or LLM) uses to decide whether to regenerate
parts of the story map or accept it as-is.

## Inputs

- `out/story_map.json`
- `out/units.json` (optional, for re-reading)
- `out/arcs.json` (optional)

## Output

- `out/story_map_review.json` — a list of `issue` records with
  `kind`, `severity`, `target` (unitId / arcId / pivotId), and
  `message`.

## What to look for

- Units that don't belong to any arc but are not silence / question.
- Arcs with very few units (1-2) — are they real arcs, or
  single-event over-grouping?
- Arcs with no strong units (`strength >= 0.7`) — are they filler?
- Pivots that don't have a unit boundary nearby (the pivot is in
  a silence gap; might be misanchored).
- Redundancies that overlap perfectly with the same text — likely
  transcription artefacts, not real redundancies.
- Units whose `text` starts or ends mid-word (probably a clip-cut
  issue from the original transcription, but worth flagging).

## Boundaries

- Never mutate `story_map.json`.
- Never add units — only diagnose.
- Be specific: cite unitId / arcId / pivotId in every issue.

## When to delegate to a subagent

**Always delegate to a subagent.** This is the canonical use case for
isolation: the reviewer must not be biased by the same context that
produced the story map. The subagent gets only:

- `story_map.json`
- `transcript_normalized.json` (for source context)
- the schema reference

It returns `story_map_review.json` and a 3-bullet prose summary of
the most important issues.

## Pointers

- Schema: `schemas/story_map.schema.md`
- Subject: `storymap-build` output
- Downstream: `editplan-build` uses the reviewed story_map.json