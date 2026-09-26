# Execution and recovery

## Ownership and frontier

Keep a durable ledger outside disposable worktrees, by default in the main
checkout's `.scratch/orchestration/<batch-id>/`. Record contract and frozen
ticket/spec text or immutable references with full digests; status, dependencies,
worktree/branch, base/candidate/reviewed SHAs, exact checks/results, separate
review reports bound to the reviewed SHA, findings, attempts, integration/
deployment proof and next action. Keep artifacts out of product commits;
temporary paths and chat are not durable evidence.
Persist changes atomically before dispatch and after every stage. Ticket states
are ready, implementing, reviewing, correcting, accepted, integrated, deployed,
waiting-decision or blocked; map them to existing tracker vocabulary. On a pause,
record the exact unfinished stage and next action.

Acquire exclusive batch ownership before claiming work. For a local queue,
use an atomic lock directory in the repository's shared Git common directory
(resolve it to an absolute path), keyed by queue identity so different worktrees
share it. Record owner, run ID and heartbeat. Editing a status field alone is
not a lock. For remote coordination use a conditional claim or shared lock;
if exclusivity cannot be established, stop before dispatch. Recover stale
claims only after verifying the owner is inactive and reconciling its work.

Support local `.scratch/<feature>/issues/<NN>-<slug>.md` tickets, including
`**Status:**`, `**Blocked by:**`, and acceptance checkboxes from `to-tickets`.
Use configured equivalents for other trackers. Update workflow metadata while
preserving requested work and acceptance criteria. Keep internal states in the
ledger if the tracker lacks matching states or write authorization.

A ticket is ready only when it is in approved scope, is unclaimed and eligible
under the configured tracker status, and prerequisites are verifiably satisfied
on its intended base. Include code/API, schema, migration and deployment constraints,
not just numeric order or a `done` label. Respect expand–migrate–contract order.
Before dispatch, choose per-ticket integration or an accepted local candidate
chain for dependents. A documented series may defer release gates to its final
verification ticket; record which and why. Otherwise each ticket passes its
checks before advancing.

Choose a topological order; use the user's order among eligible tickets, then
numeric order as tie-breaker. Report cycles, missing blockers and malformed
tickets. Default to stopping on a blocked/failed ticket; continue independent
branches only if the run contract authorizes that policy.

## Execution tranche and planned rollover

The **batch** is the human-approved implementation scope and stays stable across
the orchestration. An **execution tranche** is a bounded set of approved batch
tickets planned for the current run; it changes neither scope nor product intent
and needs no separate approval. A **run/goal** is the disposable harness context.
The durable ledger outlives both: `batch durable > execution tranche > disposable
run`.

### Plan a tranche

After freezing the batch and building its dependency graph, select and record a
bounded tranche of approved tickets, preserving topological order. Distinguish:

- **Planned in tranche:** an approved ticket whose dependency chain can become
  eligible during this tranche, even if its prerequisites are not yet satisfied.
- **Eligible for dispatch:** a ticket whose prerequisites and blockers are
  verifiably satisfied on its intended base at the moment of dispatch, under
  the readiness rules above. Tranche membership alone does not establish this.

For example, `T-01 → T-02 → T-03` may be planned in one tranche, within its
budget, even if only `T-01` is initially eligible. Dispatch each successor only
after verifying its prerequisites; a planned predecessor is not evidence of
completion.

Keep approved batch membership distinct from tranche membership in the ledger.
When the host reports an execution horizon, size the tranche to leave reasonable
capacity for final checks, both reviews, atomic ledger persistence, lock release,
and the handoff report. Record the horizon source and value.

When the horizon is unknown, use a conservative, configurable tranche budget
based on relative ticket cost: simple tickets are low cost, an ordinary
implementation plus reviews is normal cost, and migrations, Phase C work or heavy
integration are high cost. As a default, assign low/normal/high tickets relative
costs of 0.5/1/2 and cap a tranche at 2 cost units; record the chosen mapping and
cap in the ledger. These weights and the default cap are conservative scheduling
heuristics, not predictions of rounds, tokens or duration. This deliberately
bounds the first tranche (for example, it will not place a 13-ticket queue in one
run). The run may lower the cap based on
observed duration, but does not expand a frozen tranche automatically. Start a
new tranche on resume. Do not estimate tokens or assume the full batch fits one
run. This budget is only a scheduling aid and never changes the per-ticket
correction budget.

### Reassess after each ticket

After each ticket is accepted or integrated, persist the state, reread the queue
and blockers, and assess whether the next eligible ticket can reasonably be
implemented, corrected if needed, checked, reviewed on both Standards and Spec,
integrated, and checkpointed within the remaining horizon and recorded tranche
budget. Yield when all planned tranche tickets are complete, or leave the next
ticket unstarted and yield when it cannot fit the remaining horizon or budget.
Do not silently add tickets to the tranche.

### Yield at rollover

A planned rollover is a normal `yielded`/`planned-rollover` ledger outcome, not a
ticket state, tracker state, blocker, failure, or human-decision pause. At a safe
checkpoint:

1. Finish the current atomic stage and persist its result.
2. Stop and quiesce all writers; confirm no subagent owns a pending mutation.
   If a ticket is still active, checkpoint its exact unfinished stage and keep
   its existing correction-round count; do not mark it accepted.
3. Persist exact ticket states, relevant SHAs, checks, separate review results,
   blockers, next action, next eligible ticket, and completed/planned tranche.
4. Release only locks owned by this run.
5. Write an exact resume instruction and finish the run normally.

Extend the existing ledger rather than creating another state store. Record at
least the batch ID and approved tickets, tranche ID, planned and completed
tickets, next ticket to resume or begin, yield reason, and execution horizon
(source and value, or `unknown`). For fallback scheduling, also record the
relative cost mapping and tranche cap. A yielded run leaves the approved batch
authorized and healthy; it does not require approval again.

### Resume after planned rollover

Reconcile the ledger with heartbeat, lock ownership, repository/worktree and SHAs
before acting. Verify the frozen batch and ticket/spec contents have no material
drift; workflow-only metadata may change. Do not request renewed batch approval
solely because the harness session or goal changed. Discover the new run's
horizon and plan and record a new bounded tranche. If the ledger has an active
ticket with an unfinished stage, resume that ticket at its recorded `next_action`
before selecting another ticket; preserve its correction-round count and
reconcile its candidate/review SHAs. Otherwise continue at the recorded
`next_ticket`. A new goal/session continues the same batch. Human decisions,
technical blockers and failed gates retain their existing pause/blocker handling;
they are never relabeled as planned rollover.

## Execute one ticket

Freeze the base SHA from integration or an accepted predecessor.
Before dispatch, map criteria to observable evidence and proof layers;
assign fixture owners if needed. Create a clean, isolated worktree from that
base; preserve unrelated user changes. Give one fresh implementation subagent
the repository/worktree paths, full ticket, criteria, base SHA, domain constraints,
approved seams, required checks and proof map, permissions and skill paths.
It owns this ticket only. A subagent may not change the tranche, choose the next
ticket, decide a global rollover, advance ticket status to accepted/integrated,
own or rewrite the batch ledger, or close the run. The coordinator alone owns
the ledger and progression; workers implement, the coordinator reviews, accepts
and advances.

Compose Matt's `implement` stages explicitly: the worker implements and runs
checks, then hands control to the coordinator for review and acceptance below.
State this handoff in its assignment so it does not run a duplicate review,
advance the queue, merge, or deploy. Use `tdd` where behavior warrants it and an
approved seam exists. Run checks required by `implement` and the repo, including
its full suite at the end; report unavailable or failed checks accurately.

Require the worker to return outcome, acceptance evidence, changed files,
commands/results, remaining concerns, and what the next ticket can rely on.
The coordinator verifies the actual worktree, selected tests, isolated test
resources and evidence against the proof map. A passing build does not prove an
untested user journey.

Only one ticket may be implementing, fixing, reviewing, or integrating at once.
Quiesce the worker before review. Run the two independent Standards and Spec
reviewers using the mechanism established in the runtime preflight. Only those
read-only reviews may run in parallel within the ticket.

## Review and corrections

Matt's `code-review` uses `git diff <base>...HEAD`; uncommitted changes are
invisible. After checks, create a local candidate commit containing only the
intended ticket changes, including new files. If local commits are explicitly
prohibited or outside authorization, retain the ready changes and checkpoint
this prerequisite. Verify a clean worktree and that
the frozen base is an ancestor of candidate HEAD. This is a review snapshot,
not acceptance, publication or completion. Supply the base SHA and originating
spec to `code-review`; run its Standards and Spec agents on this candidate.
Record both reports and the reviewed SHA. The run-contract spec is authoritative:
reconcile conflicting issue references before review, since `code-review` otherwise
looks at commit references first. Keep writers stopped throughout review. Verify
HEAD still equals the candidate SHA and the worktree remains clean after checks
and review; any mismatch invalidates the evidence and requires reconciliation.

An empty diff requires reconciliation: if already implemented, document evidence
for every criterion and its existing commit; otherwise implementation is
incomplete. For an already-satisfied ticket with no new diff, verify all criteria
and the required integration/deployment gate; record "already satisfied; no new
diff reviewed" instead of inventing a passing review. Missing specs, skipped axes, failed reviewers and unavailable
required checks cannot count as passing review.

First apply the product/domain decision gate in
[decisions and reporting](decisions-and-reporting.md), even to a naming or module
smell: a technical label does not authorize changing meaning. For findings that
stay within the approved contract, record axis, evidence and disposition:

- Naming, duplication, module structure or convention: focused correction and
  relevant checks. A review finding alone does not require TDD.
- Incorrect behavior, regression or critical uncovered requirement: reproduce
  and fix, using `tdd` at an approved public seam where appropriate.
- Unsupported finding or documented exception: retain an evidence-based rationale
  for follow-up review to assess; never silently discard it.
- New scope, contradictory requirements, architectural decision beyond authority
  or missing permission: checkpoint the precise decision required from the user.

Delegate corrections within the same ticket and worktree. After each round,
rerun affected checks plus required end-of-ticket checks, commit the candidate,
and run both review axes against the ORIGINAL base SHA. New code changes
invalidate earlier approval. Preserve separate axis reports, not one score.
Accept only when checks pass, all acceptance criteria are evidenced, and findings
are fixed or justified with no unresolved objection in the follow-up review.

A correction round includes fixes, checks, candidate commit and both reviews.
Record its start and completion separately. Complete and assess the last allowed
round: a passing third round may be accepted; a fourth may not start. On resume,
finish a pending review in its existing round without resetting the counter.
Stop if another round would exceed the budget, or earlier for a repeated identical
failure without new evidence. Retain the branch, worktree and reports and return
the smallest concrete decision needed.

## Integration and gates

Record the accepted SHA. Apply the project's authorized integration workflow.
A local fast-forward preserves the reviewed commit exactly. If the integration
head moved, or rebase/merge/conflict resolution changes the candidate, record a
new integration attempt and base, rerun checks and review the resulting diff
before accepting. Integration retries consume the same per-ticket correction
budget; neither changed bases nor resumption reset it. Preserve other
contributors' changes.

Keep reviewed, integrated and deployed states distinct. Confirm CI and required
deployment/migration health checks using actual run evidence. Reuse existing
authorization; if a required external action is unauthorized, finish the
reviewable candidate and checkpoint that action. Mark a ticket done only when
its declared completion gate is satisfied. A dependent may use an accepted local
candidate only with passing checks and both reviews, frozen SHA and contractual
permission; deployment prerequisites still require verified deployment. For a
candidate chain, run cumulative checks on final SHA before batch readiness;
a changed SHA invalidates affected checks and reviews.

Persist the result, update authorized tracker metadata, and re-read the queue,
repository head and gates before selecting the next ticket. A dependent must
start from a base containing its predecessor's accepted changes. Report a concise
checkpoint after each ticket and continue the authorized series.

## Resume and hand back

On interruption, stop writers and save state before releasing ownership.
On resume, compare owner/heartbeat, contract, worktree, commits, review SHAs
and external gates with the ledger. Reuse a review only with a clean worktree
and HEAD at its reviewed SHA; for an accepted predecessor, that SHA may be an
ancestor of HEAD. Otherwise reconcile and rerun affected checks/reviews. Verify
uncertain external mutations at source before retrying. Never reclaim a live
heartbeat. Retain artifacts; release only this run's locks when ending or
yielding for human input.

Return the product-facing report from [decisions and reporting](decisions-and-reporting.md).
An unanswered human decision remains pending across restarts and changes of harness.
