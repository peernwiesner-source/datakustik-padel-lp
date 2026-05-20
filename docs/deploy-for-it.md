# Padel-LP — Upload-Anleitung für den Mittwald-Sync

Adressat: IT-Kollege oder externer Dev, der die FTP-Upload-Rechte für www.datakustik.com hat.

## Was hochzuladen ist — IMMER alle drei Files

Die Padel-Landingpage besteht aus **drei zusammengehörigen Files**, die immer gemeinsam aktualisiert werden müssen. Wenn nur eines übertragen wird, läuft die LP in einem inkonsistenten Zustand (alte JS-Logik mit neuem HTML-Markup → Bugs, falsche Daten, defektes Tracking).

| Lokal (Repo-Root) | Remote (Mittwald) |
|---|---|
| `padel-laerm.html` | `/html/lp/padel-laerm.html` |
| `padel-laerm.js` | `/html/lp/padel-laerm.js` |
| `translations.js` | `/html/lp/translations.js` |

**Falls Sie unsicher sind, ob ein Sync vollständig war:** Tools-Tab in Chrome öffnen, die LP laden, in der Konsole eingeben: `Object.keys(TRANSLATIONS)`. Es muss `["de","en","fr","es","zh","it"]` zurückkommen. Wenn `it` fehlt, ist die `translations.js` veraltet.

## Empfohlener Weg: Sync-Skript

Im Repo unter `scripts/sync-to-mittwald.sh` liegt ein Skript, das genau diesen Sync atomar ausführt — entweder alle drei Files oder keine:

```bash
cd /pfad/zum/datakustik-padel-lp/
./scripts/sync-to-mittwald.sh --dry-run   # Vorschau, was passieren würde
./scripts/sync-to-mittwald.sh             # tatsächlicher Sync mit Bestätigung
```

Das Skript zieht vorher ein Backup der aktuellen Remote-Files (in `backup-remote/<timestamp>/`), lädt dann alle drei Files hoch und verifiziert anschließend, dass jede URL `HTTP 200` liefert.

**Credentials:** entweder über `~/.netrc` oder über Env-Variablen `MITTWALD_FTP_HOST`, `MITTWALD_FTP_USER`, `MITTWALD_FTP_PASS`. Bitte nicht im Repo committen — die `.gitignore` schützt davor.

## Manueller Upload (Backup-Weg)

Falls das Skript nicht läuft (z. B. wenn lftp nicht installiert ist), bitte über FileZilla oder vergleichbaren FTP-Client:

1. Mit Mittwald-FTP verbinden (`ssh.datakustik.com:21` oder per Mittwald-Doku).
2. Remote in `/html/lp/` wechseln.
3. **Backup ziehen:** die drei aktuellen Live-Files lokal sichern (Ordner mit Datum benennen, z. B. `backup_remote_20260520_1430`).
4. **Alle drei Files** aus dem Repo-Root überschreiben — nicht nur die HTML.
5. Verifikation: in Chrome incognito `https://www.datakustik.com/lp/padel-laerm.html?ts=<timestamp>` laden (Query-Parameter erzwingt Cache-Bypass), Sprache auf Italienisch wechseln — wenn die LP übersetzt wird, ist `translations.js` aktuell.

## Wenn etwas schiefgeht

Im Repo unter `backup-remote/<timestamp>/` liegen die alten Files. Diese drei Files einfach wieder hochladen, dann steht die LP wieder auf dem vorherigen Stand.

Bei jedem Sync wird ein Log-File `sync-<timestamp>.log` im Repo-Root erzeugt — dort steht detailliert, welche Files mit welcher Größe übertragen wurden.

## Kontakt bei Rückfragen

Peer (Head of Marketing). Die Inhaltsänderungen werden im Marketing entschieden und kommen über dieses Repo. Der IT-Sync ist der letzte Schritt vor Production.
