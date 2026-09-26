# agents-config

Portable kit of agent skills + ADRs, designed to deploy across multiple agent harnesses (DSH, Claude Code, Codex, OpenCode, …).

## Two layers

This repo separates **development** from **deployment**:

| Layer | Lives at | Purpose |
|---|---|---|
| **Development** | repo root | AGENTS.md for maintainers, ADRs for design decisions, `docs/agents/` for Matt Pocock setup files, `bin/install.sh` |
| **Deployment** | `.agents/` | The portable kit: minimal `AGENTS.md` for runtimes, `skills/`, `prompts/`, `.skill-lock.json`. No ADRs. No design history. |

The development layer is where this repo's design lives and is versioned. The deployment layer is what runtimes actually consume — it stays minimal and contains nothing about how it was designed.

## Install

```bash
git clone git@github.com:Bricesodini/agents-config.git ~/02_dev/agents-config
cd ~/02_dev/agents-config
./bin/install.sh
```

`install.sh` creates the symlinks that wire the deployment layer into `~/.agents/`, then verifies each one resolves. If a symlink would dangle, the script fails fast.

## Layout

```
agents-config/
├── AGENTS.md              # guide for maintainers of this repo
├── README.md
├── .gitignore
├── docs/
│   ├── adr/               # design decisions (ADR-NNNN)
│   └── agents/            # Matt Pocock setup output (issue-tracker, domain, triage-labels)
├── bin/
│   └── install.sh         # deployment: clone → symlinks → verify
└── .agents/               # the portable kit (deployment layer)
    ├── AGENTS.md          # minimal runtime AGENTS.md
    ├── skills/            # 55 skills
    ├── prompts/
    └── .skill-lock.json
```

## Updating

Edit files under `.agents/` (skills, prompts, AGENTS.md) and commit. The next `install.sh` run on another machine picks up the change. Edit files outside `.agents/` (ADRs, this repo's AGENTS.md, scripts) — those stay development-only and never reach a runtime.