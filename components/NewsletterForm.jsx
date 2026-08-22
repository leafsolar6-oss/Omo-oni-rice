'use client';

import { useState } from 'react';
import { api, toast } from '../lib/client';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api('/api/newsletter', { method: 'POST', body: { email } });
      toast('Subscribed! Your 25% off code is on its way 🎉');
      setEmail('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="nl2-form" onSubmit={submit}>
      <input
        type="email"
        placeholder="Enter your email address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn" type="submit" disabled={busy}>Subscribe</button>
    </form>
  );
}
