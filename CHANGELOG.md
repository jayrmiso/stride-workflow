# Changelog

All notable Stride Workflow changes are documented here.

Stride Workflow uses GitHub releases for every published update. Each release should have:

- a version tag
- release notes
- changelog entry
- install command
- upgrade notes when behavior changes

## [0.1.0] - 2026-06-28

Initial release.

### Added

- Added the `stride-workflow` CLI with `init`, `doctor`, `status`, `version`, and command instruction output.
- Added the Codex-first `.stride/` workflow installer.
- Added core chat commands: `$stride touch`, `$stride frame`, `$stride carry`, `$stride land`, `$stride review`, `$stride mend`, and `$stride status`.
- Added `$stride kit ui` for frontend consistency, screenshot-inspired UI work, reusable components, tokens, and careful migration.
- Added worktree, previewer, and handoff phases so manual testing happens from the right checkout with a clear checklist.
- Added `AGENTS.md` generation as the Codex bridge.
- Added README documentation and the Stride Workflow diagram.
- Added a technical overview doc and a release process doc.

### Current Boundary

- This version is instruction-driven. It installs workflow files and command docs for Codex.
- Future versions can make worktree creation, preview startup, PR creation, and cleanup executable from the CLI.
