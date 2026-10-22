# team-portfolio-1

## AirPods Pro 2 — landing page

A responsive, single-page product landing page for **AirPods Pro (2nd generation)**,
built with plain HTML, CSS and vanilla JavaScript — no frameworks, no build step.

**Open `index.html` in a browser** (or serve the folder) and everything works.

### What's inside

| File | Purpose |
| --- | --- |
| `index.html` | All page markup and content |
| `assets/css/style.css` | Design tokens, layout, components, responsive rules |
| `assets/js/main.js` | All interactions (no dependencies) |
| `assets/img/*.webp` | Optimised product / lifestyle imagery |

### Sections

- Sticky glass navigation with scroll-spy and a reading-progress bar
- Hero with floating product render, noise-cancellation stat and animated ticker
- **Interactive ANC demo** — a canvas waveform that flattens as you raise the
  noise-cancellation slider (Transparency → Adaptive → Noise Cancellation)
- Feature grid, design story with numbered details, full-bleed lifestyle quote
  and animated counters
- Battery section with an animated charge bar
- Buy panel: case/AppleCare selection, free engraving (with character counter),
  quantity stepper, live total and an add-to-bag flow with toasts
- Tech-spec and FAQ accordions, review carousel with swipe/keyboard support
- Newsletter form with validation, closing CTA, footer, mobile sticky buy bar

### Notes

- Fully responsive (down to 320 px), keyboard accessible, with visible focus
  states and `prefers-reduced-motion` support.
- Product imagery is AI-generated for this demo; the page is a fan-made design
  concept and is not affiliated with Apple Inc.
- The `team-portfolio.zip` archive contains a separate PHP team-portfolio app and
  is unrelated to this landing page.
