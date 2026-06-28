# Release Process

Every meaningful public update should create a GitHub release with changelog notes.

## Versioning

Use small semantic versions:

- patch: docs, wording, small command template fixes
- minor: new command, new phase, new CLI behavior
- major: breaking workflow or install changes

## Release Checklist

1. Update `CHANGELOG.md`.
2. Update `package.json` version.
3. Run checks:

```bash
npm run check
npm run smoke
npm pack --dry-run
```

4. Commit the update.
5. Tag the version:

```bash
git tag -a vX.Y.Z -m "Stride Workflow vX.Y.Z"
```

6. Push branch and tag:

```bash
git push origin main
git push origin vX.Y.Z
```

7. Create the GitHub release from the changelog notes:

```bash
gh release create vX.Y.Z --title "Stride Workflow vX.Y.Z" --notes-file /tmp/stride-release-notes.md
```

## Release Notes Shape

```md
## Highlights

- ...

## Install

```bash
npx github:jayrmiso/stride-workflow init
```

## Notes

- ...
```
