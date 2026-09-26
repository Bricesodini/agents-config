# Apply ADR-0002's required co-edits

**Type:** task
**Status:** claimed
**Blocked by:** 01-author-skill
**Owner:** <claim before work>

## Job

Apply the two co-edits called out in `docs/adr/0002-impeccable-as-signed-off-specialist.md` Consequences, in the same commit as `.agents/skills/design-sign-off/SKILL.md`.

## Inputs

- `docs/adr/0002-impeccable-as-signed-off-specialist.md` — Required co-edits section
- `.agents/AGENTS.md` line 15
- `.agents/skills/orchestrate-implementation/references/decisions-and-reporting.md`

## Acceptance criteria

- [ ] `.agents/AGENTS.md` line 15 reduced to a one-line pointer to `decisions-and-reporting.md`. The maintainer `AGENTS.md` is **not** touched.
- [ ] `decisions-and-reporting.md` routing table has a row for design outputs citing the new subagent and ADR-0002.
- [ ] Diff is one block per file; no unrelated formatting churn.
- [ ] `git grep "change.*scope\|new scope"` over `.agents/` shows one source of truth (in `decisions-and-reporting.md`).
- [ ] Status of ADR-0002 moved from `proposed` to `accepted`.

## Out of scope

- Anything in `~/02_dev/agents-config/AGENTS.md` (maintainer).
- Anything under `bin/install.sh`.

## Answer

(work here when resolved; set Status to `resolved`)
