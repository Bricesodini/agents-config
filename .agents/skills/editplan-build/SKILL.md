---
name: editplan-build
description: Use when an editor has a `story_map.json` and wants one specific cut of it. Triggers: "build an edit", "produce an edit plan", "make a 5-min film from the story map", "select units for a portrait", "produce edit_plan.json". Reads `story_map.json` + a brief (from `--params` or `--brief`) and decides which units to include and in what order. Hands the selection to `lib/editplan_build.py` for mechanical validation and emission of `edit_plan.json`.
---

# editplan-build

## Purpose

Take a **story map** (what the interview contains) and an **editorial
brief** (what the user wants to make of it) and produce a single
**edit plan** — one specific cut of the interview.

The LLM decides:

- **Which units to include** (selection)
- **Their order** (order field)
- **Their narrativeRole** (ouverture / context / core / pivot /
  resolution / punctuation / voice)
- **Their reason** (why this unit is in this cut)

Python decides:

- Frame ranges, durations, tolerances, mustInclude / mustExclude
  enforcement, redundancy deduplication, file emission.

## Inputs

- `out/story_map.json`
- A brief (passed via `--brief <file.json>` or inline in `--params`).
  See `schemas/brief.schema.md`.

## Output

- `out/edit_plan.json` — conform to `schemas/edit_plan.schema.md`.

## Selection principles

1. **Cover all `mustIncludeArcs`** if any are listed. If you cannot
   cover them within `targetDurationSec`, the brief is contradictory;
   emit a warning rather than silently drop them.
2. **Respect `structurePreference`**:
   - `chronological` → order units by their natural source order.
   - `thematic` → group by arc, then order groups so the strongest arc
     comes first.
   - `pivot-first` → start with the strongest pivot, then expand.
3. **Allocate the time budget across arcs** based on `weight` from
   the story map. Don't starve the strongest arc.
4. **Drop the redundant units**. If `redundantWith` ties two units,
   keep the one with the higher `strength`; prefer the one whose
   `narrativeRole` is `core` over `punctuation`.
5. **Skip short back-channel units** (< ~3 s) unless they are the
   only unit in their arc.
6. **Cap long units at `trimLongUnitsTargetSec`** if the brief asks
   for trimming. Trimming is a *flag* you emit; Phase C will
   re-segment if needed. You don't try to truncate in-place.
7. **Never include `kind: question`** unless `questionsAllowed: true`.
8. **Prefer units whose `beforeContext` and `afterContext` are
   non-empty** when `preserveContext: true`. A unit with no context
   is almost always a poor choice; choose a slightly longer adjacent
   one instead.

## Output contract to Python

The selection you produce is a JSON array of:

    {
        "unitId":         "u-XXXX",
        "order":          1,            # 1-based
        "narrativeRole":  "ouverture",
        "reason":         "..."
    }

You do NOT compute frames. Python fills them in.

## Boundaries

- Do NOT decide duration feasibility yourself. Trust Python's
  `targetDurationSec ± toleranceSec` check; if it warns, re-balance.
- Do NOT touch Resolve. Phase C is downstream.
- Do NOT change `story_map.json`. If the story map is wrong, ask
  for `storymap-review` or `storymap-segment` to revise it.

## When to delegate to a subagent

For very large story maps (> ~80 units), a subagent with a fresh
context is worth it. The subagent receives:

- The story_map.json (or a compact summary if huge)
- The brief
- The selection rules above

It returns the selection array. The current agent then runs
`lib/editplan_build.py` with the selection in `--params`.

For typical interviews (< ~80 units, ~30-60 min), the current agent's
context is fine.

## Pointers

- Brief schema: `schemas/brief.schema.md`
- Plan schema: `schemas/edit_plan.schema.md`
- Python runner: `lib/editplan_build.py` + `scripts/run_editplan_build.py`
- Next step: `editplan-integrity` (sanity check), then human review