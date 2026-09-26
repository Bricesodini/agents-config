# AGENTS.md — agents-config (maintainer guide)

This file is for the **maintainer** of this repo. It is **not** the AGENTS.md that runtime agents read. That one lives at `.agents/AGENTS.md` and is what `bin/install.sh` deploys to `~/.agents/AGENTS.md` (which DSH then auto-propagates to `~/.dsh/AGENTS.md`).

## Intent

This repo is a portable kit of agent skills + ADRs. Its job is to deploy across multiple agent harnesses (DSH, Claude Code, Codex, OpenCode, …) without any single harness owning the source of truth.

## Method

### Two-layer rule

The repo carries **two layers**, kept strictly separate:

- **Development layer** (repo root, `docs/adr/`, this AGENTS.md, `bin/`): design history, scripts, maintainer conventions. Versioned. Never reaches a runtime.
- **Deployment layer** (`.agents/`): skills, prompts, minimal runtime `AGENTS.md`. Versioned. Wired into `~/.agents/` via symlinks created by `bin/install.sh`.

A file's layer is decided by **its location**. If it should reach a runtime, it goes under `.agents/`. If it's about how this repo is built, it stays at the repo root.

### Adding a skill

1. Create the skill under `.agents/skills/<name>/SKILL.md`
2. Test locally by symlinking it: `ln -s "$(pwd)/.agents/skills/<name>" ~/.agents/skills/<name>`
3. Document any non-obvious decision in `docs/adr/`
4. Commit and push

### Changing a script

`bin/install.sh` is the only deployment path. Edit it, run it locally to verify, commit. ADRs document *why* a deployment choice was made, not *how* the script works.

## Subagents

Subagents receive a bounded task and only the context required to execute it.

They execute work; they do not redefine the methodology or independently orchestrate this repo.

## Documentation

Before guessing an API or version-dependent behavior, use the appropriate source:

- Skill format / hooks → read the skill's own SKILL.md first
- Harness behaviour (DSH vs Claude Code vs Codex) → check the harness's official docs, then ask
- Project history → `git log` / `gh`

Repository reality (`AGENTS.md`, `docs/`, code, scripts) takes precedence over generic documentation.

## Environment

Default development root: `~/02_dev`

Locally maintained agent tooling: `~/02_dev/AgentTooling`

This repo: `~/02_dev/agents-config`

Shared skills (post-install): `~/.agents/skills` — symlinks to `.agents/skills`

## Validation

Documentation informs; real tools validate.

- `git status` and `git diff` before every commit
- `./bin/install.sh --check` (if implemented) before pushing changes to `bin/`
- Smoke test Impeccable after touching `.agents/skills/impeccable/`: `./.agents/skills/impeccable/scripts/impeccable --version`

Never claim success without running the relevant validation when available.

If a material product, architecture, or scope decision is unresolved, surface it rather than silently inventing a decision.