# Author `.agents/skills/design-sign-off/`

**Type:** task
**Status:** resolved
**Owner:** coordinator (this session)
**Accepted SHA:** `121e832`

## Job

Author the canonical implementation of the contract defined in `docs/adr/0002-impeccable-as-signed-off-specialist.md`. The contract is the spec; this ticket is the implementation.

## Inputs

- `docs/adr/0002-impeccable-as-signed-off-specialist.md` — interface, gate rule, failure mode, appeal rule
- `docs/agents/issue-tracker.md` — local-markdown conventions for `.scratch/`

## Acceptance criteria

- [ ] `.agents/skills/design-sign-off/SKILL.md` exists.
- [ ] Frontmatter `name: design-sign-off`; `description` matches the dispatch criteria (an `orchestrate-implementation` worker has just received an Impeccable output and needs to gate it).
- [ ] `disable-model-invocation: false` (this is a tool-callable subagent, not user-invoked).
- [ ] Body references ADR-0002 §"Surface vs system (the gate)" as the gate rule and applies it without restating (single-source-of-truth per `writing-for-agents`). Verbatim wording belongs to the ADR, not the skill.
- [ ] Body defines the sign-off packet format (disposition word + rationale + linked evidence paths).
- [ ] Body says malformed = `system-change`.
- [ ] Body says worker may appeal once per ticket before pausing.
- [ ] Does not duplicate the surface-vs-system definition already in the ADR.
- [ ] Smoke check (in-repo): the file resolves from `.agents/skills/design-sign-off/SKILL.md`; no path collisions with `handoff/`, `claude-handoff/`, or `impeccable/`. (The `~/.agents/skills/design-sign-off/` half is gated on `bin/install.sh` running — that's a separate ticket per the ADR's Forbidden Paths.)

## Out of scope

- Re-running `bin/install.sh` to deploy — that's a separate ticket after this lands.
- ADR-0003 (`handoff` / `claude-handoff` consolidation) — separate grilling session.
- Promoting the subagent to `code-review` / `domain-modeling` vocabulary — uses `codebase-design` rules itself.

## Answer

Resolved at `121e832` "Add design-sign-off subagent (ADR-0002 implementation)". The skill is now in `.agents/skills/design-sign-off/SKILL.md` (52 lines), model-invoked (`disable-model-invocation: false`), one trigger branch in the description, deferral language on line 23 referencing ADR-0002 §"Surface vs system (the gate)" without restating the four criteria.

Two-axis review: Standards PASS round 1; Spec FAIL round 1 → round 2 PASS after ticket criterion 4 wording was edited to match the ADR's single-source-of-truth decision. Correction budget used: 1 of 3.

Ticket 03 (deploy via `bin/install.sh`) is now unblocked. Coordinate with ADR-0001's deferred symlink-swap ADR before dispatching ticket 03; deploy without that ADR risks regressing the live install per ADR-0001's open consequences.
