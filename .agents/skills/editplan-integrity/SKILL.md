---
name: editplan-integrity
description: Use after `editplan-build` has produced `edit_plan.json`. Triggers: "verify the edit", "check for orphan answers", "is the plan trustworthy", "integrity check". Reads `edit_plan.json` + `story_map.json` + `transcript_normalized.json` and emits `integrity_report.json` flagging orphan answers, truncated answers, missing context, mustInclude arcs that fell through, etc. Diagnoses; does not mutate the plan.
---

# editplan-integrity

## Purpose

Mechanical sanity check on an edit plan. Surfaces issues a human
editor (or the LLM) should look at before accepting the plan. Never
modifies the plan — only diagnoses.

## Inputs

- `out/edit_plan.json`
- `out/story_map.json`
- `out/transcript_normalized.json` (for source segments)

## Output

- `out/integrity_report.json` — conform to
  `schemas/integrity_report.schema.md`.

## Issues to look for

- `orphan_answer` (warning) — an `answer` unit retained with no
  preceding `question` unit in the plan. The answer's intent is
  unclear without its question.
- `truncated_answer` (warning) — an answer unit followed by a
  question in the source. Likely mid-sentence cut.
- `context_window` (info) — the LLM cleared
  `beforeContextIncluded`/`afterContextIncluded` even though the
  brief asked for context preservation.
- `topic_overlap` (info) — two retained units in the same arc are
  within 3 frames of each other. Likely a redundancy that survived.
- `duration_drift` (warning) — selected duration exceeds
  `targetDurationSec ± toleranceSec`.
- `arc_dropped` (info) — `mustIncludeArcs` has no retained unit.
- `question_retained` (warning) — a `question` unit retained despite
  `questionsAllowed: false`.
- `self_reference` (error) — a plan unit references an unknown story
  map unit.
- `frame_out_of_bounds` (error) — frames outside the timeline.

## Boundaries

- Never mutate `edit_plan.json`.
- Severity `error` ⇒ the plan is invalid; the editor must regenerate.
- Severity `warning` ⇒ human review.
- Severity `info` ⇒ soft hint.

## When to delegate to a subagent

Optional. The integrity check is mostly mechanical (Python
`lib/editplan_integrity.py`). For a richer, prose-level critique,
delegate to a subagent that returns a 5-bullet narrative review on
top of the mechanical report.

## Pointers

- Schema: `schemas/integrity_report.schema.md`
- Mechanical runner: `lib/editplan_integrity.py` +
  `scripts/run_editplan_integrity.py`
- Downstream: human review, then Phase C (out of scope for this
  round).