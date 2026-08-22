'use client';

import { useEffect, useState } from 'react';
import { api, toast } from '../../lib/client';
import { fmt } from '../../lib/format';


const TOKEN_KEY = 'oor_admin_token';
const ALL_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];
const STATUS_CLASS = {
  Pending: 'st-pending', Confirmed: 'st-confirmed', Packed: 'st-packed',
  'Out for delivery': 'st-delivering', Delivered: 'st-delivered', Cancelled: 'st-cancelled',
};
const METHOD_NAMES = { same_day: 'Same-day Lagos', next_day: 'Next-day Lagos', nationwide: 'Nationwide', pickup: 'Pickup' };
const PAY_NAMES = { pod: 'Pay on delivery', transfer: 'Bank transfer', card: 'Card' };
const PRESET_IMAGES = [
  '/img/products/rice.jpg', '/img/products/ofada.jpg', '/img/products/beans.jpg',
  '/img/products/garri.jpg', '/img/products/yam.jpg', '/img/products/palmoil.jpg',
  '/img/products/groundnutoil.jpg', '/img/products/rodo.jpg', '/img/products/tomatoes.jpg',
  '/img/products/plantain.jpg', '/img/products/crayfish.jpg', '/img/products/egusi.jpg',
  '/img/products/stockfish.jpg', '/img/products/semovita.jpg', '/img/products/zobo.jpg',
];

const adminFetch = async (path, token, opts = {}) => {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* noop */ }
  if (!res.ok || data.ok === false) {
    if (res.status === 401) throw new Error('__UNAUTH__');
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

/* ================= Dashboard ================= */
function DashboardView({ adminApi }) {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    adminApi('/api/admin/stats')
      .then(setStats)
      .catch((e) => setErr(e.message));
  }, [adminApi]);

  if (err) return <div className="admin-card"><p className="admin-note">Could not load stats: {err}</p></div>;
  if (!stats) return <p className="admin-note">Loading dashboard…</p>;

  const maxRev = Math.max(...stats.days.map((d) => d.revenue), 1);

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="s-label"><span className="s-ico" style={{ background: '#e5f7ed', color: '#0f7a40' }}>💵</span> Total revenue</div>
          <div className="s-value">{fmt(stats.revenue)}</div>
          <div className="s-foot">All time (excl. cancelled) · {fmt(stats.paidRevenue)} paid online</div>
        </div>
        <div className="stat-card">
          <div className="s-label"><span className="s-ico" style={{ background: '#e5f7ed', color: '#0f7a40' }}>📦</span> Total orders</div>
          <div className="s-value">{stats.ordersCount}</div>
          <div className="s-foot">{stats.customers} unique customers</div>
        </div>
        <div className="stat-card">
          <div className="s-label"><span className="s-ico" style={{ background: '#fff7e8', color: '#d97706' }}>⏳</span> Awaiting action</div>
          <div className="s-value">{stats.pending}</div>
          <div className="s-foot">Pending / confirmed orders</div>
        </div>
        <div className="stat-card">
          <div className="s-label"><span className="s-ico" style={{ background: '#e5f7ed', color: '#0f7a40' }}>🛒</span> Products</div>
          <div className="s-value">{stats.productsCount}</div>
          <div className="s-foot">Live in the catalogue</div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Revenue — last 7 days</h3>
          <div className="chart">
            {stats.days.map((d) => (
              <div className="bar-col" key={d.date}>
                <div
                  className="bar"
                  style={{ height: `${Math.max(5, Math.round((d.revenue / maxRev) * 100))}%` }}
                  data-v={`${fmt(d.revenue)} · ${d.orders} order(s)`}
                />
                <span className="bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <h3>Recent orders</h3>
          <table className="atable">
            <thead><tr><th>Ref</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {stats.recent.map((o) => (
                <tr key={o.id}>
                  <td className="cell-b">{o.ref}</td>
                  <td>{o.customer_name}</td>
                  <td className="cell-b">{fmt(o.total)}</td>
                  <td><span className={`status-pill ${STATUS_CLASS[o.status]}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ================= Orders ================= */
function OrdersView({ adminApi, onViewOrder }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState(null);
  const [counts, setCounts] = useState({});
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    adminApi('/api/admin/orders' + (statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''))
      .then((d) => {
        setOrders(d.orders);
        const c = {};
        d.orders.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
        setCounts(c);
      })
      .catch((e) => toast(e.message, 'error'));
  }, [adminApi, statusFilter, refresh]);

  const changeStatus = async (id, status) => {
    try {
      await adminApi(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status } });
      toast(`Order #${id} → ${status}`);
      setRefresh((r) => r + 1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const totalShown = (orders || []).length;

  return (
    <>
      <div className="filter-tabs">
        <button className={`ftab ${!statusFilter ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All ({totalShown})</button>
        {ALL_STATUSES.filter((st) => counts[st] > 0).map((st) => (
          <button key={st} className={`ftab ${statusFilter === st ? 'active' : ''}`} onClick={() => setStatusFilter(st)}>
            {st} ({counts[st]})
          </button>
        ))}
      </div>
      <div className="admin-card">
        <table className="atable">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Date</th><th>Status</th><th /></tr></thead>
          <tbody>
            {orders === null && <tr><td colSpan={8} className="empty-row">Loading orders…</td></tr>}
            {orders !== null && !orders.length && <tr><td colSpan={8} className="empty-row">No orders here yet.</td></tr>}
            {orders !== null && orders.map((o) => (
              <tr key={o.id}>
                <td className="cell-b">{o.ref}</td>
                <td>{o.customer_name}<div className="cell-m">{o.phone}</div></td>
                <td className="cell-m">{o.item_count} item(s)</td>
                <td className="cell-m">
                  {PAY_NAMES[o.payment_method] || o.payment_method}
                  <div style={{ fontSize: '.74rem', fontWeight: 800, color: o.payment_status === 'paid' ? 'var(--g700)' : 'var(--muted)', marginTop: 2 }}>
                    {o.payment_status === 'paid' ? '✓ Paid' : 'Unpaid'}
                  </div>
                </td>
                <td className="cell-b">{fmt(o.total)}</td>
                <td className="cell-m">{new Date(`${o.created_at} UTC`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</td>
                <td>
                  <select
                    className="status-select"
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                  >
                    {ALL_STATUSES.map((st) => <option key={st}>{st}</option>)}
                  </select>
                </td>
                <td><div className="row-actions"><button className="btn btn-ghost btn-sm" onClick={() => onViewOrder(o.id)}>View</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ================= Products ================= */
function ProductsView({ adminApi, onEdit, onAdd, refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi('/api/admin/products')
      .then(setData)
      .catch((e) => toast(e.message, 'error'));
  }, [adminApi, refreshKey]);

  if (!data) return <p className="admin-note">Loading products…</p>;

  const remove = async (id) => {
    if (!window.confirm('Delete this product? Past orders keep their records.')) return;
    try {
      await adminApi(`/api/admin/products/${id}`, { method: 'DELETE' });
      toast('Product deleted');
      setData({ ...data, products: data.products.filter((p) => p.id !== id) });
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <span className="admin-note">{data.products.length} product(s) in the catalogue</span>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add product</button>
      </div>
      <div className="admin-card">
        <table className="atable">
          <thead><tr><th>Product</th><th>Category</th><th>Price (from)</th><th>Stock</th><th>Rating</th><th>Flags</th><th /></tr></thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="prod-cell">
                    <span className="pthumb">
                      {p.image
                        ? <img src={p.image} alt="" onError={(e) => { e.currentTarget.src = '/img/placeholder.svg'; }} />
                        : '🍚'}
                    </span>
                    <div><div className="cell-b">{p.name}</div><div className="cell-m">{p.variants.length} pack size(s)</div></div>
                  </div>
                </td>
                <td className="cell-m">{p.category_name}</td>
                <td className="cell-b">{fmt(p.price)}</td>
                <td>{p.stock}</td>
                <td className="cell-m">★ {Number(p.rating).toFixed(1)} ({p.reviews})</td>
                <td>
                  {p.featured === 1 && <span className="badge-featured">Featured</span>}{' '}
                  {p.deal === 1 && <span className="badge badge-amber">Deal</span>}{' '}
                  {p.badge && <span className="badge badge-green">{p.badge}</span>}
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ================= Order modal ================= */
function OrderModal({ adminApi, id, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi(`/api/admin/orders/${id}`)
      .then(setData)
      .catch((e) => toast(e.message, 'error'));
  }, [adminApi, id]);

  if (!data) {
    return (
      <div className="modal-backdrop">
        <div className="modal"><h3>Order <button className="close-x" onClick={onClose}>✕</button></h3><p className="admin-note">Loading…</p></div>
      </div>
    );
  }

  const { order, items } = data;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>Order {order.ref} <button className="close-x" onClick={onClose}>✕</button></h3>
        <div style={{ marginBottom: 14 }}>
          <span className={`status-pill ${STATUS_CLASS[order.status]}`}>{order.status}</span>{' '}
          <span className="badge badge-green">{METHOD_NAMES[order.delivery_method] || order.delivery_method}</span>{' '}
          <span className="badge badge-amber">{PAY_NAMES[order.payment_method] || order.payment_method}</span>{' '}
          <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-red'}`}>
            {order.payment_status === 'paid' ? '💳 Paid' : 'Unpaid'}
          </span>
        </div>
        <div className="od-grid" style={{ marginBottom: 16 }}>
          <div className="od-block"><b>Customer</b><p>{order.customer_name}<br />{order.phone}{order.email ? <><br />{order.email}</> : null}</p></div>
          <div className="od-block"><b>Deliver to</b><p>{order.address || 'Pickup'}{order.address ? `, ${order.city}` : ''}{order.landmark ? <><br />Landmark: {order.landmark}</> : null}</p></div>
          <div className="od-block"><b>Placed</b><p>{new Date(`${order.created_at} UTC`).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
          <div className="od-block"><b>Notes</b><p>{order.notes || '—'}</p></div>
        </div>
        <h3 style={{ fontSize: '.95rem', marginBottom: 10 }}>Items</h3>
        {items.map((i, idx) => (
          <div className="co-item" key={idx}>
            <div><div className="nm">{i.product_name}</div><div className="vr">{i.variant_label} · {fmt(i.price)}</div></div>
            <span className="q">×{i.qty}</span>
            <span className="p">{fmt(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="sum-row" style={{ marginTop: 12, borderTop: '1.5px dashed var(--line2)', paddingTop: 10 }}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
        <div className="sum-row"><span>Delivery</span><span>{order.delivery_fee > 0 ? fmt(order.delivery_fee) : 'FREE'}</span></div>
        <div className="sum-row total"><span>Total</span><b>{fmt(order.total)}</b></div>
        <div className="m-foot"><button className="btn btn-ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

/* ================= Product modal ================= */
function ProductModal({ adminApi, product, onClose, onSaved }) {
  const isEdit = !!product;
  const [image, setImage] = useState(product ? product.image : PRESET_IMAGES[0]);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    adminApi('/api/admin/products')
      .then((d) => setCategories(d.categories))
      .catch((e) => toast(e.message, 'error'));
  }, [adminApi]);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const vLines = String(fd.get('variants') || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const variants = [];
    for (const line of vLines) {
      const m = line.split('=');
      if (m.length === 2) {
        const price = Number(m[1].replace(/[^\d.]/g, ''));
        if (m[0] && price > 0) variants.push({ label: m[0].trim(), price });
      }
    }
    const name = String(fd.get('name') || '').trim();
    const unit = String(fd.get('unit') || 'per pack').trim();
    if (!name) return toast('Product name is required', 'error');
    if (!variants.length) return toast('Enter at least one pack size as "label = price"', 'error');

    const body = {
      name,
      category_id: Number(fd.get('category_id')),
      unit,
      stock: parseInt(fd.get('stock'), 10) || 0,
      rating: Number(fd.get('rating')) || 0,
      reviews: product ? product.reviews : 0,
      badge: String(fd.get('badge') || '').trim(),
      description: String(fd.get('description') || '').trim(),
      old_price: Number(fd.get('old_price')) || null,
      featured: fd.get('featured') === 'on',
      deal: fd.get('deal') === 'on',
      image,
      variants,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await adminApi(`/api/admin/products/${product.id}`, { method: 'PATCH', body });
        toast('Product updated');
      } else {
        await adminApi('/api/admin/products', { method: 'POST', body });
        toast('Product created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>{isEdit ? 'Edit product' : 'Add product'} <button className="close-x" onClick={onClose}>✕</button></h3>
        <form onSubmit={submit}>
          <div className="field"><label>Product name *</label><input className="input" name="name" defaultValue={product ? product.name : ''} required /></div>
          <div className="form-grid">
            <div className="field">
              <label>Category *</label>
              <select className="select" name="category_id" defaultValue={product ? product.category_id : categories ? categories[0]?.id : ''}>
                {categories
                  ? categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)
                  : <option>Loading…</option>}
              </select>
            </div>
            <div className="field"><label>Unit label (e.g. per bag)</label><input className="input" name="unit" defaultValue={product ? product.unit : 'per pack'} /></div>
          </div>
          <div className="field">
            <label>Pack sizes — one per line: label = price</label>
            <textarea
              className="textarea"
              name="variants"
              placeholder={'5kg bag = 11500\n25kg bag = 54000\n50kg bag = 105000'}
              defaultValue={product ? product.variants.map((v) => `${v.label} = ${v.price}`).join('\n') : ''}
            />
          </div>
          <div className="form-grid">
            <div className="field"><label>Stock *</label><input className="input" type="number" min="0" name="stock" defaultValue={product ? product.stock : 50} required /></div>
            <div className="field"><label>Old price (strikethrough, ₦)</label><input className="input" type="number" min="0" step="0.01" name="old_price" defaultValue={product ? product.old_price || '' : ''} /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Rating (0–5)</label><input className="input" type="number" step="0.1" min="0" max="5" name="rating" defaultValue={product ? product.rating : 4.5} /></div>
            <div className="field"><label>Badge (e.g. Best seller)</label><input className="input" name="badge" defaultValue={product ? product.badge || '' : ''} /></div>
          </div>
          <div className="field">
            <label>Flags</label>
            <div style={{ display: 'flex', gap: 18 }}>
              <label className="f-option" style={{ margin: 0 }}><input type="checkbox" name="featured" defaultChecked={product ? product.featured === 1 : false} /> <span>Featured on homepage</span></label>
              <label className="f-option" style={{ margin: 0 }}><input type="checkbox" name="deal" defaultChecked={product ? product.deal === 1 : false} /> <span>Deal of the day</span></label>
            </div>
          </div>
          <div className="field"><label>Description</label><textarea className="textarea" name="description" defaultValue={product ? product.description : ''} /></div>
          <div className="field">
            <label>Image</label>
            <div className="img-pick-row">
              {PRESET_IMAGES.map((img) => (
                <span
                  key={img}
                  className={`img-pick ${image === img ? 'active' : ''}`}
                  onClick={() => setImage(img)}
                >
                  <img src={img} alt="" />
                </span>
              ))}
            </div>
          </div>
          <div className="m-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{isEdit ? 'Save changes' : 'Create product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= Page ================= */
export default function AdminPage() {
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null));
  const [tab, setTab] = useState('dashboard');
  const [loginErr, setLoginErr] = useState('');
  const [modal, setModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.body.className = 'admin-body';
    return () => { document.body.className = ''; };
  }, []);

  const adminApi = async (path, opts = {}) => {
    try {
      return await adminFetch(path, token, opts);
    } catch (e) {
      if (e.message === '__UNAUTH__') {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      throw e;
    }
  };

  const login = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setLoginErr('');
    try {
      const res = await api('/api/admin/login', {
        method: 'POST',
        body: { username: String(fd.get('username') || '').trim(), password: String(fd.get('password') || '') },
      });
      sessionStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      toast(`Welcome back, ${res.username}!`);
    } catch (err) {
      setLoginErr(err.message);
    }
  };

  const logout = () => {
    if (token) adminFetch('/api/admin/logout', token, { method: 'POST' }).catch(() => {});
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    toast('Logged out');
  };

  if (!token) {
    return (
      <div className="admin-body">
        <div className="admin-login">
          <div className="login-card">
            <a className="logo" href="/">
              <span className="logo-mark">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M4.5 10h15a1 1 0 0 1 .94 1.34l-1.3 3.5a2.5 2.5 0 0 1-2.35 1.66H7.7a2.5 2.5 0 0 1-2.36-1.66l-1.28-3.5A1 1 0 0 1 4.5 10z" fill="#fff"/>
                  <path d="M3.2 6.5h17.6l-1.2 2.6H4.4z" fill="#c9eedb"/>
                  <path d="M9.5 19.5c.2-1 .2-2.6 0-3 .9.8 1.8 1.6 2.7 2.4.1 1.2.2 2.4.3 3.6-1-.3-2-.8-3-1.4" fill="#fff"/>
                  <path d="M14.5 19.5c-.2-1-.2-2.6 0-3-.9.8-1.8 1.6-2.7 2.4-.1 1.2-.2 2.4-.3 3.6 1-.3 2-.8 3-1.4" fill="#c9eedb"/>
                </svg>
              </span>
              <span className="logo-text">
                <span className="logo-name">Omo Oni <em>Rice</em></span>
                <span className="logo-tag">Admin Dashboard</span>
              </span>
            </a>
            <h2>Welcome back</h2>
            <p className="sub">Sign in to manage your store</p>
            <div className="demo-hint">🔑 Demo login — username: <b>admin</b> · password: <b>omooni123</b></div>
            <form onSubmit={login}>
              <div className="field">
                <label htmlFor="l-user">Username</label>
                <input className="input" id="l-user" name="username" autoComplete="username" required />
              </div>
              <div className="field">
                <label htmlFor="l-pass">Password</label>
                <input className="input" id="l-pass" name="password" type="password" autoComplete="current-password" required />
              </div>
              {loginErr && <p style={{ color: 'var(--red)', fontSize: '.85rem', fontWeight: 700, marginBottom: 12 }}>{loginErr}</p>}
              <button className="btn btn-primary btn-block btn-lg" type="submit">Sign in</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const nav = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'orders', label: 'Orders', icon: '📦' },
    { key: 'products', label: 'Products', icon: '🛒' },
  ];

  return (
    <div className="admin-body">
      <div className="admin-shell">
        <aside className="admin-side">
          <a className="logo" href="/">
            <span className="logo-mark">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M4.5 10h15a1 1 0 0 1 .94 1.34l-1.3 3.5a2.5 2.5 0 0 1-2.35 1.66H7.7a2.5 2.5 0 0 1-2.36-1.66l-1.28-3.5A1 1 0 0 1 4.5 10z" fill="#fff"/>
                <path d="M3.2 6.5h17.6l-1.2 2.6H4.4z" fill="#5fe39b"/>
                <path d="M9.5 19.5c.2-1 .2-2.6 0-3 .9.8 1.8 1.6 2.7 2.4.1 1.2.2 2.4.3 3.6-1-.3-2-.8-3-1.4" fill="#fff"/>
                <path d="M14.5 19.5c-.2-1-.2-2.6 0-3-.9.8-1.8 1.6-2.7 2.4-.1 1.2-.2 2.4-.3 3.6 1-.3 2-.8 3-1.4" fill="#5fe39b"/>
              </svg>
            </span>
            <span className="logo-text">
              <span className="logo-name">Omo Oni <em>Rice</em></span>
              <span className="logo-tag">Admin Dashboard</span>
            </span>
          </a>
          {nav.map((n) => (
            <button key={n.key} className={`aside-link ${tab === n.key ? 'active' : ''}`} onClick={() => setTab(n.key)}>
              {n.icon} {n.label}
            </button>
          ))}
          <div className="aside-sep" />
          <a className="aside-link" href="/" target="_blank" rel="noreferrer">🛍️ View store</a>
          <button className="aside-link" onClick={logout}>🚪 Logout</button>
        </aside>

        <main className="admin-main">
          <div className="admin-topbar">
            <h1>{nav.find((n) => n.key === tab)?.label}</h1>
            <div className="right"><span className="admin-note">Signed in as admin</span></div>
          </div>

          {tab === 'dashboard' && <DashboardView adminApi={adminApi} />}
          {tab === 'orders' && <OrdersView adminApi={adminApi} onViewOrder={(id) => setModal({ kind: 'order', id })} />}
          {tab === 'products' && (
            <ProductsView
              adminApi={adminApi}
              refreshKey={refreshKey}
              onAdd={() => setModal({ kind: 'product', product: null })}
              onEdit={(p) => setModal({ kind: 'product', product: p })}
            />
          )}
        </main>
      </div>

      {modal?.kind === 'order' && <OrderModal adminApi={adminApi} id={modal.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'product' && (
        <ProductModal
          adminApi={adminApi}
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
