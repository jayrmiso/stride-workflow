# Technical Overview

Stride Workflow is the repo-local workflow layer behind the `$stride ...` commands.

## Public Commands

Chat commands:

```text
$stride touch <small change>
$stride frame <task>
$stride carry
$stride land
$stride kit ui [from reference]
$stride review
$stride mend <issue>
$stride status
$stride workers
```

CLI commands:

```bash
stride-workflow init [path] [--force] [--no-codex] [--yes]
stride-workflow command <touch|frame|carry|land|kit|review|mend|status|workers>
stride-workflow <touch|frame|carry|land|kit|review|mend|status|workers>
stride-workflow worktree <create|status|assert|cleanup> [slug-or-path]
stride-workflow workers [path]
stride-workflow subject [path]
stride-workflow status [path]
stride-workflow doctor [path]
stride-workflow version
```

When `init` runs against an existing Stride install, it shows a Stride changelog summary for newer versions before asking to update.

## Internal Phases

- `intake`: request interpreter
- `probe`: repo explorer
- `framer`: spec writer
- `builder`: implementation engineer
- `checker`: verification runner
- `debugger`: failure investigator
- `reviewer`: behavioral reviewer
- `fixer`: review-response implementer
- `worktree`: isolated branch/worktree manager
- `previewer`: manual-test server manager
- `handoff`: manual-test guide
- `ui-auditor`: frontend consistency mapper
- `reference-reader`: screenshot/reference interpreter
- `kit-designer`: component and token designer
- `migrator`: repeated UI replacement implementer
- `ledger`: durable memory keeper

## Core Flows

Tiny change:

```text
$stride touch <small change>
```

Touch skips the frame/spec step only. It still uses the same worktree, checks, reviewer-worker, preview when useful, handoff, and ledger flow as carry.
Even tiny changes use a Stride worktree so the edited checkout stays isolated.
Installed repos also get a repo-local runner:

```bash
node .stride/bin/stride-workflow.mjs <command>
```

`node .stride/bin/stride-workflow.mjs worktree create <task-slug>` creates or reuses `.stride/worktrees/<task-slug>`.
The printed runner command's `worktree assert <active-worktree-path>` must pass before Codex edits files.
The printed runner command's `worktree cleanup <path>` removes a Stride worktree after merge or explicit cleanup approval.

If the repo-local runner is missing or fails, Stride should stop and ask for an update. It should not fall back to raw `git worktree` commands.

Normal feature:

```text
$stride frame <task>
$stride carry
manual test the preview URL
$stride land
```

Frontend consistency:

```text
$stride kit ui
$stride kit ui from screenshot.png
```

Bug after manual testing:

```text
$stride mend <issue>
```

## What Gets Installed

```text
.stride/
  bin/
    stride-workflow.mjs
  commands/
  phases/
  config.md
  ledger.md
.agents/
  skills/
.codex/
  agents/
    stride-reviewer.toml
AGENTS.md
```

`AGENTS.md` tells Codex to route `$stride ...` chat commands through the `.stride/` files.

`.codex/agents/stride-reviewer.toml` is the default worker used by touch, carry, and land to review the scoped diff without giving the worker write access.

## Token Posture

Default Stride is intentionally lighter than a full multi-agent pipeline: the main chat builds, and one read-only reviewer worker checks the scoped diff. Broader discovery or debugging should escalate through `balance` or `heavy` only when the task justifies the token cost.

## Diagram

![Stride Workflow diagram](stride-flow.svg)
