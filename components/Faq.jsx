'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'Are the products fresh and of high quality?',
    a: 'Yes! Every item is hand-picked, sorted and graded before packaging — no stones in the rice, no weevils in the beans. We stand behind it with a 100% freshness guarantee: if anything arrives below standard, we replace it free.',
  },
  {
    q: 'What are your delivery hours?',
    a: 'Ibadan orders placed before 3pm are delivered the same day (Mon–Sat). Orders after 3pm go out the next morning. Nationwide deliveries take 2–5 working days. You can also pick up free at our Bodija market shop, 8am–7pm.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Pay on delivery (cash or transfer), bank transfer ahead of delivery, or card payment online with Visa, Mastercard or Verve. Whichever you choose, you only pay for what arrives in good condition.',
  },
  {
    q: 'Do you offer any discounts or promotions?',
    a: 'Plenty! Free Ibadan delivery on orders over ₦50,000, fresh deals of the day every morning, and 25% off your first order when you subscribe to our newsletter. Bulk orders get special pricing — just call us.',
  },
  {
    q: 'How can I provide feedback about my experience?',
    a: 'We love feedback! Reach us on WhatsApp, DM us on TikTok @hee_sha1313, call +234 801 234 5678, email hello@omoonirice.ng, or tell the rider when they deliver. Every comment helps us serve you better.',
  },
  {
    q: 'Do you offer bulk ordering for events or businesses?',
    a: 'Yes — we supply restaurants, caterers, schools and event planners. Call +234 801 234 5678 or email hello@omoonirice.ng for a bulk price list and scheduled deliveries.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq-wrap">
      {FAQS.map((f, i) => (
        <div className={`faq-item ${open === i ? 'open' : ''}`} key={i}>
          <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
            {f.q}<span className="ficon">+</span>
          </button>
          <div className="faq-a" style={{ maxHeight: open === i ? 300 : 0 }}>
            <p>{f.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
