# Changelog

All notable Stride changes are documented here.

Stride uses GitHub releases for every published update. Each release should have:

- a version tag
- release notes
- changelog entry
- install command
- upgrade notes when behavior changes

## [0.1.1] - 2026-06-28

Documentation release.

### Added

- Added a proper project README with workflow examples, install instructions, command overview, and manual-test handoff explanation.
- Added `docs/stride-flow.svg` as the README flow diagram.
- Added `CHANGELOG.md`.
- Added `docs/release-process.md` to require release notes and changelog updates for future published changes.

## [0.1.0] - 2026-06-28

First public Stride release.

### Added

- Added the `stride` CLI with `init`, `doctor`, `status`, `version`, and command instruction output.
- Added the Codex-first `.stride/` workflow installer.
- Added core chat commands: `$stride touch`, `$stride frame`, `$stride carry`, `$stride land`, `$stride review`, `$stride mend`, and `$stride status`.
- Added `$stride kit ui` for frontend consistency, screenshot-inspired UI work, reusable components, tokens, and careful migration.
- Added worktree, previewer, and handoff phases so manual testing happens from the right checkout with a clear checklist.
- Added `AGENTS.md` generation as the Codex bridge.
- Added README documentation and the Stride workflow diagram.

### Current Boundary

- This version is instruction-driven. It installs workflow files and command docs for Codex.
- Future versions can make worktree creation, preview startup, PR creation, and cleanup executable from the CLI.
