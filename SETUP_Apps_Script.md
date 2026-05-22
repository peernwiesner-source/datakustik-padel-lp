# Padel-LP Lead-Backend — Apps Script Setup

**21.05.2026 · Aufwand 15–20 Min · macht Peer selbst, keine IT nötig**

## 1. Google Sheet anlegen (3 Min)

- drive.google.com (eingeloggt als peer.wiesner@datakustik.com)
- Neu → Google Tabelle → Name: `Datakustik Padel Leads`
- Erstes Tab umbenennen zu `Leads`
- Header-Zeile (Zeile 1) eintragen, Spalten A–M:

  | A | B | C | D | E | F | G | H | I | J | K | L | M |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|
  | Zeitstempel | Vorname | Nachname | Email | Firma | Telefon | Rolle | Anliegen | Webinar | UTM-Source | UTM-Channel | Landingpage | Referrer |

- Sheet-ID aus URL kopieren — der lange String zwischen `/d/` und `/edit`:
  `docs.google.com/spreadsheets/d/`**`1AbCD…XyZ`**`/edit`

## 2. Apps Script Projekt erstellen (5 Min)

- script.google.com → Neues Projekt
- Name oben links: `Padel-LP-Backend`
- Default-Code löschen, Inhalt von `Code.gs` einfügen
- Zeile 12 — `SHEET_ID` durch deine Sheet-ID ersetzen
- Speichern (Cmd+S)

## 3. Deploy (3 Min)

- Bereitstellen → Neue Bereitstellung → Zahnrad → Web-App
- Beschreibung: `Padel-LP v1`
- Ausführen als: Ich (peer.wiesner@datakustik.com)
- Wer hat Zugriff: **Jeder**
- Bereitstellen
- Berechtigungen erlauben (Sheets + Gmail)
- URL kopieren — sieht aus wie `https://script.google.com/macros/s/AKfy…/exec`

## 4. URL an mich (1 Min)

- URL schicken → ich pflege sie in `padel-laerm.html` als Form-Action ein
- IT lädt 1 Datei (HTML) hoch — kein PHP, keine .htaccess

## 5. Test (5 Min)

- LP im Inkognito öffnen
- Form ausfüllen + Webinar-Häkchen + Absenden
- Erwartet: Erfolgsmeldung · Mail in sales@datakustik.com · neue Zeile im Sheet

## Bei Fehler

- script.google.com → Projekt öffnen → links „Ausführungen" → letzten Lauf öffnen → Logger.log lesen
- Häufigste Ursache: Sheet-ID falsch, oder Berechtigung beim Deploy nicht durchgeklickt
