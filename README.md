# Omo Oni Rice 🍚

Full-stack Nigerian foodstuff e-commerce site — **Next.js (App Router) + SQLite**.

Cloned from a grocery-store template design (extracted from a screen recording), rebuilt with Nigerian foodstuffs, ₦ pricing and a complete shop + admin workflow.

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Backend | Route handlers (`app/api/**`) + server components reading SQLite directly |
| Database | SQLite via `better-sqlite3` (auto-seeded on first run) |
| Styling | Single CSS design system (`app/globals.css`) — white canvas, grocery green `#007848`, amber stars |
| State | Cart in `localStorage`, admin sessions in DB-backed tokens |

## Getting started

```bash
npm install        # install dependencies
npm run dev        # start dev server → http://localhost:3000
npm run build      # production build
npm start          # run production build
npm run reseed     # reset database to fresh demo data
```

**Admin dashboard:** http://localhost:3000/admin — username `admin`, password `omooni123`

## Project structure

```
app/
  layout.js                # root layout (fonts, metadata)
  globals.css              # design system (all styles)
  (store)/                 # storefront (header + footer layout)
    page.js                # homepage — server-rendered
    shop/page.jsx          # catalog (filters, sort, search)
    product/[id]/page.js   # product detail (server) + ProductDetail (client)
    cart/page.jsx          # cart (localStorage)
    checkout/page.jsx      # checkout (delivery + payment)
    order/page.jsx         # order confirmation / tracking
  admin/page.jsx           # admin SPA (login, dashboard, orders, products)
  api/                     # REST route handlers
    categories/ products/ orders/ newsletter/
    admin/ (login, logout, stats, orders, products)
components/                # Header, Footer, ProductCard, Countdown, Faq, ...
lib/
  db.js                    # SQLite schema, seed data, query layer
  auth.js                  # admin session tokens (DB-backed)
  client.js                # client utils (toast, cart, fetch)
  format.js, icons.js      # shared helpers
public/img/                # product photography + hero
scripts/reseed.js          # DB reset
```

## Pages & features

- **Home** — hero, featured categories, purely fresh, featured products, Summer Discount countdown, Deals of the Day, best sellers, testimonials, News & Blogs, FAQ accordion, features band, newsletter
- **Shop** — category filters, price ranges, sorting, search
- **Product** — pack-size variants, quantity, add to cart / buy now, related items
- **Cart → Checkout** — same-day Lagos / next-day / nationwide / pickup; pay on delivery, transfer or card; free-delivery progress bar
- **Order tracking** — status timeline (Placed → Confirmed → Packed → On the way → Delivered) + lookup by reference (e.g. `OOR-8F3K2A`)
- **Admin** — revenue stats & 7-day chart, order status management, product CRUD (variants, images, badges, deals)

## Pushing to GitHub

```bash
# 1. Create an empty repo on github.com (e.g. "omo-oni-rice") — no README, no .gitignore

# 2. Link and push
git remote add origin https://github.com/YOUR_USERNAME/omo-oni-rice.git
git push -u origin main
```

The `.gitignore` already excludes `node_modules/`, `.next/` and `data/` (the local SQLite file), so the repo stays clean — anyone cloning just runs `npm install && npm run dev` and gets a freshly seeded store.

## Notes

- Payments are simulated (no gateway integration yet) — hook up Paystack/Flutterwave in `app/(store)/checkout/page.jsx` when ready.
- Admin sessions expire after 24 hours; credentials are in `lib/db.js` (change them for production).
- Product images are AI-generated placeholders — swap in real photography in `public/img/`.
