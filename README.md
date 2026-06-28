# Stride

Stride is a Codex-first workflow CLI for installing a repo-local development system. It gives Codex a small set of project commands, durable workflow files, and a manual-test handoff so work happens in the right checkout and ends in a clear state.

![Stride workflow diagram](docs/stride-flow.svg)

## Why Stride Exists

Large agent workflows can be powerful, but they can also spend too much context on ceremony. Stride keeps the useful parts: shape the work, isolate it, implement it, check it, preview it, let the human judge it, then land it.

Stride is built around a simple idea:

```text
frame the work -> carry it safely -> manually test -> land it
```

For tiny edits, Stride skips the full frame and uses `touch`.

## Install

Install Stride into the current project from GitHub:

```bash
npx github:jayrmiso/stride init
```

Install into a specific project:

```bash
npx github:jayrmiso/stride init /path/to/project
```

Verify the install:

```bash
npx github:jayrmiso/stride doctor /path/to/project
```

From a local checkout:

```bash
node bin/stride.js init /path/to/project
```

## What Gets Installed

```text
.stride/
  commands/
    touch.md
    frame.md
    carry.md
    land.md
    kit.md
    review.md
    mend.md
    status.md
  phases/
    intake.md
    probe.md
    framer.md
    builder.md
    checker.md
    debugger.md
    reviewer.md
    fixer.md
    worktree.md
    previewer.md
    handoff.md
    ui-auditor.md
    reference-reader.md
    kit-designer.md
    migrator.md
    ledger.md
  config.md
  ledger.md
AGENTS.md
```

`AGENTS.md` is the Codex bridge. It tells Codex to route `$stride ...` chat commands through the files in `.stride/`.

## Core Workflow

For normal feature work:

```text
$stride frame create a product details page
$stride carry
manual test the preview URL
$stride land
```

What happens internally:

```text
frame
  -> intake
  -> probe
  -> framer
  -> writes .stride/frames/current.md
  -> stops for approval

carry
  -> worktree
  -> light probe
  -> builder
  -> checker
  -> debugger if needed
  -> reviewer
  -> fixer if needed
  -> previewer
  -> handoff
  -> ledger

land
  -> verify active run
  -> commit
  -> push
  -> create PR
  -> merge when approved
  -> cleanup worktree
```

The handoff card lives at `.stride/runs/current.md`. It should include the active worktree, branch, preview URL, what changed, what to check manually, passed checks, risks, and next command.

## Tiny Changes

Use `touch` when a full frame would be wasteful:

```text
$stride touch change the primary button color
$stride touch fix the typo on the login page
$stride touch tighten the spacing in the settings cards
```

Internal flow:

```text
quick probe -> builder -> checker if useful -> previewer if user-facing -> handoff
```

## UI Kit Workflow

Use `kit ui` when the frontend is becoming inconsistent or when you want to adapt a screenshot/reference into your own app:

```text
$stride kit ui
$stride kit ui from screenshot.png
```

Internal flow:

```text
worktree
-> ui-auditor
-> reference-reader if provided
-> kit-designer
-> builder
-> migrator if needed
-> checker
-> previewer
-> handoff
```

`kit ui` should not blindly clone another app. It should translate the reference into layout, spacing, hierarchy, tokens, components, and interaction patterns that fit your product.

## Commands

CLI commands:

```bash
stride init [path] [--force] [--no-codex]
stride command <touch|frame|carry|land|kit|review|mend|status>
stride <touch|frame|carry|land|kit|review|mend|status>
stride status [path]
stride doctor [path]
stride version
```

Codex chat commands:

```text
$stride touch <small change>
$stride frame <task>
$stride carry
$stride land
$stride kit ui [from reference]
$stride review
$stride mend <issue>
$stride status
```

`stride command carry` and `stride carry` both print the workflow instructions for that command. The implementation work happens in Codex after the user invokes the matching `$stride ...` command in chat.

## Status And Manual Testing

After `carry`, Stride should leave you with a manual-test card:

```text
Status: Ready for manual test
Worktree: .stride/worktrees/product-details
Branch: stride/product-details
Preview: http://127.0.0.1:3107/products/123

What Changed:
- Added product details page
- Linked product cards to the details page
- Added not-found state

What To Check:
- Details render correctly
- Mobile layout does not overflow
- Missing product ID shows the expected state

Next:
- If wrong: $stride mend <issue>
- If good: $stride land
```

If you forget the URL or what changed:

```bash
stride status
```

## Current Boundary

`v0.1.0` is an instruction-driven Stride release. It installs the workflow files, Codex bridge, command docs, and phase docs.

The next major step is making the CLI execute more of the workflow directly: create worktrees, start previews, create PRs, and clean up after landing.

## License

MIT
