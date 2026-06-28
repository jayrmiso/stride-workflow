# Codex Workflow Concept

Name: Stride Workflow

Stride Workflow is a Codex-first workflow system for people who want real progress in a repo without turning every task into a heavyweight committee. It is inspired by structured agent workflows, but its core idea is different: the assistant should adapt its depth to the task instead of always running the same ritual.

## Product Philosophy

The workflow should feel like a strong pair programmer:

- It starts by understanding the actual repo and the user's goal.
- It produces durable artifacts only when they help future work.
- It implements once there is enough confidence.
- It reviews risky changes without pretending every change needs a full audit.
- It explains the state of the work in concrete terms: files changed, commands run, blockers, branch status, and what is actually complete.

The goal is not to minimize tokens at all costs. The goal is to spend tokens where they create useful certainty.

## Core Mechanic

The main user loop is:

1. `$stride frame <task>`
2. approval
3. `$stride carry`
4. manual test
5. `$stride land`

Tiny changes can use:

```text
$stride touch <small change>
```

Frontend consistency and screenshot-inspired design work can use:

```text
$stride kit ui
```

The internal loop is:

1. `intake`
2. `probe`
3. `frame`
4. `carry`
5. `check`
6. `review`
7. `preview`
8. `handoff`
9. `ledger`

### Frame Command

The assistant turns the user's request into an approved work frame:

- goal
- likely files or systems involved
- risk level
- expected output
- whether code changes are implied

For tiny tasks, this can be one sentence. For larger tasks, it becomes a concrete spec.

Tiny tasks can also skip frame entirely through `$stride touch`.

### Probe

The assistant gathers only the context needed for the risk level.

Low-risk examples:

- read the touched file
- inspect nearby tests
- check package scripts

Medium-risk examples:

- inspect related routes/components/services
- check existing patterns
- identify contracts and data shapes

High-risk examples:

- inspect architecture docs
- map call chains
- create a milestone plan
- isolate work in a branch or worktree

### Carry Command

The assistant implements the smallest coherent unit of approved progress.

It should create or reuse the active Stride Workflow worktree, avoid splitting work into artificial subagents unless the task truly benefits from parallel exploration, and end with a manual-test handoff.

### Check

The assistant verifies the work using the repo's real commands.

Checks scale with risk:

- syntax check for small text/code edits
- targeted tests for narrow behavior
- build plus targeted tests for app-level changes
- review checklist for high-risk behavior or public contracts

### Ledger

The assistant closes the loop with a compact state report:

- what changed
- what passed
- what is incomplete
- exact next action if work should continue

The ledger is designed to survive context resets.

### Preview And Handoff

For user-facing work, Stride Workflow starts the app from the active worktree and gives the user the correct URL for manual testing.

The handoff card records:

- active worktree and branch
- preview URL
- what changed
- what to manually check
- checks that passed
- next command

## Commands

Stride Workflow uses user commands backed by internal phases.

### `$stride frame`

For turning a task into an approved spec.

- intake
- probe
- produce frame/spec
- stop for approval

### `$stride carry`

For implementing an approved frame.

- worktree
- load frame
- light probe
- build
- check
- debug if needed
- review
- fix if needed
- preview if user-facing
- handoff
- ledger
- final report

### `$stride touch`

For tiny changes where a full frame is wasteful.

- quick probe
- edit
- light check
- preview if user-facing
- handoff

### `$stride land`

For publishing manually approved work.

- confirm active run
- commit
- push
- create PR
- merge when approved
- clean up worktree

### `$stride kit ui`

For turning inconsistent or reference-driven frontend work into a reusable local UI kit.

- audit existing UI
- read screenshot/reference if provided
- propose components and tokens
- build the smallest useful kit
- migrate repeated UI carefully
- preview
- handoff with manual comparison checklist

### `$stride review`

For review-only work.

### `$stride mend`

For debugging broken behavior.

### Review

For risky changes, PRs, or user-requested review.

- findings first
- file and line references
- bugs and regressions over style
- missing tests called out explicitly

### `$stride status`

For reading the current ledger and active frame.

## Token Strategy

Stride Workflow should be token-aware without being timid.

Rules:

- Prefer current repo evidence over generic explanation.
- Do not spawn a reviewer for every small edit.
- Do not re-read files already inspected unless they changed or the task shifted.
- Summarize discovered facts into the ledger so later steps can reuse them.
- Escalate depth only when uncertainty or blast radius justifies it.
- Stop after one review-fix loop unless a concrete blocker remains.

This keeps the main functionality: structured planning, real implementation, verification, review, and memory. It removes forced ceremony.

## What Makes This Original

Stride Workflow is not built around named agents. It is built around adaptive depth.

The unit of work is not "send this to planner, engineer, reviewer." The unit of work is "how much certainty does this task need before we move?"

That gives us room to add features later:

- repo memory ledger
- task board generation
- local branch/worktree policy
- project-specific playbooks
- cost/depth estimates before starting
- command overrides like `$stride touch`, `$stride kit ui`, `$stride mend`, `$stride review`, or `$stride status`

## First Prototype

The first version can be a file-based workflow pack:

- `.stride/config.md`
- `.stride/commands/frame.md`
- `.stride/commands/carry.md`
- `.stride/commands/touch.md`
- `.stride/commands/land.md`
- `.stride/commands/kit.md`
- `.stride/phases/probe.md`
- `.stride/phases/reviewer.md`
- `.stride/phases/ui-auditor.md`
- `.stride/phases/reference-reader.md`
- `.stride/phases/kit-designer.md`
- `.stride/phases/migrator.md`
- `.stride/phases/previewer.md`
- `.stride/phases/handoff.md`
- `.stride/ledger.md`

No custom CLI is required at the start. We can make the behavior useful before we make the tooling fancy.
