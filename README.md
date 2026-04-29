# DRIFT — Wind down on purpose.

A functional nighttime drink ritual. This repo contains the marketing site, cart, and checkout flow for DRIFT — a single-serve adaptogen sachet positioned as the premium nightly ritual for the 27–42 wired professional.

> *Nighttime Drink Ritual · 30 Sachets · Designed for the quiet hours.*

## Stack

Intentionally vanilla — zero build step, zero dependencies, deploys to any static host in seconds.

- **HTML / CSS / JS** — no framework
- **Fraunces** (variable serif, opsz + SOFT axes) for display
- **Manrope** for body
- **JetBrains Mono** for apothecary-style metadata
- LocalStorage for cart state across pages

## Pages

| Path | Purpose |
| --- | --- |
| `/` (`index.html`) | Landing — hero, problem, ingredients, ritual, buy, reviews, FAQ |
| `/checkout` (`checkout.html`) | Multi-step checkout (Contact → Shipping → Payment) with Apple Pay / Google Pay / PayPal / Shop Pay express buttons |
| `/confirmation` (`confirmation.html`) | Animated post-order confirmation with delivery tracker |

## Local development

```bash
# Just open it
open index.html

# Or run a local server (recommended for honest cross-page navigation)
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy to Vercel

```bash
# Option A — push to GitHub then import on vercel.com
gh repo create drift-night-ritual --public --source=. --push

# Option B — deploy directly with the Vercel CLI
npx vercel --prod
```

The `vercel.json` enables clean URLs (`/checkout` instead of `/checkout.html`) and sets long-cache headers on `/assets/*`.

## Cart & checkout flow

1. Click any "Add to cart" / "Begin the ritual" / "Try the sampler" button
2. Cart drawer slides in — adjust qty, apply promo `DUSK10` (10% off)
3. Click **Checkout** → multi-step form
4. Express pay (Apple / Google / PayPal / Shop) skips straight to confirmation
5. Standard card flow validates inline, formats card number with brand detection (Visa / MC / Amex)
6. Place order → confetti, animated checkmark, personalized confirmation

## Brand notes

- **Palette**: deep ink (`#0A0E18`) with amber as the singular light source (`#E89A2C`), bone (`#F4EFE6`) typography, plum atmospheric undertones
- **Voice**: editorial, restrained, Aesop-meets-Kinfolk. Never clinical, never wellness-jargon
- **Motion**: parallax moon, animated press marquee, custom amber cursor, magnetic primary buttons, letter-by-letter hero reveal, golden moon-dust confetti on order completion

## License

© 2026 DRIFT, Inc. All rights reserved.
