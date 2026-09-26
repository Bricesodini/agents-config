# Deploy `design-sign-off/` via `bin/install.sh`

**Type:** task
**Status:** ready-for-agent
**Blocked by:** 01-author-skill
**Owner:** <claim before work>

## Job

Run `bin/install.sh` (or `--check` first) once `.agents/skills/design-sign-off/SKILL.md` exists so the deployment layer exposes `design-sign-off` to runtimes — and document any `install.sh` change as its own ADR.

## Why this is its own ticket

ADR-0002's Forbidden Paths lists "Running `bin/install.sh` to deploy the skill before it is written" as out of scope. ADR-0001 also records that the symlink swap (replacing `~/.agents/skills/` with a symlink to `.agents/skills/`) is deliberately deferred to a separate ADR because it disrupts the live install. This ticket is the third leg of the migration; do not assume it can ride 01.

## Inputs

- ADR-0002 — Forbidden Paths
- ADR-0001 — the symlink swap it deferred
- `bin/install.sh` (read-only first; only edit if a change is the ADR-worthy kind)
- The completed ticket `01-author-skill` for what should now resolve

## Acceptance criteria

- [ ] `bin/install.sh --check` reports `design-sign-off/` resolves under both `.agents/skills/` and (post-swap) `~/.agents/skills/`.
- [ ] `~/.dsh/skills/design-signoff` (or whichever runtime mirror the host uses) is a symlink to `~/.agents/skills/design-sign-off/`, with no path collisions against `handoff`, `claude-handoff`, or `impeccable`.
- [ ] If `install.sh` had to be edited, that change ships as its own ADR and commit — not bundled with the deploy.
- [ ] A smoke `impeccable --version` from `.agents/skills/impeccable/scripts/impeccable` still returns 4.x (no regression from the install migration).

## Out of scope

- The ADR that authorises the symlink swap (if not yet written). If that ADR isn't accepted, this ticket pauses on it.
- ADR-0003 (`handoff` / `claude-handoff` consolidation).

## Answer

(work here when resolved; set Status to `resolved`)
