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

## Paystack payments 💳

Card payments are powered by **Paystack** (inline popup + server-side verification).

### Setup

1. Get your keys at [dashboard.paystack.com](https://dashboard.paystack.com) → **Settings → API Keys & Webhooks**
2. Copy `.env.example` to `.env.local` and fill in your keys:

```bash
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx          # secret — server only
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx  # public — used by the popup
```

- **Test mode** (`sk_test_` / `pk_test_`): use Paystack's [test cards](https://paystack.com/docs/payments/test-payments/) — e.g. `4084 0840 8408 4081`, CVV `408`, any future expiry, PIN `0000`
- **Live mode**: switch on in the Paystack dashboard and use `sk_live_` / `pk_live_` keys

### How it works

1. Customer picks **Card payment** at checkout → the order is created with status `Pending` / `payment_status: unpaid`
2. The server initializes a Paystack transaction (amount in kobo, order ref as Paystack reference)
3. The official **Paystack Inline** popup opens (falls back to a full-page redirect if the popup can't load)
4. On success, the browser calls `POST /api/paystack/verify` → the **server** verifies with Paystack (status + exact amount) and marks the order `paid`, auto-advancing it to `Confirmed`
5. Admin dashboard shows **Paid / Unpaid** per order and paid revenue

### Demo mode (no keys)

If the keys are missing, the checkout clearly labels the card flow as a **Paystack demo**: the order is created and "paid" through a simulated step (`demo: true` in the API response). As soon as real keys land in `.env.local`, the official Paystack checkout takes over with zero code changes.

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
    paystack/ (config, verify)
    admin/ (login, logout, stats, orders, products)
components/                # Header, Footer, ProductCard, Countdown, Faq, ...
lib/
  db.js                    # SQLite schema, seed data, query layer
  paystack.js              # Paystack initialize + verify (server-side)
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

- Payments run through Paystack (see above). Delivery payments (cash on delivery, bank transfer) are recorded but not processed online.
- Admin sessions expire after 24 hours; credentials are in `lib/db.js` (change them for production).
- Product images are AI-generated placeholders — swap in real photography in `public/img/`.
