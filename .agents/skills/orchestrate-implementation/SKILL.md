---
name: orchestrate-implementation
description: Execute a human-approved implementation ticket batch in dependency order with subagents, independent code review and verified integration. Pause for unresolved product or architecture decisions and report outcomes in plain language for a product designer. Use after ticket approval or to resume a batch, across agent harnesses.
---

# Orchestrate implementation

The human owns shaping, specifications and ticket approval. Start at approved
implementation tickets. Own their execution, not the product decisions behind
them. Keep one ticket active through implementation, corrections, review and
integration, then select the next eligible ticket. Continue without routine
confirmation until the authorized batch finishes, a meaningful gate blocks it,
or the current execution tranche reaches a planned handoff boundary. A planned
rollover is a normal yield, not a failure or blocker, and does not require renewed
approval of the batch. Finish at a safe checkpoint and resume from the durable
ledger in a fresh run.

This is a portable instruction protocol, not a daemon or scheduler. Read
[runtime requirements](references/runtime.md) at startup or when changing harness.
Read [execution](references/execution.md) before dispatching workers. Read
[decisions and reporting](references/decisions-and-reporting.md) before the first
worker, whenever new uncertainty appears, and when returning a result. Keep the
approved batch durable across bounded execution tranches and disposable harness
runs: `batch durable > execution tranche > disposable run`.

## Establish the approved contract

Read project instructions, the authoritative spec, tickets, domain glossary,
ADRs, tracker configuration and integration/deployment procedures. Follow project
pointers rather than assuming every repository uses the same paths. Load Matt
Pocock's installed `implement` and `code-review`, and `tdd` when needed. Resolve
actual files even if the host does not expose those skills automatically; preserve
their source files. Missing required procedures are a named prerequisite, not
permission to invent a replacement.

Verify the selected items describe implementable behavior and acceptance criteria.
Decision tickets, unapproved drafts, contradictory requirements and unresolved
product choices belong back with the human. A ready label alone is insufficient.
An explicit user instruction to implement these tickets counts as approval of
their current contents if they are implementable; do not ask for approval again.
Record that instruction or an existing approval record as evidence. Reading a
queue, or automatically discovering this skill, does not authorize execution.

Freeze the approved contract in a durable batch ledger:

- Repository, selected ticket IDs and titles, exact spec/ticket contents or immutable
  revisions and hashes, approval evidence, dependencies and exclusions.
- Authoritative domain/ADR sources and their revisions, integration branch and
  starting SHA, required checks, and completion gate: reviewed, integrated or deployed.
- Existing authorization for local commits, push/PR, merge, deployment and tracker
  writes; reuse prior authorization without extending it. No external messaging
  is implied. Record any delegated decision authority and its explicit limits.
- Approved test seams, correction budget (three rounds per ticket by default),
  user deadline/cost limit and supported worker/reviewer mechanism.

An explicit range limits the batch. An explicit whole-queue request snapshots its
current membership. External blockers may be inspected but are not added to scope.
Before dispatch and acceptance, compare spec, acceptance criteria, dependencies and
domain decisions with the approved snapshot, excluding workflow-only metadata.
Pause on material drift; never consume edited requirements as renewed approval.

For unattended TDD, reuse public test boundaries already approved by the human.
Existing tests alone do not establish that approval. If new boundaries are needed,
explain the observable scenarios to protect in ordinary product language and obtain
that decision once; pass its precise technical mapping to workers. A necessary
unapproved boundary discovered later follows the decision handoff. Run existing
checks while waiting; do not evade an approval requirement by renaming the method.

## Own the boundary between doing and deciding

Workers must escalate when evidence contradicts the approved rule, or choosing a
fix would settle an unresolved product/domain/architecture choice. The coordinator
applies the same gate to reviewer suggestions. Routine technical corrections within
the approved intent remain autonomous. Use the decision guide to distinguish them.

A human-required pause stops dispatch and speculative fixes for the affected scope.
Pause the batch by default; the decision guide defines the authorized independent-
ticket exception. Collect evidence,
preserve the candidate and prepare a small decision brief. Resume only after the
actual answer, reconcile revised docs and affected tickets, and repeat relevant
checks/review. Silence, an agent-written note, or an exhausted retry budget is not
approval. Routine infrastructure waits remain pending with a checkpoint; missing
credentials, failed gates or persistent uncertainty are reported as real blockers.

Finish every run, including pauses and failures, with the product-facing report in
the decision guide. Preserve technical evidence separately so the human can choose
what to do next without interpreting commits, raw logs or agent conversations.
