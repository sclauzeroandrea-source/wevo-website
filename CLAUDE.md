# Wevo — sito

Sito one-page di Wevo, statico (HTML, CSS, JS vanilla), pubblicato su Vercel. Questo lavoro sostituisce il posizionamento vecchio ("Growth Engineering Firm") con il nuovo: **Commerce Content Operations**.

## Fonte del contenuto

- Tutto il testo della pagina viene da `content/copy.md`. Non inventare né riscrivere il copy: usalo così com'è.
- I segnaposto tra parentesi quadre (`[DA APPROVARE]`, `[DA PREPARARE]`, `[verificare ...]`, `[Ragione sociale ...]`) restano in pagina come placeholder ben visibili finché non vengono sostituiti.
- Le "Note d'uso" e le "Varianti H1 da testare" di `copy.md` sono note interne: non vanno in pagina.
- Mai nominare Eataly o Lavazza. Mai usare "AI" in un titolo. Nessun prezzo.
- Il vecchio copy di `index.html` (Growth Engineering Firm, "Test" nell'H1, sezioni Cosa facciamo / Per chi / Perché Wevo) va sostituito tutto.

## Stack: resta com'è

- Niente framework, niente build step. File: `index.html`, `assets/css/styles.css`, `assets/js/main.js`, `api/contact.js`.
- Riusa il design system esistente in `styles.css` (token, palette v1: fondo `#E6E5E2`, nero, grafite `#1E1E1E` per le sezioni `.theme-dark`, unico accento menta `#5CFFC8` / menta profonda `#00704E` su chiaro, CTA neutre mai menta, Instrument Serif + IBM Plex Sans/Mono, `.reveal`, `.section`, `.section--alt`). Aggiungi componenti nuovi seguendo le stesse convenzioni, non creare un secondo sistema.
- Grafica solo SVG inline, nessuna foto stock, nessuna illustrazione "AI" generica.
- Accessibilità e performance già presenti (skip link, focus visibile, `prefers-reduced-motion`, una sola CSS e una sola JS) vanno mantenute.

## Struttura della pagina (ordine di scroll)

| # | Sezione | id | Note |
| --- | --- | --- | --- |
| 1 | Hero | — | eyebrow mono, H1 serif, sottotitolo, CTA primaria → `#diagnosis`, CTA secondaria → `#content-engine`, riga di fiducia |
| 2 | Problema | `#problema` | 3 card + frase ponte |
| 3 | Il motore | `#motore` | grafica SVG del ciclo: 3 fasi in fila + freccia di ritorno da Digital Systems a Data Strategy; Content Engine evidenziato con l'accento; poi 3 card |
| 4 | Wevo Content Engine | `#content-engine` | 3 blocchi USP, flusso pipeline in 4 step orizzontale (verticale su mobile), box prima/dopo come placeholder |
| 5 | Perché Wevo | `#perche-wevo` | griglia di confronto 4 righe × 3 colonne; su mobile diventa card impilate |
| 6 | Casi | `#casi` | Thermore come processo (Data / Content Engine / Digital Systems), poi 2 card secondarie |
| 7 | Come iniziare | `#come-iniziare` | 4 step numerati + CTA → `#diagnosis` |
| 8 | Team e per chi lavoriamo | `#team` | ruoli in griglia, 3 card settore, riga per ruolo |
| 9 | FAQ | `#faq` | accordion con `<details>`/`<summary>` |
| 10 | CTA finale + form | `#diagnosis` | form Commerce Diagnosis, poi footer |

Griglia Clienti (in fondo a Casi): solo clienti del Brand Positioning Playbook, ognuno con link al sito del brand in nuova scheda. Mai inventare URL: se manca, cella senza link e TODO nel codice.

Navigazione: Content Engine · Casi · Come iniziare · Team · FAQ, più bottone "Richiedi una Diagnosis".

## Form Commerce Diagnosis

Aggiorna form, `main.js` e `api/contact.js` mantenendo validazione, honeypot `_gotcha`, `reply_to`, stati di conferma ed errore, fallback `mailto:`.

- Campi: Nome*, Azienda*, Ruolo*, Email*, Sito web, Numero di SKU* (select: `<300`, `300–1.000`, `1.000–5.000`, `>5.000`), Canali di vendita (checkbox: Sito, Marketplace, Meta, Google, Altro).
- Rimuovi i campi `budget` e `messaggio` (nessun discorso economico nel primo contatto).
- Oggetto email: `Richiesta Commerce Diagnosis — <azienda>`.
- Variabili d'ambiente invariate: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`.

## SEO e metadati

- `<title>`, meta description, `og:title` da `copy.md` sezione 10. Aggiorna anche Twitter card e JSON-LD (`description`, `knowsAbout` coerenti con i tre pillar).
- Dominio, email e LinkedIn restano quelli attuali finché non indicato diversamente.
- Rigenera l'immagine OG con `tools/build-og.js` dopo aver aggiornato `tools/og-template.html` con il nuovo claim.

## Tracking e privacy

- GTM caricato solo dopo il consenso (Consent Mode v2), container ID in un attributo `data-gtm-id` sul `<body>`, per ora vuoto.
- Eventi `dataLayer`: `cta_click` (con `cta_location`), `form_start`, `generate_lead` all'invio riuscito.
- Link Privacy e Cookie nel footer come placeholder.

## Come lavorare

- Lavora su un branch dedicato, mai direttamente sul branch di default.
- Una sezione alla volta, verificando in locale con `python3 -m http.server 8080`.
- Aggiorna `README.md` quando cambiano form, variabili o struttura.
