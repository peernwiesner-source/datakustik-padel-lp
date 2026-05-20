# datakustik-deploy — Changelog

Reverse-chronologisches Sync-Log: Master → deploy. Neueste Einträge oben. Jeder Eintrag dokumentiert, was bei einem Sync von `Marketing/Content/.../01_Master/` in diesen Ordner inhaltlich übernommen wurde — damit Kollegen auf der Festplatte sofort sehen, ob ein Sync neue Inhalte oder nur Timestamps bringt.

---

## 2026-05-20 (Nachmittag) — Bugfixes Welle 1 (Bridge, Privacy EN/IT, Newsletter-CTA)

**Files**
- padel-laerm.html
- padel-laerm.js
- translations.js

**Was geändert wurde**
- **Consent-Bridge** (`padel-laerm.js`): Liest jetzt `e.detail['Google Analytics 4']` mit Fallback auf `'Google Analytics'`. Vorher wurde der Service-Rename in Usercentrics nicht erkannt → `analytics_storage` wurde nach jedem Accept fälschlich wieder auf `denied` gesetzt. **GA4-Tracking lief seit dem UC-Rename praktisch komplett kaputt.**
- **EN/IT Privacy-Link** (`translations.js`): Alle Vorkommen von `https://www.datakustik.com/en/privacy/` → `https://www.datakustik.com/data-protection/` (4 Stellen). Die alte URL war 404.
- **Newsletter-CTA** (alle 3 Files): Neuer Soft-Conversion-Block direkt nach dem CTA-Band („Noch nicht bereit für ein Gespräch?") plus Footer-Link, beides → `https://account.datakustik.com/de/newsletter/subscribe` mit UTM-Tagging (`utm_source=padel_lp&utm_medium=cta&utm_campaign=newsletter_padel_2026`). Neuer GA4-Event `newsletter_click` (50 €, Soft-Conversion) mit `cta_position`-Dimension. 6-Sprachen-i18n (DE/EN/FR/ES/ZH/IT).
- **WICHTIG — Upload-Hinweis:** Beim FTP-Upload zu Mittwald MÜSSEN alle drei Files (padel-laerm.html + padel-laerm.js + translations.js) übertragen werden. In den letzten Wochen wurde nur die HTML hochgeladen, dadurch lief auf Live ein veraltetes JS (Webinar-Datum 09.06. statt 24.06., GA4 v1.0 statt v2.0, keine Advanced-Consent-Bridge). Backup vorher: `backup/pre_bugfix_newsletter_*/`.

---

## 2026-05-20 07:37 — Advanced Consent Mode v2 (cookieless pings + modeling)

**Files**
- padel-laerm.html
- padel-laerm.js

**Was geändert wurde**
- `<head>`: Consent Mode auf Advanced umgestellt. Default-Deny ergänzt um `ad_user_data` + `ad_personalization` (Pflicht seit Consent Mode v2, März 2024). Neue Flags `url_passthrough: true` und `ads_data_redaction: true` aktivieren cookieless Pings und automatische IP-/Click-ID-Maskierung.
- Bridge in `padel-laerm.js`: `gtag('consent', 'update', ...)` setzt jetzt alle vier Signale (analytics_storage, ad_storage, ad_user_data, ad_personalization) statt nur zwei — sonst bleiben die neuen v2-Signale für immer auf `denied`.
- Erwartete Wirkung: bei „Ablehnen" sendet GA4 weiter anonyme Pings, Google modelliert daraus 40–60 % der sonst verlorenen Conversions. DSGVO-konform — keine User-ID, keine PII, IPs maskiert.
- Usercentrics-Side: Toggle „Google Consent Mode" in CMP Settings war bereits aktiv (= Step 1 der Usercentrics-Doku erledigt). Dieser Sync ist Step 2.
- Backup vorher: `backup/pre_advanced_consent_20260520_073700/`

---

## 2026-05-07 14:37 — "Andere Länder / Regionen" jetzt in allen drei Tabs

**Files**
- padel-laerm.html
- translations.js

**Was geändert wurde**
- Internationaler Hinweis-Block (Taktmaximalverfahren / CadnaA-Industrieschallquellen / Impuls-Zuschlag) wird jetzt zusätzlich in Tab 2 (Bauämter & Kommunen) und Tab 3 (Gutachter & Sachverständige) angezeigt — bisher nur in Tab 1.
- Neue i18n-Keys: `p2.intl.label/text` und `p3.intl.label/text` in allen 6 Sprachen (DE/EN/FR/ES/ZH/IT) — Inhalt initial identisch zu p1.intl, kann pro Tab später audience-spezifisch geschärft werden.
- Backup vorher: `backup/pre_sync_20260507_143720/`

---


## 20260513_090151 — Mobile-Court 4 Spieler · CadnaA-CSS-Fix · Webinar 24.06.2026
- Mobile-SVG: +2 Partner-Spieler hinzugefügt (Padel-Doppel-Korrektur, vorher nur 2)
- CSS .banner-meta: text-transform:uppercase ENTFERNT (CadnaA / BImSchV jetzt mixed case statt CADNAA / BIMSCHV)
- Webinar-Datum: 09.06.2026 → 24.06.2026 in HTML, JS, translations.js (DE/EN/FR/ES/IT/ZH), contact.php, Code.gs (Apps Script)

## 20260513_093801 — Copy-Alignment: 'erhoben' → 'abgeleitet' im Hero-Sub
- DE: "DataKustik hat die fehlenden Emissionskennwerte abgeleitet …"
- EN: "DataKustik has derived the missing emission values …"
- FR: "DataKustik a dérivé les valeurs d'émission manquantes …"
- ES: "DataKustik ha derivado los valores de emisión faltantes …"
- IT: "DataKustik ha derivato i valori di emissione finora mancanti …"
- ZH: "DataKustik已推算出缺失的排放数据 …"
- Grund: Konsistenz mit NNI-Werbemitteln, wo "derived" statt "measured" verwendet wird (Pickleball wurde nicht von DataKustik gemessen).
