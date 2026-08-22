'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../lib/icons';
import { cartCount } from '../lib/client';

const Logo = () => (
  <a className="logo" href="/" aria-label="Omo Oni Rice home">
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
      <span className="logo-tag">Naija Foodstuff Market</span>
    </span>
  </a>
);

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener('cart-updated', update);
    return () => window.removeEventListener('cart-updated', update);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  const links = [
    { href: '/', label: 'Home', active: pathname === '/' },
    { href: '/shop', label: 'Shop', active: pathname === '/shop' || pathname.startsWith('/product') },
    { href: '/#deals', label: 'Deals', active: false },
    { href: '/#best-sellers', label: 'Best Sellers', active: false },
    { href: '/#blogs', label: 'Blogs', active: false },
    { href: '/#faq', label: 'FAQ', active: false },
    { href: '/#contact', label: 'Contact', active: false },
  ];

  return (
    <>
      <div className="topbar">
        <div className="container">🚚 Same-day delivery across Lagos &nbsp;·&nbsp; 💵 Pay on delivery &nbsp;·&nbsp; 🎉 <b>Free Lagos delivery on orders over ₦50,000</b></div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className="main-nav" aria-label="Main navigation">
            {links.map((l) => (
              <a key={l.href} href={l.href} className={l.active ? 'active' : ''}>{l.label}</a>
            ))}
          </nav>
          <div className="header-actions">
            <span className="rating-pill" title="Average customer rating">⭐ 4.8 Ratings+</span>
            <form className="header-search" onSubmit={submitSearch} role="search">
              <input
                type="search"
                placeholder="Search garri, rice, beans…"
                aria-label="Search products"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="submit" aria-label="Search"><span dangerouslySetInnerHTML={{ __html: Icons.search }} /></button>
            </form>
            <a className="icon-btn" href="/cart" aria-label="View cart">
              <span dangerouslySetInnerHTML={{ __html: Icons.cart }} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </a>
            <button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span dangerouslySetInnerHTML={{ __html: Icons.menu }} />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-nav ${menuOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}>
        <div className="sheet">
          <button className="m-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
          <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="/shop" onClick={() => setMenuOpen(false)}>Shop all</a>
          <a href="/shop?category=rice-grains" onClick={() => setMenuOpen(false)}>Rice &amp; Grains</a>
          <a href="/shop?category=beans-legumes" onClick={() => setMenuOpen(false)}>Beans &amp; Legumes</a>
          <a href="/shop?category=cassava-flours" onClick={() => setMenuOpen(false)}>Cassava &amp; Flours</a>
          <a href="/shop?category=fresh-produce" onClick={() => setMenuOpen(false)}>Fresh Produce</a>
          <a href="/shop?category=oils" onClick={() => setMenuOpen(false)}>Oils</a>
          <a href="/shop?category=proteins-fish" onClick={() => setMenuOpen(false)}>Proteins &amp; Fish</a>
          <a href="/cart" onClick={() => setMenuOpen(false)}>Cart</a>
        </div>
      </div>
    </>
  );
}
