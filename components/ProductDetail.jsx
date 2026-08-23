'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmt, starsHtml } from '../lib/format';
import { Icons } from '../lib/icons';
import { addToCart } from '../lib/client';
import ProductCard from './ProductCard';

export default function ProductDetail({ product, related }) {
  const router = useRouter();
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const v = product.variants[variantIdx] || product.variants[0];
  const stockCls = product.stock <= 0 ? 'out' : product.stock < 15 ? 'low' : '';
  const stockTxt = product.stock <= 0 ? 'Out of stock' : product.stock < 15 ? `Only ${product.stock} left — order soon` : 'In stock';
  const saving = product.old_price && Number(product.old_price) > Number(v.price)
    ? Math.round((1 - Number(v.price) / Number(product.old_price)) * 100) : 0;

  return (
    <>
      <div className="product-layout">
        <div className="pd-media">
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => { e.currentTarget.src = '/img/placeholder.svg'; }}
          />
        </div>
        <div>
          <a className="pd-cat" href={`/shop?category=${product.category_slug}`}>{product.category_name}</a>
          <h1 className="pd-title">{product.name}</h1>
          <div className="pd-rating">
            <span className="stars">{starsHtml(product.rating)}</span>
            {Number(product.rating).toFixed(1)} · {product.reviews} verified reviews
            {product.badge && <span className="badge badge-amber" style={{ marginLeft: 6 }}>{product.badge}</span>}
          </div>

          <div className="pd-price" style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            {fmt(v.price)} <small>{v.label}</small>
            {saving > 0 && (
              <>
                <span className="p-old" style={{ fontSize: '1.05rem', textDecoration: 'line-through', color: 'var(--muted)', fontWeight: 700 }}>
                  {fmt(product.old_price)}
                </span>
                <span className="deal-off">Save {saving}%</span>
              </>
            )}
          </div>
          <div className="p-stock" style={{ fontSize: '.85rem', marginTop: 4, color: stockCls === 'low' ? 'var(--amber600)' : stockCls === 'out' ? 'var(--red)' : 'var(--g700)' }}>
            ● {stockTxt}
          </div>
          <p className="pd-desc">{product.description}</p>

          <div className="variant-label">Choose pack size</div>
          <div className="variant-row">
            {product.variants.map((vr, i) => (
              <button
                key={i}
                className={`variant-pill ${i === variantIdx ? 'active' : ''}`}
                onClick={() => setVariantIdx(i)}
              >
                {vr.label}<small>{fmt(vr.price)}</small>
              </button>
            ))}
          </div>

          <div className="qty-row">
            <span className="variant-label" style={{ margin: 0 }}>Quantity</span>
            <div className="qty-stepper">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
              <span>{qty}</span>
              <button disabled={qty >= product.stock} onClick={() => setQty(Math.min(product.stock, 99, qty + 1))} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <div className="buy-row">
            <button className="btn btn-primary btn-lg" disabled={product.stock <= 0} onClick={() => addToCart(product.id, variantIdx, qty, product.stock)}>
              <span dangerouslySetInnerHTML={{ __html: Icons.cart }} /> Add to cart — {fmt(v.price * qty)}
            </button>
            <button
              className="btn btn-amber btn-lg"
              disabled={product.stock <= 0}
              onClick={() => {
                if (addToCart(product.id, variantIdx, qty, product.stock)) setTimeout(() => router.push('/cart'), 400);
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: Icons.bolt }} /> Buy now
            </button>
          </div>

          <div className="delivery-box">
            <div className="drow"><span className="ficon"><span dangerouslySetInnerHTML={{ __html: Icons.truck }} /></span><div><b>Same-day Ibadan</b><span>Order before 3pm — from ₦2,500</span></div></div>
            <div className="drow"><span className="ficon"><span dangerouslySetInnerHTML={{ __html: Icons.wallet }} /></span><div><b>Pay on delivery</b><span>Inspect first, then pay</span></div></div>
            <div className="drow"><span className="ficon"><span dangerouslySetInnerHTML={{ __html: Icons.shield }} /></span><div><b>Fresh guarantee</b><span>Not fresh? We replace it free</span></div></div>
            <div className="drow"><span className="ficon"><span dangerouslySetInnerHTML={{ __html: Icons.store }} /></span><div><b>Free pickup</b><span>Bodija market shop, Mon–Sat</span></div></div>
          </div>

          <div className="pd-perks">
            <span className="badge badge-green">✓ Hand-picked quality</span>
            <span className="badge badge-green">✓ No stones, no chaff</span>
            <span className="badge badge-green">✓ Fair market price</span>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 10 }}>
          <div className="sec-head">
            <div>
              <h2 className="sec-title">You may also like</h2>
              <p className="sec-sub">More from the same shelf.</p>
            </div>
          </div>
          <div className="product-grid">
            {related.map((p) => <ProductCard product={p} key={p.id} />)}
          </div>
        </section>
      )}
    </>
  );
}
