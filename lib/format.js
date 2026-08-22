/* Shared pure formatting helpers (safe for server & client) */
export const fmt = (n) => '₦' + Number(n || 0).toLocaleString('en-NG');
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const starsHtml = (rating) => {
  const r = Math.round(Number(rating) || 0);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
};
