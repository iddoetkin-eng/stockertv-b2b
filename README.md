# StockerTV — B2B Microsite

Single-page marketing site for StockerTV's platform offering, aimed at banks, brokers, and trading platforms.

**Live:** https://iddoetkin-eng.github.io/stockertv-b2b/

## Stack

Static HTML/CSS/JS — no build step. The interactive globe uses [cobe](https://github.com/shuding/cobe) loaded from CDN, with an SVG fallback when WebGL (or a hardware GPU) is unavailable.

## Local development

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8123
```

`?noanim` in the URL disables scroll-reveal animations (useful for screenshots).

## Changing the contact address

Edit the `EMAIL` constant at the top of `main.js` — every contact link (and the visible footer address) updates from that one line. The `href` attributes baked into `index.html` are only a fallback for visitors with JavaScript disabled; update them too if you want the fallback to match.

## Custom domain (b2b.stockertv.com)

The repo contains `CNAME.placeholder`. **Do not rename it until DNS is in place** — an active `CNAME` file immediately switches GitHub Pages to the custom domain and the site goes down until DNS resolves.

1. At your DNS provider for `stockertv.com`, create one record:
   - Type: `CNAME` · Host/Name: `b2b` · Value/Target: `iddoetkin-eng.github.io` · TTL: default
2. Wait for propagation (usually minutes, up to an hour).
3. Rename `CNAME.placeholder` → `CNAME`, commit, push.
4. In the repo: Settings → Pages → confirm the custom domain shows `b2b.stockertv.com`, then tick **Enforce HTTPS** once the certificate is issued (GitHub provisions it automatically, can take a few minutes).

Optional but recommended: Settings → Pages → verify the `stockertv.com` domain to prevent domain takeover if the repo is ever deleted.

## Fonts

Instrument Serif and Instrument Sans are self-hosted in `assets/fonts/` (latin subsets, woff2). Both are licensed under the SIL Open Font License.
