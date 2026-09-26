---
name: storymap-arcs
description: Use after `storymap-segment` has produced `units.json`. Triggers: "find the arcs", "identify the narrative structure", "what are the chapters of this interview", "extract pivots", "find redundancies". Reads `units.json` and groups units into arcs, marks the pivot frames where the narrative changes register, and surfaces redundancies. Writes `arcs.json` and `pivots.json` conforming to `schemas/story_map.schema.md`. Stays duration-agnostic and editorial-brief-agnostic.
---

# storymap-arcs

## Purpose

Group the discourse units produced by `storymap-segment` into a small
number of **narrative arcs**. Identify the **pivots** where the
interview visibly changes register. Surface **redundancies** (units
that say the same thing).

## Inputs

- `out/units.json` — the LLM-authored DU list.
- `out/transcript_normalized.json` — for source context.

## Outputs

- `out/arcs.json` — list of arcs (id, label, kind, summary, unitIds,
  startFrame, endFrame, durationSec, weight).
- `out/pivots.json` — list of pivots (id, atFrame, atTC, label,
  inArcId, outArcId, rationale, strength).
- `out/redundancies.json` — list of redundancy records (id, unitIds,
  kind, note).

## Arc taxonomy (kind)

Use exactly one of:

- `historical` — past events that frame the story
- `development` — growth / scale-up
- `difficulty` — crisis, obstacle, loss
- `pivot` — a moment of decision that changes the trajectory
- `transmission` — handover between generations / entities
- `values` — beliefs, principles, ethics
- `portrait` — who the interviewee is as a person
- `other` — anything that doesn't fit

Avoid more than 6-8 arcs total. If you have more, merge them.

## Pivot criteria

A pivot is a single moment — usually one or two source segments — where
the narrative visibly shifts arc. Examples:

- "Donc en 1991 je suis arrivé dans l'entreprise…" — entry into a new
  era of the family firm.
- "Et puis il y a eu la tempête de 2003…" — a difficulty arc begins.
- "On a fait rentrer DMR au capital…" — a pivot (transmission /
  association).

Do not invent pivots that are not clearly anchored to a source frame.

## Redundancy criteria

Mark as `restated` if the same idea is repeated with different words.
Mark as `rephrased` if a similar idea is restated more concisely. Mark
as `circular` if the interviewee loops back to the same point.

Each redundancy record references 2+ unit ids from `units.json`.

## Weight field (0..1)

`weight` is your judgement of how central the arc is to the interview
as a whole. Use 1.0 only for the arc you would have to include no
matter what the brief said. Use 0.0 for arcs that are pure aside.

## Boundaries

- Do NOT decide narrative order. Arcs are unordered collections of units.
- Do NOT consider the brief. Arcs are properties of the interview,
  not of the edit.
- Do NOT touch Resolve. Inputs and outputs are JSON files on disk.

## When to delegate to a subagent

For very long transcripts, the arc-detection passes benefit from a
fresh context. A subagent receives the units.json, the schema, and a
1-paragraph framing of the interview's apparent subject. It returns
arcs.json + pivots.json + redundancies.json + a short rationale.

## Pointers

- Schema: `schemas/story_map.schema.md`
- Previous step: `storymap-segment`
- Next step: `storymap-build` (composes arcs + units into story_map.json)