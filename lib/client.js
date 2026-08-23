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
  // Messages can include server-provided product names. Build the toast with
  // DOM nodes rather than innerHTML so catalogue content cannot inject markup.
  if (type === 'success') {
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = '✓';
    el.append(tick);
  }
  el.append(document.createTextNode(String(msg)));
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

export function addToCart(productId, variant = 0, qty = 1, maxStock = 99) {
  const cart = getCart();
  const requested = Math.max(1, Math.min(99, Number(qty) || 1));
  const stockCap = Math.max(0, Math.min(99, Number(maxStock) || 0));
  // Stock is tracked per product, so quantities in every pack-size variant
  // count towards the same available inventory.
  const alreadyInCart = cart
    .filter((i) => i.id === productId)
    .reduce((sum, i) => sum + i.qty, 0);
  const added = Math.min(requested, Math.max(0, stockCap - alreadyInCart));

  if (added <= 0) {
    toast(stockCap <= 0 ? 'This product is out of stock' : `Only ${stockCap} item(s) are available`, 'error');
    return false;
  }

  const found = cart.find((i) => i.id === productId && i.variant === variant);
  if (found) found.qty += added;
  else cart.push({ id: productId, variant, qty: added });
  saveCart(cart);
  window.dispatchEvent(new Event('cart-updated'));
  toast(added < requested ? `Added ${added}; only ${stockCap} item(s) are available` : 'Added to cart 🛒');
  return true;
}
