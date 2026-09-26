---
name: storymap-refine
description: Use when `editplan-build` (or a human editor) flags a unit as too long for the brief and the plan wants to keep only part of it. Triggers: "refine this unit", "split this long segment", "produce sub-beats for u-007", "the unit is too long for my 2-min film", "I want the second half of this answer". Lazily refines ONE unit at a time into `unit.subBeats[]` cached inside `story_map.json`. Triggers: storymap, sub-beats, refine, split a unit, large answer.
---

# storymap-refine

## Purpose

Split **one** Discourse Unit into a small number of **sub-beats** when
an editorial plan needs a finer cut than the unit level. The result is
cached inside `story_map.json::units[*].subBeats` so subsequent plans
can reuse it without re-asking the LLM.

This skill is **lazy**. Do not run it for every unit. Run it only when:

1. The brief has `trimLongUnits: true`, AND
2. The editor (human or LLM) wants to keep *part* of a unit, AND
3. The unit's `durationSec > trimLongUnitsTargetSec` (default 45 s).

## Inputs

- `out/story_map.json`
- `out/transcript_normalized.json`
- `params.unitId` (e.g. `u-007`)
- `params.brief.trimLongUnitsTargetSec` (optional, default 45)

## Output

- The unit's `subBeats[]` field is filled in `out/story_map.json`.
- A sidecar `out/sub_beats/<unitId>.json` is written for audit.

## Sub-beat shape

See `schemas/sub_beat.schema.md`. Required fields:

- `sourceSegmentIndices` — span of source segments covered by the
  sub-beat. **This is the primary input.** Python resolves the rest
  from the transcript.
- `narrativeRole` — one of `setup`, `turning_point`, `evidence`,
  `conclusion`, `context`, `anecdote`, `transition`, `pivot`, `voice`,
  `other`.
- `standalone` — `self_contained` / `needs_question` / `needs_prior` /
  `needs_followup` / `needs_prior_and_question`.
- `contextDependency` — non-empty only if `standalone` says the
  sub-beat depends on something.
- `summary` — one sentence.
- `editorialImportance` — `high` / `medium` / `low`.

`id` is optional; Python assigns `parentUnitId + ".sb-NN"` if absent.

## Editorial rule (binding)

> A select-able sub-beat should be understandable without hearing the
> interviewer's question. If it depends on the preceding context, the
> dependency must be flagged explicitly via `standalone` and
> `contextDependency`.

Implications for the LLM:

- Prefer sub-beats that **stand on their own**. A 30-second slice that
  begins "Et puis" depends on what came before — mark it
  `needs_prior`.
- A sub-beat that is the **answer to a question** but starts with
  "Oui" or "Non" or "Alors" without that question being included in
  the slice → mark `needs_question`. Better: find a slice that starts
  *after* the "Oui" with the actual content.
- A sub-beat that ends abruptly because the LLM cut before a
  sentence's end → mark `needs_followup`.
- Avoid 5-second fragments that contain only a back-channel. They are
  rarely worth keeping.

## Boundaries

- Do NOT produce more than ~6 sub-beats per unit. Anything finer than
  ~6 s is editorial noise.
- Do NOT split at silence boundaries alone. Split at *idea*
  boundaries — when the interviewee's intent shifts inside the unit.
- Do NOT modify the unit's own text or frame range. You are adding
  sub-beats **inside** the unit, not replacing it.
- Do NOT touch Resolve.

## How to do the work

1. Read the unit's `text` and `sourceSegmentIndices`.
2. Optionally read the original `transcript_normalized.json` segments
   for finer context (look at the words array).
3. Identify idea boundaries: places where the interviewee's intent
   visibly shifts. Anchor each sub-beat to a range of
   `sourceSegmentIndices`.
4. For each sub-beat, decide:
   - `narrativeRole`
   - `standalone` — be honest, do not default to `self_contained`
   - `summary` (one sentence)
   - `editorialImportance` — qualitative, no numeric scores
5. Hand the result to `lib/storymap_refine.py` via
   `scripts/run_storymap_refine.py`. The Python side validates
   bounds, dedups overlaps, fills frame ranges.

## Reuse

The next plan that touches this unit reads the cached `subBeats`. You
do not need to run this skill again unless the story_map.json was
regenerated from scratch.

## When to delegate to a subagent

A subagent is useful when the unit is **very long** (> 5 minutes)
and you want a fresh context. For typical 1-3 minute units, the
current agent's context is fine.

## Pointers

- Schema: `schemas/sub_beat.schema.md`
- Mechanical runner: `lib/storymap_refine.py` + `scripts/run_storymap_refine.py`
- Downstream: `editplan-build` consumes `unit.subBeats` when the
  selection references `(unitId, subBeatId)`.
- Integrity check: `lib/editplan_integrity.py` flags sub-beats whose
  `standalone: needs_question` is not preceded by a question unit in
  the plan.