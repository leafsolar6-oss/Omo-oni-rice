'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, toast } from '../../../lib/client';
import { fmt } from '../../../lib/format';

const STATUS_FLOW = [
  { key: 'Pending', label: 'Placed' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Packed', label: 'Packed' },
  { key: 'Out for delivery', label: 'On the way' },
  { key: 'Delivered', label: 'Delivered' },
];
const STATUS_CLASS = {
  Pending: 'st-pending', Confirmed: 'st-confirmed', Packed: 'st-packed',
  'Out for delivery': 'st-delivering', Delivered: 'st-delivered', Cancelled: 'st-cancelled',
};
const METHOD_NAMES = {
  same_day: 'Same-day Ibadan', next_day: 'Next-day Ibadan',
  nationwide: 'Nationwide (2–5 days)', pickup: 'Pickup at Bodija market',
};
const PAY_NAMES = { pod: 'Pay on delivery', transfer: 'Bank transfer', card: 'Card payment' };

function OrderInner() {
  const sp = useSearchParams();
  const ref = sp.get('ref');
  const [view, setView] = useState(ref ? 'loading' : 'lookup');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!ref) return;
    const loadOrder = async () => {
      // Paystack's full-page checkout fallback returns with reference/trxref.
      // Verify it before loading the order so the receipt immediately shows
      // the confirmed payment, just like the inline popup flow.
      const callbackRef = sp.get('reference') || sp.get('trxref');
      if (callbackRef && callbackRef.toUpperCase() === ref.toUpperCase()) {
        try {
          await api('/api/paystack/verify', { method: 'POST', body: { reference: ref } });
        } catch (e) {
          toast(`Payment confirmation pending: ${e.message}`, 'error');
        }
      }
      const d = await api(`/api/orders/${encodeURIComponent(ref)}`);
      setData(d);
      setView('order');
    };
    loadOrder().catch((e) => { toast(e.message, 'error'); setView('lookup'); });
  }, [ref, sp]);

  const lookup = async (e) => {
    e.preventDefault();
    const r = new FormData(e.target).get('ref');
    try {
      const d = await api(`/api/orders/${encodeURIComponent(String(r).trim().toUpperCase())}`);
      setData(d);
      setView('order');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (view === 'loading') {
    return <div className="order-wrap"><p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading your order…</p></div>;
  }

  if (view === 'lookup') {
    return (
      <div className="order-wrap">
        <div className="order-success">
          <div className="es-icon" style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--g100)', color: 'var(--g700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2.2rem' }}>📦</div>
          <h1>Track your order</h1>
          <p>Enter your order reference (e.g. OOR-8F3K2A).</p>
          <form className="lookup-form" onSubmit={lookup} style={{ marginTop: 18 }}>
            <input className="input" name="ref" placeholder="OOR-XXXXXX" required />
            <button className="btn btn-primary" type="submit">Track order</button>
          </form>
        </div>
      </div>
    );
  }

  const { order, items } = data;
  const statusIdx = STATUS_FLOW.findIndex((s) => s.key === order.status);
  const width = order.status === 'Delivered' ? 100 : Math.max(0, (statusIdx / (STATUS_FLOW.length - 1)) * 100);
  const isNew = ref != null;

  return (
    <div className="order-wrap">
      <div className="order-success">
        <div className="success-check" style={{ fontSize: '2.4rem' }}>✓</div>
        <h1>{isNew ? 'Order placed successfully! 🎉' : 'Order details'}</h1>
        <p>{isNew ? 'We have received your order and our team is getting it ready.' : 'Here is the current status of your order.'}</p>
        <span className="order-ref">{order.ref}</span>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`status-pill ${STATUS_CLASS[order.status] || 'st-pending'}`}>● {order.status}</span>
          {order.payment_status === 'paid' ? (
            <span className="status-pill st-delivered">💳 Paid</span>
          ) : (
            <>
              {order.payment_method === 'card' && <span className="status-pill st-pending">⏳ Awaiting payment</span>}
              {order.payment_method === 'pod' && <span className="badge badge-amber">💵 Pay on delivery</span>}
              {order.payment_method === 'transfer' && <span className="badge badge-amber">🏦 Pending transfer</span>}
            </>
          )}
        </div>
      </div>

      <div className="order-details">
        <h3>Delivery progress</h3>
        {order.status === 'Cancelled' ? (
          <div style={{ textAlign: 'center', padding: '26px 0' }}>
            <span className="status-pill st-cancelled" style={{ fontSize: '1rem' }}>Order cancelled</span>
            <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: '.9rem' }}>This order was cancelled. If this is a mistake, please call us on <b>+234 801 234 5678</b>.</p>
          </div>
        ) : (
          <>
            <div className="timeline">
              {STATUS_FLOW.map((s, i) => {
                const cls = i < statusIdx ? 'done' : i === statusIdx ? 'current' : '';
                return (
                  <div className={`tl-step ${cls}`} key={s.key}>
                    <span className="tl-dot">{i < statusIdx ? '✓' : i + 1}</span>
                    <small>{s.label}</small>
                  </div>
                );
              })}
            </div>
            <style>{`.order-wrap .timeline::after { width: ${Math.min(100, width * 0.84 + 8)}%; }`}</style>
          </>
        )}
      </div>

      <div className="order-details">
        <h3>Items ({items.reduce((s, i) => s + i.qty, 0)})</h3>
        {items.map((i, idx) => (
          <div className="co-item" key={idx}>
            <div>
              <div className="nm">{i.product_name}</div>
              <div className="vr">{i.variant_label} · {fmt(i.price)} each</div>
            </div>
            <span className="q">×{i.qty}</span>
            <span className="p">{fmt(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="sum-row" style={{ marginTop: 14, borderTop: '1.5px dashed var(--line2)', paddingTop: 12 }}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
        <div className="sum-row"><span>Delivery ({METHOD_NAMES[order.delivery_method] || order.delivery_method})</span><span>{order.delivery_fee > 0 ? fmt(order.delivery_fee) : 'FREE'}</span></div>
        <div className="sum-row total"><span>Total</span><b>{fmt(order.total)}</b></div>
      </div>

      <div className="order-details">
        <h3>Delivery &amp; payment</h3>
        <div className="od-grid">
          <div className="od-block">
            <b>Deliver to</b>
            <p>
              {order.customer_name}<br />
              {order.address || '—'}<br />
              {order.city}{order.landmark ? `, near ${order.landmark}` : ''}, {order.state}<br />
              {order.phone}
            </p>
          </div>
          <div className="od-block"><b>Delivery method</b><p>{METHOD_NAMES[order.delivery_method] || order.delivery_method}</p></div>
          <div className="od-block"><b>Payment</b><p>{PAY_NAMES[order.payment_method] || order.payment_method}</p></div>
          <div className="od-block">
            <b>Placed on</b>
            <p>{new Date(`${order.created_at} UTC`).toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <a className="btn btn-primary" href="/shop">Continue shopping</a>
        <a className="btn btn-ghost" href="/">Back to home</a>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="order-wrap"><p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading…</p></div>}>
      <OrderInner />
    </Suspense>
  );
}
