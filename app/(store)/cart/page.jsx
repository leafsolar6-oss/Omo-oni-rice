'use client';

import { useEffect, useState } from 'react';
import { api, getCart, saveCart, toast } from '../../../lib/client';
import { fmt } from '../../../lib/format';
import { Icons } from '../../../lib/icons';

const FREE_DELIVERY_AT = 50000;

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [prods, setProds] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = getCart();
    setCart(c);
    if (!c.length) { setLoading(false); return; }
    const ids = c.map((i) => i.id).join(',');
    api(`/api/products?ids=${ids}&limit=100`)
      .then((d) => {
        const by = {};
        d.products.forEach((p) => { by[p.id] = p; });
        setProds(by);
        setLoading(false);
      })
      .catch((e) => { toast(e.message, 'error'); setLoading(false); });
  }, []);

  const rows = cart.map((item) => ({ item, product: prods[item.id] })).filter((r) => r.product);
  const subtotal = rows.reduce((s, r) => {
    const v = r.product.variants[r.item.variant] || r.product.variants[0];
    return s + v.price * r.item.qty;
  }, 0);
  const toFree = Math.max(0, FREE_DELIVERY_AT - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_AT) * 100));
  const productTotals = cart.reduce((totals, item) => {
    totals[item.id] = (totals[item.id] || 0) + item.qty;
    return totals;
  }, {});
  const unavailableCount = loading ? 0 : cart.filter((item) => !prods[item.id]).length;
  const overstockedIds = loading ? [] : Object.entries(productTotals)
    .filter(([id, qty]) => prods[id] && qty > prods[id].stock)
    .map(([id]) => Number(id));
  const hasStockIssues = unavailableCount > 0 || overstockedIds.length > 0;

  const update = (id, variant, delta, remove = false) => {
    let c = getCart();
    const f = c.find((i) => i.id === id && i.variant === variant);
    if (f) {
      if (remove || f.qty + delta <= 0) {
        c = c.filter((i) => !(i.id === id && i.variant === variant));
      } else if (delta > 0) {
        const total = c.filter((i) => i.id === id).reduce((sum, i) => sum + i.qty, 0);
        const stock = Number(prods[id]?.stock || 0);
        if (total >= stock) {
          toast(`Only ${stock} item(s) of this product are available`, 'error');
          return;
        }
        f.qty += Math.min(delta, stock - total);
      } else {
        f.qty = Math.min(99, f.qty + delta);
      }
    }
    saveCart(c);
    setCart([...c]);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeUnavailable = () => {
    const next = getCart().filter((item) => prods[item.id]);
    saveCart(next);
    setCart(next);
    window.dispatchEvent(new Event('cart-updated'));
    toast('Unavailable items removed');
  };

  if (!cart.length) {
    return (
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span className="sep">›</span><a href="/shop">Shop</a><span className="sep">›</span><span>Cart</span></nav>
        <div className="page-head"><h1>Your Cart</h1><p>Review your items before checkout.</p></div>
        <div className="empty-state">
          <div className="es-icon" style={{ fontSize: '2.6rem' }}>🛒</div>
          <h3>Your cart is empty</h3>
          <p>Fill it with fresh foodstuffs — rice, beans, garri and more await.</p>
          <a className="btn btn-primary btn-lg" href="/shop">Start shopping</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span className="sep">›</span><a href="/shop">Shop</a><span className="sep">›</span><span>Cart</span></nav>
      <div className="page-head"><h1>Your Cart</h1><p>Review your items before checkout.</p></div>

      <div className="cart-layout">
        <div>
          <div className="cart-card">
            {loading && <p style={{ color: 'var(--muted)' }}>Loading your items…</p>}
            {!loading && unavailableCount > 0 && (
              <div style={{ padding: 14, marginBottom: 12, borderRadius: 10, background: '#fff1f1', color: 'var(--red)', fontWeight: 700 }}>
                {unavailableCount} cart item(s) are no longer available.{' '}
                <button className="ci-remove" onClick={removeUnavailable}>Remove them</button>
              </div>
            )}
            {!loading && rows.map(({ item, product }) => {
              const v = product.variants[item.variant] || product.variants[0];
              return (
                <div className="cart-item" key={`${product.id}-${item.variant}`}>
                  <a className="cart-thumb" href={`/product/${product.id}`}>
                    <img src={product.image} alt={product.name} onError={(e) => { e.currentTarget.src = '/img/placeholder.svg'; }} />
                  </a>
                  <div>
                    <div className="ci-name"><a href={`/product/${product.id}`}>{product.name}</a></div>
                    <div className="ci-variant">{v.label} · {fmt(v.price)} each</div>
                    {overstockedIds.includes(product.id) && (
                      <div style={{ color: 'var(--red)', fontSize: '.78rem', fontWeight: 800, marginTop: 5 }}>
                        Only {product.stock} available across all pack sizes — reduce the quantity.
                      </div>
                    )}
                    <div className="qty-stepper" style={{ marginTop: 9 }}>
                      <button onClick={() => update(product.id, item.variant, -1)} aria-label="Decrease quantity">−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => update(product.id, item.variant, 1)} aria-label="Increase quantity">+</button>
                    </div>
                  </div>
                  <div className="ci-actions">
                    <span className="ci-price">{fmt(v.price * item.qty)}</span>
                    <button className="ci-remove" onClick={() => { update(product.id, item.variant, 0, true); toast('Item removed'); }}>
                      <span dangerouslySetInnerHTML={{ __html: Icons.trash }} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <a className="btn btn-ghost" href="/shop">← Continue shopping</a>
        </div>

        <aside>
          <div className="summary-card">
            <h3>Order summary</h3>
            <div className="free-progress">
              <p>
                {toFree > 0
                  ? <>Add {fmt(toFree)} more for <b style={{ color: 'var(--g700)' }}>FREE Ibadan delivery</b> 🎉</>
                  : <>You have unlocked <b style={{ color: 'var(--g700)' }}>FREE Ibadan delivery</b> 🎉</>}
              </p>
              <div className="bar"><i style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="sum-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="sum-row"><span>Delivery</span><span style={{ color: 'var(--muted)' }}>Calculated at checkout</span></div>
            <div className="sum-row total"><span>Total</span><b>{fmt(subtotal)}</b></div>
            <div className="summary-cta">
              {hasStockIssues
                ? <button className="btn btn-primary btn-lg btn-block" disabled>Resolve stock issues to continue</button>
                : <a className="btn btn-primary btn-lg btn-block" href="/checkout">Proceed to checkout →</a>}
            </div>
            <div className="pay-note">🛡️ Pay on delivery · Bank transfer · Card</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
