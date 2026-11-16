#!/usr/bin/env bash
# Starts a hotfix: a hotfix/<name> branch cut from the latest release tag, so
# the fix ships without whatever is unreleased on main.
#
#   scripts/hotfix.sh music-stops-on-wake
#   ...fix, add a line under [Unreleased] in CHANGELOG.md, commit...
#   scripts/release.sh patch
#   gh pr create --base main      # bring the fix back to main
set -euo pipefail
cd "$(dirname "$0")/.."

name=${1:?usage: scripts/hotfix.sh <short-name>}
[ -z "$(git status --porcelain)" ] || { echo "Commit or stash your changes first."; exit 1; }
git fetch --tags origin
latest=$(git tag --list 'v*' --sort=-v:refname | head -1)
[ -n "$latest" ] || { echo "No release tag yet: release from main with scripts/release.sh"; exit 1; }
git switch -c "hotfix/$name" "$latest"
echo "On hotfix/$name from $latest. Fix, note it in CHANGELOG.md under [Unreleased], commit, then: scripts/release.sh patch"
