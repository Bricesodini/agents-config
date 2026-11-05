#!/usr/bin/env bash
# downie-dl.sh — prototype de la skill "youtube-to-mp4"
#
# Usage :
#   ./bin/downie-dl.sh <urls-file> [--dest <dir>] [--postprocessing mp4|audio]
#
# Lit un fichier texte (une URL YouTube par ligne), envoie chaque URL à Downie 4
# via son custom scheme `downie://XUOpenURL?url=...&postprocessing=...&destination=...`
# puis démarre la queue Downie.
#
# Pré-requis : Downie 4 doit être installé dans /Applications/.
#              macOS only (utilise `open`).
#
# Pas de logique custom : Downie gère le téléchargement, le post-processing MP4
# et le placement dans le dossier destination.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <urls-file> [--dest <dir>] [--postprocessing mp4|audio]" >&2
  exit 1
fi

URLS_FILE="$1"
shift

DEST="$HOME/Downloads"
POST="mp4"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --postprocessing) POST="$2"; shift 2 ;;
    *) echo "Arg inconnu: $1" >&2; exit 2 ;;
  esac
done

if [[ ! -f "$URLS_FILE" ]]; then
  echo "Fichier introuvable : $URLS_FILE" >&2
  exit 1
fi

if [[ ! -d "$DEST" ]]; then
  echo "Destination introuvable, création : $DEST"
  mkdir -p "$DEST"
fi

# Vérifie Downie
if [[ ! -d "/Applications/Downie 4.app" && ! -d "/Applications/Downie.app" ]]; then
  echo "Downie 4 introuvable dans /Applications" >&2
  exit 1
fi
DOWNIE_APP="Downie 4"
[[ ! -d "/Applications/Downie 4.app" ]] && DOWNIE_APP="Downie"

echo "▶ Downie : $DOWNIE_APP"
echo "▶ Destination : $DEST"
echo "▶ Post-processing : $POST"
echo "▶ Source : $URLS_FILE"
echo

count=0
errors=0
while IFS= read -r line || [[ -n "$line" ]]; do
  # Ignorer lignes vides / commentaires
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  # Doit ressembler à une URL http(s)
  if [[ ! "$line" =~ ^https?:// ]]; then
    echo "  ⚠ ignoré (pas une URL) : $line"
    continue
  fi

  # URL-encode minimale : % doit devenir %25, & reste ok dans query string,
  # mais Downie demande d'encoder au minimum ? et & dans `url=`.
  encoded_url=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$line")
  encoded_dest=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DEST")
  custom="downie://XUOpenURL?url=${encoded_url}&postprocessing=${POST}&destination=${encoded_dest}"

  echo "  → $line"
  if open -a "$DOWNIE_APP" "$custom"; then
    count=$((count+1))
  else
    errors=$((errors+1))
    echo "    ✗ open a échoué"
  fi
done < "$URLS_FILE"

echo
echo "▶ $count URL(s) envoyée(s) à Downie, $errors erreur(s)."

if [[ $count -gt 0 ]]; then
  echo "▶ Démarrage de la queue Downie…"
  osascript <<EOF
tell application "$DOWNIE_APP" to start queue
EOF
fi
