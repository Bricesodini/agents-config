#!/usr/bin/env bash
# install.sh — wire the .agents/ deployment layer into ~/.agents/ via symlinks.
#
# Idempotent: safe to re-run. Each step is skipped if the symlink already points
# at the right target, otherwise it replaces. Dangling symlinks fail fast.
#
# Usage:
#   ./bin/install.sh           # full install
#   ./bin/install.sh --check   # verify only, no changes

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY="$REPO_ROOT/.agents"
TARGET="$HOME/.agents"

# Files and directories under .agents/ that get linked into ~/.agents/
# Each line: "<source-in-.agents>" "<link-name-in-~/.agents>"
LINKS=(
  "skills      skills"
  "prompts     prompts"
  "AGENTS.md   AGENTS.md"
  ".skill-lock.json .skill-lock.json"
)

log() { printf '  %s\n' "$*"; }
err() { printf '  ✗ %s\n' "$*" >&2; }

link_one() {
  local src_name="$1"
  local link_name="$2"
  local src="$DEPLOY/$src_name"
  local link="$TARGET/$link_name"

  if [ ! -e "$src" ] && [ ! -L "$src" ]; then
    err "source missing: $src"
    return 1
  fi

  # Resolve current state of $link
  if [ -L "$link" ]; then
    local current
    current="$(readlink "$link")"
    if [ "$current" = "$src" ]; then
      log "ok  $link (already linked)"
      return 0
    fi
    log "relink $link ($current → $src)"
    rm "$link"
  elif [ -e "$link" ]; then
    # Real file/dir exists — refuse to clobber.
    err "refusing to clobber existing $link (not a symlink)"
    err "  back it up then re-run, or rm it manually"
    return 1
  fi

  mkdir -p "$(dirname "$link")"
  ln -s "$src" "$link"
  log "linked $link → $src"
  return 0
}

check_one() {
  local link="$1"
  if [ ! -L "$link" ]; then
    err "missing symlink: $link"
    return 1
  fi
  if [ ! -e "$link" ]; then
    err "dangling symlink: $link → $(readlink "$link")"
    return 1
  fi
  log "ok  $link"
  return 0
}

main() {
  local mode="${1:-install}"

  printf 'agents-config install (mode=%s)\n' "$mode"
  printf '  repo:    %s\n' "$REPO_ROOT"
  printf '  deploy:  %s\n' "$DEPLOY"
  printf '  target:  %s\n\n' "$TARGET"

  if [ "$mode" = "--check" ]; then
    local ok=1
    for entry in "${LINKS[@]}"; do
      set -- $entry
      local link_name="$2"
      check_one "$TARGET/$link_name" || ok=0
    done
    if [ "$ok" = 1 ]; then
      printf '\nall symlinks healthy\n'
    else
      printf '\nsymlink check failed\n' >&2
      exit 1
    fi
    return 0
  fi

  if [ "$mode" != "install" ]; then
    err "unknown mode: $mode (expected 'install' or '--check')"
    exit 2
  fi

  if [ ! -d "$DEPLOY" ]; then
    err "deployment layer missing: $DEPLOY"
    exit 1
  fi

  mkdir -p "$TARGET"

  for entry in "${LINKS[@]}"; do
    set -- $entry
    link_one "$1" "$2"
  done

  printf '\nsmoke test: launching impeccable via the symlinked path\n'
  if [ -x "$TARGET/skills/impeccable/scripts/impeccable" ]; then
    "$TARGET/skills/impeccable/scripts/impeccable" --version \
      && log "impeccable launcher responds" \
      || err "impeccable launcher failed (check that .agents/skills/impeccable/scripts/impeccable is populated)"
  else
    log "skipped (impeccable not yet populated under .agents/skills/impeccable/)"
  fi

  printf '\ndone. verify with:  ./bin/install.sh --check\n'
}

main "$@"