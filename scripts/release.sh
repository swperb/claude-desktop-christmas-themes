#!/usr/bin/env bash
# Cuts a release: bumps the version, moves [Unreleased] notes under it in
# CHANGELOG.md, commits, tags vX.Y.Z and pushes. The tag starts the Release
# workflow, which checks the plugin and publishes the GitHub release.
#
#   scripts/release.sh patch      # 0.1.0 -> 0.1.1  (hotfixes)
#   scripts/release.sh minor      # 0.1.0 -> 0.2.0  (new themes, features)
#   scripts/release.sh major      # 0.1.0 -> 1.0.0
#   scripts/release.sh 0.3.0      # an exact version
set -euo pipefail
cd "$(dirname "$0")/.."

bump=${1:?usage: scripts/release.sh patch|minor|major|X.Y.Z}
branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in main|hotfix/*) ;; *) echo "Release from main or a hotfix/* branch (on $branch)"; exit 1;; esac
[ -z "$(git status --porcelain)" ] || { echo "Commit or stash your changes first."; exit 1; }

current=$(node -p "require('./.claude-plugin/plugin.json').version")
next=$(node -e "
const [a,b,c]='$current'.split('.').map(Number); const k='$bump';
if (/^\d+\.\d+\.\d+$/.test(k)) console.log(k);
else if (k==='major') console.log([a+1,0,0].join('.'));
else if (k==='minor') console.log([a,b+1,0].join('.'));
else if (k==='patch') console.log([a,b,c+1].join('.'));
else { console.error('unknown bump: '+k); process.exit(1) }")
git rev-parse -q --verify "refs/tags/v$next" >/dev/null && { echo "v$next already exists"; exit 1; }

echo "Releasing $current -> $next"
scripts/check.sh

node -e "
const fs=require('fs'); const p='.claude-plugin/plugin.json';
const j=JSON.parse(fs.readFileSync(p,'utf8')); j.version='$next';
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
const c='CHANGELOG.md'; let t=fs.readFileSync(c,'utf8');
const today=new Date().toISOString().slice(0,10);
t=t.replace('## [Unreleased]\n', '## [Unreleased]\n\n## [$next] - '+today+'\n');
fs.writeFileSync(c,t);"

git add .claude-plugin/plugin.json CHANGELOG.md
git commit -m "Release v$next"
git tag -a "v$next" -m "v$next"
git push origin "$branch"
git push origin "v$next"

if [[ "$branch" == hotfix/* ]]; then
  echo "Hotfix released from $branch. Merge it back: open a PR into main (gh pr create --base main)."
fi
echo "Tagged v$next. The Release workflow publishes it; installed copies get it with: claude plugin update christmas-themes"
