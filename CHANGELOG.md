# Changelog

All notable Stride Workflow changes are documented here.

Stride Workflow uses GitHub releases for every published update. Each release should have:

- a version tag
- release notes
- changelog entry
- install command
- upgrade notes when behavior changes

## [0.1.2] - 2026-06-28

Naming release.

### Changed

- Renamed the official project/package language to `stride-workflow` / Stride Workflow.
- Renamed the CLI binary from `stride` to `stride-workflow`.
- Kept Codex chat commands as `$stride ...`.
- Updated install commands and repository metadata for `github:jayrmiso/stride-workflow`.

### Added

- Added GitHub Actions validation for CLI syntax, smoke tests, package dry run, and install doctor.
- Added a manual publish workflow that tags and creates GitHub releases from `CHANGELOG.md`.

## [0.1.1] - 2026-06-28

Documentation release.

### Added

- Added a proper project README with workflow examples, install instructions, command overview, and manual-test handoff explanation.
- Added `docs/stride-flow.svg` as the README flow diagram.
- Added `CHANGELOG.md`.
- Added `docs/release-process.md` to require release notes and changelog updates for future published changes.

## [0.1.0] - 2026-06-28

First public Stride Workflow release.

### Added

- Added the `stride` CLI with `init`, `doctor`, `status`, `version`, and command instruction output.
- Added the Codex-first `.stride/` workflow installer.
- Added core chat commands: `$stride touch`, `$stride frame`, `$stride carry`, `$stride land`, `$stride review`, `$stride mend`, and `$stride status`.
- Added `$stride kit ui` for frontend consistency, screenshot-inspired UI work, reusable components, tokens, and careful migration.
- Added worktree, previewer, and handoff phases so manual testing happens from the right checkout with a clear checklist.
- Added `AGENTS.md` generation as the Codex bridge.
- Added README documentation and the Stride Workflow diagram.

### Current Boundary

- This version is instruction-driven. It installs workflow files and command docs for Codex.
- Future versions can make worktree creation, preview startup, PR creation, and cleanup executable from the CLI.
