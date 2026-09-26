# Apply ADR-0002's required co-edits

**Type:** task
**Status:** resolved
**Owner:** coordinator (this session)

## Job

Apply the two co-edits called out in `docs/adr/0002-impeccable-as-signed-off-specialist.md` Consequences, in the same commit as `.agents/skills/design-sign-off/SKILL.md`.

## Inputs

- `docs/adr/0002-impeccable-as-signed-off-specialist.md` — Required co-edits section
- `.agents/AGENTS.md` line 15
- `.agents/skills/orchestrate-implementation/references/decisions-and-reporting.md`

## Acceptance criteria

- [x] `.agents/AGENTS.md` line 15 reduced to a one-line pointer to `decisions-and-reporting.md`. The maintainer `AGENTS.md` is **not** touched.
- [x] `decisions-and-reporting.md` routing table has a row for design outputs citing the new subagent and ADR-0002.
- [x] Diff is one block per file; no unrelated formatting churn.
- [x] `git grep "change.*scope\|new scope"` over `.agents/` shows one source of truth (in `decisions-and-reporting.md`).
- [x] Status of ADR-0002 moved from `proposed` to `accepted`.

## Out of scope

- Anything in `~/02_dev/agents-config/AGENTS.md` (maintainer).
- Anything under `bin/install.sh`.

## Answer

Resolved in commit `45a440b` "Accept ADR-0002: design sign-off for Impeccable ↔ orchestrate-implementation". Both co-edits landed in the same commit as the ADR itself; the duplication grep over `.agents/` returns one match for the rule (in `decisions-and-reporting.md`) plus the pointer in `.agents/AGENTS.md` line 15 that defers to it. ADR status is `accepted`.

Note for next reviewer: ticket numbering assumed 01-author-skill gates 02; in fact the co-edits were deliberately bound to the ADR's acceptance rather than to the SKILL.md implementation. The `Blocked by` line was removed when the ticket resolved, since the dependency never gated the work.

