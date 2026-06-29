# Changelog

All notable Stride Workflow changes are documented here.

Stride Workflow uses GitHub releases for every published update. Each release should have:

- a version tag
- release notes
- changelog entry
- install command
- upgrade notes when behavior changes

## [1.0.9] - 2026-06-29

### Changed

- Refined the existing-install upgrade prompt to say when Stride is already current and the run is just refreshing installed files.

## [1.0.8] - 2026-06-29

### Changed

- Made `stride-workflow init` show a Stride changelog summary when upgrading an existing install, instead of listing file paths.
- Kept `--yes` for non-interactive upgrades.

## [1.0.7] - 2026-06-29

### Changed

- Made `stride-workflow init` show a summary of existing Stride changes and ask before updating an already-installed repo.
- Added `--yes` for non-interactive upgrades.

## [1.0.6] - 2026-06-29

### Changed

- Added a `workers` command and worker skill that makes the default mode use one reviewer worker while keeping the main thread as builder.
- Updated the CLI help and technical overview to include `workers`.

## [1.0.5] - 2026-06-29

### Changed

- Added `stride-workflow subject` to derive a conventional commit subject from the active frame and handoff.
- Made `$stride land` and the land skill point at the derived subject flow.

## [1.0.4] - 2026-06-29

### Changed

- Made `stride-workflow init` refresh existing managed `.stride` and `.agents` files so already-installed Stride setups can update in place.

## [1.0.3] - 2026-06-29

### Changed

- Made `$stride land` prefer conventional commit subjects and surface a suggested commit subject in the handoff card.

## [1.0.2] - 2026-06-29

### Changed

- Split the Codex skill install into multiple Stride skills so the `$` picker can surface command-specific actions like `stride-frame` and `stride-carry`.

## [1.0.1] - 2026-06-29

### Added

- Added a real Codex skill install so `\$stride` can surface in repo skill lists.
- Added `.agents/skills/stride/SKILL.md` to the init template.
- Made `stride-workflow init` append its `AGENTS.md` bridge instead of skipping existing files.

## [1.0.0] - 2026-06-28

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
