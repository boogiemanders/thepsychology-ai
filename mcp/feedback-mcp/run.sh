#!/usr/bin/env bash
# Launcher: loads .env.local, installs deps + builds if needed, then execs the MCP server.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${FEEDBACK_MCP_ENV_FILE:-$HOME/thepsychology-ai/.env.local}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if [ ! -d "$HERE/node_modules" ]; then
  (cd "$HERE" && npm install --silent) >&2
fi

if [ ! -f "$HERE/dist/server.js" ] || [ "$HERE/server.ts" -nt "$HERE/dist/server.js" ]; then
  (cd "$HERE" && npm run --silent build) >&2
fi

exec node "$HERE/dist/server.js"
