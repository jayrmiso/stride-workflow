# Stride Ledger

This file records durable project knowledge discovered while using Stride.

## Current State

- Workspace initialized with the first Stride concept and command skeleton.
- Worktree, previewer, handoff, touch, and land flow added to support manual testing and publishing.
- `kit ui` added for screenshot-inspired frontend work, UI consistency audits, reusable components, tokens, and careful migration.
- No project-specific app code has been added yet.

## Decisions

- Stride is a frame-and-carry workflow, not a named-agent orchestration system.
- Token use should be value-aware, not merely minimized.
- The first prototype is file-based so the behavior can mature before adding CLI tooling.

## Open Questions

- Final name.
- Whether to integrate with RAC later, build a small standalone CLI, or keep it as Codex-native files.
- Core lifecycle is `$stride touch` for tiny changes or `$stride frame` -> `$stride carry` -> manual test -> `$stride land` for larger work.
- Frontend systemization uses `$stride kit ui`.
