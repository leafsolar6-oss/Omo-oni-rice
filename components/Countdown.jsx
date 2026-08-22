'use client';

import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

export default function Countdown() {
  const [t, setT] = useState(14 * 24 * 3600 * 1000);

  useEffect(() => {
    const end = Date.now() + 14 * 24 * 3600 * 1000;
    const iv = setInterval(() => setT(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(iv);
  }, []);

  const d = Math.floor(t / 86400000);
  const h = Math.floor((t % 86400000) / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);

  return (
    <div className="countdown">
      <div className="cd-box"><b>{pad(d)}</b><small>Days</small></div>
      <span className="cd-sep">:</span>
      <div className="cd-box"><b>{pad(h)}</b><small>Hours</small></div>
      <span className="cd-sep">:</span>
      <div className="cd-box"><b>{pad(m)}</b><small>Minutes</small></div>
      <span className="cd-sep">:</span>
      <div className="cd-box"><b>{pad(s)}</b><small>Seconds</small></div>
    </div>
  );
}
