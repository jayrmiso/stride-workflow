# Stride Workflow

Stride Workflow is a Codex-first workflow tool for keeping repo work specified, isolated, reviewed, and easy to hand off for manual testing.

Default worker split: `stridebuilder` writes, `stridereviewer` reviews, `stridelead` is read-only recon when extra repo facts are worth it, and `strideuiauditor` checks the live UI with bundled Playwright when the change is user-facing.

Work shows up as a simple milestone checklist that mirrors the current run:

```text
Task:
- [ ] <current milestone 1>
- [ ] <current milestone 2>
```

For a feature run, that checklist usually tracks phases such as `spec`, `impl`, `review`, `preview`, and `land`. Completed items stay visible but are marked done instead of being removed.

![Stride Workflow diagram](docs/stride-flow.svg)

For the technical workflow, commands, phases, and install details, see [docs/technical-overview.md](docs/technical-overview.md).

## Install

```bash
npx github:jayrmiso/stride-workflow init
```

For a clean reinstall that removes and reapplies the managed Stride files, use:

```bash
stride-workflow refresh
```

`stride-workflow doctor` also checks that the bundled Playwright runtime and Chromium browser binary are available for visual auditing.
The package install downloads the Chromium browser automatically through Playwright so the visual-audit path is ready after install.
`stride-workflow init` prints a Playwright readiness line after install so you can confirm the visual-audit path immediately.

## License

MIT
