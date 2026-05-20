#!/usr/bin/env bash
#
# sync-to-mittwald.sh — synct die Padel-LP Production-Files zu Mittwald
#
# Verhindert das wiederkehrende „Only HTML"-Problem: dieses Skript lädt
# IMMER alle drei Files (HTML + JS + translations.js) hoch — entweder
# alle oder keine. Vorher: Backup, Verifikation, Log-File.
#
# Voraussetzungen:
#   - lftp installiert (macOS: brew install lftp / Linux: apt install lftp)
#   - FTP-Credentials in ~/.netrc oder als Env-Variablen
#       MITTWALD_FTP_HOST, MITTWALD_FTP_USER, MITTWALD_FTP_PASS
#   - Remote-Pfad in MITTWALD_REMOTE_PATH (Default: /html/lp)
#
# Usage:
#   ./sync-to-mittwald.sh             # Sync mit Bestätigungsabfrage
#   ./sync-to-mittwald.sh --dry-run   # Nur anzeigen, was geschehen würde
#   ./sync-to-mittwald.sh --force     # Ohne Bestätigung
#
set -euo pipefail

# === KONFIGURATION ===
REMOTE_PATH="${MITTWALD_REMOTE_PATH:-/html/lp}"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$LOCAL_DIR/sync-$(date +%Y%m%d_%H%M%S).log"

FILES=(
  "padel-laerm.html"
  "padel-laerm.js"
  "translations.js"
)

# === FUNKTIONEN ===
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

err() {
  echo "[FEHLER] $*" >&2 | tee -a "$LOG_FILE"
  exit 1
}

check_prerequisites() {
  command -v lftp >/dev/null 2>&1 || err "lftp ist nicht installiert. Installation: brew install lftp"

  if [[ -z "${MITTWALD_FTP_HOST:-}" ]] && [[ ! -f "$HOME/.netrc" ]]; then
    err "Keine FTP-Credentials gefunden. Setzen Sie MITTWALD_FTP_HOST/USER/PASS oder konfigurieren Sie ~/.netrc"
  fi

  for f in "${FILES[@]}"; do
    [[ -f "$LOCAL_DIR/$f" ]] || err "File fehlt im Repo: $f"
    local size
    size=$(stat -f%z "$LOCAL_DIR/$f" 2>/dev/null || stat -c%s "$LOCAL_DIR/$f")
    if [[ "$size" -lt 1000 ]]; then
      err "Datei $f ist verdächtig klein ($size Bytes) — Abbruch"
    fi
    log "  OK: $f ($size Bytes)"
  done
}

print_summary() {
  log "==================================="
  log "Sync-Plan:"
  log "  Lokal:  $LOCAL_DIR"
  log "  Remote: ${MITTWALD_FTP_HOST:-via netrc}:$REMOTE_PATH"
  log "  Files:"
  for f in "${FILES[@]}"; do
    log "    - $f"
  done
  log "==================================="
}

confirm() {
  if [[ "${1:-}" == "--force" ]] || [[ "${FORCE:-}" == "1" ]]; then
    return 0
  fi
  read -rp "Sync jetzt ausführen? [j/N] " answer
  [[ "$answer" =~ ^[JjYy]$ ]] || { log "Abgebrochen durch Nutzer"; exit 0; }
}

backup_remote() {
  log "Lade aktuellen Remote-Stand als Backup..."
  local backup_dir="$LOCAL_DIR/backup-remote/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$backup_dir"

  lftp -e "
    set ftp:ssl-allow yes
    set ftp:ssl-force yes
    set ssl:verify-certificate yes
    cd $REMOTE_PATH
    mget -O '$backup_dir' ${FILES[*]}
    bye
  " "${MITTWALD_FTP_HOST:-}" 2>>"$LOG_FILE" || log "  (Backup teilweise fehlgeschlagen — kein Show-Stopper, vermutlich erster Upload)"

  log "Backup unter: $backup_dir"
}

upload_files() {
  log "Lade ${#FILES[@]} Files zu Mittwald hoch..."

  local cmds="
    set ftp:ssl-allow yes
    set ftp:ssl-force yes
    set ssl:verify-certificate yes
    cd $REMOTE_PATH
  "
  for f in "${FILES[@]}"; do
    cmds+="
    put '$LOCAL_DIR/$f' -o '$f'"
  done
  cmds+="
    bye
  "

  lftp -e "$cmds" "${MITTWALD_FTP_HOST:-}" 2>>"$LOG_FILE" || err "Upload fehlgeschlagen — siehe $LOG_FILE"
  log "Upload abgeschlossen."
}

verify_remote() {
  log "Verifiziere Remote-Files..."
  for f in "${FILES[@]}"; do
    local url="https://www.datakustik.com/lp/$f"
    local status
    status=$(curl -o /dev/null -s -w "%{http_code}" "$url")
    if [[ "$status" == "200" ]]; then
      log "  OK: $url ($status)"
    else
      log "  WARNUNG: $url liefert $status"
    fi
  done
}

# === MAIN ===
log "Padel-LP Sync gestartet"
log "Repo: $LOCAL_DIR"
log "Log:  $LOG_FILE"

if [[ "${1:-}" == "--dry-run" ]]; then
  check_prerequisites
  print_summary
  log "DRY-RUN — keine Änderungen ausgeführt."
  exit 0
fi

check_prerequisites
print_summary
confirm "${1:-}"

backup_remote
upload_files
verify_remote

log "FERTIG. Bitte Live-LP manuell prüfen: https://www.datakustik.com/lp/padel-laerm.html"
