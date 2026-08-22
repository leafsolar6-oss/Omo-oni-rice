/* Client-only utilities: toasts, localStorage cart, fetch helper.
   Import this ONLY from client components ("use client"). */

export async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* noop */ }
  if (!res.ok || data.ok === false) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

/* ---------- toasts ---------- */
export function toast(msg, type = 'success') {
  let root = document.querySelector('.toast-root');
  if (!root) {
    root = document.createElement('div');
    root.className = 'toast-root';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = type === 'success' ? '<span class="tick">✓</span>' + msg : msg;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 320);
  }, 2600);
}

/* ---------- cart (localStorage) ---------- */
export const CART_KEY = 'oor_cart';
export const getCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
};
export const saveCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
export const cartCount = () => getCart().reduce((s, i) => s + i.qty, 0);

export function addToCart(productId, variant = 0, qty = 1) {
  const cart = getCart();
  const found = cart.find((i) => i.id === productId && i.variant === variant);
  if (found) found.qty = Math.min(99, found.qty + qty);
  else cart.push({ id: productId, variant, qty: Math.min(99, qty) });
  saveCart(cart);
  window.dispatchEvent(new Event('cart-updated'));
  toast('Added to cart 🛒');
}
