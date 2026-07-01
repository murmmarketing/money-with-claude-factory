'use client';

import { useState } from 'react';

export default function AccountClient() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      setLoading(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={logout} disabled={loading}>
      {loading ? 'Logging out…' : 'Log out'}
    </button>
  );
}
