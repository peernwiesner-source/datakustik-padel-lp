# Argumentation für eigene Marketing-Upload-Rechte

Talking-Points für das Gespräch mit IT und/oder Geschäftsleitung. Ziel: Marketing bekommt eigene FTP-Zugangsdaten, eingeschränkt auf den Pfad `/html/lp/` (Landingpages), ohne Server-Admin-Rechte und ohne Zugriff auf andere Systeme.

## Worum es geht

Das aktuelle Upload-Setup — IT-Kollege als Single-Gatekeeper für alle Production-Files — hat in den letzten Wochen messbar zu Qualitätsproblemen geführt. Es ist nicht die Schuld des Kollegen; das Setup selbst ist die Engstelle.

## Konkrete Bug-Beispiele aus dem QA-Test vom 20. Mai 2026

Beim ersten echten Live-Test der Padel-LP wurden in 90 Minuten fünf kritische Bugs entdeckt, die alle dieselbe Ursache haben: **seit dem initialen Upload wurde keine der drei zusammengehörigen Dateien (HTML, JS, translations.js) gemeinsam aktualisiert**, sondern in mehreren Anläufen nur die HTML.

| Bug | Symptom | Ursache |
|---|---|---|
| Webinar-Registrierung defekt | Apps-Script-Mail kommt mit altem Datum 09.06.2026 | JS-Datei vom 4. Mai nie hochgeladen, sendet weiter alten String |
| Italienisch-Sprache fehlt | Klick auf IT-Flagge ohne Wirkung | `translations.js` ohne IT-Block, alt-Version live |
| Privacy-Link in EN/IT zeigt auf 404 | `/en/privacy/` existiert nicht | Schon gefixt im Repo, aber alte translations.js live |
| GA4-Tracking de facto tot | Bridge erkennt Service-Rename in Usercentrics nicht | JS-Bug, der im Repo seit Wochen wartet, aber nicht live geht |
| Advanced Consent Mode fehlt | Cookieless Pings nicht aktiv | JS-Patch von heute, der ohne Upload nicht wirkt |

**Gemeinsamer Nenner:** Es ist ohne Staging und ohne eigene Upload-Rechte unmöglich, diese Bugs vor Production zu finden. Der externe Wirkungspfad ist: Marketing testet im Master-Verzeichnis → IT lädt teilweise hoch → Marketing testet live → findet Bug → muss IT bitten, neuen Upload zu machen → IT wartet auf „finale Version" → Bug bleibt live.

## Sicherheitsargumente, die den IT-Bedenken Rechnung tragen

Es ist verständlich, dass IT Server-Rechte restriktiv vergibt. Der Wunsch ist **kein Server-Admin-Zugang**, sondern ein **eingeschränkter FTP-User** mit folgendem Profil:

| Aspekt | Vorschlag |
|---|---|
| Account-Typ | Eigener FTP-User für Marketing (z. B. `marketing-lp`) |
| Schreibrechte | NUR auf `/html/lp/*` (Landingpage-Verzeichnis) |
| Keine Rechte auf | TYPO3-Backend, Datenbank, Mail-Server, `/html/de/*` (Haupt-Site), `/html/en/*`, sonstige Pfade |
| Authentifizierung | Persönliches Passwort + IP-Whitelist (Office-IP) optional |
| Audit-Log | Mittwald loggt alle Upload-Aktionen ohnehin server-seitig |

Diese Einschränkung lässt sich in Mittwald-Standard-Konfigurationen über chroot-FTP oder über einen separaten User mit eingeschränktem Home-Verzeichnis abbilden. Mittwald-Support kann das in unter einer Stunde einrichten.

## Risiko des Status quo

Solange Marketing nicht autonom deployen kann, gilt:

- Jeder Bug-Fix braucht mindestens einen IT-Ticket-Cycle (Stunden bis Tage).
- Iteratives Testen ist faktisch unmöglich. Bugs werden erst im echten Production-Lauf sichtbar — also bei echten Lead-Empfängern (Sales).
- Die Time-to-Market für Kampagnen-LPs ist 2–4× länger als nötig.
- Tracking-Bugs (wie der GA4-Bridge-Bug) bleiben monatelang unentdeckt, mit messbarem Daten- und Attributionsverlust.

## Konkreter Vorschlag

1. Marketing bekommt eigenen FTP-User `marketing-lp` mit Schreibrechten ausschließlich auf `/html/lp/`.
2. Alle Production-Uploads laufen über das Repo + Sync-Skript (siehe `scripts/sync-to-mittwald.sh`). Damit ist jeder Upload reproduzierbar, geloggt und rückgängig machbar.
3. Für sicherheitsrelevante Änderungen (Backend-PHP, Form-Endpoints, neue Domains) bleibt der IT-Kollege Gatekeeper — diese Änderungen sind aber selten.
4. IT-Kollege hat weiterhin Audit-Einsicht (Mittwald-Log) und kann jederzeit den FTP-User deaktivieren.

## Was Marketing als Gegenleistung bietet

- Dokumentation jedes Uploads in `CHANGELOG.md` (siehe Repo).
- Klare Trennung: Test- und Production-Stand sind sichtbar.
- Im Schadensfall: schnelle Roll-Back-Fähigkeit reduziert IT-Aufwand statt ihn zu erhöhen.

## Gesprächs-Vorschlag

Bei IT ansprechen: „Wir hatten beim QA-Test fünf Bugs in 90 Minuten gefunden, alle wegen unvollständiger Uploads. Können wir uns 30 Minuten zusammensetzen, um einen FTP-User für Marketing einzurichten, der nur auf `/html/lp/` schreiben darf? Mittwald-Support kann das einrichten, und wir haben ein Sync-Skript, das jeden Upload protokolliert."

Wenn die Antwort „Nein" lautet, wäre der nächste sinnvolle Schritt: Marketing-Ticket zur Geschäftsleitung mit dem Hinweis, dass die aktuelle Konstellation die Kampagnen-Performance messbar bremst.
