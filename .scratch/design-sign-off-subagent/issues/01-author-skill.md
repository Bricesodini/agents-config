# Author `.agents/skills/design-sign-off/`

**Type:** task
**Status:** claimed
**Blocked by:** —
**Owner:** <claim before work>

## Job

Author the canonical implementation of the contract defined in `docs/adr/0002-impeccable-as-signed-off-specialist.md`. The contract is the spec; this ticket is the implementation.

## Inputs

- `docs/adr/0002-impeccable-as-signed-off-specialist.md` — interface, gate rule, failure mode, appeal rule
- `docs/agents/issue-tracker.md` — local-markdown conventions for `.scratch/`

## Acceptance criteria

- [ ] `.agents/skills/design-sign-off/SKILL.md` exists.
- [ ] Frontmatter `name: design-sign-off`; `description` matches the dispatch criteria (an `orchestrate-implementation` worker has just received an Impeccable output and needs to gate it).
- [ ] `disable-model-invocation: false` (this is a tool-callable subagent, not user-invoked).
- [ ] Body states the four system-change criteria verbatim from the ADR.
- [ ] Body defines the sign-off packet format (disposition word + rationale + linked evidence paths).
- [ ] Body says malformed = `system-change`.
- [ ] Body says worker may appeal once per ticket before pausing.
- [ ] Does not duplicate the surface-vs-system definition already in the ADR.
- [ ] Smoke check: load the file under both `~/.agents/skills/design-sign-off/` (post-`install.sh`) and `.agents/skills/design-sign-off/`; no path collisions with `handoff/`, `claude-handoff/`, or `impeccable/`.

## Out of scope

- Re-running `bin/install.sh` to deploy — that's a separate ticket after this lands.
- ADR-0003 (`handoff` / `claude-handoff` consolidation) — separate grilling session.
- Promoting the subagent to `code-review` / `domain-modeling` vocabulary — uses `codebase-design` rules itself.

## Answer

(work here when resolved; set Status to `resolved` per `docs/agents/issue-tracker.md`)
