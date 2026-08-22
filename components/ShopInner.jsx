'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import { api, toast } from '../lib/client';

const CAT_META = {
  'rice-grains': { t: 'Rice & Grains', d: 'Long grain, ofada and more — stone-free and bagged fresh.' },
  'beans-legumes': { t: 'Beans & Legumes', d: 'Sweet honey beans, egusi and seeds for the pot.' },
  'cassava-flours': { t: 'Cassava & Flours', d: 'Garri, semovita and swallow staples.' },
  'fresh-produce': { t: 'Fresh Produce', d: 'Pepper, tomatoes and market-fresh items.' },
  tubers: { t: 'Tubers', d: 'Fresh yam and root crops from Benue farms.' },
  oils: { t: 'Oils & Sauces', d: 'Pure palm oil, groundnut oil and cooking oils.' },
  'proteins-fish': { t: 'Proteins & Fish', d: 'Crayfish, stockfish and soup boosters.' },
  'drinks-snacks': { t: 'Drinks & Snacks', d: 'Zobo and chilled treats.' },
};

const PRICE_RANGES = [
  { value: '', label: 'Any price' },
  { value: '0-5000', label: 'Under ₦5,000' },
  { value: '5000-15000', label: '₦5,000 – ₦15,000' },
  { value: '15000-50000', label: '₦15,000 – ₦50,000' },
  { value: '50000-99999999', label: 'Over ₦50,000' },
];

export default function ShopInner() {
  const searchParams = useSearchParams();
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState(null);
  const [activeCat, setActiveCat] = useState(searchParams.get('category') || '');
  const [price, setPrice] = useState('');
  const [sort, setSort] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');

  useEffect(() => {
    api('/api/categories')
      .then((d) => setCats(d.categories))
      .catch((e) => toast(e.message, 'error'));
  }, []);

  useEffect(() => {
    setProducts(null);
    const query = new URLSearchParams();
    if (activeCat) query.set('category', activeCat);
    if (search) query.set('search', search);
    if (sort) query.set('sort', sort);
    query.set('limit', '100');
    api(`/api/products?${query.toString()}`)
      .then((d) => setProducts(d.products))
      .catch((e) => toast(e.message, 'error'));
  }, [activeCat, search, sort]);

  const inPriceRange = (p) => {
    if (!price) return true;
    const [lo, hi] = price.split('-').map(Number);
    return p.price >= lo && p.price < hi;
  };

  const shown = (products || []).filter(inPriceRange);

  const meta = activeCat && CAT_META[activeCat] ? CAT_META[activeCat] : null;
  const title = meta ? meta.t : search ? `Results for “${search}”` : 'All Foodstuffs';
  const desc = meta ? meta.d : search ? 'Searching the whole market for you.' : 'Fresh, quality foodstuffs at honest market prices.';

  const setUrl = (params) => {
    const q = new URLSearchParams(params).toString();
    window.history.replaceState(null, '', q ? `/shop?${q}` : '/shop');
  };

  const clearAll = () => {
    setActiveCat(''); setPrice(''); setSort(''); setSearch('');
    setUrl({});
  };

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span className="sep">›</span><span>Shop</span>
      </nav>
      <div className="page-head">
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>

      <div className="shop-layout">
        <aside className="filters">
          <div className="filter-group">
            <h4>Categories</h4>
            <label className={`f-option ${!activeCat ? 'active' : ''}`}>
              <input type="radio" name="cat" checked={!activeCat} onChange={() => { setActiveCat(''); setUrl({ q: search, sort }); }} />
              <span>All categories</span>
              <span className="cnt">{cats.reduce((s, c) => s + c.product_count, 0)}</span>
            </label>
            {cats.map((c) => (
              <label className={`f-option ${activeCat === c.slug ? 'active' : ''}`} key={c.slug}>
                <input
                  type="radio"
                  name="cat"
                  checked={activeCat === c.slug}
                  onChange={() => { setActiveCat(c.slug); setUrl({ category: c.slug, q: search, sort }); }}
                />
                <span>{c.emoji} {c.name}</span>
                <span className="cnt">{c.product_count}</span>
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h4>Price range</h4>
            {PRICE_RANGES.map((r) => (
              <label className="f-option" key={r.value}>
                <input type="radio" name="price" checked={price === r.value} onChange={() => setPrice(r.value)} />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
          <button className="btn btn-ghost btn-block btn-sm" onClick={clearAll}>Clear all filters</button>
        </aside>

        <section>
          <div className="shop-toolbar">
            <div className="count">Showing <b>{shown.length}</b> product{shown.length !== 1 ? 's' : ''}</div>
            <div className="sort-wrap">
              <label htmlFor="sort">Sort by</label>
              <select id="sort" value={sort} onChange={(e) => { setSort(e.target.value); setUrl({ category: activeCat, q: search, sort: e.target.value }); }}>
                <option value="">Most popular</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name">Name A–Z</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>

          {products === null ? (
            <p style={{ color: 'var(--muted)' }}>Loading foodstuffs…</p>
          ) : shown.length ? (
            <div className="product-grid cols-3">
              {shown.map((p) => <ProductCard product={p} key={p.id} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="es-icon" style={{ fontSize: '2.6rem' }}>🔍</div>
              <h3>No foodstuffs found</h3>
              <p>Try a different search or clear your filters.</p>
              <button className="btn btn-primary" onClick={clearAll}>Clear filters</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

