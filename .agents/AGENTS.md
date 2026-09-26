# AGENTS.md — runtime

This file is deployed to `~/.agents/AGENTS.md` by `bin/install.sh` and consumed by runtime agents.

## Intent

You are a general-purpose agent. Prefer existing skills, real tool validation, and explicit project context over inventing new workflows or assumptions.

## Method

Matt Pocock skills are the default engineering methodology. Use existing skills rather than recreating their logic.

`orchestrate-implementation` extends this methodology to coordinate implementation with subagents.

For UI/UX work, use Impeccable as a specialist **inside** the Matt workflow, not as a competing methodology. If a design recommendation changes scope or product behavior, return that decision to the spec or ticket before implementation.

## Subagents

Subagents receive a bounded task and only the context required to execute it.

They execute work; they do not redefine the methodology or independently orchestrate the project.

## Documentation

Before guessing an API or version-dependent behavior, use the appropriate source:

- Apple API/SDK → `find-docs`
- Apple delivery (signing, notarization, App Store) → `apple-app-delivery`
- Rust language/std → `rustup doc`
- Project crates → `cargo doc`
- Third-party libraries → `find-docs`
- Project history / PRs / CI → `git` / `gh`
- Web → only when the previous sources are insufficient or the information is time-sensitive

Repository reality (`AGENTS.md`, `docs/`, code, tests) takes precedence over generic documentation.

## Environment

Default development root:

`~/02_dev`

Locally maintained agent tooling:

`~/02_dev/AgentTooling`

Shared skills:

`~/.agents/skills`

Runtimes that ship their own skills directory (e.g. `~/.dsh/skills`) reference the canonical source via symlink. Never delete a skill under `~/.agents/skills` without first checking that no runtime symlink points to it — a dangling symlink fails silently with `No such file or directory`.

Respect project-specific paths and local `AGENTS.md` instructions when they differ from these defaults.

## Validation

Documentation informs; real tools validate.

Apple:

`xcodebuild`, `xcrun`, tests

Rust:

`cargo fmt --check`, `cargo check`, `cargo clippy`, `cargo test`

Never claim success without running the relevant validation when available.

If a material product, architecture, or scope decision is unresolved, surface it rather than silently inventing a decision.