# team-portfolio-1

## AirPods Pro 2 — landing page

A responsive, single-page product landing page for **AirPods Pro (2nd generation)**,
built with plain HTML, CSS and vanilla JavaScript — no frameworks, no build step.

**Open `index.html` in a browser** (or serve the folder) and everything works.

### What's inside

| File | Purpose |
| --- | --- |
| `index.html` | Landing page markup and content |
| `checkout.html` | Bag + checkout page |
| `assets/css/style.css` | Design tokens, layout, components, responsive rules |
| `assets/css/checkout.css` | Checkout-specific layout, forms and success state |
| `assets/js/cart.js` | Shared localStorage bag (add, quantity, remove, badges) |
| `assets/js/main.js` | Landing page interactions (no dependencies) |
| `assets/js/checkout.js` | Checkout validation, totals, promos and order flow |
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

### Checkout flow

Open `checkout.html` (or the bag icon in the header / “View bag & checkout” under
the buy button) after adding a pair.

- **Bag** — line items survive page reloads via `localStorage`, with quantity
  steppers, removal, and a free engraving/AppleCare summary per line
- **Delivery** — country, address and two delivery speeds with live arrival
  dates; Express adds $12
- **Payment** — Card (with grouping, brand detection, Luhn and expiry checks),
  Apple Pay or cash on delivery; card fields are skipped for the other methods
- **Promo codes** — `QUIET10` for 10% off, `FREESHIP` for free delivery
- **Totals** — recalculated on every change; the place-order button always shows
  the current total
- **Confirmation** — animated success screen with order number, delivery window,
  receipt lines and a print-friendly receipt (cart is cleared)

Validation runs inline on blur, blocks submission with a focus jump to the first
invalid field, and the demo card `4242 4242 4242 4242` always succeeds.

### Notes

- Fully responsive (down to 320 px), keyboard accessible, with visible focus
  states and `prefers-reduced-motion` support.
- Product imagery is AI-generated for this demo; the page is a fan-made design
  concept and is not affiliated with Apple Inc.
- The `team-portfolio.zip` archive contains a separate PHP team-portfolio app and
  is unrelated to this landing page.
