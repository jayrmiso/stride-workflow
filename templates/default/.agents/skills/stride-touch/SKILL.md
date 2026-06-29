---
name: stride-touch
description: Stride Workflow skill for small changes. Use when the user wants to skip framing/spec but still run the normal worktree, check, reviewer, and handoff flow.
---

# Stride Touch

Use this skill for small changes that should skip frame/spec but still use the normal carry-style execution and review flow.

## Use when

- The user wants a small, low-risk tweak.
- The change is simple enough to avoid a larger spec.
- The task should skip frame/spec but still get worktree, checks, reviewer, preview when useful, and handoff.

## Do

- Keep the scope narrow.
- Use the user request as the approved scope; if scope is unclear or broader than a touch, stop and ask for `$stride frame`.
- Use the reviewer worker as the default worker mode before editing.
- Make the smallest safe change.
- Use the repo-local Stride runner: `node .stride/bin/stride-workflow.mjs`.
- If the Stride runner is missing or fails, stop and ask the user to update Stride. Do not fall back to raw `git worktree` commands.
- Run the Stride runner's `worktree create <task-slug>` even when the change is tiny.
- Run the Stride runner's `worktree assert <active-worktree-path>` before editing.
- Announce each Stride phase before doing it.
- Spawn or use `stride-reviewer` against the scoped diff before handoff.
- Treat missing worktree or missing reviewer worker as a workflow limitation that must be reported.
- Stop and report a workflow error instead of editing from `main` or `master`.
- Update the ledger only if the result matters later.
- Avoid spinning up a heavier workflow unless needed.
