'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getCart, saveCart, toast } from '../../../lib/client';
import { fmt } from '../../../lib/format';
import { Icons } from '../../../lib/icons';

const FREE_AT = 50000;

const METHODS = [
  { key: 'same_day', icon: Icons.bolt, name: 'Same-day Lagos', desc: 'Order before 3pm, delivered today. Lagos mainland & island.', fee: 2500 },
  { key: 'next_day', icon: Icons.truck, name: 'Next-day Lagos', desc: 'Delivered tomorrow. Anywhere in Lagos.', fee: 1500 },
  { key: 'nationwide', icon: '🚛', name: 'Nationwide', desc: '2–5 working days to anywhere in Nigeria.', fee: 5000 },
  { key: 'pickup', icon: Icons.store, name: 'Pickup at shop', desc: 'Free pickup at Ogudu market, Mon–Sat, 8am–7pm.', fee: 0 },
];
const PAYMENTS = [
  { key: 'pod', icon: Icons.cash, name: 'Pay on delivery', desc: 'Inspect your items, then pay cash or transfer.' },
  { key: 'transfer', icon: Icons.bank, name: 'Bank transfer', desc: 'Send ahead to our GTBank account — confirmation on delivery.' },
  { key: 'card', icon: Icons.card, name: 'Card payment', desc: 'Pay securely with Paystack — Visa, Mastercard, Verve, transfer & USSD.' },
];

const feeFor = (key, subtotal) => {
  const m = METHODS.find((x) => x.key === key);
  if (!m) return 0;
  if ((key === 'same_day' || key === 'next_day') && subtotal >= FREE_AT) return 0;
  return m.fee;
};

/* ---- Paystack inline popup (loads the official script on demand) ---- */
function loadPaystackScript(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.PaystackPop) return resolve();
    let done = false;
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v2/inline.js';
    s.async = true;
    s.onload = () => { if (!done) { done = true; resolve(); } };
    s.onerror = () => { if (!done) { done = true; reject(new Error('Could not load Paystack')); } };
    document.head.appendChild(s);
    setTimeout(() => { if (!done) { done = true; reject(new Error('Paystack took too long to load')); } }, timeoutMs);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [prods, setProds] = useState({});
  const [loading, setLoading] = useState(true);
  const [methodKey, setMethodKey] = useState('same_day');
  const [payKey, setPayKey] = useState('pod');
  const [placing, setPlacing] = useState(false);
  const [paystackCfg, setPaystackCfg] = useState(null);
  const [demoRef, setDemoRef] = useState(null);
  const [demoPaying, setDemoPaying] = useState(false);

  useEffect(() => {
    const c = getCart();
    setCart(c);
    if (!c.length) { setLoading(false); } else {
      const ids = c.map((i) => i.id).join(',');
      api(`/api/products?ids=${ids}&limit=100`)
        .then((d) => {
          const by = {};
          d.products.forEach((p) => { by[p.id] = p; });
          setProds(by);
          setLoading(false);
        })
        .catch((e) => { toast(e.message, 'error'); setLoading(false); });
    }
    api('/api/paystack/config')
      .then((d) => setPaystackCfg(d))
      .catch(() => setPaystackCfg({ configured: false }));
  }, []);

  const rows = cart.map((item) => ({ item, product: prods[item.id] })).filter((r) => r.product);
  const subtotal = rows.reduce((s, r) => {
    const v = r.product.variants[r.item.variant] || r.product.variants[0];
    return s + v.price * r.item.qty;
  }, 0);
  const fee = feeFor(methodKey, subtotal);
  const total = subtotal + fee;

  const finishOrder = (ref) => router.push(`/order?ref=${encodeURIComponent(ref)}`);

  /* Real Paystack popup */
  const openPaystack = async (paystack, ref) => {
    try {
      await loadPaystackScript();
      const handler = window.PaystackPop.new({
        key: paystackCfg.publicKey,
        accessCode: paystack.access_code,
        onSuccess: async () => {
          try { await api('/api/paystack/verify', { method: 'POST', body: { reference: ref } }); }
          catch (e) { toast(e.message, 'error'); }
          finishOrder(ref);
        },
        onCancel: () => finishOrder(ref),
      });
      handler.openIframe();
    } catch (err) {
      // Fallback: full-page Paystack checkout redirect
      toast('Opening Paystack…');
      window.location.href = paystack.authorization_url;
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (placing) return;
    const fd = new FormData(e.target);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const address = String(fd.get('address') || '').trim();
    const city = String(fd.get('city') || '').trim();
    const state = String(fd.get('state') || '');
    const landmark = String(fd.get('landmark') || '').trim();
    const notes = String(fd.get('notes') || '').trim();

    if (!name) return toast('Please enter your full name', 'error');
    if (!/^[0-9+\-() ]{7,16}$/.test(phone)) return toast('Please enter a valid phone number', 'error');
    if (payKey === 'card' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return toast('Enter your email to pay with card (Paystack sends your receipt there)', 'error');
    }
    if (methodKey !== 'pickup' && (!address || !city)) return toast('Please enter your delivery address and area', 'error');

    setPlacing(true);
    try {
      const res = await api('/api/orders', {
        method: 'POST',
        body: {
          customer: { name, phone, email, address, city, state, landmark },
          delivery: { method: methodKey },
          payment: { method: payKey },
          notes,
          items: cart.map((i) => ({ id: i.id, variant: i.variant, qty: i.qty })),
        },
      });
      saveCart([]);
      window.dispatchEvent(new Event('cart-updated'));

      const ref = res.order.ref;
      if (payKey === 'card') {
        if (res.paystack && res.paystack.access_code) {
          openPaystack(res.paystack, ref);
        } else if (!res.paystack_configured) {
          setDemoRef(ref); // demo mode — no keys on this server
        } else {
          toast(res.paystack_error || 'Could not start the payment', 'error');
          finishOrder(ref); // order kept as pending — user can follow up
        }
        return;
      }
      finishOrder(ref);
    } catch (err) {
      setPlacing(false);
      toast(err.message, 'error');
    }
  };

  if (!loading && !cart.length) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="es-icon" style={{ fontSize: '2.6rem' }}>🛒</div>
          <h3>Nothing to checkout</h3>
          <p>Your cart is empty. Add some foodstuffs first.</p>
          <a className="btn btn-primary btn-lg" href="/shop">Start shopping</a>
        </div>
      </div>
    );
  }

  const cardDisabledNote = payKey === 'card' && paystackCfg && !paystackCfg.configured
    ? '🧪 Paystack keys not set on this server — you will see the demo payment flow.'
    : null;

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span className="sep">›</span><a href="/cart">Cart</a><span className="sep">›</span><span>Checkout</span></nav>
      <div className="page-head"><h1>Checkout</h1><p>Almost there — fill in your delivery details.</p></div>

      <div className="checkout-layout">
        <form id="co-form" onSubmit={placeOrder}>
          <div className="co-section">
            <div className="co-sec-title"><span className="num">1</span> Contact details</div>
            <div className="form-grid">
              <div className="field"><label htmlFor="f-name">Full name *</label><input className="input" id="f-name" name="name" placeholder="e.g. Adaeze Okafor" required /></div>
              <div className="field"><label htmlFor="f-phone">Phone number *</label><input className="input" id="f-phone" name="phone" type="tel" placeholder="e.g. 0803 123 4567" required /></div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="f-email">Email {payKey === 'card' ? '* (Paystack sends your receipt here)' : '(for order updates)'}</label>
              <input className="input" id="f-email" name="email" type="email" placeholder="you@example.com" required={payKey === 'card'} />
            </div>
          </div>

          <div className="co-section" style={{ opacity: methodKey === 'pickup' ? 0.45 : 1 }}>
            <div className="co-sec-title">
              <span className="num">2</span> Delivery address
              {methodKey === 'pickup' && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Not needed for pickup</span>}
            </div>
            <div className="field"><label htmlFor="f-address">Street address *</label><input className="input" id="f-address" name="address" placeholder="House number & street" required={methodKey !== 'pickup'} /></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="f-city">Area / town *</label><input className="input" id="f-city" name="city" placeholder="e.g. Yaba, Ikeja, Lekki" required={methodKey !== 'pickup'} /></div>
              <div className="field">
                <label htmlFor="f-state">State</label>
                <select className="select" id="f-state" name="state" defaultValue="Lagos">
                  <option>Lagos</option><option>Abuja (FCT)</option><option>Ogun</option><option>Oyo</option>
                  <option>Rivers</option><option>Kano</option><option>Kaduna</option><option>Enugu</option>
                  <option>Delta</option><option>Other</option>
                </select>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}><label htmlFor="f-landmark">Landmark (optional)</label><input className="input" id="f-landmark" name="landmark" placeholder="e.g. Beside First Bank, near the yellow gate" /></div>
          </div>

          <div className="co-section">
            <div className="co-sec-title"><span className="num">3</span> Delivery method</div>
            <div className="method-grid">
              {METHODS.map((m) => {
                const f = feeFor(m.key, subtotal);
                return (
                  <label className={`method-card ${m.key === methodKey ? 'active' : ''}`} key={m.key} onClick={() => setMethodKey(m.key)}>
                    <input type="radio" name="method" readOnly checked={m.key === methodKey} />
                    <span className="ficon"><span dangerouslySetInnerHTML={{ __html: m.icon }} /></span>
                    <div className="m-head"><b>{m.name}</b><span className="m-fee">{f === 0 ? 'FREE' : fmt(f)}</span></div>
                    <small>{m.desc}</small>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="co-section">
            <div className="co-sec-title"><span className="num">4</span> Payment method</div>
            <div className="method-grid">
              {PAYMENTS.map((m) => (
                <label className={`method-card ${m.key === payKey ? 'active' : ''}`} key={m.key} onClick={() => setPayKey(m.key)}>
                  <input type="radio" name="payment" readOnly checked={m.key === payKey} />
                  <span className="ficon"><span dangerouslySetInnerHTML={{ __html: m.icon }} /></span>
                  <div className="m-head"><b>{m.name}</b>{m.key === 'card' && <span className="badge badge-green">Paystack</span>}</div>
                  <small>{m.desc}</small>
                </label>
              ))}
            </div>
            {cardDisabledNote && <p className="admin-note" style={{ marginTop: 12 }}>{cardDisabledNote}</p>}
          </div>

          <div className="co-section">
            <div className="co-sec-title"><span className="num">5</span> Order note (optional)</div>
            <textarea className="textarea" name="notes" placeholder="Anything we should know? e.g. Call on arrival, drop with security…" />
          </div>

          <div style={{ display: 'none' }}><button type="submit" id="hidden-submit" /></div>
        </form>

        <aside>
          <div className="summary-card">
            <h3>Your order</h3>
            <div className="co-items">
              {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
              {rows.map(({ item, product }) => {
                const v = product.variants[item.variant] || product.variants[0];
                return (
                  <div className="co-item" key={`${product.id}-${item.variant}`}>
                    <a className="co-thumb" href={`/product/${product.id}`}>
                      <img src={product.image} alt="" onError={(e) => { e.currentTarget.src = '/img/placeholder.svg'; }} />
                    </a>
                    <div>
                      <div className="nm">{product.name}</div>
                      <div className="vr">{v.label}</div>
                    </div>
                    <span className="q">×{item.qty}</span>
                    <span className="p">{fmt(v.price * item.qty)}</span>
                  </div>
                );
              })}
            </div>
            <div className="sum-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="sum-row">
              <span>Delivery ({METHODS.find((m) => m.key === methodKey).name})</span>
              <span>{fee === 0 ? 'FREE' : fmt(fee)}</span>
            </div>
            {subtotal >= FREE_AT && (methodKey === 'same_day' || methodKey === 'next_day') && (
              <div className="sum-row" style={{ color: 'var(--g700)' }}><span>🎉 Free delivery unlocked</span><span>−{fmt(feeFor(methodKey, 0))}</span></div>
            )}
            <div className="sum-row total"><span>Total</span><b>{fmt(total)}</b></div>
            <div className="summary-cta">
              <button className="btn btn-primary btn-lg btn-block" onClick={() => document.getElementById('hidden-submit').click()} disabled={placing}>
                {placing ? 'Placing your order…' : `✓ Place order — ${fmt(total)}`}
              </button>
              <a className="btn btn-ghost btn-block" href="/cart">← Back to cart</a>
            </div>
            <div className="secure-note">🛡️ Card payments secured by Paystack · Freshness guaranteed</div>
          </div>
        </aside>
      </div>

      {/* Paystack demo mode modal — shown only when no keys are configured */}
      {demoRef && (
        <div className="modal-backdrop" onClick={() => { if (!demoPaying) { setDemoRef(null); finishOrder(demoRef); } }}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <h3>Paystack demo payment <button className="close-x" onClick={() => { setDemoRef(null); finishOrder(demoRef); }}>✕</button></h3>
            <p className="admin-note" style={{ marginBottom: 14 }}>
              🧪 <b>Demo mode.</b> No Paystack keys are configured on this server (.env.local).
              This simulates the card payment step. With real keys, the official Paystack
              checkout opens here instead.
            </p>
            <div className="sum-row"><span>Order</span><span className="cell-b">{demoRef}</span></div>
            <div className="sum-row total"><span>Amount</span><b>{fmt(total)}</b></div>
            <div className="m-foot">
              <button className="btn btn-ghost" disabled={demoPaying} onClick={() => { setDemoRef(null); finishOrder(demoRef); }}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={demoPaying}
                onClick={async () => {
                  setDemoPaying(true);
                  try {
                    const res = await api('/api/paystack/verify', { method: 'POST', body: { reference: demoRef } });
                    toast(res.demo ? 'Demo payment successful ✓' : 'Payment confirmed ✓');
                    finishOrder(demoRef);
                  } catch (err) {
                    setDemoPaying(false);
                    toast(err.message, 'error');
                  }
                }}
              >
                {demoPaying ? 'Processing…' : `💳 Pay ${fmt(total)} (demo)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
