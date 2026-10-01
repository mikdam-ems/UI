# EMS UI Showcase — working conventions

Internal showcase of EMS's UX/UI craft: show-stopping heroes and website sections
for fictional brands across industries. Not production code; visual impact first.

## Structure
- `index.html` — the gallery/showroom. Reads `registry.js`.
- `registry.js` — one entry per piece. **Add an entry for every new piece.**
- `shared/base.css` — reset, fonts fallback, reduced-motion helper, `.ems-back` link.
- `_template/index.html` — copy this to start a new piece.
- `heroes/NN-slug/index.html` — one self-contained folder per hero.
- `sections/<type>/NN-slug/index.html` — other sections (pricing, features, stats, testimonials, footer…).

## Rules for each piece
- Self-contained: its own `index.html` (+ optional local `style.css`, `main.js`, assets). Opens directly in a browser, no build step.
- Libraries from CDN only (cdnjs / jsdelivr / unpkg): GSAP, Three.js, Lenis, Splitting, etc. — whatever the brief needs.
- Fictional brand per piece (name, palette, type). Never imitate real companies' branding.
- Must: responsive to 360px, `prefers-reduced-motion` fallback, readable without JS animations, no horizontal scroll.
- Language per brief: English by default; Arabic pieces set `lang="ar" dir="rtl"` and use an Arabic typeface (IBM Plex Sans Arabic, Tajawal, Noto Kufi Arabic…).
- Generative/code-made visuals preferred; any image must be free-licensed.

## Workflow per piece
1. Brief from the user → build in its folder from `_template/`.
2. Add to `registry.js`.
3. Verify in headless Chromium (screenshot desktop + mobile).
4. Commit + push to the working branch.
