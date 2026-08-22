'use client';

import { fmt, starsHtml } from '../lib/format';
import { Icons } from '../lib/icons';
import { addToCart } from '../lib/client';

export default function DealsList({ deals }) {
  if (!deals.length) return <p style={{ color: 'var(--muted)' }}>No deals right now — check back tomorrow morning!</p>;

  return (
    <div className="deal-grid">
      {deals.map((p) => {
        const off = p.old_price ? Math.round((1 - Number(p.price) / Number(p.old_price)) * 100) : 0;
        return (
          <div className="deal-card" key={p.id}>
            <a className="deal-thumb" href={`/product/${p.id}`}>
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = '/img/placeholder.svg'; }}
              />
            </a>
            <div className="deal-info">
              {off > 0 && <span className="deal-off">-{off}% Off</span>}
              <h4><a href={`/product/${p.id}`}>{p.name}</a></h4>
              <div className="p-meta">
                <span className="stars">{starsHtml(p.rating)}</span> {Number(p.rating).toFixed(1)}
              </div>
              <div className="deal-prices">
                <span className="now">{fmt(p.price)}</span>
                {p.old_price && <span className="was">{fmt(p.old_price)}</span>}
              </div>
            </div>
            {p.stock > 0 && (
              <button className="add-btn" onClick={() => addToCart(p.id)} aria-label={`Add ${p.name} to cart`}>
                <span dangerouslySetInnerHTML={{ __html: Icons.plus }} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
