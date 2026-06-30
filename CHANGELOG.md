# Changelog

All notable Stride Workflow changes are documented here.

Stride Workflow uses GitHub releases for every published update. Each release should have:

- a version tag
- release notes
- changelog entry
- install command
- upgrade notes when behavior changes

## [1.0.33] - 2026-06-30

### Changed

- Clarified that the UI auditor must resolve Playwright from Stride’s own installation, not from the application checkout being audited.
- Kept app env inheritance separate from Playwright resolution so local testing can source repo env without confusing the worker’s browser toolchain.
- Applied the same rule to the UI auditor skill, agent manifest, and phase docs so the worker boundary stays consistent after install.

## [1.0.32] - 2026-06-30

### Changed

- Clarified that local preview and UI-audit runs can source env files from the parent checkout or repo root when the active worktree does not carry them.
- Updated the worktree, previewer, UI auditor, and config docs so local test runs can inherit env from the surrounding repo without copying secrets into the worktree.
- Kept the instruction focused on local testing only; this does not change how published releases package env files.

## [1.0.31] - 2026-06-30

### Changed

- Restored the bundled Chromium browser requirement for the UI auditor so the workflow stays on a single browser path instead of switching to system Chrome.
- Added a package `postinstall` step that installs Chromium automatically through Playwright, which keeps the visual-audit path ready after `npm install` without requiring manual browser setup.
- Removed the explicit browser-install steps from the GitHub validate and publish workflows because the package install now handles the Chromium download.

## [1.0.30] - 2026-06-30

### Changed

- Added an explicit milestone checklist to the public workflow docs so the active run can show a simple `Task` flow instead of hiding progress inside prose.
- Clarified that the checklist is dynamic and mirrors the current run phases, such as `spec`, `impl`, `review`, `preview`, and `land`, rather than using fixed example steps.
- Updated the README, technical overview, handoff guidance, status guidance, and flow diagram to surface the milestone checklist consistently.

## [1.0.29] - 2026-06-30

### Changed

- Clarified that extra builders are for separate independent slices of work, not for replacing a worker that is still running on the same scope.
- Tightened the orchestrator rules so the main chat waits for an active worker to finish instead of reassigning the same slice early.
- Updated the generated bridge and worker guidance to say that a second worker is only appropriate when the work can actually be split cleanly.

## [1.0.28] - 2026-06-30

### Changed

- Tightened the runtime handoff so once a builder owns a scope, the main chat cannot resume code edits, preview tweaks, or last-mile fixes for that same scope.
- Clarified that if a scope still needs implementation after the builder pass, the work should be handed to another builder worker instead of reclaiming the write path in the orchestrator.
- Updated the GitHub validation and publish workflows to install dependencies on Node 24 before running the smoke and install checks, so Playwright-backed auditing is available during CI.

## [1.0.18] - 2026-06-30

### Changed

- Added `strideuiauditor` as a read-only visual auditor worker for user-facing or layout-sensitive changes.
- Wired visual changes to run the UI auditor before preview and handoff, so the workflow can catch cramped or ugly layouts before land.
- Made `strideuiauditor` use Playwright against the live app when a preview URL or local route is available.
- Updated the kit flow to include a final Playwright-backed visual audit pass.
- Clarified that builder and reviewer should apply OOP, SOLID, clean architecture, and clean code principles when they help the result, without forcing unnecessary abstraction.

## [1.0.19] - 2026-06-30

### Changed

- Made `strideuiauditor` Playwright-only for live UI checks.
- Tightened the preview and handoff flow so the run record must include what changed and what the user should manually verify next.
- Clarified the previewer and handoff phases so user-facing work records the live route, change summary, and concrete manual-check items.

## [1.0.20] - 2026-06-30

### Added

- Added `stride-workflow refresh` to remove managed Stride files first and reinstall the current release cleanly.

### Changed

- Updated the installer docs so refresh is the explicit clean reinstall path while `init` remains the normal update path.

## [1.0.21] - 2026-06-30

### Changed

- Tightened the worker contract so visual verification stays inside `strideuiauditor` and previewer flow instead of moving back into the main chat.
- Made the UI auditor and handoff phases return blocked when Playwright-backed verification cannot run, rather than inventing a manual fallback in the orchestrator.
- Clarified the manual-test handoff so it always records the live route, change summary, and concrete check list when a preview exists.

## [1.0.22] - 2026-06-30

### Changed

- Added `playwright` as a Stride dependency so the UI auditor has a bundled Playwright runtime available.
- Made `stride-workflow doctor` report a missing Playwright dependency as a blocking install problem.
- Documented that visual auditing depends on the bundled Playwright path instead of an external browser fallback.

## [1.0.23] - 2026-06-30

### Changed

- Made `stride-workflow doctor` verify both the Playwright package and the Chromium browser binary.
- Installed Playwright Chromium in the local package so the bundled visual-audit path is runnable.

## [1.0.24] - 2026-06-30

### Changed

- Made `stride-workflow init` print a Playwright status line after install so users can see whether the visual-audit path is ready.
- Kept the Playwright readiness check tied to the bundled dependency and Chromium binary.

## [1.0.25] - 2026-06-30

### Changed

- Clarified that auth-gated visual audits must use an authenticated Playwright context from the previewer or project docs.
- Made the ui auditor return blocked instead of guessing when Playwright is unavailable or when no authenticated context exists for a protected route.
- Propagated the auth-context requirement into previewer and handoff notes.

## [1.0.26] - 2026-06-30

### Changed

- Updated the generated Stride bridge so patch, impl, and land cannot finish without a handoff card that says what changed, what to verify in the running app, and the next command.
- Reinforced the final handoff summary in the workflow docs so the orchestrator ends with a concrete user-facing verification step.

## [1.0.27] - 2026-06-30

### Changed

- Clarified that the main chat is the brain, not the hands, and that multiple builders are preferred when that keeps the orchestrator out of the write path.
- Reinforced the token-aware worker guidance so split scopes should use more than one builder or reviewer instead of letting the orchestrator edit files.

## [1.0.17] - 2026-06-30

### Changed

- Clarified that the orchestrator must not take over if a builder or reviewer stalls.
- Allowed multiple builders or reviewers when a task naturally splits or the chosen mode justifies it.
- Tightened the worker selection docs so default mode is still one builder and one reviewer, but balance and heavy can scale out.

## [1.0.16] - 2026-06-30

### Changed

- Clarified `stridelead` as a read-only recon worker instead of a planning worker.
- Hardened the orchestrator boundary so the main chat stops writing once `stridebuilder` is spawned for a scope.
- Updated the public technical overview and README to reflect the split between builder, reviewer, and recon workers.

## [1.0.15] - 2026-06-29

### Changed

- Renamed the primary flow to `$stride spec`, `$stride impl`, and `$stride patch`.
- Renamed installed command skills to no-dash names such as `stridespec`, `strideimpl`, and `stridepatch`.
- Made the default patch and impl flow require main-chat orchestration, a `stridebuilder` editing worker, and a `stridereviewer` review worker.
- Added optional `stridelead` for balance/heavy planning when extra architecture judgment is worth the token cost.
- Made init remove old managed dashed skills and old `frame`, `carry`, and `touch` command files during upgrade.

## [1.0.14] - 2026-06-29

### Changed

- Made `$stride patch` use the same worktree, checks, reviewer-worker, fixer, preview, handoff, and ledger flow as `$stride impl`.
- Clarified that patch skips spec only; it does not skip review.
- Updated worker guidance so patch, impl, and land all use the default reviewer worker unless a stronger mode is justified.

## [1.0.13] - 2026-06-29

### Changed

- Installed a repo-local Stride runner at `.stride/bin/stride-workflow.mjs` so Codex does not depend on a global `stride-workflow` binary being on PATH.
- Updated Stride commands and skills to stop when the Stride runner is missing or fails instead of falling back to raw `git worktree` commands.
- Made worktree status print the exact Stride runner command to reuse for later assertions from the active worktree.

## [1.0.12] - 2026-06-29

### Changed

- Added executable `stride-workflow worktree create`, `worktree status`, `worktree assert`, and `worktree cleanup` commands so Stride can prove work is happening away from `main` or `master` and clean up safely after merge.
- Updated impl, patch, land, skills, and the Codex bridge to require worktree assertion before edits or commits.
- Strengthened the default reviewer worker with focused review passes and blocking/minor triage while keeping the default token posture to one reviewer worker.
- Made `doctor` report installed-version drift instead of only checking for missing files.

## [1.0.11] - 2026-06-29

### Changed

- Added the `stridereviewer` Codex agent template so default worker mode installs a real reviewer worker.
- Strengthened impl and land so they announce phases, require the worktree before editing or landing, and run reviewer-worker review before handoff or commit.
- Tightened patch so even tiny edits announce phases and stop instead of editing from `main` or `master`.

## [1.0.10] - 2026-06-29

### Changed

- Made `$stride patch` always create or reuse a Stride worktree, even for tiny changes.

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

- Added `stride-workflow subject` to derive a conventional commit subject from the active spec and handoff.
- Made `$stride land` and the land skill point at the derived subject flow.

## [1.0.4] - 2026-06-29

### Changed

- Made `stride-workflow init` refresh existing managed `.stride` and `.agents` files so already-installed Stride setups can update in place.

## [1.0.3] - 2026-06-29

### Changed

- Made `$stride land` prefer conventional commit subjects and surface a suggested commit subject in the handoff card.

## [1.0.2] - 2026-06-29

### Changed

- Split the Codex skill install into multiple Stride skills so the `$` picker can surface command-specific actions like `stride-spec` and `stride-impl`.

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
- Added core chat commands: `$stride patch`, `$stride spec`, `$stride impl`, `$stride land`, `$stride review`, `$stride mend`, and `$stride status`.
- Added `$stride kit ui` for frontend consistency, screenshot-inspired UI work, reusable components, tokens, and careful migration.
- Added worktree, previewer, and handoff phases so manual testing happens from the right checkout with a clear checklist.
- Added `AGENTS.md` generation as the Codex bridge.
- Added README documentation and the Stride Workflow diagram.
- Added a technical overview doc and a release process doc.

### Current Boundary

- This version is instruction-driven. It installs workflow files and command docs for Codex.
- Future versions can make worktree creation, preview startup, PR creation, and cleanup executable from the CLI.
