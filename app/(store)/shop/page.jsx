import { Suspense } from 'react';
import ShopInner from '../../../components/ShopInner';

export const metadata = { title: 'Shop Foodstuffs' };

export default function ShopPage() {
  return (
    <Suspense
      fallback={<div className="container" style={{ padding: '40px 0', color: 'var(--muted)' }}>Loading shop…</div>}
    >
      <ShopInner />
    </Suspense>
  );
}
