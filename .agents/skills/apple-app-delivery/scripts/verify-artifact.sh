#!/usr/bin/env bash
#
# verify-artifact.sh — verify a signed Apple distribution artifact before upload.
#
# Usage: verify-artifact.sh <path-to.pkg-or.ipa>
#
# Exits:
#   0  OK    — bundle ID, version, build number readable; signature present and correct identity.
#   1  WARN  — artifact is signed but with the wrong identity for the intended lane (e.g. Developer ID on a TestFlight upload).
#   2  FAIL  — artifact unreadable, signature missing, or required identity missing.
#   3  USAGE — wrong invocation (missing path, unsupported extension).
#
# The script prints a single verdict line. It does NOT upload, parse, or modify the artifact.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "USAGE: $0 <path-to.pkg-or.ipa>" >&2
  exit 3
fi

ARTIFACT="$1"

if [[ ! -f "$ARTIFACT" ]]; then
  echo "FAIL  $ARTIFACT  file not found" >&2
  exit 2
fi

case "$ARTIFACT" in
  *.pkg) LANE_HINT="macos-pkg";;
  *.ipa) LANE_HINT="ios-family-ipa";;
  *)
    echo "FAIL  $ARTIFACT  unsupported extension (expected .pkg or .ipa)" >&2
    exit 3
    ;;
esac

# --- Step 1: locate the embedded Info.plist -----------------------------------

case "$LANE_HINT" in
  macos-pkg)
    # Extract first; then locate the embedded .app via find, since the path
    # layout under --expand-full is nested (`<identifier>.pkg/Payload/<Name>.app/`)
    # and depends on the bundle identifier, which we don't yet know here.
    # Extract just for reading. Two macOS quirks conspire:
    #   (a) `mktemp -d` defaults to /var/folders/.../T/ which on FileVault /
    #       sandboxed builds is a symlinks-only volume that breaks
    #       `pkgutil --expand-full` ("The operation couldn't be completed.
    #       File exists"). Use ~/.cache/ instead.
    #   (b) `pkgutil --expand-full` ALSO fails when the destination directory
    #       already exists, even if empty. So we must NOT use `mktemp -d`
    #       (which creates the dir). Instead, allocate a path and rmdir it
    #       so pkgutil creates the dir itself.
    # Override via TMP_DIR_FOR_VERIFY if needed.
    CACHE_ROOT="${TMP_DIR_FOR_VERIFY:-$HOME/.cache/verify-artifact}"
    mkdir -p "$CACHE_ROOT"
    TMP_DIR="$(mktemp -u -t verify-artifact-XXXXXX -p "$CACHE_ROOT")"
    trap 'rm -rf "$TMP_DIR"' EXIT
    if ! pkgutil --expand-full "$ARTIFACT" "$TMP_DIR" 2>/dev/null; then
      echo "FAIL  $ARTIFACT  pkgutil --expand-full failed" >&2
      exit 2
    fi
    PAYLOAD_APP="$(find "$TMP_DIR" -type d -name "*.app" -path "*/Payload/*" | head -1 || true)"
    if [[ -z "$PAYLOAD_APP" ]]; then
      # Fallback: locate any .app under TMP_DIR (for flat .pkg variants).
      PAYLOAD_APP="$(find "$TMP_DIR" -type d -name "*.app" | head -1 || true)"
    fi
    if [[ -z "$PAYLOAD_APP" ]]; then
      echo "FAIL  $ARTIFACT  no .app found inside package" >&2
      exit 2
    fi
    PLIST="$PAYLOAD_APP/Contents/Info.plist"
    ;;
  ios-family-ipa)
    # .ipa is a zip; Payload/<Name>.app/Info.plist
    TMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TMP_DIR"' EXIT
    unzip -q "$ARTIFACT" -d "$TMP_DIR" || {
      echo "FAIL  $ARTIFACT  unzip failed" >&2
      exit 2
    }
    PAYLOAD_APP="$(find "$TMP_DIR/Payload" -maxdepth 2 -name "*.app" -type d | head -1)"
    if [[ -z "$PAYLOAD_APP" ]]; then
      echo "FAIL  $ARTIFACT  no .app found under Payload/" >&2
      exit 2
    fi
    PLIST="$PAYLOAD_APP/Info.plist"
    ;;
esac

if [[ ! -f "$PLIST" ]]; then
  echo "FAIL  $ARTIFACT  Info.plist not found at $PLIST" >&2
  exit 2
fi

# --- Step 2: read bundle ID / version / build --------------------------------

BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$PLIST" 2>/dev/null || true)"
SHORT_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$PLIST" 2>/dev/null || true)"
BUILD_NUMBER="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$PLIST" 2>/dev/null || true)"

if [[ -z "$BUNDLE_ID" || -z "$SHORT_VERSION" || -z "$BUILD_NUMBER" ]]; then
  echo "FAIL  $ARTIFACT  could not read bundle ID / version / build from Info.plist" >&2
  exit 2
fi

# --- Step 3: verify signature -------------------------------------------------

case "$LANE_HINT" in
  macos-pkg)
    # A Mac Installer .pkg must carry BOTH:
    #   - Apple Distribution (binary signing inside the embedded .app)
    #   - Mac Installer Distribution (installer signing on the .pkg itself)
    BIN_SIG="$(codesign -dvv "$PAYLOAD_APP" 2>&1 | awk -F= '/^Authority=/ {print $2}' | head -1 || true)"
    # pkgutil --check-signature prints lines like:
    #   "    1. 3rd Party Mac Developer Installer: Brice Sodini (NU2VGTQ5X2)"
    # We extract the subject line and look for any installer-certif common-name
    # variant. Accept: "Apple Distribution" + "Mac Installer Distribution"
    # (modern name), "3rd Party Mac Developer Installer" (legacy name),
    # "Developer ID Installer" (direct-distribution name).
    PKG_SIG="$(pkgutil --check-signature "$ARTIFACT" 2>&1 | awk '/^ +[0-9]+\. / {print; exit}' | sed -E 's/^ +[0-9]+\. //' || true)"
    INSTALLER_AUTH=""

    APPLE_DISTRIBUTION_OK=0
    MAC_INSTALLER_DIST_OK=0
    [[ "$BIN_SIG"   == *Apple*Distribution* ]] && APPLE_DISTRIBUTION_OK=1
    [[ "$BIN_SIG"   == *Developer*ID*Application* ]] && DEV_ID_BIN_OK=1 || DEV_ID_BIN_OK=0
    # TestFlight-eligible installer certifs (any of the three name variants
    # Apple has shipped since macOS 10.7):
    if   [[ "$PKG_SIG" == *Mac*Installer*Distribution* ]] \
      || [[ "$PKG_SIG" == *"3rd Party Mac Developer Installer"* ]] \
      || [[ "$PKG_SIG" == *"3rd-party Mac Developer Installer"* ]]; then
      MAC_INSTALLER_DIST_OK=1
    fi
    [[ "$PKG_SIG" == *Developer*ID*Installer* ]] && DEV_ID_INSTALLER_OK=1 || DEV_ID_INSTALLER_OK=0

    if (( APPLE_DISTRIBUTION_OK == 1 )) && (( MAC_INSTALLER_DIST_OK == 1 )); then
      VERDICT="OK"
      SIGNED_DESC="Apple Distribution + Mac Installer Distribution"
      EXIT_CODE=0
    elif (( DEV_ID_BIN_OK == 1 )) || (( DEV_ID_INSTALLER_OK == 1 )); then
      VERDICT="WARN"
      SIGNED_DESC="Developer ID (direct distribution) — not eligible for TestFlight"
      EXIT_CODE=1
    else
      VERDICT="FAIL"
      SIGNED_DESC="missing required identity (need Apple Distribution + Mac Installer Distribution for TestFlight)"
      EXIT_CODE=2
    fi
    ;;

  ios-family-ipa)
    SIG="$(codesign -dvv "$PAYLOAD_APP" 2>&1 | awk -F= '/^Authority=/ {print $2}' | head -1 || true)"
    if [[ "$SIG" == *Apple*Distribution* ]]; then
      VERDICT="OK"
      SIGNED_DESC="Apple Distribution"
      EXIT_CODE=0
    elif [[ "$SIG" == *iPhone*Developer* || "$SIG" == *Apple*Development* ]]; then
      VERDICT="WARN"
      SIGNED_DESC="development signing — not eligible for TestFlight upload"
      EXIT_CODE=1
    elif [[ -z "$SIG" ]]; then
      VERDICT="FAIL"
      SIGNED_DESC="no signature found"
      EXIT_CODE=2
    else
      VERDICT="FAIL"
      SIGNED_DESC="unexpected identity: $SIG"
      EXIT_CODE=2
    fi
    ;;
esac

printf '%-5s %s  %s  %s (%s)  signed=%s\n' \
  "$VERDICT" "$ARTIFACT" "$BUNDLE_ID" "$SHORT_VERSION" "$BUILD_NUMBER" "$SIGNED_DESC"

exit "$EXIT_CODE"
