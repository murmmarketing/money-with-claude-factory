'use client';

import { useCallback, useEffect, useState } from 'react';
import { money } from '../../lib/format';

interface Me {
  email: string | null;
  pro: boolean;
  entitlement: {
    plan: string | null;
    status: string;
    current_period_end: string | null;
  } | null;
}

interface HaulRow {
  id: string;
  title: string;
  slug: string | null;
  is_public: boolean;
  currency: string;
  destination_country: string;
  updated_at: string;
  item_count: number;
}

interface WatchRow {
  id: string;
  label: string;
  product_url: string;
  target_price_cny: number | null;
  active: boolean;
}

export default function AccountClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [hauls, setHauls] = useState<HaulRow[]>([]);
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);

  const [wLabel, setWLabel] = useState('');
  const [wUrl, setWUrl] = useState('');
  const [wTarget, setWTarget] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/me', { cache: 'no-store' });
      const meJson: Me = await meRes.json();
      setMe(meJson);
      if (meJson.pro) {
        const [h, w] = await Promise.all([
          fetch('/api/hauls', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ hauls: [] })),
          fetch('/api/watches', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ watches: [] })),
        ]);
        setHauls(h.hauls || []);
        setWatches(w.watches || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  async function openPortal() {
    setPortalBusy(true);
    try {
      const r = await fetch('/api/pro/portal', { method: 'POST' });
      const j = await r.json();
      if (r.ok && j.url) window.location.href = j.url;
      else alert(j.error === 'coming_soon' ? 'Billing portal opens once live payments are connected.' : 'Could not open billing portal.');
    } finally {
      setPortalBusy(false);
    }
  }

  async function deleteHaul(id: string) {
    if (!confirm('Delete this haul? This cannot be undone.')) return;
    await fetch(`/api/hauls/${id}`, { method: 'DELETE' });
    setHauls((prev) => prev.filter((h) => h.id !== id));
  }

  async function addWatch(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch('/api/watches', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        label: wLabel,
        product_url: wUrl,
        target_price_cny: wTarget ? Number(wTarget) : null,
      }),
    });
    const j = await r.json();
    if (r.ok && j.watch) {
      setWatches((prev) => [j.watch, ...prev]);
      setWLabel('');
      setWUrl('');
      setWTarget('');
    }
  }

  async function deleteWatch(id: string) {
    await fetch(`/api/watches?id=${id}`, { method: 'DELETE' });
    setWatches((prev) => prev.filter((w) => w.id !== id));
  }

  if (loading) return <div className="card">Loading your account…</div>;

  if (!me?.email) {
    return (
      <div className="card" style={{ maxWidth: 460 }}>
        <p style={{ marginBottom: 14 }}>You&apos;re not signed in.</p>
        <a href="/login?next=/account" className="btn btn-primary">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      {/* status */}
      <div className="card">
        <div className="row spread wrap" style={{ gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 13 }}>Signed in as</div>
            <b>{me.email}</b>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <span className={`pill ${me.pro ? 'pill-accent' : ''}`}>
              {me.pro ? `Pro · ${me.entitlement?.plan || ''}` : 'Free'}
            </span>
            {me.pro && me.entitlement?.current_period_end && (
              <span className="pill">
                renews {new Date(me.entitlement.current_period_end).toLocaleDateString()}
              </span>
            )}
            {me.pro ? (
              <button className="btn btn-sm" onClick={openPortal} disabled={portalBusy}>
                {portalBusy ? '…' : 'Manage billing'}
              </button>
            ) : (
              <a href="/pricing" className="btn btn-primary btn-sm">
                Upgrade to Pro
              </a>
            )}
            <button className="btn btn-sm btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </div>

      {!me.pro && (
        <div className="notice">
          Pro unlocks cloud-saved hauls, multi-agent compare, the split planner,
          shareable pages, QC photos, CSV export and the watchlist.{' '}
          <a href="/pricing">See Pro →</a>
        </div>
      )}

      {me.pro && (
        <>
          {/* hauls */}
          <div>
            <div className="row spread" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 20 }}>Saved hauls ({hauls.length})</h2>
              <a href="/haul" className="btn btn-sm btn-primary">
                + New haul
              </a>
            </div>
            {hauls.length === 0 ? (
              <div className="card muted">No saved hauls yet. Build one and hit &quot;Save haul to cloud&quot;.</div>
            ) : (
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Dest</th>
                      <th className="num">Items</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {hauls.map((h) => (
                      <tr key={h.id}>
                        <td><b>{h.title}</b></td>
                        <td className="muted">{h.destination_country}</td>
                        <td className="num">{h.item_count}</td>
                        <td>
                          {h.is_public ? (
                            <span className="pill pill-cyan">public</span>
                          ) : (
                            <span className="pill">private</span>
                          )}
                        </td>
                        <td className="muted">{new Date(h.updated_at).toLocaleDateString()}</td>
                        <td>
                          <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                            <a className="btn btn-sm" href={`/haul?id=${h.id}`}>Edit</a>
                            {h.is_public && h.slug && (
                              <a className="btn btn-sm btn-cyan" href={`/h/${h.slug}`} target="_blank" rel="noreferrer">View</a>
                            )}
                            <button className="btn btn-sm btn-danger" onClick={() => deleteHaul(h.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* watchlist */}
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Price / restock watchlist</h2>
            <div className="card" style={{ marginBottom: 12 }}>
              <form className="row wrap" style={{ gap: 8 }} onSubmit={addWatch}>
                <input className="field grow" placeholder="Label (e.g. Jordan 4 Bred)" value={wLabel} onChange={(e) => setWLabel(e.target.value)} required />
                <input className="field grow" placeholder="Product link" value={wUrl} onChange={(e) => setWUrl(e.target.value)} required />
                <input className="field field-num" style={{ maxWidth: 130 }} type="number" placeholder="Target ¥" value={wTarget} onChange={(e) => setWTarget(e.target.value)} />
                <button className="btn btn-primary">Add watch</button>
              </form>
            </div>
            {watches.length === 0 ? (
              <div className="card muted">No watches yet. We&apos;ll email you a weekly nudge to re-check the ones you add.</div>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {watches.map((w) => (
                  <div key={w.id} className="card card-2 row spread wrap" style={{ gap: 10 }}>
                    <div>
                      <b>{w.label}</b>
                      <div className="muted" style={{ fontSize: 13 }}>
                        <a href={w.product_url} target="_blank" rel="noreferrer">link</a>
                        {w.target_price_cny != null && <span> · target {money(w.target_price_cny, 'CNY')}</span>}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteWatch(w.id)}>Remove</button>
                  </div>
                ))}
                <p className="faint" style={{ fontSize: 12 }}>
                  v1 sends a scheduled &quot;re-check these&quot; email — no live scraping yet.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
