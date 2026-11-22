# Wevo Digital — sito MVP

Sito one-page statico per **Wevo Digital**, Commerce Content Operations.
Il copy viene da `content/copy.md`; le regole per chi ci lavora (anche Claude Code) sono in `CLAUDE.md`.
HTML, CSS e JavaScript vanilla: zero build step, zero dipendenze runtime.

```
index.html                 pagina unica con anchor navigation
content/copy.md            fonte del testo della pagina
CLAUDE.md                  brief e regole per lo sviluppo
assets/css/styles.css      design system (token, componenti, responsive)
assets/js/main.js          nav mobile, reveal, form, dataLayer e GTM dopo il consenso
assets/img/og-wevo.png     immagine Open Graph 1200×630
api/contact.js             endpoint serverless del form di contatto (Vercel)
tools/og-template.html     sorgente dell'immagine OG
tools/build-og.js          script di rigenerazione dell'immagine OG
```

## Avvio in locale

Qualsiasi server statico va bene:

```bash
npx http-server -p 8080 .
# oppure
python3 -m http.server 8080
```

Il sito è statico: si pubblica così com'è su Netlify, Vercel, Cloudflare Pages,
GitHub Pages o un qualsiasi hosting con web server.

## Da configurare prima del go-live

| Elemento | Dove | Valore attuale |
| --- | --- | --- |
| Recapito del form | variabile d'ambiente `RESEND_API_KEY` su Vercel | da impostare |
| Email di contatto | `index.html` (link `mailto:`, `data-fallback-email`, JSON-LD) | `hello@wevodigital.it` |
| Profilo LinkedIn | `index.html` → sezione Contatti | `linkedin.com/company/wevo-digital` |
| Dominio | `index.html` → `canonical`, `og:url`, `og:image`, `twitter:image` | `https://www.wevodigital.it/` |
| Link di Innovadog e Golfo Paradiso | `index.html` → sezione Casi, griglia Clienti | wordmark senza link, URL da fornire |
| Container GTM | `index.html` → `data-gtm-id` sul `<body>` | vuoto |
| CMP / banner cookie | da integrare, deve chiamare `window.wevoConsent.update({ analytics, ads })` | assente |
| Segnaposto del copy (`[DA APPROVARE]`, `[DA PREPARARE]`, …) | `index.html`, evidenziati in arancione | da completare |

### Form Commerce Diagnosis

Campi: nome, azienda, ruolo, email, sito (facoltativo), numero di SKU (`<300`, `300-1000`, `1000-5000`, `>5000`), canali di vendita (array tra Sito, Marketplace, Meta, Google, Altro).

Il form fa POST in JSON su `/api/contact`, una Serverless Function che Vercel
rileva automaticamente dalla cartella `api/`. La funzione valida i campi lato
server e recapita la richiesta via [Resend](https://resend.com).

Per attivare il recapito servono le variabili d'ambiente del progetto Vercel
(*Settings → Environment Variables*):

| Variabile | Obbligatoria | Default |
| --- | --- | --- |
| `RESEND_API_KEY` | sì | — |
| `CONTACT_TO` | no | `hello@wevodigital.it` |
| `CONTACT_FROM` | no | `Wevo Digital <onboarding@resend.dev>` |

`CONTACT_FROM` deve usare un dominio verificato su Resend; il default
`onboarding@resend.dev` funziona subito per i test.

Risposte dell'endpoint:

| Codice | Corpo | Front-end |
| --- | --- | --- |
| `200` | `{ ok: true }` | schermata di conferma |
| `400` | `{ error: "missing_fields" \| "invalid_email" \| "invalid_sku" \| "invalid_body" }` | messaggio di errore + fallback `mailto:` |
| `405` | `{ error: "method_not_allowed" }` | — |
| `503` | `{ error: "unconfigured" }` | «invio in configurazione» + fallback `mailto:` |
| `502` | `{ error: "delivery_failed" }` | messaggio di errore + fallback `mailto:` |

Comportamento già attivo:

- validazione client-side in italiano, campo per campo, con `aria-invalid` e messaggi collegati;
- validazione server-side con limiti di lunghezza ed escaping HTML dei contenuti;
- honeypot `_gotcha` su entrambi i lati (il server risponde `200` senza inviare);
- `reply_to` impostato sull'email del contatto, così la risposta parte diretta;
- stato di conferma dedicato con possibilità di inviare una seconda richiesta;
- fallback `mailto:` precompilato quando l'endpoint manca o la rete cade.

Per passare a un servizio esterno (Formspree, Basin, Web3Forms) basta cambiare
l'attributo `action` del form: il client invia JSON e considera riuscito
qualsiasi `2xx`.

### Loghi clienti

La griglia Clienti (sezione Casi) mostra solo i clienti del Brand Positioning Playbook. Ogni cella con sito confermato linka al brand in una nuova scheda.

| Brand | Asset | Link |
| --- | --- | --- |
| Thermore | `assets/img/clients/thermore.svg` | thermore.com |
| Slowweed | `assets/img/clients/slowweed.svg` | slowweed.ch |
| SimplyBia | `assets/img/clients/simplybia.png` | simplybia.com |
| Frers Design | wordmark | frers.design |
| Innovadog | wordmark | da fornire |
| Golfo Paradiso | wordmark | da fornire |

Per aggiungere un logo:

```html
<li class="logos__item">
  <a class="logos__link" href="https://…" target="_blank" rel="noopener"
     aria-label="Nome brand, apre il sito in una nuova scheda">
    <img class="logo-img logo-img--nomebrand" src="assets/img/clients/nomebrand.svg"
         width="…" height="…" alt="Nome brand" loading="lazy" decoding="async">
  </a>
</li>
```

### Tracking

Consent Mode v2 parte con tutto negato. GTM si carica solo quando il CMP chiama `window.wevoConsent.update(...)` concedendo almeno una categoria e `data-gtm-id` non è vuoto. Eventi `dataLayer`: `cta_click` (`cta_location`, `cta_text`), `form_start`, `generate_lead` (`sku_range`).

### Immagine Open Graph

```bash
NODE_PATH=$(npm root -g) node tools/build-og.js
```

Richiede Playwright + Chromium. Il file viene scritto in `assets/img/og-wevo.png`.

## Scelte tecniche

- **Palette** v1: fondo `#E6E5E2`, superficie `#FFFFFF`, nero `#000000`, grafite `#1E1E1E`
  (sezioni `.theme-dark` e footer), un solo accento menta `#5CFFC8` (menta profonda
  `#00704E` per testo su chiaro). CTA nera su chiaro, bianca su grafite.
- **Type**: Instrument Serif per i titoli, IBM Plex Sans per il corpo,
  IBM Plex Mono per label ed eyebrow. Caricamento asincrono con `font-display: swap`
  e fallback di sistema.
- **Grafica** interamente vettoriale e inline: diagramma di sistema in SVG,
  griglie, favicon in data URI. Nessuna foto stock, nessuna icon font.
- **Performance**: una sola richiesta CSS, una sola JS (`defer`), immagini assenti
  sopra la piega, animazioni limitate a `opacity` e `transform`.
- **Accessibilità**: skip link, focus visibile, landmark, `aria-expanded` sul menu,
  `role="status"` sui messaggi del form, rispetto di `prefers-reduced-motion`.
- **SEO**: title e description coerenti col posizionamento, canonical, Open Graph,
  Twitter card, JSON-LD `Organization`.
