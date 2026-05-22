/**
 * Padel-LP Lead-Form Backend (Google Apps Script)
 * DataKustik GmbH · 21.05.2026
 *
 * Endpoint für padel-laerm.html. Schreibt Lead ins Google Sheet
 * "Datakustik Padel Leads" und sendet Mail an sales@datakustik.com.
 *
 * Setup-Anleitung: SETUP_Apps_Script.md
 */

const CONFIG = {
  SHEET_ID:   'HIER_SHEET_ID_EINTRAGEN',  // aus URL: docs.google.com/spreadsheets/d/SHEET_ID/edit
  SHEET_NAME: 'Leads',
  MAIL_TO:    'sales@datakustik.com',
  MAIL_FROM:  'DataKustik Padel-LP',
};

function doPost(e) {
  try {
    const p = e.parameter || {};

    // 1. Honeypot — Bot füllt versteckte Felder
    if (p._honey) return ok();

    // 2. Pflichtfelder
    const required = ['Vorname', 'Nachname', 'Email', 'Rolle'];
    for (const f of required) {
      if (!p[f] || !p[f].trim()) return fail('Pflichtfeld ' + f + ' fehlt.');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.Email)) {
      return fail('Bitte gültige E-Mail-Adresse angeben.');
    }

    const webinar = p.Webinar || 'Nein';

    // 3. Sheet
    SpreadsheetApp.openById(CONFIG.SHEET_ID)
      .getSheetByName(CONFIG.SHEET_NAME)
      .appendRow([
        new Date(),
        p.Vorname, p.Nachname, p.Email,
        p.Firma || '', p.Telefon || '', p.Rolle,
        p.Anliegen || '', webinar,
        p.campaign_source || '', p.campaign_channel || '',
        p.landingpage || '', p.referrer || '',
      ]);

    // 4. Mail an Sales
    const tag = (webinar !== 'Nein') ? '[Padel-Lead+Webinar]' : '[Padel-Lead]';
    const subject = tag + ' ' + p.Vorname + ' ' + p.Nachname + ' (' + p.Rolle + ')';
    const body = [
      'Neuer Lead über Padel-Landingpage',
      '─'.repeat(50),
      'Name:    ' + p.Vorname + ' ' + p.Nachname,
      'Mail:    ' + p.Email,
      'Firma:   ' + (p.Firma || '—'),
      'Tel:     ' + (p.Telefon || '—'),
      'Rolle:   ' + p.Rolle,
      'Webinar: ' + webinar,
      '',
      'Anliegen:',
      p.Anliegen || '(keine Angabe)',
      '',
      '─'.repeat(50),
      'Kampagne: ' + (p.campaign_source || '—') + ' · ' + (p.campaign_channel || '—'),
      'Landingpage: ' + (p.landingpage || '—'),
      'Referrer: ' + (p.referrer || '—'),
      'Timestamp: ' + new Date().toISOString(),
    ].join('\n');

    GmailApp.sendEmail(CONFIG.MAIL_TO, subject, body, {
      name:    CONFIG.MAIL_FROM,
      replyTo: p.Email,
    });

    return ok();
  } catch (err) {
    Logger.log('ERROR: ' + (err.stack || err));
    return fail('Backend-Fehler: ' + err.message);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'padel-lp-backend' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok() {
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function fail(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
