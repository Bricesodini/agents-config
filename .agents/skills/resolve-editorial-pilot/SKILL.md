---
name: resolve-editorial-pilot
description: User-invoked pilot for editorial Resolve work. Triggers when the user types the skill name to ask "what should I do next on this interview" or "I'm stuck — walk me through the steps". Recommends the next concrete step in the Phase A → B → C workflow, asks for clarification only when the answer would change the editorial decision, and otherwise just advances.
---

# resolve-editorial-pilot

A user-invoked skill (no model description; the human types the name).
This is the editorial counterpart to `/ask-matt`. When you invoke it,
the agent gives you the next step on the current interview.

## Rule: ASK ONLY WHEN THE ANSWER CHANGES THE EDITORIAL DECISION

This skill is the gatekeeper for user questions. Before asking
**anything**, score the question:

| Would the answer change the cut? | Action |
|---|---|
| Yes — multiple defensible structures, ambiguous audience, missing constraint that can't be deduced | Ask |
| No — derivable from transcript / brief / context / story map | Decide and tell |
| Mechanical (durations, frame numbers, file paths) | Decide silently, no question |

## What "decidable without asking" looks like

- The transcript alone gives the topic order.
- The brief says "300 s ± 30 s" — that's a hard number, no question.
- The story map already has `weight` on arcs; the LLM can pick which
  to weight heavier.
- The integrity report flags an orphan answer — the LLM can pick a
  better adjacent unit itself.
- The user said "5 min film" once — that defines target duration for
  every subsequent cut until told otherwise.

## What "ask first" looks like

- The brief says nothing about the audience, but multiple audiences would
  pick different arcs.
- The user says "do something cool with this" without an intent.
- A unit has multiple legitimate narrative positions and the LLM
  cannot pick without a tonal hint.
- A constraint is missing that the LLM cannot infer (e.g. the
  deliverable aspect ratio for a vertical cut).
- Two structural choices have the same editorial weight (chronological
  vs pivot-first would both work for the brief).

## What to do, in order

1. Look at the current state of `out/`:
   - `transcript_normalized.json` present? If not → recommend
     `scripts/run_extract_transcript.py`.
   - `units_seed.json` present? → recommend running the
     `storymap-segment` skill.
   - `units.json` present? → check if `arcs.json`, `pivots.json`,
     `redundancies.json` exist. If not → recommend `storymap-arcs`.
   - `story_map.json` present? → recommend `storymap-review` (or
     skip if the editor is in a hurry).
   - `edit_plan.json` present? → recommend `editplan-integrity`.
   - `integrity_report.json` present and clean → ready for Phase C
     (out of scope this round, but mention it).
2. For each step, give the **one concrete command** the user should
   run, and the **one sentence** of why.
3. If the next step requires a brief that doesn't exist, ask **one**
   concise question to elicit it (intent, target duration, audience).
4. If the user has provided a brief already, do NOT re-ask. Decide
   based on it.
5. If a step is purely mechanical (frame computation, file emission),
   execute it yourself; do not bother the user.

## What NEVER to do

- Ask "do you want me to do X?" before doing X. Just do X and tell
  the user what you did.
- Re-ask something already in the brief.
- Pile up multiple questions. One question per turn, at most.
- Ask the user to choose between mechanical variants (e.g. "should I
  store the file in `out/` or `tmp/`?"). Pick the convention.
- Recommend a step without saying what command to run.

## Output format

The skill should reply in this shape:

    Current state:
      - <list of files present in out/, briefly>
      - <one-line summary of what each means>
    Next step:
      - <one concrete action + the command to run>
    If you need to ask:
      - <one question, only if it changes the cut>

That's it. No multi-page plans. No "first, we should consider…". The
user invoked this skill to get unblocked; unblock them.

## Pointers

- Workflow overview: `~/.agents/skills/resolve-workflow/SKILL.md`
- Story map pipeline: `storymap-segment`, `storymap-arcs`,
  `storymap-build`, `storymap-review`
- Edit plan pipeline: `editplan-build`, `editplan-integrity`
- Phase A: `lib/extract_transcript.py`
- Phase B (mechanical): `lib/storymap_segment.py`,
  `lib/storymap_integrate.py`, `lib/editplan_build.py`,
  `lib/editplan_integrity.py`
- Phase C: out of scope this round.