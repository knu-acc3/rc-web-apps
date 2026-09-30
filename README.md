# Online tools

Browser-only tools site in Russian and English: PDF, images, video and audio, text, symbols and emoji, time and
timers, calculators, converters, generators, developer and SEO tools, device tests. Nothing is uploaded — every tool
runs in the visitor's browser. Every tool and every useful variant (a timer duration, a unit pair, an emoji, a city)
is its own statically generated page.

## Commands
```bash
npm ci                 # install
npm run dev            # development server
npm run build          # production build (prebuild: generated tool map + vendor assets)
npm start              # serve the build
npm run lint && npm run typecheck && npm test   # checks
npm run test:e2e       # Playwright smoke + accessibility (needs a build)
```
Docker: `docker build -t tools . && docker run -p 3000:3000 tools`.

## Renaming the site
The name, domain, contact e-mail and search-console ids live in one place: `src/config/brand.ts`.

## Where things are
See `docs/ARCHITECTURE.md` — folder layout, how pages are produced, how to add a tool, SEO and design rules.
