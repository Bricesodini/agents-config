# Runtime contract

The model and its harness are separate. A model name such as DeepSeek does not
specify filesystem, subprocess, delegation or permission capabilities. Discover
the current host's documented tools; never guess APIs from a product name.

Before mutation, establish these capabilities and record their actual mapping:

| Need | Acceptable mechanism |
| --- | --- |
| Read skills, spec and source | Host file tools or filesystem access |
| Isolate changes and run checks | Git worktree or equivalent isolated checkout plus command execution |
| Delegate one ticket | Native subagent, or a documented child-agent process with fresh context and explicit working directory |
| Independent review | Two fresh reviewer contexts, separate from the implementer, given the same frozen candidate |
| Wait, stop and recover | Observe completion, stop writers, collect outputs and persist state |
| Human handoff | Current conversation plus durable files accessible on resume |
| Execution horizon / run budget | Host-reported rounds, duration, token, child-agent or other measurable run limit |

Discover and record an execution horizon when the host exposes one. In the
ledger, record `source: host` with the reported value, or `source: fallback` and
`value: unknown` when no measurable horizon is exposed. Never infer a limit from
a model or product name, and keep host-specific thresholds out of this portable
skill. For an unknown horizon, use the bounded tranche fallback in
[execution](execution.md). Never assume one agent session will survive the whole
approved batch.

Use installed mechanisms within existing permissions. Matt's review runs its two
axes in parallel; use that when supported. If the host supports only one child at
a time, run the two independent reviewer contexts sequentially and record this
scheduling adaptation. Preserve both review scopes and reports. A role-play in the
implementer's context is not independent review. If fresh child contexts are
unavailable, report the missing capability before implementation; do not silently
lower the acceptance bar. Release idle workers when the host requires this to make
room for reviewers. Reviewer assignments are read-only; verify candidate integrity.

Skill names refer to instruction files, not a mandatory slash-command API. Read
the dependency and its required references, then assign its stages explicitly.
UI metadata under `agents/` is optional; the protocol depends on Markdown, Git,
checks and the available delegation mechanism, not Codex-specific goals or tools.

Pi supports skill folders, but delegation depends on an installed extension or
child-process integration; skill discovery alone does not establish execution
readiness. For another harness, register this whole folder in its documented skill
location or explicitly load `SKILL.md` with its relative references. Install Matt's
required skills there too. Do not auto-install plugins or alter global agent
settings merely to satisfy this run.

The ledger is portable task data: Markdown plus optional JSON, outside disposable
worktrees. When changing hosts, transfer the ledger and all relevant repository
state, including uncommitted work and local branches. Verify actual state before
resume; neither a saved chat nor a ledger alone transfers code. Scheduled wakeups
and background execution require separately configured host support.
