# GitHub-Push — Schritt-für-Schritt-Anleitung

Diese Anleitung führt Sie das erste Mal durch den Push dieses Repos zu GitHub und die Aktivierung von GitHub Pages als Staging-Umgebung.

## 1. GitHub-Account anlegen

Falls noch nicht vorhanden: https://github.com/signup mit `peernwiesner@gmail.com` (oder Datakustik-E-Mail, je nachdem ob Sie den Account beruflich oder privat führen wollen).

**Empfehlung:** Privater Account ist okay für den Start. Wenn das Repo später Datakustik-offiziell werden soll, kann der Account in eine Datakustik-Organisation übertragen werden — kein Datenverlust dabei.

## 2. Repo auf GitHub anlegen

1. Auf https://github.com/new gehen.
2. Repository-Name: `datakustik-padel-lp` (oder Name Ihrer Wahl).
3. Description: „Padel-Lärm Landingpage — Quellcode, Tracking-Setup, Deployment-Workflow".
4. **Public** wählen (kostenloses GitHub Pages braucht Public-Repo) — oder Private, wenn Sie GitHub Pro / Datakustik Team Account haben.
5. **Wichtig:** NICHT „Add a README", NICHT „Add .gitignore", NICHT „Choose a license" anklicken. Wir haben das alles schon lokal.
6. „Create repository" klicken.

GitHub zeigt jetzt einen Setup-Bildschirm mit den Befehlen. Den Block „…or push an existing repository from the command line" verwenden Sie gleich.

## 3. Lokales Repo mit GitHub verbinden

Terminal öffnen, ins Repo-Verzeichnis wechseln:

```bash
cd ~/Datakustik_Festplatte/Marketing/padel-lp-repo
```

Remote-URL hinzufügen (die URL kommt von GitHub im Setup-Bildschirm, sieht ungefähr so aus):

```bash
git remote add origin https://github.com/IHR-USERNAME/datakustik-padel-lp.git
git push -u origin main
```

GitHub fragt nach Authentifizierung:

- **Username:** Ihr GitHub-Username
- **Password:** **Nicht** Ihr GitHub-Passwort, sondern ein Personal Access Token. Anlegen über:
  https://github.com/settings/tokens → „Generate new token (classic)" → Scope „repo" anhaken → Token kopieren → als „Password" verwenden.

Nach erfolgreichem Push sind die Files auf GitHub. Refresh der Repo-Seite — die drei LP-Files sind sichtbar.

## 4. GitHub Pages aktivieren (Staging-URL erzeugen)

1. Im Repo auf **Settings** klicken (Reiter ganz rechts oben).
2. Im linken Menü **Pages** wählen.
3. Unter „Build and deployment":
   - **Source:** „Deploy from a branch"
   - **Branch:** `main`, Folder: `/ (root)`
   - „Save" klicken.
4. Nach 1–2 Minuten erscheint oben die Live-URL, z. B. `https://IHR-USERNAME.github.io/datakustik-padel-lp/`.

Ihre Staging-URL für die Landingpage ist dann:
```
https://IHR-USERNAME.github.io/datakustik-padel-lp/padel-laerm.html?utm_source=staging&utm_medium=test&utm_campaign=padel_qa
```

## 5. Workflow für künftige Änderungen

```bash
cd ~/Datakustik_Festplatte/Marketing/padel-lp-repo

# 1. Änderung machen — entweder direkt in den drei Files oder über den Master-Workflow
# 2. Schauen, was sich geändert hat:
git status
git diff

# 3. Änderung committen:
git add padel-laerm.html padel-laerm.js translations.js
git commit -m "Sprechende Commit-Message — z. B. 'Webinar-Datum auf 24.06.2026 verschoben'"

# 4. Pushen:
git push

# Nach ~30 Sek ist die Staging-URL aktualisiert.
```

## 6. Wenn etwas schiefgeht

**„fatal: refusing to merge unrelated histories":** Sie haben auf GitHub doch einen README angelegt. Lösung: `git pull origin main --allow-unrelated-histories` und Konflikt mergen.

**„Authentication failed":** Token abgelaufen oder falsch kopiert. Neuen Token erstellen, alten Eintrag aus dem macOS-Keychain löschen (Keychain Access → „github.com" suchen → löschen), beim nächsten Push neu eingeben.

**Staging-URL zeigt 404:** GitHub Pages braucht 1–5 Minuten nach der ersten Aktivierung. Wenn nach 10 Minuten noch 404: Settings → Pages prüfen, ob „Your site is live at…" angezeigt wird.

## 7. Optional: SSH-Key einrichten (komfortabler als Token)

Wer öfter pusht, sollte einen SSH-Key einrichten — dann fragt Git nicht mehr nach Passwort/Token.

```bash
ssh-keygen -t ed25519 -C "peernwiesner@gmail.com"
# Default-Pfad bestätigen, optional Passphrase setzen
cat ~/.ssh/id_ed25519.pub
# Den Inhalt kopieren, dann:
# https://github.com/settings/keys → "New SSH key" → einfügen → speichern
```

Dann Remote-URL umstellen:

```bash
git remote set-url origin git@github.com:IHR-USERNAME/datakustik-padel-lp.git
```

Ab dann lädt jeder Push ohne Passwort.
