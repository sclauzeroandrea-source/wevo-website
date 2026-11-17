/* =========================================================
   Wevo Digital — interazioni
   ========================================================= */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.remove('no-js');

  /* ---------- Tracking: dataLayer + GTM dopo il consenso ---------- */
  window.dataLayer = window.dataLayer || [];

  function track(event, params) {
    var payload = { event: event };
    if (params) {
      Object.keys(params).forEach(function (key) { payload[key] = params[key]; });
    }
    window.dataLayer.push(payload);
  }

  var gtmId = (document.body.dataset.gtmId || '').trim();
  var gtmLoaded = false;

  function loadGtm() {
    if (gtmLoaded || !gtmId) return;
    gtmLoaded = true;
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtmId);
    document.head.appendChild(s);
  }

  /*
   * Da chiamare dal CMP quando l'utente accetta:
   *   window.wevoConsent.update({ analytics: true, ads: false })
   * Aggiorna Consent Mode v2 e carica GTM solo se almeno una categoria è concessa.
   */
  window.wevoConsent = {
    update: function (choice) {
      var analytics = Boolean(choice && choice.analytics);
      var ads = Boolean(choice && choice.ads);
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: analytics ? 'granted' : 'denied',
          ad_storage: ads ? 'granted' : 'denied',
          ad_user_data: ads ? 'granted' : 'denied',
          ad_personalization: ads ? 'granted' : 'denied'
        });
      }
      if (analytics || ads) loadGtm();
    }
  };

  document.addEventListener('click', function (e) {
    var cta = e.target.closest('[data-cta]');
    if (cta) track('cta_click', { cta_location: cta.dataset.cta, cta_text: cta.textContent.trim() });
  });

  /* ---------- Anno corrente ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Nav: stato sticky ---------- */
  var nav = document.querySelector('.nav');
  var onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 12);
  };
  if (nav) {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Nav: menu mobile ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('nav-menu');

  var closeMenu = function () {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Apri il menu');
    menu.classList.remove('is-open');
  };

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Apri il menu' : 'Chiudi il menu');
      menu.classList.toggle('is-open', !open);
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduced) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(revealables, function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Form Commerce Diagnosis ---------- */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusBox = document.getElementById('form-status');
  var successBox = document.getElementById('form-success');
  var resetBtn = document.getElementById('form-reset');
  var submitBtn = form.querySelector('button[type="submit"]');
  var fallbackEmail = form.dataset.fallbackEmail || '';

  var MESSAGES = {
    nome: 'Inserite il vostro nome.',
    azienda: 'Inserite il nome dell\'azienda.',
    ruolo: 'Indicate il vostro ruolo.',
    email: 'Inserite un indirizzo email valido.',
    sku: 'Selezionate il numero di SKU.'
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function fieldOf(input) {
    return input.closest('.field');
  }

  function setError(input, message) {
    var wrap = fieldOf(input);
    var note = form.querySelector('[data-error-for="' + input.name + '"]');
    if (wrap) wrap.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (note) {
      if (!note.id) note.id = 'err-' + input.name;
      note.textContent = message || '';
      note.hidden = !message;
      if (message) input.setAttribute('aria-describedby', note.id);
      else input.removeAttribute('aria-describedby');
    }
  }

  function validate(input) {
    var value = (input.value || '').trim();
    var message = '';

    if (input.required && !value) {
      message = MESSAGES[input.name] || 'Campo obbligatorio.';
    } else if (input.type === 'email' && value && !EMAIL_RE.test(value)) {
      message = MESSAGES.email;
    }

    setError(input, message);
    return !message;
  }

  var controls = form.querySelectorAll('input[required], select[required], input[type="email"]');

  Array.prototype.forEach.call(controls, function (input) {
    var evt = input.tagName === 'SELECT' ? 'change' : 'blur';
    input.addEventListener(evt, function () { validate(input); });
    input.addEventListener('input', function () {
      if (fieldOf(input) && fieldOf(input).classList.contains('is-invalid')) validate(input);
    });
  });

  var started = false;
  form.addEventListener('focusin', function () {
    if (started) return;
    started = true;
    track('form_start', { form_id: 'commerce_diagnosis' });
  });

  function showStatus(html) {
    if (!statusBox) return;
    statusBox.innerHTML = html;
    statusBox.hidden = false;
  }

  function clearStatus() {
    if (!statusBox) return;
    statusBox.hidden = true;
    statusBox.textContent = '';
  }

  function collect() {
    var data = new FormData(form);
    return {
      nome: data.get('nome') || '',
      azienda: data.get('azienda') || '',
      ruolo: data.get('ruolo') || '',
      email: data.get('email') || '',
      sito: data.get('sito') || '',
      sku: data.get('sku') || '',
      canali: data.getAll('canali'),
      _gotcha: data.get('_gotcha') || ''
    };
  }

  function mailtoFallback(p) {
    if (!fallbackEmail) return '';
    var body = [
      'Nome: ' + p.nome,
      'Azienda: ' + p.azienda,
      'Ruolo: ' + p.ruolo,
      'Email: ' + p.email,
      'Sito web: ' + (p.sito || '—'),
      'Numero di SKU: ' + p.sku,
      'Canali di vendita: ' + (p.canali.length ? p.canali.join(', ') : '—')
    ].join('\n');

    return ' Scriveteci a <a href="mailto:' + fallbackEmail +
      '?subject=' + encodeURIComponent('Richiesta Commerce Diagnosis — ' + p.azienda) +
      '&body=' + encodeURIComponent(body) + '">' + fallbackEmail + '</a>.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearStatus();

    var firstInvalid = null;
    Array.prototype.forEach.call(controls, function (input) {
      if (!validate(input) && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var payload = collect();

    /* Honeypot: la richiesta si chiude qui. */
    if (payload._gotcha.trim()) return;
    delete payload._gotcha;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso…';

    fetch(form.getAttribute('action'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.ok) {
          track('generate_lead', { form_id: 'commerce_diagnosis', sku_range: payload.sku });
          form.hidden = true;
          successBox.hidden = false;
          successBox.focus();
          form.reset();
          return;
        }
        return res.json().catch(function () { return {}; }).then(function (info) {
          showStatus(info.error === 'unconfigured'
            ? 'L\'invio dal sito è in configurazione.' + mailtoFallback(payload)
            : 'L\'invio è stato interrotto. Riprovate tra qualche istante.' + mailtoFallback(payload));
        });
      })
      .catch(function () {
        showStatus('L\'invio è stato interrotto. Riprovate tra qualche istante.' + mailtoFallback(payload));
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.label;
      });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      successBox.hidden = true;
      form.hidden = false;
      started = false;
      clearStatus();
      Array.prototype.forEach.call(controls, function (input) { setError(input, ''); });
      form.querySelector('#nome').focus();
    });
  }
})();

/* Hero: scala la scena 640×560 alla larghezza della colonna */
(function () {
  var box = document.querySelector('.hx');
  if (!box) return;
  function fit() { box.style.setProperty('--hx-scale', (box.clientWidth / 640).toFixed(4)); }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(box);
  else window.addEventListener('resize', fit);
})();
