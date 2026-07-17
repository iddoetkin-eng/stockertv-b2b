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
