# Technical Overview

Stride Workflow is the repo-local workflow layer behind the `$stride ...` commands.

## Public Commands

Chat commands:

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

CLI commands:

```bash
stride-workflow init [path] [--force] [--no-codex] [--yes]
stride-workflow command <touch|frame|carry|land|kit|review|mend|status|workers>
stride-workflow <touch|frame|carry|land|kit|review|mend|status|workers>
stride-workflow workers [path]
stride-workflow subject [path]
stride-workflow status [path]
stride-workflow doctor [path]
stride-workflow version
```

When `init` runs against an existing Stride install, it shows a Stride changelog summary for newer versions before asking to update.

## Internal Phases

- `intake`: request interpreter
- `probe`: repo explorer
- `framer`: spec writer
- `builder`: implementation engineer
- `checker`: verification runner
- `debugger`: failure investigator
- `reviewer`: behavioral reviewer
- `fixer`: review-response implementer
- `worktree`: isolated branch/worktree manager
- `previewer`: manual-test server manager
- `handoff`: manual-test guide
- `ui-auditor`: frontend consistency mapper
- `reference-reader`: screenshot/reference interpreter
- `kit-designer`: component and token designer
- `migrator`: repeated UI replacement implementer
- `ledger`: durable memory keeper

## Core Flows

Tiny change:

```text
$stride touch <small change>
```

Normal feature:

```text
$stride frame <task>
$stride carry
manual test the preview URL
$stride land
```

Frontend consistency:

```text
$stride kit ui
$stride kit ui from screenshot.png
```

Bug after manual testing:

```text
$stride mend <issue>
```

## What Gets Installed

```text
.stride/
  commands/
  phases/
  config.md
  ledger.md
AGENTS.md
```

`AGENTS.md` tells Codex to route `$stride ...` chat commands through the `.stride/` files.

## Diagram

![Stride Workflow diagram](stride-flow.svg)
