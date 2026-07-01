import type { Metadata } from 'next';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'Your account',
  description: 'Manage your HaulHQ hauls, Pro subscription and price watchlist.',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="container section">
      <span className="eyebrow">Account</span>
      <h1 style={{ fontSize: 32, marginBottom: 18 }}>Your workspace</h1>
      <AccountClient />
    </div>
  );
}
