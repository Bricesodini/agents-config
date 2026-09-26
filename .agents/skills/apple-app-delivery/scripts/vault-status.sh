#!/usr/bin/env bash
#
# vault-status.sh — report App Store Connect key-vault metadata WITHOUT ever
# reading the contents of any .p8 file.
#
# Usage: vault-status.sh
#
# Exits:
#   0  OK    — vault present, metadata readable, at least one key file listed.
#   1  WARN  — vault present but a key file is missing (e.g. issuer-id set, no .p8).
#   2  FAIL  — vault missing entirely.
#
# Output is a single JSON object on stdout, suitable for parsing by asc-driven
# scripts. The script never opens, cats, wc's, or otherwise inspects the bytes
# of any AuthKey_*.p8 file. The .p8 is registered with the system Keychain via
# `asc auth login`; this script never reads it.

set -euo pipefail

VAULT="${ASC_KEY_VAULT:-$HOME/.secrets/appstore-connect}"

emit() { printf '%s\n' "$1"; }

if [[ ! -d "$VAULT" ]]; then
  cat <<EOF
{
  "vault": "$VAULT",
  "status": "FAIL",
  "reason": "vault directory missing"
}
EOF
  exit 2
fi

# Read metadata files. These are plaintext by convention — no .p8 content here.
ISSUER_ID=""
KEY_TYPE=""
if [[ -f "$VAULT/issuer-id" ]]; then
  ISSUER_ID="$(tr -d '[:space:]' < "$VAULT/issuer-id")"
fi
if [[ -f "$VAULT/key-type" ]]; then
  KEY_TYPE="$(tr -d '[:space:]' < "$VAULT/key-type")"
fi

# List .p8 filenames ONLY. We do not stat them in a way that reads contents;
# `ls -1` returns names without opening the files. We also do not capture size,
# mtime, or hash — those would require opening.
mapfile -t KEY_FILES < <(cd "$VAULT" && ls -1 AuthKey_*.p8 2>/dev/null || true)

# Derive key_id from the filename suffix: AuthKey_HXJXUYUD63.p8 -> HXJXUYUD63.
# This is the public identifier Apple assigns; it is not secret.
KEY_IDS=()
for f in "${KEY_FILES[@]}"; do
  base="${f#AuthKey_}"   # strip prefix
  base="${base%.p8}"     # strip suffix
  KEY_IDS+=("$base")
done

# Determine status.
STATUS="OK"
REASON=""
if [[ ${#KEY_FILES[@]} -eq 0 ]]; then
  STATUS="WARN"
  REASON="no AuthKey_*.p8 files present"
elif [[ -z "$ISSUER_ID" ]]; then
  STATUS="WARN"
  REASON="issuer-id metadata file missing"
elif [[ -z "$KEY_TYPE" ]]; then
  STATUS="WARN"
  REASON="key-type metadata file missing"
fi

# Build JSON without invoking jq (so this script has no jq dependency).
# We collect lines into an array first so we can drop the trailing comma from
# the last entry before joining — easier than tracking commas by hand.
{
  emit "{"
  emit "  \"vault\": \"$VAULT\","
  emit "  \"status\": \"$STATUS\","
  if [[ -n "$REASON" ]]; then
    emit "  \"reason\": \"$REASON\","
  fi
  emit "  \"issuer_id\": \"$ISSUER_ID\","
  emit "  \"key_type\": \"$KEY_TYPE\","
  if [[ ${#KEY_FILES[@]} -eq 0 ]]; then
    emit "  \"key_files\": [],"
    emit "  \"key_ids\": [],"
  else
    files_json=$(printf '"%s",' "${KEY_FILES[@]}")
    files_json="[${files_json%,}]"
    ids_json=$(printf '"%s",' "${KEY_IDS[@]}")
    ids_json="[${ids_json%,}]"
    emit "  \"key_files\": $files_json,"
    emit "  \"key_ids\": $ids_json,"
  fi
  emit "  \"p8_contents_exposed\": false"
  emit "}"
}

case "$STATUS" in
  OK)   exit 0 ;;
  WARN) exit 1 ;;
  FAIL) exit 2 ;;
esac
