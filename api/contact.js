/**
 * POST /api/contact — Serverless Function (Vercel, runtime Node).
 *
 * Riceve il form Commerce Diagnosis in JSON, valida i campi e recapita la
 * richiesta via Resend (https://resend.com).
 *
 * Variabili d'ambiente:
 *   RESEND_API_KEY   obbligatoria — chiave API Resend
 *   CONTACT_TO       destinatario   (default: hello@wevodigital.it)
 *   CONTACT_FROM     mittente verificato su Resend (default: onboarding@resend.dev)
 *
 * Senza RESEND_API_KEY la funzione risponde 503 { error: "unconfigured" }
 * e il front-end mostra il fallback mailto.
 */

'use strict';

var LIMITS = { nome: 120, azienda: 160, ruolo: 120, email: 200, sito: 200, sku: 20 };

var SKU_LABELS = {
  '<300': 'Meno di 300',
  '300-1000': '300 – 1.000',
  '1000-5000': '1.000 – 5.000',
  '>5000': 'Oltre 5.000'
};

var CANALI = ['Sito', 'Marketplace', 'Meta', 'Google', 'Altro'];

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return null; }
  }
  return null;
}

function clean(value, max) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  var body = readBody(req);
  if (!body) return res.status(400).json({ error: 'invalid_body' });

  /* Honeypot: risposta positiva, invio silenziosamente ignorato. */
  if (clean(body._gotcha, 200)) return res.status(200).json({ ok: true });

  var data = {
    nome: clean(body.nome, LIMITS.nome),
    azienda: clean(body.azienda, LIMITS.azienda),
    ruolo: clean(body.ruolo, LIMITS.ruolo),
    email: clean(body.email, LIMITS.email),
    sito: clean(body.sito, LIMITS.sito),
    sku: clean(body.sku, LIMITS.sku)
  };

  /* Canali: solo valori ammessi, senza duplicati. */
  var canali = (Array.isArray(body.canali) ? body.canali : [])
    .map(function (v) { return clean(v, 20); })
    .filter(function (v, i, all) { return CANALI.indexOf(v) !== -1 && all.indexOf(v) === i; });

  var missing = ['nome', 'azienda', 'ruolo', 'email', 'sku'].filter(function (key) {
    return !data[key];
  });
  if (missing.length) return res.status(400).json({ error: 'missing_fields', fields: missing });
  if (!EMAIL_RE.test(data.email)) return res.status(400).json({ error: 'invalid_email' });
  if (!SKU_LABELS[data.sku]) return res.status(400).json({ error: 'invalid_sku' });

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'unconfigured' });

  var lines = [
    ['Nome', data.nome],
    ['Azienda', data.azienda],
    ['Ruolo', data.ruolo],
    ['Email', data.email],
    ['Sito web', data.sito || '—'],
    ['Numero di SKU', SKU_LABELS[data.sku]],
    ['Canali di vendita', canali.length ? canali.join(', ') : '—']
  ];

  var html =
    '<h2 style="font:600 16px system-ui,sans-serif;margin:0 0 16px">Nuova richiesta di Commerce Diagnosis</h2>' +
    '<table style="font:14px/1.6 system-ui,sans-serif;border-collapse:collapse">' +
    lines.map(function (row) {
      return '<tr><td style="padding:4px 20px 4px 0;color:#666">' + row[0] +
        '</td><td style="padding:4px 0"><strong>' + escapeHtml(row[1]) + '</strong></td></tr>';
    }).join('') +
    '</table>';

  var text = lines.map(function (row) { return row[0] + ': ' + row[1]; }).join('\n');

  try {
    var response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Wevo Digital <onboarding@resend.dev>',
        to: [process.env.CONTACT_TO || 'hello@wevodigital.it'],
        reply_to: data.email,
        subject: 'Richiesta Commerce Diagnosis — ' + data.azienda,
        html: html,
        text: text
      })
    });

    if (!response.ok) {
      var detail = await response.text();
      console.error('Resend ha risposto', response.status, detail);
      return res.status(502).json({ error: 'delivery_failed' });
    }
  } catch (err) {
    console.error('Invio fallito:', err && err.message);
    return res.status(502).json({ error: 'delivery_failed' });
  }

  return res.status(200).json({ ok: true });
};
