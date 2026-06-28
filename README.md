# Stride

Stride is a Codex-first workflow system for framing work before carrying it through.

The user-facing loop is:

```text
$stride frame <task>
$stride carry
manual test
$stride land
```

`frame` turns an idea into a concrete spec after inspecting the repo. `carry` creates or uses the Stride worktree, implements the accepted frame, checks it, reviews it, starts the correct preview, and writes a manual-test handoff. `land` publishes the approved work.

Tiny changes can skip the frame with:

```text
$stride touch <small change>
```

Frontend consistency and screenshot-inspired UI work can use:

```text
$stride kit ui
```

`kit ui` audits the existing frontend, studies reference screenshots when provided, proposes reusable components/tokens, migrates repeated UI carefully, and ends with a preview plus manual comparison checklist.

## Internal Phases

- `intake`: understands the user request
- `probe`: explores the repo for relevant facts
- `framer`: writes the approved work frame
- `builder`: implements the frame
- `checker`: runs real verification commands
- `debugger`: investigates failures
- `reviewer`: reviews behavior and regressions
- `fixer`: applies review fixes
- `ui-auditor`: finds repeated or inconsistent UI
- `reference-reader`: extracts layout, spacing, hierarchy, and interaction cues from screenshots
- `kit-designer`: proposes reusable components and tokens
- `migrator`: replaces repeated UI with shared components
- `worktree`: isolates carry work from main
- `previewer`: starts the app from the active worktree
- `handoff`: writes what changed and what to manually check
- `ledger`: records durable project knowledge

## Install Into A Project

From GitHub:

```bash
npx github:jayrmiso/stride init
```

From a local checkout:

```bash
node bin/stride.js init /path/to/project
```

That writes:

- `.stride/config.md`
- `.stride/ledger.md`
- `.stride/commands/*.md`
- `.stride/phases/*.md`
- `AGENTS.md`

`AGENTS.md` is the Codex bridge. It tells Codex to read the Stride files before substantial work.

## Commands

```bash
stride init [path] [--force] [--no-codex]
stride command <touch|frame|carry|land|kit|review|mend|status>
stride <touch|frame|carry|land|kit|review|mend|status>
stride status [path]
stride doctor [path]
stride version
```

`stride command carry` and `stride carry` both print the installed workflow instructions for that command. The actual implementation work happens in Codex after the user invokes the matching `$stride ...` command in chat.

## Workflow

Tiny change:

```text
$stride touch change the primary button color
```

Normal feature:

```text
$stride frame create a product details page
$stride carry
manual test the preview URL
$stride land
```

Frontend consistency:

```text
$stride kit ui from screenshot.png
```

Bug after manual testing:

```text
$stride mend the mobile title overlaps the button
```

## Release

First public version: `v0.1.0`.

## Current Target

Stride currently works best with Codex because Codex understands repo-local instruction files and can use the `.stride` ledger during real implementation work.

The CLI is intentionally separate from Codex, though. Later adapters can generate instructions for Claude, OpenCode, or other tools without changing the core workflow.
