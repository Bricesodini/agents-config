# 0001 — Vendor runtime skills into the repo

We copied the 55 skills under `~/.agents/skills/` and the `.skill-lock.json` manifest into `.agents/` so the deployment layer is reproducible from a fresh clone, not from a hand-curated `~/.agents/`. Vendoring is the first half of the migration; the second half — replacing `~/.agents/skills/` with a symlink to `.agents/skills/` — is deferred to a separate ADR because it disrupts the live install.

## Status

accepted

## Context

Before this ADR the deployment layer (`.agents/skills/`, `.agents/prompts/`, `.agents/.skill-lock.json`) was empty. The actual skills lived at `~/.agents/skills/` with no in-repo source of truth, and `bin/install.sh` would have failed on any fresh clone because the files it tries to symlink didn't exist in `.agents/`. The README also claimed "55 skills" under `.agents/skills/` when there were zero — a documentation lie waiting to bite.

## Decision

Copy (not move) the contents of `~/.agents/skills/` into `.agents/skills/`, and copy `~/.agents/.skill-lock.json` into `.agents/.skill-lock.json`. Commit both. Leave `~/.agents/skills/` untouched for now.

The next step — replacing `~/.agents/skills/` with a symlink to `.agents/skills/` so `bin/install.sh` becomes the canonical deployment path — is explicitly **not** part of this change. It will be a separate ADR with its own risk assessment.

## Consequences

- `bin/install.sh --check` will continue to fail on a fresh checkout until the symlink swap is done: it expects `~/.agents/skills/` and `~/.agents/.skill-lock.json` to be symlinks into the repo, and they aren't yet.
- The repo now contains ~55 vendored skills with provenance split between two sources:
  - 38 from `mattpocock/skills`
  - 1 from `vercel-labs/skills`
  - **16 with no provenance recorded in `.skill-lock.json`** (`apple-app-delivery`, `editplan-build`, `editplan-integrity`, `find-docs`, `gepeto`, `impeccable`, `obsidian-agentic-vault`, `orchestrate-implementation`, `pinokio`, `resolve-editorial-pilot`, `resolve-workflow`, `storymap-arcs`, `storymap-build`, `storymap-refine`, `storymap-review`, `storymap-segment`). These were installed outside the `npx skills` flow. Future work: record their upstream or mark them as locally-authored.
- Any local edits to skills under `~/.agents/skills/` are now also present in `.agents/skills/`, but the link between the two is by content equality, not by reference. Once the symlink swap lands, edits on either side will be visible on both.
- `.skill-lock.json` is committed and serves as the reproducibility manifest for the 39 locked skills. Until the 16 unlocked skills are documented, a fresh install from this repo will produce those 16 with no audit trail.
- `.DS_Store` files copied from the source are ignored by `.gitignore` and won't reach the commit.

## Considered Options

- **Audit every skill before vendoring** — rejected for this iteration. Adds hours, the audit itself needs an ADR per local edit, and the value is roughly the same as committing and auditing later from a known-good baseline.
- **Vendor as a git submodule per upstream** — rejected. Submodules don't compose with `bin/install.sh`'s symlink strategy, and we'd lose the ability to commit local edits alongside upstream updates.
