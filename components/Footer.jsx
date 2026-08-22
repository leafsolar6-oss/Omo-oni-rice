import { Icons } from '../lib/icons';

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
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
                <span className="logo-tag">Naija Foodstuff Market</span>
              </span>
            </a>
            <p>Fresh Nigerian foodstuffs — rice, beans, garri, palm oil and more — hand-picked from the best markets and delivered to your door in Ibadan and across Nigeria.</p>
            <div className="social-row">
              <a href="https://www.tiktok.com/@hee_sha1313" target="_blank" rel="noreferrer" aria-label="TikTok"><span dangerouslySetInnerHTML={{ __html: Icons.tiktok }} /></a>
              <a href="#" aria-label="Instagram"><span dangerouslySetInnerHTML={{ __html: Icons.instagram }} /></a>
              <a href="#" aria-label="Facebook"><span dangerouslySetInnerHTML={{ __html: Icons.facebook }} /></a>
              <a href="#" aria-label="Twitter / X"><span dangerouslySetInnerHTML={{ __html: Icons.twitter }} /></a>
              <a href="#" aria-label="WhatsApp"><span dangerouslySetInnerHTML={{ __html: Icons.whatsapp }} /></a>
            </div>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><a href="/#testimonials">About Us</a></li>
              <li><a href="/shop">Our Shop</a></li>
              <li><a href="/#blogs">Blog</a></li>
              <li><a href="/#testimonials">Testimonials</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Customer Services</h5>
            <ul>
              <li><a href="/order">Track Order</a></li>
              <li><a href="/#faq">FAQs</a></li>
              <li><a href="/#delivery">Delivery Info</a></li>
              <li><a href="/cart">My Cart</a></li>
              <li><a href="/#newsletter">Newsletter</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Our Information</h5>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms &amp; Conditions</a></li>
              <li><a href="#">Refund Policy</a></li>
              <li><a href="#">Return Policy</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Contact Info</h5>
            <ul className="footer-contact">
              <li><span dangerouslySetInnerHTML={{ __html: Icons.pin }} /><span>Shop 12, Bodija Market,<br />Bodija, Ibadan, Oyo State, Nigeria</span></li>
              <li><span dangerouslySetInnerHTML={{ __html: Icons.phone }} /><span><a href="tel:+2348012345678">+234 801 234 5678</a></span></li>
              <li><span dangerouslySetInnerHTML={{ __html: Icons.mail }} /><span><a href="mailto:hello@omoonirice.ng">hello@omoonirice.ng</a></span></li>
              <li><span dangerouslySetInnerHTML={{ __html: Icons.tiktok }} /><span><a href="https://www.tiktok.com/@hee_sha1313" target="_blank" rel="noreferrer">TikTok: @hee_sha1313</a></span></li>
              <li>🕒<span>Mon – Sat: 8:00am – 7:00pm</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Omo Oni Rice. All rights reserved. · Made with 💚 in Ibadan 🇳🇬</p>
          <div className="pay-row">
            <span className="pay-pill">Visa</span><span className="pay-pill">Mastercard</span><span className="pay-pill">Verve</span>
            <span className="pay-pill">Bank Transfer</span><span className="pay-pill">Pay on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
