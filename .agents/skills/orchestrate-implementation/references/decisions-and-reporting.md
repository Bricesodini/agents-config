# Decisions and reporting

## Route by the uncertainty, not by review severity

| What the evidence shows | Action |
| --- | --- |
| Typo, duplication, convention breach, or code contradicting a clear approved rule | Correct autonomously; verify and review. |
| A fact is missing, but the intended behavior is settled | Bounded inspection or reproduction; consult `research` for external facts. Keep it within the ticket and remaining run budget. Escalate if inconclusive. |
| Competing business meanings, contradictory rules, or a fix changing user-visible policy | Pause for a human decision; prepare `grilling` + `domain-modeling` context. |
| A design question needs something concrete to judge | Pause implementation; propose a focused `prototype` session for the human to evaluate. |
| Several linked decisions make the route unclear across sessions | Hand off toward `wayfinder`; never resolve its human-in-the-loop questions yourself. |
| A significant architectural trade-off meets the ADR threshold | Present the decision and propose an ADR using `domain-modeling`. |
| Required capability, check, access or authorization is absent | Explain the operational blocker and the smallest action that unlocks it. |

Use the installed skill when its branch is reached. Human-facing planning skills
are handoff destinations, not permission to run the entire upstream workflow
unattended. An ADR is warranted only when the decision is hard to reverse,
surprising without context, and involves genuine alternatives. An already approved
choice may be recorded within existing authority; an unresolved choice stays
proposed until the human decides. A draft ADR never becomes its own authorization.
Keep glossary definitions in `CONTEXT.md`, decisions in ADRs, and requirements in
the spec/tickets. Do not silently weaken any of them to make code pass review.

## A pause is an actionable decision brief

Stop the current ticket at a safe checkpoint, quiesce writers and block its
successors. By default pause the batch; independent tickets may continue only
under an explicit run policy and only if the open decision cannot affect them.
Preserve completed work and any useful evidence gathered within the approved scope.

Speak in the user's language and product vocabulary. Give:

1. The concrete situation: what someone using the product would experience.
2. Why this is a choice rather than an implementation detail; cite the conflicting
   approved rule and observed fact, with links in supporting evidence.
3. Two or three real options, when alternatives exist, with user impact, cost,
   reversibility and a recommended choice with its reason. Do not invent options
   for a simple access or permission blocker.
4. One precise question, which tickets wait for it, and what happens after an answer.

Example (French): « Une réservation annulée ne doit plus bloquer le créneau,
mais la règle actuelle le conserve jusqu'au remboursement. Faut-il libérer le
créneau dès l'annulation ou après remboursement ? Je recommande la première
option pour permettre une nouvelle réservation ; cela exige de modifier la règle
validée. Les tickets de disponibilité attendent cette décision. »

On reply, record the human's actual choice and its scope. Apply approved updates
using the relevant domain/doc procedure, identify affected tickets and revalidate
their acceptance criteria. Preserve prior approved versions. Resume only the
approved remainder; propose new tickets separately. If the choice is still unclear,
keep the checkpoint rather than implementing an interpretation as settled policy.

## Product-facing result

Use this structure for completion, planned rollover, partial completion and
pauses. Keep the main report short; put detailed technical proof in linked
supporting files.

- **État :** terminé, reprise planifiée, partiellement terminé, en attente technique,
  ou décision attendue. A planned rollover is a clean voluntary yield, distinct
  from a problem, technical wait or human decision.
- **Ce qui change :** capabilities delivered, with one concrete before/after example
  where useful. Name tickets by title; IDs are secondary.
- **Ce qui a été vérifié :** observable scenarios and results; distinguish automated
  checks, independent code review and any actual usage/browser checks. State missing
  evidence and residual limits. Passing tests alone does not prove usability.
- **Où c'est disponible :** only prepared locally, integrated into the project,
  available in a test environment, or live for users. Translate reviewed/integrated/
  deployed states; never say a feature is available merely because code was committed.
- **Ce qui reste à décider ou à faire :** recommendation and trade-offs for open
  decisions, or simply no decision needed; include the paused ticket and its effect
  on the rest of the batch. Do not manufacture an arbitration at successful completion.
- **Suite :** the next useful action or an exact resume instruction.

For **reprise planifiée / planned rollover**, report completed tickets and any
active checkpoint in this tranche. Also say that the approved batch remains
authorized and healthy, why this run yields now, which ticket resumes next, where
the durable ledger is, and the exact resume instruction. Example: « État : reprise planifiée — la tranche courante est
terminée proprement ; aucun blocker produit ou technique. Reprendre le même
batch depuis `<ledger>` au ticket `<next_ticket>`. »

Retain both Standards and Spec reports unmerged in technical evidence. Explain
material findings as maintainability or intended-behavior consequences in the main
report. Evidence includes accepted/reviewed commits, commands and outcomes, review
rounds, integration/deployment runs and the ledger location. The human should be
able to arbitrate without reading it, and inspect it when needed.
