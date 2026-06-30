# Technical Overview

Stride Workflow is the repo-local workflow layer behind the `$stride ...` commands.

## Public Commands

Chat commands:

```text
$stride patch <small change>
$stride spec <task>
$stride impl
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
stride-workflow refresh [path] [--no-codex] [--yes]
stride-workflow command <patch|spec|impl|land|kit|review|mend|status|workers>
stride-workflow <patch|spec|impl|land|kit|review|mend|status|workers>
stride-workflow worktree <create|status|assert|cleanup> [slug-or-path]
stride-workflow workers [path]
stride-workflow subject [path]
stride-workflow status [path]
stride-workflow doctor [path]
stride-workflow version
```

When `init` runs against an existing Stride install, it shows a Stride changelog summary for newer versions before asking to update.
Use `refresh` when you want to remove the managed Stride files first and reinstall the current release cleanly.

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
- `ui-auditor`: frontend consistency mapper and visual quality checker
- `reference-reader`: screenshot/reference interpreter
- `kit-designer`: component and token designer
- `migrator`: repeated UI replacement implementer
- `ledger`: durable memory keeper

## Core Flows

Tiny change:

```text
$stride patch <small change>
```

Patch skips the spec step only. It still uses the same worktree, builder-worker, checks, reviewer-worker, preview when useful, handoff, and ledger flow as impl.
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
$stride spec <task>
$stride impl
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
    stridebuilder.toml
    stridelead.toml
    strideuiauditor.toml
    stridereviewer.toml
AGENTS.md
```

`AGENTS.md` tells Codex to route `$stride ...` chat commands through the `.stride/` files.

`.codex/agents/stridebuilder.toml` is the default editing worker used by patch and impl.
`.codex/agents/stridereviewer.toml` is the default review worker used by patch, impl, and land to review the scoped diff without giving the worker write access.
`.codex/agents/stridelead.toml` is optional for balance/heavy read-only recon when scope or risk needs more repo facts.
`.codex/agents/strideuiauditor.toml` is the optional visual auditor used for user-facing or layout-sensitive work. It should inspect the live UI with Playwright when a preview URL or local route is available.

## Token Posture

Default Stride uses a small worker loop: the main chat orchestrates, `stridebuilder` edits, and `stridereviewer` checks the scoped diff. If a task naturally splits, balance or heavy mode may use multiple builder or reviewer workers, but the main chat still does not take over writes or reviews. Broader recon, discovery, or debugging should escalate through `balance` or `heavy` only when the task justifies the token cost.

## Diagram

![Stride Workflow diagram](stride-flow.svg)
