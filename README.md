# Datakustik Padel-LP — Repository

Versions- und Deployment-Repo für die Padel-Lärm-Kampagnen-Landingpage `https://www.datakustik.com/lp/padel-laerm.html`. Dient gleichzeitig als Staging-Umgebung (über GitHub Pages) und als Single-Source-of-Truth für die drei Production-Files.

## Inhalt

| Pfad | Zweck |
|---|---|
| `padel-laerm.html` | HTML-Master der Landingpage (Production-ready) |
| `padel-laerm.js` | Tracking-Logik, Lead-Form-Handler, i18n-Switch, Webinar-Toggle |
| `translations.js` | i18n-Strings in 6 Sprachen (DE/EN/FR/ES/ZH/IT) |
| `docs/deploy-for-it.md` | Schritt-für-Schritt-Anleitung für den IT-Kollegen, der Production-Uploads macht |
| `docs/argumentation-fuer-it.md` | Begründungstext für das nächste IT-Gespräch (eigene FTP-Rechte für Marketing) |
| `scripts/sync-to-mittwald.sh` | Bash-Skript: lädt alle drei Files mit lftp auf Mittwald — verhindert „Only HTML"-Uploads |
| `CHANGELOG.md` | Reverse-chronologisches Log aller Production-Änderungen |
| `.github/workflows/deploy.yml` | Automatischer Build → GitHub Pages bei jedem Commit auf `main` |

## Quick-Start — wie Sie das hier verwenden

**Lokales Bearbeiten:** Sie öffnen die drei Files direkt im Editor, committen die Änderung mit klarer Commit-Message (z. B. „Webinar-Datum auf 24.06.2026 verschoben"), pushen auf `main`. GitHub Pages baut automatisch die Staging-URL.

**Staging-URL:** Nach dem Push verfügbar unter `https://<dein-github-username>.github.io/datakustik-padel-lp/padel-laerm.html`. Echtzeit-Test in DevTools, GA4 DebugView, Sprachumschalter, Newsletter-Klick.

**Production-Deploy:** Wenn der Stand auf Staging stabil ist, gibt der Marketing-Lead die Files für Mittwald-Upload frei. Der IT-Kollege folgt `docs/deploy-for-it.md` (drei Files, nicht nur HTML!) oder ruft `scripts/sync-to-mittwald.sh` auf — letzteres ist der sichere Weg.

## Bekannte Einschränkungen der Staging-Umgebung

- **Lead-Form-Submit funktioniert nicht** auf GitHub Pages, weil `contact.php` auf Mittwald liegt und Cross-Origin blockt. Workaround: Sie sehen die Formular-Validierung, die Webinar-Card-Toggle-Logik und alle Tracking-Events im GA4-DebugView. Nur der finale POST landet im Browser-Fehler. Für End-to-End-Form-Test: Production-Mittwald-Stage abwarten.
- **Cookie-Banner Usercentrics** zeigt sich nur, wenn die Domain in der Usercentrics-Config eingetragen ist. Wenn nicht, läuft die LP cookie-frei (für UI-Tests irrelevant, für Consent-Tests blockierend). Lösung: GitHub-Pages-Domain in Usercentrics-Admin als Test-Domain hinzufügen.

## DSGVO und Tracking

Alle Tracking-Details (UTM-Schema, GA4-Event-Schema, Consent-Mode-Setup) sind in der globalen Datakustik-Marketing-Doku unter `Datakustik_Festplatte/Marketing/Skills/datakustik-landingpage/references/` dokumentiert. Dieses Repo nutzt diese Konventionen, dupliziert sie aber nicht.

## Stand

- Aktuelle Version siehe `CHANGELOG.md`
- Production-Stand auf Mittwald liegt aktuell **hinter** dem Repo-Stand (siehe Datakustik-internes Ticket „LP-Sync 2026-05-20")
