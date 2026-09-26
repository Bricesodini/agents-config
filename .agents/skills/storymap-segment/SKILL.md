---
name: storymap-segment
description: Use when a `transcript_normalized.json` exists and the editor needs the interview cut into discourse units (DUs) before any narrative analysis. Triggers: "segment the interview", "cut into units", "split the transcript", "make DUs", "produce units.json". Reads `units_seed.json` (mechanical over-segmentation from `lib/storymap_segment.py`) and merges/cleaves it into semantically coherent units. Writes `units.json` conforming to `schemas/story_map.schema.md` §"Unit shape". Never decides narrative order — that is `storymap-arcs` and `storymap-build`.
---

# storymap-segment

## Purpose

Produce a list of **Discourse Units** (DUs) from an interview transcript
and a mechanical over-segmentation seed. A DU is a coherent chunk of
*meaning*, **not** a silence-bounded slice.

## Inputs

- `out/transcript_normalized.json` — the read-only transcript snapshot.
- `out/units_seed.json` — mechanical seed produced by
  `lib/storymap_segment.py` (silence splits + speaker changes + pauses).

## Output

- `out/units.json` — the LLM-authored units file, conforming to
  `schemas/story_map.schema.md`. May include `arcId: null` (filled later
  by `storymap-arcs`).

## Criteria for splitting / merging DUs

A DU ends and the next begins when **any** of the following holds:

1. The speaker changes from interviewee to interviewer (interviewer
   turn begins).
2. The topic changes — i.e. the interviewee's intent shifts from
   "telling X" to "telling Y". Continuity markers like "donc", "et
   puis", "en fait" alone are not enough; you must detect a shift in
   *what the speaker is trying to communicate*.
3. The interviewer introduces a new question (detected by a "?"
   suffix or by the content of the new turn being unrelated to the
   previous answer).

A DU continues across:

- Short silences (`< 2 s`).
- Short back-channel answers (e.g. "voilà", "très bien").
- Short clarifications on the same topic.

A DU **may be a single sentence or a paragraph**; the LLM decides.

## Mandatory fields per unit

- `id`: keep the seed id if you don't split, append `-a/-b/-c` if you
  split, invent a fresh `u-XXXX` only if you merge seed units.
- `kind`: `answer` / `question` / `silence` (use `silence` only for
  long silences that the LLM wants to preserve as a unit).
- `startFrame` / `endFrame` / `startTC` / `endTC`: inherited from the
  first / last source segment indices. **Never invent frames.**
- `text`: concatenated text of all source segments, lightly trimmed.
- `topicHint`: one of the values the LLM has inferred; do NOT use the
  keyword-bank tags from `lib/build_edit_plan.py` v1 (those were
  primitive and obsolete).
- `beforeContext` / `afterContext`: short snippets of the
  preceding/following source segments (≤ 1 segment each) for
  context-window integrity.
- `strength` (0..1): how prominent this unit is for the interview as a
  whole. Mark 1.0 only for what you would put in a documentary trailer.
- `redundantWith`: ids of other units that say the same thing.
- `sourceSegmentIndices`: list of indices into
  `transcript_normalized.json::segments`. Required for Python to
  recover frames.

## Boundaries you must not cross

- Do NOT call any Resolve API. Phase A (`extract_transcript.py`) has
  already produced the snapshot; the LLM reads JSON on disk only.
- Do NOT invent frames that are not in the seed.
- Do NOT reorder units — that is `storymap-arcs` territory.
- Do NOT drop interviewer turns (kind: question) — they are useful
  context for `editplan-integrity` later. Just don't ask them to be
  retained in the final cut unless `questionsAllowed: true` in the
  brief.

## Failure modes to avoid

- **Over-splitting**: every 2-second silence becomes a unit. The
  seed has already done this; your job is to **merge** where the
  meaning flows across the silence.
- **Under-splitting**: a 90-second answer that clearly contains two
  distinct topics remains a single DU. The LLM must catch topic
  shifts regardless of length.
- **Topic over-fitting**: tagging everything "origines" because the
  LLM read the keyword bank. Each unit's topicHint should be the
  *best* description of that unit's intent, not a global label.

## When to delegate to a subagent

For transcripts > ~30 min, prefer a subagent so the unit-level
reasoning gets a fresh context window. The subagent must receive:
the units_seed.json, a 1-paragraph summary of the interview subject,
and the schema spec. It must return units.json and a short prose
summary of the segmentation choices it made.

## Pointers

- Schema: `schemas/story_map.schema.md`
- Mechanical seed: `lib/storymap_segment.py`
- Integrator / validator: `lib/storymap_integrate.py`
- Next step: `storymap-arcs`