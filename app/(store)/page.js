import ProductCard from '../../components/ProductCard';
import Countdown from '../../components/Countdown';
import Faq from '../../components/Faq';
import NewsletterForm from '../../components/NewsletterForm';
import DealsList from '../../components/DealsList';
import { getCategories, getProducts } from '../../lib/db';

export const dynamic = 'force-dynamic';

const CAT_BADGES = {
  'rice-grains': 'Flat 20% Discount',
  'fresh-produce': 'Fresh Daily',
};

export default async function HomePage() {
  const cats = getCategories().filter((c) => c.product_count > 0);
  const fresh = getProducts({ category: 'fresh-produce', limit: 4 });
  const featured = getProducts({ featured: 1, limit: 8 });
  const deals = getProducts({ deal: 1, limit: 3 });
  const best = getProducts({ sort: 'rating', limit: 4 });

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="hero-badge-row">
              <span className="hero-kicker" style={{ margin: 0 }}>🛒 The Best Online Foodstuff Store</span>
              <span className="rating-pill"><span className="stars">★★★★★</span> 4.8 Ratings+</span>
            </div>
            <h1>Your One-Stop Shop<br />for Quality <span className="hl">Foodstuffs</span></h1>
            <ul className="hero-points">
              <li><span className="tick">✓</span> 100% fresh &amp; hand-picked from trusted markets</li>
              <li><span className="tick">✓</span> Same-day delivery across Lagos</li>
              <li><span className="tick">✓</span> Pay on delivery — inspect before you pay</li>
            </ul>
            <div className="hero-ctas">
              <a className="btn btn-primary btn-lg" href="/shop">Shop Now</a>
              <a className="btn btn-ghost btn-lg" href="#categories">Explore Categories</a>
            </div>
            <div className="hero-trust" style={{ marginTop: 28 }}>
              <div className="trust-item"><b>15,000+</b><span>deliveries made</span></div>
              <div className="trust-item"><b>4.8 ★</b><span>average rating</span></div>
              <div className="trust-item"><b>100%</b><span>fresh guarantee</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-img-wrap">
              <img src="/img/hero.jpg" alt="Fresh Nigerian foodstuffs arranged on a clean surface" />
            </div>
            <div className="hero-float hf-1">
              <span className="ficon" style={{ background: '#e5f7ed', color: '#007848' }}>⚡</span>
              <span>Same-day delivery<small>Lagos mainland &amp; island</small></span>
            </div>
            <div className="hero-float hf-2">
              <span className="ficon" style={{ background: '#fff7e8', color: '#d97706' }}>💵</span>
              <span>Pay on delivery<small>Cash, transfer or card</small></span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section" id="categories" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="p-cat" style={{ fontSize: '.78rem', letterSpacing: '.14em' }}>Categories</span>
              <h2 className="sec-title">Featured Categories</h2>
            </div>
            <a className="sec-link" href="/shop">View All Categories <span>→</span></a>
          </div>
          <div className="cat-circle-row">
            {cats.map((c) => (
              <a className="cat-circle" href={`/shop?category=${encodeURIComponent(c.slug)}`} key={c.slug}>
                <span className="cc-img">
                  {c.emoji}
                  {CAT_BADGES[c.slug] && <span className="cc-badge">{CAT_BADGES[c.slug]}</span>}
                </span>
                <b>{c.name}</b>
                <small>{c.product_count} product{c.product_count !== 1 ? 's' : ''}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* PURELY FRESH */}
      <section className="section">
        <div className="container">
          <div className="fresh-grid">
            <a className="fresh-banner" href="/shop?category=fresh-produce">
              <img src="/img/products/tomatoes.jpg" alt="Purely fresh produce" />
              <span className="fb-kicker">Purely Fresh</span>
              <h3>Vegetables &amp; Produce</h3>
              <p>Pepper, tomatoes and plantain — picked today, delivered same-day.</p>
              <span className="btn">Shop Fresh Produce →</span>
            </a>
            <div className="fresh-minis">
              {fresh.map((p) => <ProductCard product={p} key={p.id} />)}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="p-cat" style={{ fontSize: '.78rem', letterSpacing: '.14em' }}>Products</span>
              <h2 className="sec-title">Featured Products</h2>
            </div>
            <a className="sec-link" href="/shop">View All Products <span>→</span></a>
          </div>
          <div className="product-grid">
            {featured.map((p) => <ProductCard product={p} key={p.id} />)}
          </div>
        </div>
      </section>

      {/* SUMMER DISCOUNT + COUNTDOWN */}
      <section className="section" id="deals" style={{ paddingTop: 10 }}>
        <div className="container">
          <div className="discount-banner">
            <div>
              <span className="db-kicker">Summer Discount</span>
              <h3>Get <em>up to 50% off</em> — Limited Time Offer!</h3>
              <p>Stock your kitchen for less. Deal ends when the timer stops ticking.</p>
            </div>
            <Countdown />
          </div>
        </div>
      </section>

      {/* TODAY DEALS */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="p-cat" style={{ fontSize: '.78rem', letterSpacing: '.14em' }}>Today Deals</span>
              <h2 className="sec-title">Deals of the Day</h2>
            </div>
            <a className="sec-link" href="/shop">View All Products <span>→</span></a>
          </div>
          <DealsList deals={deals} />
        </div>
      </section>

      {/* UNBEATABLE OFFERS */}
      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container">
          <div className="offer-banner">
            <img src="/img/hero.jpg" alt="Unbeatable offers on foodstuffs" />
            <div>
              <h3>Unbeatable Offers: Your <em>Fresh</em> Foodstuff Fix</h3>
              <p>Bulk bundles, weekly deals and market-fresh picks — all in one place.</p>
              <a className="btn" href="/shop">Shop Deals →</a>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="section" id="best-sellers">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="p-cat" style={{ fontSize: '.78rem', letterSpacing: '.14em' }}>Best Seller</span>
              <h2 className="sec-title">Best Seller Products</h2>
            </div>
            <a className="sec-link" href="/shop">View All Products <span>→</span></a>
          </div>
          <div className="product-grid">
            {best.map((p) => <ProductCard product={p} key={p.id} />)}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="testimonials">
        <div className="container">
          <div className="sec-head testi-center" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div>
              <span className="p-cat" style={{ fontSize: '.78rem', letterSpacing: '.14em' }}>Testimonials</span>
              <h2 className="sec-title">Testimonials from Our Loyal Customers</h2>
            </div>
          </div>
          <div className="testi-grid">
            <div className="testi-card testi-quote-card">
              <div className="stars">★★★★★</div>
              <blockquote>&ldquo;I&rsquo;ve tried several foodstuff delivery services, and this one is by far the best. The website is user-friendly, the selection is vast, and the customer service is outstanding. Highly recommend!&rdquo;</blockquote>
              <div className="testi-who">
                <span className="avatar" style={{ background: '#007848' }}>CN</span>
                <div><b>Chiamaka Nwosu</b><small>Yaba, Lagos</small></div>
              </div>
            </div>
            <div className="testi-card testi-quote-card">
              <div className="stars">★★★★★</div>
              <blockquote>&ldquo;Ordered 25kg of rice and honey beans in the morning — it was at my gate by 4pm. Stone-free rice, pure palm oil. Omo Oni Rice is now my plug for everything!&rdquo;</blockquote>
              <div className="testi-who">
                <span className="avatar" style={{ background: '#d97706' }}>TB</span>
                <div><b>Tunde Adebayo</b><small>Ikeja, Lagos</small></div>
              </div>
            </div>
            <div className="testi-card testi-quote-card">
              <div className="stars">★★★★★</div>
              <blockquote>&ldquo;The rodo and tomatoes arrived looking like I picked them myself at Mile 12. Fresh, firm and fairly priced. Pay-on-delivery gives me total peace of mind.&rdquo;</blockquote>
              <div className="testi-who">
                <span className="avatar" style={{ background: '#054d2e' }}>FB</span>
                <div><b>Fatima Bello</b><small>Surulere, Lagos</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWS & BLOGS */}
      <section className="section" id="blogs">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="p-cat" style={{ fontSize: '.78rem', letterSpacing: '.14em' }}>News &amp; Blogs</span>
              <h2 className="sec-title">Our Latest News &amp; Blogs</h2>
            </div>
          </div>
          <div className="blog-grid">
            <article className="blog-card">
              <div className="bc-img"><img src="/img/products/rice.jpg" alt="Stock your Nigerian pantry" /><span className="bc-date">📅 14 August 2026</span></div>
              <div className="bc-body">
                <div className="blog-meta">✍️ Jenny Alexander <span className="dot" /> Shopping Tips</div>
                <h4><a href="#">How to Stock Your Nigerian Pantry: Stay Organized &amp; Save Money</a></h4>
                <a className="read-more" href="#">Read More <span>→</span></a>
              </div>
            </article>
            <article className="blog-card">
              <div className="bc-img"><img src="/img/products/tomatoes.jpg" alt="Market guide for fresh produce" /><span className="bc-date">📅 13 August 2026</span></div>
              <div className="bc-body">
                <div className="blog-meta">✍️ Jenny Alexander <span className="dot" /> Market Guide</div>
                <h4><a href="#">Market Guide: Picking Fresh Tomatoes, Pepper &amp; Plantain Like a Pro</a></h4>
                <a className="read-more" href="#">Read More <span>→</span></a>
              </div>
            </article>
            <article className="blog-card">
              <div className="bc-img"><img src="/img/products/garri.jpg" alt="Top foodstuffs for a balanced diet" /><span className="bc-date">📅 12 August 2026</span></div>
              <div className="bc-body">
                <div className="blog-meta">✍️ Jenny Alexander <span className="dot" /> Healthy Eating</div>
                <h4><a href="#">Top 10 Nigerian Foodstuffs for a Balanced Diet: Boost Your Health</a></h4>
                <a className="read-more" href="#">Read More <span>→</span></a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="container">
          <div className="sec-head testi-center" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div>
              <span className="p-cat" style={{ fontSize: '.78rem', letterSpacing: '.14em' }}>News &amp; Blogs</span>
              <h2 className="sec-title">Frequently Asked Questions</h2>
            </div>
          </div>
          <Faq />
        </div>
      </section>

      {/* FEATURES BAND */}
      <section className="section" id="delivery" style={{ paddingTop: 10 }}>
        <div className="container">
          <div className="features-band">
            <div className="feature-cell">
              <span className="ficon" style={{ background: '#e5f7ed' }}>🚚</span>
              <div><b>Free Shipping</b><p>Free shipping for orders above ₦50,000 (Lagos)</p></div>
            </div>
            <div className="feature-cell">
              <span className="ficon" style={{ background: '#fff7e8' }}>💳</span>
              <div><b>Flexible Payment</b><p>Multiple secure payment options</p></div>
            </div>
            <div className="feature-cell">
              <span className="ficon" style={{ background: '#e5f7ed' }}>🎧</span>
              <div><b>24x7 Support</b><p>We support you online all days</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section" id="newsletter" style={{ paddingBottom: 10 }}>
        <div className="container">
          <div className="newsletter-template">
            <img src="/img/products/plantain.jpg" alt="" />
            <div className="nl2-inner">
              <span className="off-pill">🎉 25% OFF your first order</span>
              <h3>Our Newsletter — Subscribe to Get Updates on Our Latest Offers</h3>
              <p>Get 25% off on your first order just by subscribing to our newsletter. Weekly deals, harvest news and subscriber-only bundles.</p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
