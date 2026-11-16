# Releasing and hotfixes

People install this plugin from the repository's marketplace file, and Claude Code
offers them an update when the `version` in `.claude-plugin/plugin.json` changes. So
every change people should get ships as a new version, and `scripts/release.sh` is the
one way versions change.

## A normal release (new theme, new feature)
1. Work on `main` (or a branch merged into it). CI validates and tests every push and PR.
2. Note the change under `## [Unreleased]` in `CHANGELOG.md`.
3. `scripts/release.sh minor` (or `patch`, `major`, or an exact `X.Y.Z`).

The script runs the checks, bumps `plugin.json`, dates the changelog entry, commits,
tags `vX.Y.Z` and pushes. The tag starts the **Release** workflow, which checks the tag
matches `plugin.json`, re-runs the checks, and publishes a GitHub release with a zip and
the changelog notes.

## A hotfix (something broken in the released version)
1. `scripts/hotfix.sh <short-name>`: a `hotfix/<short-name>` branch from the latest tag,
   so only the fix ships, not unreleased work on `main`.
2. Fix it, note it under `## [Unreleased]` in `CHANGELOG.md`, commit.
3. `scripts/release.sh patch`: tags and publishes `vX.Y.(Z+1)` from the hotfix branch.
4. `gh pr create --base main` to bring the fix (and the version bump) back to `main`.

Installed copies pick it up with `claude plugin update christmas-themes`, or from the
desktop app's plugin settings.

## Checking locally
`scripts/check.sh` runs what CI runs: `claude plugin validate .`, `claude plugin test .`,
the scene size limit (131,072 characters each) and the version read.

## Adding a theme
1. Write a generator in `tools/` (copy `gen-cozy-fireplace.mjs`), run it to produce
   `hooks/scenes/<id>.ts`.
2. Add the theme to `THEMES` in `hooks/register.tsx` with its palette.
3. Add a line under `[Unreleased]`, then `scripts/release.sh minor`.
