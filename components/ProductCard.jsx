'use client';

import { fmt, starsHtml } from '../lib/format';
import { Icons } from '../lib/icons';
import { addToCart } from '../lib/client';

export default function ProductCard({ product }) {
  const stockCls = product.stock <= 0 ? 'out' : product.stock < 15 ? 'low' : '';
  const stockTxt = product.stock <= 0 ? 'Out of stock' : product.stock < 15 ? `Only ${product.stock} left` : 'In stock';
  const badgeCls = (product.badge || '').toLowerCase().includes('best') ? 'badge-amber' : 'badge-green';
  const oldPrice = product.old_price && Number(product.old_price) > Number(product.price)
    ? <span className="p-old">{fmt(product.old_price)}</span> : null;

  return (
    <article className="p-card">
      <a className="p-media" href={`/product/${product.id}`}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/img/placeholder.svg'; }}
        />
        {product.badge && <span className={`badge ${badgeCls}`}>{product.badge}</span>}
      </a>
      <div className="p-body">
        <div className="p-cat">{product.category_name}</div>
        <h3 className="p-name"><a href={`/product/${product.id}`}>{product.name}</a></h3>
        <div className="p-meta">
          <span className="stars">{starsHtml(product.rating)}</span> {Number(product.rating).toFixed(1)} · {product.reviews} reviews
        </div>
        <div className="p-foot">
          <div className="p-price">
            <div className="prices-row">{oldPrice}{fmt(product.price)}</div>
            <small>{product.variants[0]?.label || product.unit}</small>
          </div>
          {product.stock > 0
            ? (
              <button className="add-btn" onClick={() => addToCart(product.id, 0, 1, product.stock)} aria-label={`Add ${product.name} to cart`}>
                <span dangerouslySetInnerHTML={{ __html: Icons.plus }} />
              </button>
            )
            : <span className={`p-stock ${stockCls}`}>{stockTxt}</span>}
        </div>
        {product.stock > 0 && (
          <div className={`p-stock ${stockCls}`} style={{ marginTop: -6 }}>{stockTxt}</div>
        )}
      </div>
    </article>
  );
}
