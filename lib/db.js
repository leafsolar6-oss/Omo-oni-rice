/**
 * Omo Oni Rice — database layer (SQLite via better-sqlite3)
 * Server-only module: creates the schema and seeds demo data on first run.
 * Usage: import { getProducts, ... } from '@/lib/db'
 * Reset:  npm run reseed
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DATA_DIR = process.env.VERCEL
  // Vercel's filesystem is read-only except /tmp — and /tmp is per-instance,
  // so the demo database reseeds itself on each cold start (no persistence).
  // For persistent data in production, swap to a hosted Postgres (Neon /
  // Vercel Postgres) — see README "Deploying to Vercel".
  ? path.join('/tmp', 'omo-oni-rice-data')
  : path.join(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'store.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export { db };

/* ================= helpers ================= */

const hashPassword = (password, salt) =>
  crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');

export function makeRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `OOR-${s}`;
}

function daysAgo(d, h = 10, m = 0) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, m, Math.floor(Math.random() * 59), 0);
  return t.toISOString();
}

export function deliveryFee(method, subtotal) {
  if (method === 'pickup') return 0;
  let fee = method === 'same_day' ? 2500 : method === 'next_day' ? 1500 : 5000;
  if ((method === 'same_day' || method === 'next_day') && subtotal >= 50000) fee = 0;
  return fee;
}

const productJson = (p) => ({ ...p, variants: JSON.parse(p.variants || '[]') });

/* ================= schema ================= */

function createSchema() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
    emoji TEXT NOT NULL DEFAULT '🛒', tagline TEXT DEFAULT '', sort INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL, unit TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL, old_price REAL,
    variants TEXT NOT NULL DEFAULT '[]', stock INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL DEFAULT '', badge TEXT,
    rating REAL NOT NULL DEFAULT 4.5, reviews INTEGER NOT NULL DEFAULT 0,
    featured INTEGER NOT NULL DEFAULT 0, deal INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '',
    address TEXT DEFAULT '', city TEXT DEFAULT '', state TEXT DEFAULT '', landmark TEXT DEFAULT '',
    delivery_method TEXT NOT NULL, delivery_fee REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    subtotal REAL NOT NULL, total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, variant_label TEXT NOT NULL DEFAULT '',
    qty INTEGER NOT NULL, price REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS newsletter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    expires INTEGER NOT NULL
  );
  `);

  // Migration for databases created before payment_status existed
  const orderCols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
  if (!orderCols.includes('payment_status')) {
    db.exec(`ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'`);
    // Backfill: anything already shipped or delivered has been paid for
    db.exec(`UPDATE orders SET payment_status = 'paid'
             WHERE status IN ('Packed','Out for delivery','Delivered')`);
  }
}

/* ================= seed data ================= */

const CATEGORIES = [
  { name: 'Rice & Grains', slug: 'rice-grains', emoji: '🍚', tagline: 'Stone-free rice, local & imported', sort: 1 },
  { name: 'Beans & Legumes', slug: 'beans-legumes', emoji: '🫘', tagline: 'Sweet beans, egusi & seeds', sort: 2 },
  { name: 'Cassava & Flours', slug: 'cassava-flours', emoji: '🌾', tagline: 'Garri, semovita & swallow staples', sort: 3 },
  { name: 'Fresh Produce', slug: 'fresh-produce', emoji: '🍅', tagline: 'Pepper, tomatoes & plantain', sort: 4 },
  { name: 'Tubers', slug: 'tubers', emoji: '🍠', tagline: 'Farm-fresh yam tubers', sort: 5 },
  { name: 'Oils & Sauces', slug: 'oils', emoji: '🫗', tagline: 'Pure palm oil & groundnut oil', sort: 6 },
  { name: 'Proteins & Fish', slug: 'proteins-fish', emoji: '🐟', tagline: 'Crayfish, stockfish & more', sort: 7 },
  { name: 'Drinks & Snacks', slug: 'drinks-snacks', emoji: '🥤', tagline: 'Zobo and chilled treats', sort: 8 },
];

const PRODUCTS = [
  { name: 'Long Grain Rice (Premium)', unit: 'per bag', category: 'rice-grains',
    description: 'Premium long-grain parboiled rice, carefully stone-cleaned and bagged. Fluffy when cooked, no stones, no chaff — the reliable everyday rice for Nigerian homes.',
    price: 11500, old_price: 14900, stock: 42, image: '/img/products/rice.jpg', badge: 'Best seller', rating: 4.8, reviews: 412, featured: 1, deal: 0,
    variants: [{ label: '5kg bag', price: 11500 }, { label: '25kg bag', price: 54000 }, { label: '50kg bag', price: 105000 }] },
  { name: 'Ofada Rice (Local)', unit: 'per pack', category: 'rice-grains',
    description: 'Unpolished, locally-grown ofada rice with that distinct nutty flavour and aroma. Stone-free and sorted by hand. Pairs perfectly with ayamase (designer stew).',
    price: 2900, old_price: 3800, stock: 58, image: '/img/products/ofada.jpg', badge: 'Local pride', rating: 4.7, reviews: 231, featured: 1, deal: 0,
    variants: [{ label: '1kg pack', price: 2900 }, { label: '5kg pack', price: 13500 }] },
  { name: 'Honey Beans (Oloyin)', unit: 'per bag', category: 'beans-legumes',
    description: 'Sweet honey beans (oloyin) — soft, sweet and cooks fast. No weevils, no stones. Perfect for porridge, moi-moi and beans & plantain.',
    price: 3800, old_price: 4800, stock: 65, image: '/img/products/beans.jpg', badge: 'Sweet & soft', rating: 4.9, reviews: 318, featured: 1, deal: 0,
    variants: [{ label: '2kg bag', price: 3800 }, { label: '5kg bag', price: 9000 }, { label: '25kg bag', price: 42000 }] },
  { name: 'Egusi (Melon Seeds)', unit: 'per cup', category: 'beans-legumes',
    description: 'Cleanly shelled, pale-yellow egusi melon seeds — no sand, no stones. The heart of every proper egusi soup.',
    price: 3200, old_price: 4200, stock: 70, image: '/img/products/egusi.jpg', badge: null, rating: 4.8, reviews: 156, featured: 0, deal: 1,
    variants: [{ label: '1 cup (250g)', price: 3200 }, { label: '4 cups (1kg)', price: 11800 }] },
  { name: 'Yellow Garri (Ijebu)', unit: 'per paint', category: 'cassava-flours',
    description: 'Fine yellow garri from Ijebu — smooth, well-fermented and guaranteed to swell well in cold water. Enjoy with groundnut, milk or hot eba.',
    price: 2200, old_price: 2800, stock: 80, image: '/img/products/garri.jpg', badge: 'Deal of the day', rating: 4.8, reviews: 456, featured: 1, deal: 1,
    variants: [{ label: '1 paint (4kg)', price: 2200 }, { label: '5kg bag', price: 9500 }, { label: '50kg bag', price: 88000 }] },
  { name: 'Semovita (Golden)', unit: 'per pack', category: 'cassava-flours',
    description: 'Smooth golden semovita that turns to soft, lump-free swallow every time. Fortified and finely milled — a family favourite.',
    price: 4800, old_price: 6000, stock: 55, image: '/img/products/semovita.jpg', badge: null, rating: 4.6, reviews: 142, featured: 0, deal: 0,
    variants: [{ label: '2kg pack', price: 4800 }, { label: '10kg pack', price: 22000 }] },
  { name: 'Fresh Yam Tubers', unit: 'per bundle', category: 'tubers',
    description: 'Farm-fresh white yam tubers from Benue farms. Firm, white flesh that pounds smoothly — perfect for pounded yam and yam porridge.',
    price: 18000, old_price: 22000, stock: 36, image: '/img/products/yam.jpg', badge: 'Farm fresh', rating: 4.6, reviews: 187, featured: 1, deal: 0,
    variants: [{ label: '5 medium tubers', price: 18000 }, { label: '10 medium tubers', price: 34000 }] },
  { name: 'Red Palm Oil (Pure)', unit: 'per bottle', category: 'oils',
    description: 'Rich, pure red palm oil — thick, aromatic and unadulterated. Pressed and bottled fresh; no mixing, no bleaching.',
    price: 3200, old_price: 4200, stock: 74, image: '/img/products/palmoil.jpg', badge: null, rating: 4.8, reviews: 342, featured: 1, deal: 0,
    variants: [{ label: '1L bottle', price: 3200 }, { label: '5L keg', price: 14500 }] },
  { name: 'Groundnut Oil (Golden)', unit: 'per bottle', category: 'oils',
    description: 'Golden groundnut oil, cold-pressed and cholesterol-free. Light on the palate, excellent for frying.',
    price: 3800, old_price: 4800, stock: 60, image: '/img/products/groundnutoil.jpg', badge: null, rating: 4.7, reviews: 203, featured: 0, deal: 0,
    variants: [{ label: '1L bottle', price: 3800 }, { label: '5L keg', price: 17500 }] },
  { name: 'Scotch Bonnet Pepper (Rodo)', unit: 'per pack', category: 'fresh-produce',
    description: 'Fiery fresh rodo (scotch bonnet) peppers, hand-picked and packed same-day. The authentic heat for stews, jollof and pepper soup.',
    price: 1800, old_price: 2400, stock: 90, image: '/img/products/rodo.jpg', badge: 'Spicy 🔥', rating: 4.9, reviews: 271, featured: 1, deal: 0,
    variants: [{ label: '500g pack', price: 1800 }, { label: '1kg pack', price: 3400 }] },
  { name: 'Fresh Tomatoes (Basket)', unit: 'per basket', category: 'fresh-produce',
    description: 'Ripe, red tomatoes from Kano farms — firm, fleshy and perfect for stew. Packed in ventilated baskets to arrive fresh.',
    price: 7500, old_price: 9500, stock: 48, image: '/img/products/tomatoes.jpg', badge: 'Ripe & red', rating: 4.7, reviews: 189, featured: 1, deal: 0,
    variants: [{ label: 'Small basket', price: 7500 }, { label: 'Big basket', price: 14000 }] },
  { name: 'Ripe Plantain (Bunch)', unit: 'per bunch', category: 'fresh-produce',
    description: 'Sweet ripe plantain, perfect for dodo, boli or porridge. Hand-picked bunches from Edo and Ondo farms.',
    price: 4500, old_price: 5800, stock: 52, image: '/img/products/plantain.jpg', badge: 'Fresh pick', rating: 4.8, reviews: 165, featured: 0, deal: 1,
    variants: [{ label: '1 bunch (~6 fingers)', price: 4500 }, { label: '2 bunches', price: 8500 }] },
  { name: 'Dried Crayfish', unit: 'per pack', category: 'proteins-fish',
    description: 'Sun-dried crayfish, stone-free and freshly packed. Adds that deep, rich umami to every pot of soup.',
    price: 3500, old_price: 4500, stock: 64, image: '/img/products/crayfish.jpg', badge: null, rating: 4.7, reviews: 198, featured: 0, deal: 0,
    variants: [{ label: '1 cup (150g)', price: 3500 }, { label: '1kg pack', price: 21500 }] },
  { name: 'Stockfish (Okporoko)', unit: 'per piece', category: 'proteins-fish',
    description: 'Proper Norwegian-dried stockfish (okporoko) — white, meaty and full of flavour. The secret backbone of afang and egusi soup.',
    price: 6500, old_price: 8500, stock: 38, image: '/img/products/stockfish.jpg', badge: 'Soup booster', rating: 4.6, reviews: 121, featured: 0, deal: 0,
    variants: [{ label: 'Medium piece', price: 6500 }, { label: 'Large piece', price: 9500 }] },
  { name: 'Zobo Drink (Chilled)', unit: 'per bottle', category: 'drinks-snacks',
    description: 'Freshly brewed zobo (hibiscus) with ginger, cloves and pineapple peel — naturally sweet, deep red and ice-cold.',
    price: 2500, old_price: 3200, stock: 100, image: '/img/products/zobo.jpg', badge: 'Chilled', rating: 4.9, reviews: 97, featured: 0, deal: 1,
    variants: [{ label: '1L bottle', price: 2500 }, { label: '3L keg', price: 6800 }] },
];

const SAMPLE_CUSTOMERS = [
  ['Chiamaka Nwosu', '08031234567', 'Yaba', 'Lagos'],
  ['Tunde Adebayo', '08055678901', 'Ikeja', 'Lagos'],
  ['Fatima Bello', '07034567890', 'Surulere', 'Lagos'],
  ['Emeka Obi', '08145678902', 'Lekki Phase 1', 'Lagos'],
  ['Aisha Yusuf', '09056789013', 'Gbagada', 'Lagos'],
  ['Segun Ogunleye', '08167890124', 'Magodo', 'Lagos'],
  ['Ngozi Eze', '08078901235', 'Festac', 'Lagos'],
  ['Ibrahim Musa', '07089012346', 'Ajah', 'Lagos'],
  ['Funke Alade', '08190123457', 'Ogba', 'Lagos'],
  ['Bayo Adeyemi', '09001234568', 'Ikoyi', 'Lagos'],
  ['Halima Sani', '08012345679', 'Victoria Island', 'Lagos'],
  ['Chinedu Okoro', '08123456780', 'Ikorodu', 'Lagos'],
  ['Yemi Okafor', '07034567891', 'Egbeda', 'Lagos'],
  ['Blessing Uche', '09045678902', 'Agege', 'Lagos'],
];

function seedProducts() {
  const insertCat = db.prepare('INSERT INTO categories (name, slug, emoji, tagline, sort) VALUES (@name, @slug, @emoji, @tagline, @sort)');
  const insertProd = db.prepare(`INSERT INTO products
    (category_id, name, unit, description, price, old_price, variants, stock, image, badge, rating, reviews, featured, deal)
    VALUES (@category_id, @name, @unit, @description, @price, @old_price, @variants, @stock, @image, @badge, @rating, @reviews, @featured, @deal)`);
  const catId = {};
  for (const c of CATEGORIES) catId[c.slug] = insertCat.run(c).lastInsertRowid;
  for (const p of PRODUCTS) {
    insertProd.run({
      category_id: catId[p.category], name: p.name, unit: p.unit, description: p.description,
      price: p.price, old_price: p.old_price || null, variants: JSON.stringify(p.variants),
      stock: p.stock, image: p.image, badge: p.badge, rating: p.rating, reviews: p.reviews,
      featured: p.featured, deal: p.deal,
    });
  }
}

function seedOrders() {
  const prodRows = db.prepare('SELECT * FROM products').all();
  const insertOrder = db.prepare(`INSERT INTO orders
    (ref, customer_name, phone, email, address, city, state, delivery_method, delivery_fee, payment_method, payment_status, subtotal, total, status, created_at)
    VALUES (@ref, @customer_name, @phone, @email, @address, @city, @state, @delivery_method, @delivery_fee, @payment_method, @payment_status, @subtotal, @total, @status, @created_at)`);
  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, variant_label, qty, price) VALUES (?, ?, ?, ?, ?, ?)');

  const statusPlan = ['Pending', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Delivered',
    'Pending', 'Confirmed', 'Delivered', 'Delivered', 'Out for delivery', 'Delivered', 'Cancelled', 'Delivered'];
  const methods = ['same_day', 'next_day', 'nationwide', 'pickup'];
  const payments = ['pod', 'transfer', 'card'];

  statusPlan.forEach((status, i) => {
    const cust = SAMPLE_CUSTOMERS[i % SAMPLE_CUSTOMERS.length];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const payment = payments[Math.floor(Math.random() * payments.length)];
    const itemCount = 1 + Math.floor(Math.random() * 3);
    let subtotal = 0;
    const items = [];
    const used = new Set();
    for (let j = 0; j < itemCount; j++) {
      let p;
      do { p = prodRows[Math.floor(Math.random() * prodRows.length)]; } while (used.has(p.id));
      used.add(p.id);
      const v = JSON.parse(p.variants)[Math.floor(Math.random() * JSON.parse(p.variants).length)];
      const qty = 1 + Math.floor(Math.random() * 2);
      subtotal += v.price * qty;
      items.push({ product_id: p.id, name: p.name, label: v.label, qty, price: v.price });
    }
    const fee = deliveryFee(method, subtotal);
    // Anything already packed/out/delivered has been paid for in the demo data
    const paymentStatus = ['Packed', 'Out for delivery', 'Delivered'].includes(status) ? 'paid' : 'unpaid';
    const orderId = insertOrder.run({
      ref: makeRef(), customer_name: cust[0], phone: cust[1],
      email: `${cust[0].split(' ')[0].toLowerCase()}@example.com`,
      address: `${5 + i} ${['Adeola', 'Bode', 'Coker', 'Durosinmi', 'Awolowo'][i % 5]} Street`,
      city: cust[2], state: cust[3], delivery_method: method, delivery_fee: fee,
      payment_method: payment, payment_status: paymentStatus, subtotal, total: subtotal + fee, status,
      created_at: daysAgo(Math.floor(i * 0.5), 8 + (i % 10), i * 7),
    }).lastInsertRowid;
    for (const it of items) insertItem.run(orderId, it.product_id, it.name, it.label, it.qty, it.price);
  });
}

export function seed(force = false) {
  if (force) {
    db.exec(`
      DROP TABLE IF EXISTS order_items;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS admins;
      DROP TABLE IF EXISTS newsletter;
      DROP TABLE IF EXISTS sessions;
    `);
  }
  createSchema();
  const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (count === 0) {
    const tx = db.transaction(() => {
      seedProducts();
      seedOrders();
      const salt = crypto.randomBytes(8).toString('hex');
      db.prepare('INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)')
        .run('admin', hashPassword('omooni123', salt), salt);
    });
    tx();
    console.log('✅ Database seeded: 15 products, demo orders, admin user');
  } else {
    console.log(`ℹ️  Database ready (${count} products)`);
  }
}

seed(); // idempotent — runs on first import

/* ================= storefront queries ================= */

export function getCategories() {
  return db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
    FROM categories c ORDER BY c.sort`).all();
}

export function getProducts({ category, search, sort, featured, deal, ids, limit = 24, offset = 0 } = {}) {
  const where = [];
  const params = {};
  if (category) { where.push('p.category_id = (SELECT id FROM categories WHERE slug = @category)'); params.category = category; }
  if (featured === 1 || featured === '1') where.push('p.featured = 1');
  if (deal === 1 || deal === '1') where.push('p.deal = 1');
  if (search) {
    where.push('(p.name LIKE @q OR p.description LIKE @q OR c.name LIKE @q)');
    params.q = `%${search}%`;
  }
  if (ids) {
    const idList = String(ids).split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
    const ors = idList.map((id, i) => { params[`id${i}`] = id; return `p.id = @id${i}`; });
    if (ors.length) where.push(`(${ors.join(' OR ')})`);
  }
  let orderBy = 'p.featured DESC, p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  if (sort === 'price_desc') orderBy = 'p.price DESC';
  if (sort === 'name') orderBy = 'p.name ASC';
  if (sort === 'rating') orderBy = 'p.rating DESC';

  const sql = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p JOIN categories c ON c.id = p.category_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`;
  return db.prepare(sql).all({
    ...params,
    limit: Math.min(parseInt(limit, 10) || 24, 100),
    offset: Math.max(parseInt(offset, 10) || 0, 0),
  }).map(productJson);
}

export function getProduct(id) {
  const p = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`).get(id);
  return p ? productJson(p) : null;
}

export function getRelated(product) {
  return db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.category_id = ? AND p.id != ? ORDER BY p.featured DESC LIMIT 4`)
    .all(product.category_id, product.id).map(productJson);
}

/* ================= orders ================= */

export const DELIVERY_METHODS = {
  same_day: 'Same-day Lagos', next_day: 'Next-day Lagos',
  nationwide: 'Nationwide (2–5 days)', pickup: 'Pickup at Ogudu market',
};
export const PAYMENT_METHODS = {
  pod: 'Pay on delivery', transfer: 'Bank transfer', card: 'Card payment',
};

export function createOrder({ customer = {}, delivery = {}, payment = {}, notes = '', items = [] } = {}) {
  const name = String(customer.name || '').trim();
  const phone = String(customer.phone || '').trim();
  const email = String(customer.email || '').trim();
  const address = String(customer.address || '').trim();
  const city = String(customer.city || '').trim();
  const state = String(customer.state || '').trim();
  const method = String(delivery.method || '');
  const payMethod = String(payment.method || '');

  if (!name) throw new Error('Please enter your full name');
  if (!/^[0-9+\-() ]{7,16}$/.test(phone)) throw new Error('Please enter a valid phone number');
  if (!DELIVERY_METHODS[method]) throw new Error('Please choose a delivery method');
  if (!PAYMENT_METHODS[payMethod]) throw new Error('Please choose a payment method');
  if (payMethod === 'card' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('Enter your email address to pay with card (Paystack needs it for your receipt)');
  }
  if (method !== 'pickup' && (!address || !city)) throw new Error('Please enter your delivery address and area');
  if (!Array.isArray(items) || items.length === 0) throw new Error('Your cart is empty');

  const getProductRow = db.prepare('SELECT * FROM products WHERE id = ?');
  const lineItems = [];
  let subtotal = 0;
  for (const it of items) {
    const pid = Number(it.id);
    const vi = Number(it.variant) || 0;
    const qty = parseInt(it.qty, 10) || 0;
    if (!Number.isInteger(pid) || pid < 1 || qty < 1 || qty > 99) throw new Error('Invalid item in cart');
    const p = getProductRow.get(pid);
    if (!p) throw new Error('A product in your cart no longer exists');
    const variants = JSON.parse(p.variants || '[]');
    const v = variants[vi] || variants[0] || { label: p.unit, price: p.price };
    lineItems.push({ product_id: p.id, product_name: p.name, variant_label: v.label, qty, price: v.price });
    subtotal += v.price * qty;
  }

  const fee = deliveryFee(method, subtotal);
  const total = subtotal + fee;
  const ref = makeRef();

  const create = db.transaction(() => {
    const info = db.prepare(`INSERT INTO orders
      (ref, customer_name, phone, email, address, city, state, landmark, delivery_method, delivery_fee, payment_method, subtotal, total, status, notes)
      VALUES (@ref, @name, @phone, @email, @address, @city, @state, @landmark, @method, @fee, @pay, @subtotal, @total, 'Pending', @notes)`)
      .run({
        ref, name, phone, email, address, city, state: state || 'Lagos',
        landmark: String(customer.landmark || '').trim(), method, fee, pay: payMethod,
        subtotal, total, notes: String(notes || '').slice(0, 500),
      });
    const orderId = info.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, variant_label, qty, price) VALUES (?, ?, ?, ?, ?, ?)');
    for (const li of lineItems) insertItem.run(orderId, li.product_id, li.product_name, li.variant_label, li.qty, li.price);
    const decStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');
    for (const li of lineItems) if (li.product_id) decStock.run(li.qty, li.product_id);
    return orderId;
  });

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(create());
}

export function getOrderByRef(ref) {
  const order = db.prepare('SELECT * FROM orders WHERE ref = ?').get(String(ref || '').trim().toUpperCase());
  if (!order) return null;
  return { order, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) };
}

/**
 * Mark an order as paid (after successful Paystack verification, or the demo flow).
 * Card orders auto-advance from Pending → Confirmed once money is received.
 */
export function markOrderPaid(ref) {
  const info = db.prepare(`
    UPDATE orders
    SET payment_status = 'paid',
        status = CASE WHEN status = 'Pending' THEN 'Confirmed' ELSE status END
    WHERE ref = ?`).run(String(ref || '').trim().toUpperCase());
  return info.changes > 0;
}

export function subscribeNewsletter(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) throw new Error('Please enter a valid email address');
  db.prepare('INSERT OR IGNORE INTO newsletter (email) VALUES (?)').run(clean);
  return true;
}

/* ================= admin ================= */

export function adminLogin(username, password) {
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || admin.password_hash !== hashPassword(password, admin.salt)) return null;
  return { username: admin.username };
}

export function adminStats() {
  const revenue = db.prepare("SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE status != 'Cancelled'").get().v;
  const paidRevenue = db.prepare("SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE payment_status = 'paid'").get().v;
  const ordersCount = db.prepare('SELECT COUNT(*) AS v FROM orders').get().v;
  const pending = db.prepare("SELECT COUNT(*) AS v FROM orders WHERE status IN ('Pending','Confirmed')").get().v;
  const productsCount = db.prepare('SELECT COUNT(*) AS v FROM products').get().v;
  const customers = db.prepare('SELECT COUNT(DISTINCT phone) AS v FROM orders').get().v;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = db.prepare("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders FROM orders WHERE date(created_at) = ? AND status != 'Cancelled'").get(key);
    days.push({ date: key, label: d.toLocaleDateString('en-NG', { weekday: 'short' }), revenue: row.revenue, orders: row.orders });
  }
  const recent = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6').all();
  return { revenue, paidRevenue, ordersCount, pending, productsCount, customers, days, recent };
}

export function adminOrders({ status, q } = {}) {
  const where = [];
  const params = {};
  if (status && status !== 'All') { where.push('o.status = @status'); params.status = status; }
  if (q) { where.push('(o.ref LIKE @q OR o.customer_name LIKE @q OR o.phone LIKE @q)'); params.q = `%${q}%`; }
  return db.prepare(`
    SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
    FROM orders o
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY o.created_at DESC LIMIT 200`).all(params);
}

export function adminOrderById(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  return { order, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) };
}

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];

export function adminSetOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) throw new Error('Invalid status');
  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  if (!info.changes) throw new Error('Order not found');
  return true;
}

export function adminProducts() {
  const products = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.id`).all().map(productJson);
  return { products, categories: getCategories() };
}

export function adminCreateProduct(b) {
  const name = String(b.name || '').trim();
  const category_id = Number(b.category_id);
  const unit = String(b.unit || 'per pack').trim();
  const price = Number(b.price);
  if (!name || !Number.isInteger(category_id)) throw new Error('Name and category are required');
  if (!(price > 0)) throw new Error('Enter a valid price');
  const variants = (Array.isArray(b.variants) && b.variants.length ? b.variants : [{ label: unit, price }])
    .filter((v) => v.label && Number(v.price) > 0);
  const info = db.prepare(`INSERT INTO products
    (category_id, name, unit, description, price, old_price, variants, stock, image, badge, rating, reviews, featured, deal)
    VALUES (@category_id, @name, @unit, @description, @price, @old_price, @variants, @stock, @image, @badge, @rating, @reviews, @featured, @deal)`)
    .run({
      category_id, name, unit,
      description: String(b.description || '').slice(0, 2000),
      price: variants.length ? variants[0].price : price,
      old_price: Number(b.old_price) > price ? Number(b.old_price) : null,
      variants: JSON.stringify(variants), stock: parseInt(b.stock, 10) || 0,
      image: String(b.image || '').slice(0, 500),
      badge: String(b.badge || '').trim() || null,
      rating: Math.min(5, Math.max(0, Number(b.rating) || 4.5)),
      reviews: parseInt(b.reviews, 10) || 0,
      featured: b.featured ? 1 : 0, deal: b.deal ? 1 : 0,
    });
  return info.lastInsertRowid;
}

export function adminUpdateProduct(id, b) {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) throw new Error('Product not found');
  const name = b.name !== undefined ? String(b.name).trim() : p.name;
  const category_id = b.category_id !== undefined ? Number(b.category_id) : p.category_id;
  const price = b.price !== undefined ? Number(b.price) : p.price;
  if (!name || !Number.isInteger(category_id) || !(price > 0)) throw new Error('Invalid product fields');
  let variants = p.variants;
  if (Array.isArray(b.variants) && b.variants.length) {
    const clean = b.variants.filter((v) => v.label && Number(v.price) > 0);
    if (clean.length) variants = JSON.stringify(clean);
  }
  db.prepare(`UPDATE products SET
    name = @name, category_id = @category_id, unit = @unit, description = @description,
    price = @price, old_price = @old_price, variants = @variants, stock = @stock, image = @image,
    badge = @badge, rating = @rating, reviews = @reviews, featured = @featured, deal = @deal
    WHERE id = @id`).run({
    id, name, category_id,
    unit: b.unit !== undefined ? String(b.unit).trim() || 'per pack' : p.unit,
    description: b.description !== undefined ? String(b.description).slice(0, 2000) : p.description,
    price,
    old_price: b.old_price !== undefined ? (Number(b.old_price) > price ? Number(b.old_price) : null) : p.old_price,
    variants,
    stock: b.stock !== undefined ? Math.max(0, parseInt(b.stock, 10) || 0) : p.stock,
    image: b.image !== undefined ? String(b.image).slice(0, 500) : p.image,
    badge: b.badge !== undefined ? (String(b.badge).trim() || null) : p.badge,
    rating: b.rating !== undefined ? Math.min(5, Math.max(0, Number(b.rating) || 0)) : p.rating,
    reviews: b.reviews !== undefined ? parseInt(b.reviews, 10) || 0 : p.reviews,
    featured: b.featured !== undefined ? (b.featured ? 1 : 0) : p.featured,
    deal: b.deal !== undefined ? (b.deal ? 1 : 0) : p.deal,
  });
  return true;
}

export function adminDeleteProduct(id) {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (!info.changes) throw new Error('Product not found');
  return true;
}
