# 0002 — Impeccable as a signed-off specialist in orchestrate-implementation

`orchestrate-implementation` calls Impeccable inside a ticket's implementation tranche. Impeccable's output is gated by a small dedicated subagent (a **design sign-off**) before the worker acts on it. Surface-only recommendations proceed; system-changing recommendations pause for a human decision. This contract fixes the seam between the two skills, kills the duplicated scope-change rule, and reserves the noun `handoff` for the unrelated conversation-continuity skill.

## Status

accepted

## Context

`.agents/AGENTS.md` line 15 says: "For UI/UX work, use Impeccable as a specialist **inside** the Matt workflow … If a design recommendation changes scope or product behavior, return that decision to the spec or ticket before implementation." `orchestrate-implementation`'s `references/decisions-and-reporting.md` says the same thing under a different heading: "Competing business meanings, contradictory rules, or a fix changing user-visible policy" is a pause-for-decision row. The same rule lives in two places.

Both pieces of prose are correct; neither names a seam, an interface, or a handoff format. In practice the gate has three problems:

1. **No defined caller.** Impeccable is reached by an LLM loading its SKILL.md mid-ticket. The seam is in the prompt, not in any function call. Without a named subagent owning the gate, dispatch varies by run and the gate fires only when the worker happens to remember the rule.
2. **Asymmetric declaration.** `orchestrate-implementation` declares the consumer side; Impeccable (local copy and upstream at impeccable.style/docs/new-work) declares nothing about returning design recommendations to a spec or orchestrator. Impeccable's scope model is user-facing ("set how much can change" per-request), not orchestrator-facing. The discrepancy is the surface this ADR patches.
3. **Duplicated rule.** Two copies diverge: `.agents/AGENTS.md` reads policy; `decisions-and-reporting.md` reads procedure. A future edit to one will skip the other.

The two-layer rule (maintainer `AGENTS.md`) is sacred. The fix lives under `.agents/` and is captured here as a contract; the contract's implementation (the subagent itself) is separate work.

## Decision

Introduce a small dedicated subagent — **design sign-off** — that gates Impeccable's output before the `orchestrate-implementation` worker acts on it.

### Interface

The subagent sits **between Impeccable and the worker**, not between worker and coordinator. The worker reads the subagent's classified packet and decides whether to act or pause; the coordinator only sees the worker's decision.

| Slot | Value |
|---|---|
| **Inputs** | the live ticket (acceptance criteria + frozen ticket text), the Impeccable recommendation (output files + linked `.impeccable/`, `.impeccable/mocks/`, `.impeccable/surfaces/` paths), the in-flight surface brief when present |
| **Outputs** | a **sign-off packet**: disposition word + classification rationale + linked evidence |
| **Disposition word** | `surface-fix` or `system-change` |
| **Implementation** | `.agents/skills/design-sign-off/SKILL.md` — follow-up work item, not part of this ADR |

### Surface vs system (the gate)

A recommendation is `surface-fix` if **all four** are true; otherwise `system-change`:

1. It stays in the active ticket's scope. It does not cross into another ticket or context.
2. It does not add, remove, or reword an acceptance criterion.
3. It does not change the surface's Impeccable Mode (Persuade / Operate / Read / Experience).
4. It does not revert or replace code already accepted by an earlier ticket in the batch.

### Failure mode

A sign-off packet missing the disposition word, missing the rationale, or missing evidence links is **malformed**. A malformed packet is treated as `system-change`; the worker pauses. This is fail-soft toward the human.

### Disagreement

The worker may appeal the classification **once per ticket** with written evidence (point at a ticket clause, an ADR, or a `decisions-and-reporting.md` row that the recommendation satisfies). If the worker still disagrees after the appeal, it pauses. Appeals are recorded in the durable ledger beside the sign-off packet.

### Caller of record

`worker subagent → coordinator (orchestrate-implementation)`. The worker is the immediate caller of Impeccable; the coordinator sees the worker's classification decision, not the Impeccable output directly.

### Removing the duplication

`decisions-and-reporting.md`'s routing table becomes the single source of truth for the rule. `.agents/AGENTS.md` line 15 is reduced to a one-line pointer.

## Consequences

### What the ADR changes when accepted

**Within this ADR's scope:**

- `docs/adr/0002-impeccable-as-signed-off-specialist.md` — this file. Status moves `proposed` → `accepted`.

**Required co-edits (same commit, not a separate ticket):**

- `.agents/AGENTS.md` line 15 — replace the inline rule with a pointer to `decisions-and-reporting.md`.
- `.agents/skills/orchestrate-implementation/references/decisions-and-reporting.md` — add a row to the routing table naming `design sign-off` for design-output sources; cite this ADR.

**Out of scope, captured as follow-up tickets in `.scratch/`:**

- Author `.agents/skills/design-sign-off/SKILL.md`. The contract above is the spec; this is the implementation.
- Backport the rule to the Impeccable upstream (or document why we don't).
- Decide whether the subagent's verdict word `surface-fix` / `system-change` joins `.agents/.skill-lock.json`.

### Reversibility

The contract is the durable artifact; the implementation is interchangeable. A future ADR can rewrite the subagent's classification rule without invalidating the seam. A future ADR can replace the dedicated subagent with a built-in call inside `orchestrate-implementation`'s reference without invalidating the consumer side.

### Considered options

- **Reuse an existing skill as the gate.** `code-review` produces an axis report for code; not for design outputs. `grilling` is for plans and ideas, not live outputs. Neither fits. Rejected.
- **Inline the gate inside `decisions-and-reporting.md` as a checklist.** Less code to ship, but loses the disposition word, the failure mode, and the appeal rule. Loses testability. Rejected.
- **Make `orchestrate-implementation`'s worker the classifier instead of dispatching a subagent.** Saves a hop; loses the contract — every worker reproduces the rule independently and drifts. Rejected.
- **Use the existing `handoff` skill or `claude-handoff` skill as the subagent.** Both are `disable-model-invocation: true` and exist for conversation continuity, not for design-output gating. The noun `handoff` collides if we name the new thing "design handoff". Picked `design sign-off` instead. Consolidating `handoff` / `claude-handoff` is captured as a separate decision with its own ADR; this ADR does not allocate that number.

### Forbidden paths

The following are not part of this ADR and would invalidate it:

- Adding an `## Agent skills` block to the **maintainer** `AGENTS.md` (line 3 forbids runtime-facing content there).
- Running `bin/install.sh` to deploy the skill before it is written (the deployment layer is symlinks into a kit that does not yet contain the subagent).
- Reusing the noun `handoff` for this subagent.
