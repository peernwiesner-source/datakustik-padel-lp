/**
 * padel-laerm.js – DataKustik Padel Landingpage
 * Tab-Navigation + Kontaktformular (AJAX → Google Apps Script) + i18n (DE/EN/FR/ES/ZH/IT)
 * + GA4 Event Tracking v2.0 (Measurement ID G-Y5GTQNCL71, Stream-ID 5001292825)
 *
 * Tracking-Schema: siehe Marketing/Marketing Strategy/202605_GA4_KPI_Tracking/202605_GA4_Event-Schema.xlsx
 * v2.0 Changelog (2026-05-04):
 *  - Conversion-Werte ergänzt (generate_lead 500 €, webinar_signup 100 €)
 *  - UTM-Parameter sauber gesplittet als eigene Custom-Dim-Felder
 *  - target_group abgeleitet aus utm_term oder Rolle-Select
 *  - Naming vereinheitlicht: cta_position (statt button_location), language_from/_to
 *  - Neue Events: download_dossier, download_paper, outbound_click, scroll (25/50/75),
 *    form_start, form_field_error
 *  - Backward-Compat: alte Parameter-Namen werden parallel mitgeschickt (3 Wochen,
 *    danach entfernen)
 */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════════════
   * 1. UTM- & TARGET-GROUP-CAPTURE  (Closure-Vars für alle Events nutzbar)
   * ════════════════════════════════════════════════════════════════════════ */
  var urlParams = new URLSearchParams(window.location.search);
  var UTM = {
    source:   (urlParams.get('utm_source')   || 'direct').toLowerCase(),
    medium:   (urlParams.get('utm_medium')   || 'none').toLowerCase(),
    campaign: (urlParams.get('utm_campaign') || 'organic').toLowerCase(),
    content:  (urlParams.get('utm_content')  || '').toLowerCase(),
    term:     (urlParams.get('utm_term')     || '').toLowerCase()
  };

  // Map "Rolle/Perspektive"-Select zu target_group-Dimension (snake_case).
  var ROLE_TO_GROUP = {
    'Gutachter / Ingenieur-Büro':    'gutachter',
    'Bauamt / Kommune':              'kommune',
    'Sportanlagen-Hersteller':       'koop',
    'Verein / Verband':              'koop',
    'Betreiber / Investor':          'betreiber',
    'Fachpresse':                    'medien',
    'Bestandskunde':                 'bestand',
    'Sonstiges':                     'unknown'
  };

  // target_group Priorität: utm_term > Rolle-Select > 'unknown'
  function resolveTargetGroup() {
    if (UTM.term) return UTM.term;
    var role = document.getElementById('fRole');
    if (role && role.value && ROLE_TO_GROUP[role.value]) return ROLE_TO_GROUP[role.value];
    return 'unknown';
  }

  // Standard-Parameter, die JEDES Event begleiten (Custom Dimensions in GA4)
  // `environment` wird zusätzlich als Event-Param mitgeschickt, damit auch event-scoped
  // Reports/Filter sauber zwischen Staging und Production trennen können.
  function baseParams(extra) {
    var p = {
      campaign_source:  UTM.source,
      campaign_medium:  UTM.medium,
      campaign_name:    UTM.campaign,
      campaign_content: UTM.content,
      campaign_term:    UTM.term,
      target_group:     resolveTargetGroup(),
      language:         currentLang,
      environment:      window.DK_ENV || 'production'
    };
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }

  /* ════════════════════════════════════════════════════════════════════════
   * 2. GA4 HELPER (Wrapper)
   * ════════════════════════════════════════════════════════════════════════ */
  function trackEvent(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params || {});
    }
    // Optional: Bei Bedarf via window.dataLayer.push für spätere GTM-Migration
    // window.dataLayer = window.dataLayer || [];
    // window.dataLayer.push({ event: eventName, params: params });
  }

  /* ════════════════════════════════════════════════════════════════════════
   * 3. USERCENTRICS → GA4 CONSENT MODE v2 BRÜCKE
   * ════════════════════════════════════════════════════════════════════════ */
  // Bridge: Usercentrics → GA4 Consent Mode v2 Update
  // ad_storage / ad_user_data / ad_personalization bleiben 'denied' bis Datakustik
  // Google Ads aktiv nutzt — dann hier auf 'granted' umstellen.
  window.addEventListener('ucEvent', function (e) {
    if (!e.detail || typeof gtag !== 'function') return;
    var ev = e.detail.event;
    if (ev === 'consent_status' || ev === 'ACCEPT_ALL' || ev === 'onAcceptAllServices') {
      // Usercentrics hat den Service in 2026 von "Google Analytics" auf "Google Analytics 4" umbenannt.
      // Beide Schreibweisen prüfen, sonst wird analytics_storage nach Accept fälschlich wieder denied.
      var gaConsent = e.detail['Google Analytics 4'] || e.detail['Google Analytics'];
      gtag('consent', 'update', {
        analytics_storage:  gaConsent ? 'granted' : 'denied',
        ad_storage:         'denied',
        ad_user_data:       'denied',
        ad_personalization: 'denied'
      });
    }
  });
  window.addEventListener('UC_UI_CMP_EVENT', function (e) {
    if (!e.detail || typeof gtag !== 'function') return;
    if (e.detail.type === 'ACCEPT_ALL' || e.detail.type === 'SAVE') {
      gtag('consent', 'update', {
        analytics_storage:  'granted',
        ad_storage:         'denied',
        ad_user_data:       'denied',
        ad_personalization: 'denied'
      });
    }
  });

  /* ════════════════════════════════════════════════════════════════════════
   * 4. TAB NAVIGATION (Event-Delegation – robust gegen DOM-Mutationen
   *     durch i18n und gegen Klicks auf inneren SVG/Span-Kindern)
   * ════════════════════════════════════════════════════════════════════════ */
  function activateTab(btn) {
    if (!btn) return;
    var id = btn.getAttribute('data-tab');
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    var target = document.getElementById('tab-' + id);
    if (target) target.classList.add('active');
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    trackEvent('tab_click', baseParams({ tab_name: id }));
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest('.tab-btn[data-tab]') : null;
    if (!btn) return;
    ev.preventDefault();
    activateTab(btn);
  });

  // Keyboard support (Enter/Space) für Accessibility
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var btn = ev.target && ev.target.closest ? ev.target.closest('.tab-btn[data-tab]') : null;
    if (!btn) return;
    ev.preventDefault();
    activateTab(btn);
  });

  /* ════════════════════════════════════════════════════════════════════════
   * 5. LANGUAGE SWITCHING
   * ════════════════════════════════════════════════════════════════════════ */
  var currentLang = 'de';

  function applyLang(lang) {
    if (typeof TRANSLATIONS === 'undefined') return;
    if (!TRANSLATIONS[lang]) lang = 'de';
    var prevLang = currentLang;
    currentLang = lang;
    var t = TRANSLATIONS[lang];

    try { sessionStorage.setItem('dk_lang', lang); } catch(e) {}
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      if (t[key] !== undefined) el.placeholder = t[key];
    });

    var roleSelect = document.getElementById('fRole');
    if (roleSelect) {
      var opts = roleSelect.querySelectorAll('option');
      var keys = ['form.role.placeholder',
                  'form.role.o1','form.role.o2','form.role.o3','form.role.o4',
                  'form.role.o5','form.role.o6','form.role.o7','form.role.o8'];
      opts.forEach(function(opt, i) {
        if (t[keys[i]]) opt.textContent = t[keys[i]];
      });
    }

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Nav-Logo: datakustik.com hat NUR /de/ (DE) und / (EN) als komplette Sites.
    // Root „/" ist die englische Version (laut hreflang=en-US), /de/ ist die deutsche.
    // Für FR/ES/IT/ZH gibt es keine eigene Site → fällt auf englische Root zurück.
    var navLogo = document.querySelector('.nav-logo');
    if (navLogo) {
      navLogo.href = (lang === 'de')
        ? 'https://www.datakustik.com/de/'
        : 'https://www.datakustik.com/';
    }

    var submitBtn = document.getElementById('formSubmit');
    if (submitBtn && !submitBtn.disabled && t['form.submit']) {
      submitBtn.textContent = t['form.submit'];
    }
    return prevLang;
  }

  function detectAndApplyLang() {
    var stored;
    try { stored = sessionStorage.getItem('dk_lang'); } catch(e) {}
    if (stored && typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[stored]) {
      applyLang(stored);
      return;
    }
    applyLang('de');
    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var map = {
          'DE':'de','AT':'de','CH':'de','LI':'de',
          'GB':'en','US':'en','AU':'en','CA':'en','NZ':'en','IE':'en','ZA':'en','IN':'en',
          'FR':'fr','BE':'fr','LU':'fr','MC':'fr',
          'ES':'es','MX':'es','AR':'es','CO':'es','CL':'es','PE':'es',
          'BO':'es','EC':'es','PY':'es','UY':'es','VE':'es',
          'CN':'zh','TW':'zh','HK':'zh','MO':'zh',
          'IT':'it','SM':'it','VA':'it'
        };
        var detected = map[d.country_code];
        var pref;
        try { pref = sessionStorage.getItem('dk_lang'); } catch(e) {}
        if (!pref && detected && detected !== 'de') applyLang(detected);
      })
      .catch(function () {});
  }

  // Lang-Buttons → language_switch Event mit language_from/_to
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var newLang = this.getAttribute('data-lang');
      var prev = currentLang;
      applyLang(newLang);
      trackEvent('language_switch', baseParams({
        language_from: prev,
        language_to:   newLang,
        language:      newLang  // Backward-Compat
      }));
    });
  });

  detectAndApplyLang();

  /* ════════════════════════════════════════════════════════════════════════
   * 6. CTA-BUTTON-TRACKING (vereinheitlicht: cta_position + cta_label)
   * ════════════════════════════════════════════════════════════════════════ */
  function bindCta(selector, position) {
    document.querySelectorAll(selector).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var label = (btn.textContent || '').trim().substring(0, 80);
        var dest  = btn.getAttribute('href') || '';
        trackEvent('cta_click', baseParams({
          cta_position:    position,
          cta_label:       label,
          cta_destination: dest,
          button_location: position  // Backward-Compat (3 Wochen)
        }));
      });
    });
  }
  bindCta('.nav-cta', 'nav');
  bindCta('.hero .btn-primary', 'hero');
  bindCta('.cta-band .btn-white-ghost, .cta-band .btn-white', 'cta_band');
  bindCta('[data-cta]', 'inline'); // generisch für künftige Inline-CTAs

  /* ════════════════════════════════════════════════════════════════════════
   * 7. SCROLL-TRACKING — 25 / 50 / 75 % + scroll_to_form
   * ════════════════════════════════════════════════════════════════════════ */
  (function () {
    var fired = { 25: false, 50: false, 75: false };
    var ticking = false;
    function checkScroll() {
      var docH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      ) - window.innerHeight;
      if (docH <= 0) return;
      var pct = Math.round((window.scrollY / docH) * 100);
      [25, 50, 75].forEach(function (mark) {
        if (!fired[mark] && pct >= mark) {
          fired[mark] = true;
          trackEvent('scroll', baseParams({ percent_scrolled: mark }));
        }
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(checkScroll);
        ticking = true;
      }
    }, { passive: true });
  })();

  // scroll_to_form (separat — feuert genau einmal, wenn Form-Section sichtbar wird)
  var formSection = document.getElementById('registrierung');
  if (formSection && typeof IntersectionObserver !== 'undefined') {
    var formScrollFired = false;
    var formObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !formScrollFired) {
          formScrollFired = true;
          trackEvent('scroll_to_form', baseParams());
          formObserver.disconnect();
        }
      });
    }, { threshold: 0.2 });
    formObserver.observe(formSection);
  }

  /* ════════════════════════════════════════════════════════════════════════
   * 8. DOWNLOAD-TRACKING — download_dossier / download_paper / Backup
   *
   * Konvention: Auf Download-Links data-track-Attribute setzen, z.B.:
   *   <a href="dossiers/Padel_Laerm_Bauamt_DE.docx"
   *      data-track="dossier" data-dossier-type="bauamt">…</a>
   *
   *   <a href="papers/DAGA26_Ballschlaggeraeusche.pdf"
   *      data-track="paper" data-paper-id="DAGA26"
   *      data-paper-title="Ballschlaggeräusche">…</a>
   *
   * Auto-Backup: Alle .pdf/.docx/.xlsx-Links ohne data-track feuern 'file_download'.
   * ════════════════════════════════════════════════════════════════════════ */
  function isFileLink(href) {
    return /\.(pdf|docx?|xlsx?|pptx?|zip)(\?|$)/i.test(href || '');
  }
  function fileMeta(href) {
    var m = (href || '').match(/\/?([^\/?#]+\.([a-z0-9]+))(?:[?#]|$)/i);
    return m ? { file_name: m[1], file_extension: (m[2] || '').toLowerCase() } : { file_name: '', file_extension: '' };
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var trackKind = a.getAttribute('data-track');

    // Explizit getaggte Downloads
    if (trackKind === 'dossier') {
      trackEvent('download_dossier', baseParams({
        dossier_type:  a.getAttribute('data-dossier-type') || 'unknown',
        file_name:     fileMeta(href).file_name,
        link_url:      a.href,
        content_type:  'dossier'
      }));
      return;
    }
    if (trackKind === 'paper') {
      trackEvent('download_paper', baseParams({
        paper_id:    a.getAttribute('data-paper-id')    || 'unknown',
        paper_title: a.getAttribute('data-paper-title') || '',
        file_name:   fileMeta(href).file_name,
        link_url:    a.href,
        content_type: 'paper'
      }));
      return;
    }
    if (trackKind === 'press_kit') {
      trackEvent('outbound_click', baseParams({
        link_url:     a.href,
        link_domain:  (a.hostname || ''),
        link_text:    (a.textContent || '').trim().substring(0, 80),
        content_type: 'press_kit'
      }));
      return;
    }

    // Auto-Detect: Datei-Download (Backup für ungetaggte Files)
    if (isFileLink(href)) {
      var meta = fileMeta(href);
      trackEvent('file_download', baseParams({
        file_name:      meta.file_name,
        file_extension: meta.file_extension,
        link_url:       a.href
      }));
      return;
    }

    // Newsletter-Click (Soft-Conversion, 50 €) — feuert für alle a[data-cta="newsletter"]
    // Auch der Datakustik-Subdomain account.datakustik.com wird hier abgefangen, damit kein
    // doppeltes outbound_click-Event entsteht.
    if (a.getAttribute && a.getAttribute('data-cta') === 'newsletter') {
      trackEvent('newsletter_click', baseParams({
        cta_position:  a.getAttribute('data-cta-position') || 'unknown',
        content_type:  'newsletter_signup',
        link_url:      a.href,
        value:         50,
        currency:      'EUR'
      }));
      return;
    }

    // Auto-Detect: Outbound-Click (nicht datakustik.com / nicht account.datakustik.com)
    if (a.hostname && a.hostname !== window.location.hostname &&
        a.hostname !== 'www.datakustik.com' &&
        a.hostname !== 'datakustik.com' &&
        a.hostname !== 'account.datakustik.com') {
      trackEvent('outbound_click', baseParams({
        link_url:    a.href,
        link_domain: a.hostname,
        link_text:   (a.textContent || '').trim().substring(0, 80)
      }));
    }
  }, true);

  /* ════════════════════════════════════════════════════════════════════════
   * 9. WEBINAR-CARD TOGGLE
   * ════════════════════════════════════════════════════════════════════════ */
  var wCard  = document.getElementById('webinarCard');
  var wField = document.getElementById('fWebinar');

  function toggleWebinar() {
    if (!wCard || !wField) return;
    var active = wCard.classList.toggle('selected');
    wField.value = active ? 'Ja – Webinar 24.06.2026, 16:00 CEST' : 'Nein';
    wCard.setAttribute('aria-checked', String(active));
  }

  if (wCard) {
    wCard.addEventListener('click', toggleWebinar);
    wCard.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleWebinar(); }
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
   * 10. LEAD FORM — UTM-Hidden-Fields, form_start, field_error, Submit
   * ════════════════════════════════════════════════════════════════════════ */
  var form = document.getElementById('padelLeadForm');
  if (!form) return;

  // UTM-Hidden-Fields (für Server-Side / Backend)
  var legacyChannel = UTM.source;
  if (UTM.medium && UTM.medium !== 'none')   legacyChannel += ' / ' + UTM.medium;
  if (UTM.campaign && UTM.campaign !== 'organic') legacyChannel += ' / ' + UTM.campaign;
  var fldChannel  = document.getElementById('fldChannel');
  var fldReferrer = document.getElementById('fldReferrer');
  if (fldChannel)  fldChannel.value  = legacyChannel;
  if (fldReferrer) fldReferrer.value = document.referrer || '';

  // form_start — feuert genau einmal, wenn das erste Formularfeld fokussiert wird
  var formStartFired = false;
  form.addEventListener('focusin', function () {
    if (formStartFired) return;
    formStartFired = true;
    trackEvent('form_start', baseParams({ form_name: 'padel_lead' }));
  });

  // form_field_error — bei HTML5-Validierungs-Fehlern
  form.addEventListener('invalid', function (ev) {
    var f = ev.target;
    if (!f || !f.name) return;
    trackEvent('form_field_error', baseParams({
      form_name:  'padel_lead',
      field_name: f.name,
      error_type: f.validationMessage ? 'validation' : 'unknown'
    }));
  }, true); // capture-phase, da invalid nicht bubbelt

  var okEl  = document.getElementById('formSuccess');
  var errEl = document.getElementById('formError');
  var btn   = document.getElementById('formSubmit');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang])
            ? TRANSLATIONS[currentLang]
            : TRANSLATIONS['de'];

    if (okEl)  okEl.classList.remove('show');
    if (errEl) errEl.classList.remove('show');
    btn.disabled    = true;
    btn.textContent = t['form.sending'] || 'Wird gesendet…';

    // URLSearchParams statt FormData → kompatibel mit Apps Script doPost (e.parameter)
    var data = new URLSearchParams(new FormData(form));
    var webinarSelected = wCard && wCard.classList.contains('selected');

    fetch(form.action, {
      method:  'POST',
      body:    data,
      headers: { 'Accept': 'application/json' }
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (res.ok && data.success) {
          var wConfirm = document.getElementById('webinarConfirm');
          if (wConfirm) {
            wConfirm.textContent = webinarSelected
              ? (t['form.success.webinar'] || ' Ihre Webinar-Anmeldung für den 24. Juni 2026, 16:00 Uhr CEST ist vorgemerkt.')
              : '';
          }
          var baseEl = document.getElementById('formSuccessBase');
          if (baseEl) baseEl.textContent = t['form.success'] || 'Danke — Ihre Anfrage ist eingegangen. Wir melden uns in Kürze.';

          if (okEl) {
            okEl.classList.add('show');
            okEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // GA4: generate_lead — IMMER feuern (PRIMARY-Conversion, 500 €)
          trackEvent('generate_lead', baseParams({
            form_name:      'padel_lead',
            content_type:   'lead_form',
            value:          500,
            currency:       'EUR',
            webinar_opt_in: webinarSelected ? 'yes' : 'no',
            channel:        legacyChannel  // Backward-Compat
          }));

          // GA4: webinar_signup — nur bei aktivierter Webinar-Card (PRIMARY, 100 €)
          if (webinarSelected) {
            trackEvent('webinar_signup', baseParams({
              webinar_name: 'padel_basics_2026_06_09',
              webinar_date: '2026-06-24',
              value:        100,
              currency:     'EUR'
            }));
          }

          form.reset();
          if (wCard)  wCard.classList.remove('selected');
          if (wField) wField.value = 'Nein';
          btn.textContent = t['form.sent'] || 'Gesendet ✓';
          setTimeout(function () {
            btn.disabled    = false;
            btn.textContent = t['form.submit'] || 'Registrierung absenden';
          }, 3500);
        } else {
          throw new Error(data.error || 'Unbekannter Fehler');
        }
      });
    })
    .catch(function () {
      var t2 = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang])
               ? TRANSLATIONS[currentLang]
               : { 'form.error': 'Leider ist beim Senden ein Fehler aufgetreten. Bitte schreiben Sie direkt an sales@datakustik.com.', 'form.submit': 'Registrierung absenden' };
      if (errEl) {
        errEl.textContent = t2['form.error'];
        errEl.classList.add('show');
      }
      btn.disabled    = false;
      btn.textContent = t2['form.submit'] || 'Registrierung absenden';

      // Diagnose-Event bei Submit-Fehler
      trackEvent('form_field_error', baseParams({
        form_name:  'padel_lead',
        field_name: '__submit__',
        error_type: 'network_or_backend'
      }));
    });
  });

})();
