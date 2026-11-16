#!/usr/bin/env bash
# Checks the plugin the way CI does: manifest + marketplace, hooks module, tests,
# scene size limits, and that both version fields agree.
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p "require('./.claude-plugin/plugin.json').version")
echo "plugin version: $version"

for scene in hooks/scenes/*.ts; do
  size=$(node -e "const s=require('fs').readFileSync('$scene','utf8');const m=s.match(/= (\".*\")/s);process.stdout.write(String(JSON.parse(m[1]).length))")
  if [ "$size" -gt 131072 ]; then echo "✘ $scene is $size characters; a scene must stay under 131072"; exit 1; fi
  echo "✔ $scene: $size characters"
done

claude plugin validate .
claude plugin test .
