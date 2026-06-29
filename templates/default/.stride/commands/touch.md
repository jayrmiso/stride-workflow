# Touch Command

User call:

```text
$stride touch <small change>
```

Purpose: make a small change without paying the frame/spec cost.

Internal flow:

```text
workers(default) -> worktree -> capture touch request -> light probe -> builder -> checker -> debugger if needed -> reviewer -> fixer if needed -> checker again -> previewer if user-facing -> handoff -> ledger -> final report
```

Use this for copy tweaks, color changes, spacing fixes, small renames, and other low-risk edits.

Rules:

- Do not write a full frame unless the change turns out to be broader than expected.
- Use the user request as the approved scope. If the scope is unclear or broader than a touch, stop and ask for `$stride frame`.
- Choose the default worker mode before editing unless the task clearly needs balance or heavy mode.
- Keep the edit local.
- Use the repo-local Stride runner: `node .stride/bin/stride-workflow.mjs`.
- If the Stride runner is missing or fails, stop and ask the user to update Stride. Do not fall back to raw `git worktree` commands.
- Always create or reuse a Stride worktree with `node .stride/bin/stride-workflow.mjs worktree create <task-slug>`, even for tiny changes.
- Continue all repo reads, edits, checks, and preview commands from the printed active worktree path.
- Run the printed Stride runner's `worktree assert <active-worktree-path>` before editing; stop if it fails.
- Announce each phase before starting it: `workers`, `worktree`, `probe`, `builder`, `checker`, `reviewer`, `handoff`.
- Stop and report a workflow error instead of editing from `main` or `master`.
- Re-check relevant files inside the worktree before changing them.
- Make one coherent implementation pass.
- Run the most relevant checks.
- Spawn or use the `stride-reviewer` worker to review the scoped diff for behavior, contracts, states, and missing tests.
- If the reviewer worker is unavailable, say that explicitly and perform a local review with the same output shape.
- Treat any `[blocking]` reviewer finding as mandatory: fix it once, re-run relevant checks, and re-review.
- If the change is visual, start the preview from the edited checkout and write `.stride/runs/current.md`.
- Write `.stride/runs/current.md` with the manual-test URL, what changed, what to check, passed commands, reviewer result, and next command.
- Update `.stride/ledger.md` with durable facts.
