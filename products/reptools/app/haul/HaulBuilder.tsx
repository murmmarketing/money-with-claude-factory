'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Agent, CustomsRule } from '../../lib/referenceData';
import { FX_PRESETS, DEFAULT_USD_PER_CNY } from '../../lib/referenceData';
import {
  computeLandedCost,
  compareAgents,
  planSplit,
  type LandedCostInput,
} from '../../lib/haulCompute';
import { money, cny, grams, currencySymbol } from '../../lib/format';
import { type HaulItem, emptyItem } from '../../lib/types';

interface Props {
  agents: Agent[];
  customs: CustomsRule[];
}

interface Me {
  email: string | null;
  pro: boolean;
}

const DRAFT_KEY = 'haulhq_draft_v1';

interface Draft {
  id?: string;
  slug?: string;
  isPublic?: boolean;
  title: string;
  destination_country: string;
  currency: string;
  fx_rate: number;
  agent: string;
  shipping_line: string;
  volumeCm3: number;
  notes: string;
  items: HaulItem[];
}

function num(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function HaulBuilder({ agents, customs }: Props) {
  const firstAgent = agents[0]?.id || 'kakobuy';
  const [me, setMe] = useState<Me>({ email: null, pro: false });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [id, setId] = useState<string | undefined>();
  const [slug, setSlug] = useState<string | undefined>();
  const [isPublic, setIsPublic] = useState(false);

  const [title, setTitle] = useState('My haul');
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [fxRate, setFxRate] = useState(FX_PRESETS.USD);
  const [agentId, setAgentId] = useState(firstAgent);
  const [line, setLine] = useState('');
  const [volumeCm3, setVolumeCm3] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<HaulItem[]>([emptyItem(firstAgent)]);

  const [tab, setTab] = useState<'breakdown' | 'compare' | 'split'>('breakdown');
  const restored = useRef(false);

  // ---- load session + draft (or an existing haul via ?id=) ----------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled) setMe({ email: j.email ?? null, pro: !!j.pro });
      } catch {
        /* not logged in */
      }

      const params = new URLSearchParams(window.location.search);
      const loadId = params.get('id');
      if (loadId) {
        try {
          const r = await fetch(`/api/hauls/${loadId}`, { cache: 'no-store' });
          if (r.ok) {
            const { haul } = await r.json();
            if (!cancelled && haul) {
              applyDraft(haul as any, true);
              setLoaded(true);
              restored.current = true;
              return;
            }
          }
        } catch {
          /* fall back to local draft */
        }
      }

      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw && !cancelled) {
          const d = JSON.parse(raw) as Draft;
          applyDraft(d, false);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        setLoaded(true);
        restored.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyDraft(d: any, fromCloud: boolean) {
    if (fromCloud) {
      setId(d.id);
      setSlug(d.slug);
      setIsPublic(!!d.is_public);
    } else {
      setId(d.id);
      setSlug(d.slug);
      setIsPublic(!!d.isPublic);
    }
    setTitle(d.title ?? 'My haul');
    setCountry(d.destination_country ?? 'US');
    setCurrency(d.currency ?? 'USD');
    setFxRate(Number(d.fx_rate) || FX_PRESETS.USD);
    setAgentId(d.agent ?? firstAgent);
    setLine(d.shipping_line ?? '');
    setVolumeCm3(Number(d.volumeCm3 ?? d.volume_cm3 ?? 0) || 0);
    setNotes(d.notes ?? '');
    if (Array.isArray(d.items) && d.items.length) {
      setItems(
        d.items.map((it: any) => ({
          ...emptyItem(d.agent ?? firstAgent),
          ...it,
          cny_price: Number(it.cny_price) || 0,
          qty: Number(it.qty) || 1,
          weight_grams: Number(it.weight_grams) || 0,
        }))
      );
    }
  }

  // ---- persist draft to localStorage --------------------------------------
  useEffect(() => {
    if (!restored.current) return;
    const draft: Draft = {
      id,
      slug,
      isPublic,
      title,
      destination_country: country,
      currency,
      fx_rate: fxRate,
      agent: agentId,
      shipping_line: line,
      volumeCm3,
      notes,
      items,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* quota / private mode */
    }
  }, [id, slug, isPublic, title, country, currency, fxRate, agentId, line, volumeCm3, notes, items]);

  const agent = useMemo(
    () => agents.find((a) => a.id === agentId) || agents[0],
    [agents, agentId]
  );
  const shippingLine = useMemo(() => {
    const lines = agent?.shipping_lines || [];
    return lines.find((l) => l.line === line) || lines[0];
  }, [agent, line]);
  const rule = useMemo(
    () => customs.find((c) => c.country_code === country) || customs[0],
    [customs, country]
  );

  // keep line valid when agent changes
  useEffect(() => {
    const lines = agent?.shipping_lines || [];
    if (lines.length && !lines.some((l) => l.line === line)) {
      setLine(lines[0].line);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const computeInput: LandedCostInput = useMemo(
    () => ({
      items: items.map((it) => ({
        cny_price: it.cny_price,
        qty: it.qty,
        weight_grams: it.weight_grams,
      })),
      fxRate,
      usdPerCny: DEFAULT_USD_PER_CNY,
      serviceFeePct: agent?.service_fee_pct ?? 0,
      shipping: {
        baseCost: shippingLine?.base_cost ?? 0,
        perKg: shippingLine?.per_kg ?? 0,
        volumetricDivisor: shippingLine?.volumetric_divisor ?? 6000,
        volumeCm3: volumeCm3 || undefined,
      },
      vatPct: rule?.vat_pct ?? 0,
      deMinimisUsd: rule?.de_minimis_usd ?? 0,
    }),
    [items, fxRate, agent, shippingLine, volumeCm3, rule]
  );

  const result = useMemo(() => computeLandedCost(computeInput), [computeInput]);

  const quotes = useMemo(() => {
    const { items: its, fxRate: fx, usdPerCny, vatPct, deMinimisUsd } = computeInput;
    return compareAgents({ items: its, fxRate: fx, usdPerCny, vatPct, deMinimisUsd }, agents);
  }, [computeInput, agents]);

  const cheapest = quotes[0];
  const currentQuote = quotes.find((q) => q.agentId === agentId);
  const savingsVsCurrent =
    cheapest && currentQuote ? Math.max(0, currentQuote.landedTarget - cheapest.landedTarget) : 0;

  const split = useMemo(
    () => planSplit(computeInput, { de_minimis_usd: rule?.de_minimis_usd ?? 0, vat_pct: rule?.vat_pct ?? 0 }),
    [computeInput, rule]
  );

  // ---- item mutations ------------------------------------------------------
  const setItem = useCallback((i: number, patch: Partial<HaulItem>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }, []);
  const addItem = () => setItems((prev) => [...prev, emptyItem(agentId)]);
  const removeItem = (i: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  // ---- currency change -> preset FX ---------------------------------------
  function onCurrency(c: string) {
    setCurrency(c);
    if (FX_PRESETS[c]) setFxRate(FX_PRESETS[c]);
  }
  function onCountry(code: string) {
    setCountry(code);
    const r = customs.find((c) => c.country_code === code);
    if (r && FX_PRESETS[r.currency]) {
      setCurrency(r.currency);
      setFxRate(FX_PRESETS[r.currency]);
    }
  }

  // ---- copy summary --------------------------------------------------------
  function copySummary() {
    const lines = [
      `📦 ${title} — landed cost via ${agent?.name} (${shippingLine?.line})`,
      `Destination: ${rule?.country_name} · ${currency}`,
      '',
      ...items
        .filter((it) => it.cny_price > 0 || it.name)
        .map(
          (it) =>
            `• ${it.name || 'Item'} — ¥${it.cny_price} ×${it.qty}` +
            (it.product_url ? ` — ${it.product_url}` : '')
        ),
      '',
      `Goods: ${money(result.goodsTarget, currency)}`,
      `Service fee: ${money(result.serviceFeeTarget, currency)}`,
      `Shipping (${grams(result.chargeableWeightG)}): ${money(result.shippingTarget, currency)}`,
      `Customs/VAT: ${money(result.taxTarget, currency)}${result.overDeMinimis ? '' : ' (under de-minimis)'}`,
      `LANDED TOTAL: ${money(result.landedTarget, currency)} (${money(result.perUnitTarget, currency)}/unit)`,
      '',
      'Priced with HaulHQ',
    ];
    navigator.clipboard?.writeText(lines.join('\n')).then(
      () => flash('ok', 'Summary copied to clipboard'),
      () => flash('err', 'Could not copy — select and copy manually')
    );
  }

  function flash(kind: 'ok' | 'err', text: string) {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 4000);
  }

  // ---- Pro: save / share / export -----------------------------------------
  function haulPayload() {
    return {
      title,
      destination_country: country,
      currency,
      fx_rate: fxRate,
      agent: agentId,
      shipping_line: line,
      notes,
      items: items.map((it, idx) => ({ ...it, sort_order: idx })),
    };
  }

  async function saveHaul(): Promise<string | null> {
    if (!me.pro) {
      flash('err', 'Saving to the cloud is a Pro feature');
      return null;
    }
    setBusy('save');
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/hauls/${id}` : '/api/hauls';
      const r = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(haulPayload()),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'save_failed');
      setId(j.haul.id);
      setSlug(j.haul.slug);
      flash('ok', id ? 'Haul updated' : 'Haul saved to your account');
      return j.haul.id as string;
    } catch (e: any) {
      flash('err', e.message === 'not_pro' ? 'Pro required to save' : 'Could not save haul');
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function togglePublic() {
    if (!me.pro) return flash('err', 'Sharing is a Pro feature');
    let haulId = id;
    if (!haulId) {
      haulId = (await saveHaul()) || undefined;
      if (!haulId) return;
    }
    setBusy('share');
    try {
      const r = await fetch(`/api/hauls/${haulId}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_public: !isPublic }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      setIsPublic(j.is_public);
      setSlug(j.slug || slug);
      flash('ok', j.is_public ? 'Public share link is live' : 'Haul set to private');
    } catch {
      flash('err', 'Could not update share setting');
    } finally {
      setBusy(null);
    }
  }

  const shareUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/h/${slug}` : '';

  // ---- Pro: QC photo upload ------------------------------------------------
  async function uploadQc(i: number, file: File) {
    if (!me.pro) return flash('err', 'QC photo storage is a Pro feature');
    setBusy(`qc-${i}`);
    try {
      const r = await fetch('/api/qc/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      const up = await fetch(j.signedUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!up.ok) throw new Error('upload_failed');
      setItem(i, { qc_photo_url: j.publicUrl });
      flash('ok', 'QC photo attached');
    } catch {
      flash('err', 'QC upload failed — is Supabase Storage configured?');
    } finally {
      setBusy(null);
    }
  }

  const sym = currencySymbol(currency);

  return (
    <div className="builder-grid">
      {/* ================= LEFT: inputs ================= */}
      <div className="stack" style={{ gap: 16 }}>
        {msg && (
          <div className={`notice ${msg.kind === 'err' ? 'danger' : ''}`}>{msg.text}</div>
        )}

        {/* Haul meta */}
        <div className="card">
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div>
              <label>Haul title</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spring fit haul" />
            </div>
            <div>
              <label>Destination</label>
              <select className="field" value={country} onChange={(e) => onCountry(e.target.value)}>
                {customs.map((c) => (
                  <option key={c.country_code} value={c.country_code}>
                    {c.country_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Agent</label>
              <select className="field" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.service_fee_pct ? ` (${a.service_fee_pct}% fee)` : ' (0% fee)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Shipping line</label>
              <select className="field" value={line} onChange={(e) => setLine(e.target.value)}>
                {(agent?.shipping_lines || []).map((l) => (
                  <option key={l.line} value={l.line}>
                    {l.line}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label-row">
                <label>Currency</label>
              </div>
              <select className="field" value={currency} onChange={(e) => onCurrency(e.target.value)}>
                {Object.keys(FX_PRESETS).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label-row">
                <label>FX rate</label>
                <span className="faint" style={{ fontSize: 12 }}>
                  {sym}
                  {fxRate} / ¥1
                </span>
              </div>
              <input
                className="field field-num"
                type="number"
                step="0.001"
                value={fxRate}
                onChange={(e) => setFxRate(num(e.target.value, fxRate))}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="stack" style={{ gap: 8 }}>
          <div className="row spread">
            <h3 style={{ fontSize: 16 }}>Items ({items.length})</h3>
            <button className="btn btn-sm" onClick={addItem}>
              + Add item
            </button>
          </div>

          {items.map((it, i) => (
            <div key={i} className="card card-2" style={{ padding: 12 }}>
              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                <input
                  className="field grow"
                  placeholder="Item name (e.g. Panda Dunks)"
                  value={it.name}
                  onChange={(e) => setItem(i, { name: e.target.value })}
                />
                <button className="btn btn-sm btn-danger" onClick={() => removeItem(i)} aria-label="Remove item" title="Remove">
                  ✕
                </button>
              </div>
              <input
                className="field"
                placeholder="W2C / product link (optional)"
                value={it.product_url}
                onChange={(e) => setItem(i, { product_url: e.target.value })}
                style={{ marginBottom: 8, fontSize: 13 }}
              />
              <div className="grid grid-3" style={{ gap: 8 }}>
                <div>
                  <label>Price (¥)</label>
                  <input className="field field-num" type="number" min="0" value={it.cny_price || ''} onChange={(e) => setItem(i, { cny_price: num(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label>Qty</label>
                  <input className="field field-num" type="number" min="1" value={it.qty} onChange={(e) => setItem(i, { qty: Math.max(1, Math.floor(num(e.target.value, 1))) })} />
                </div>
                <div>
                  <label>Weight (g)</label>
                  <input className="field field-num" type="number" min="0" value={it.weight_grams || ''} onChange={(e) => setItem(i, { weight_grams: num(e.target.value) })} placeholder="0" />
                </div>
              </div>

              {/* Pro: QC + notes */}
              <div className="row wrap" style={{ gap: 10, marginTop: 10 }}>
                {me.pro ? (
                  <label className="btn btn-sm btn-ghost" style={{ cursor: 'pointer' }}>
                    {busy === `qc-${i}` ? 'Uploading…' : it.qc_photo_url ? '✓ QC photo' : '+ QC photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => e.target.files?.[0] && uploadQc(i, e.target.files[0])}
                    />
                  </label>
                ) : (
                  <span className="pill">QC photo · Pro</span>
                )}
                {it.qc_photo_url && (
                  <a href={it.qc_photo_url} target="_blank" rel="noreferrer" className="pill pill-cyan">
                    view
                  </a>
                )}
                <span className="faint mono" style={{ fontSize: 12, marginLeft: 'auto' }}>
                  {money(it.cny_price * it.qty * fxRate, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Volumetric / advanced */}
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            Advanced: parcel volume (volumetric weight)
          </summary>
          <div style={{ marginTop: 12 }}>
            <label>Total parcel volume (cm³, optional)</label>
            <input
              className="field field-num"
              type="number"
              min="0"
              value={volumeCm3 || ''}
              placeholder="e.g. length×width×height in cm"
              onChange={(e) => setVolumeCm3(num(e.target.value))}
            />
            <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
              Agents bill the greater of actual and volumetric weight
              (volume ÷ {shippingLine?.volumetric_divisor ?? 6000}). Leave blank
              if you don&apos;t know the box size.
            </p>
          </div>
        </details>
      </div>

      {/* ================= RIGHT: results ================= */}
      <div className="stack sticky-col" style={{ gap: 16 }}>
        {/* Savings hero */}
        {savingsVsCurrent > 0.5 && cheapest && (
          <div className="notice cyan" style={{ borderLeftColor: 'var(--accent)' }}>
            <b className="accent">You&apos;d save {money(savingsVsCurrent, currency)}</b> switching
            from {agent?.name} to <b>{cheapest.agentName}</b> ({cheapest.line}).
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${tab === 'breakdown' ? 'active' : ''}`} onClick={() => setTab('breakdown')}>
            Breakdown
          </button>
          <button className={`tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>
            Compare agents {me.pro ? '' : '· Pro'}
          </button>
          <button className={`tab ${tab === 'split' ? 'active' : ''}`} onClick={() => setTab('split')}>
            Split planner {me.pro ? '' : '· Pro'}
          </button>
        </div>

        {tab === 'breakdown' && (
          <div className="card">
            <div className="ledger">
              <div className="ledger-row">
                <span className="k">Goods ({cny(result.goodsCny)})</span>
                <span className="v">{money(result.goodsTarget, currency)}</span>
              </div>
              <div className="ledger-row">
                <span className="k">Agent service fee ({agent?.service_fee_pct ?? 0}%)</span>
                <span className="v">{money(result.serviceFeeTarget, currency)}</span>
              </div>
              <div className="ledger-row">
                <span className="k">
                  Shipping · {grams(result.chargeableWeightG)}
                  {result.volumetricApplies ? ' (volumetric)' : ''}
                </span>
                <span className="v">{money(result.shippingTarget, currency)}</span>
              </div>
              <div className="ledger-row">
                <span className="k">
                  Customs / VAT ({rule?.vat_pct ?? 0}%)
                  {result.overDeMinimis ? '' : ' · under de-minimis'}
                </span>
                <span className="v">{money(result.taxTarget, currency)}</span>
              </div>
              <div className="ledger-row total">
                <span className="k">Landed total</span>
                <span className="v">{money(result.landedTarget, currency)}</span>
              </div>
            </div>

            <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
              <span className="pill">{money(result.perUnitTarget, currency)}/unit</span>
              <span className="pill">{result.markup ? `${Math.round((result.markup - 1) * 100)}% over goods` : '—'}</span>
              <span className={`pill ${result.overDeMinimis ? 'pill-warn' : 'pill-accent'}`}>
                {result.overDeMinimis ? 'likely taxed' : 'likely tax-free'}
              </span>
            </div>

            <p className="faint" style={{ fontSize: 12, marginTop: 12 }}>
              {rule?.duty_notes}
            </p>
          </div>
        )}

        {tab === 'compare' && (
          <div className="card upsell">
            <table className="table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Line</th>
                  <th className="num">Ship</th>
                  <th className="num">Landed</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q, idx) => (
                  <tr key={q.agentId} className={idx === 0 ? 'best' : ''}>
                    <td>
                      {q.agentName}
                      {idx === 0 && <span className="pill pill-accent" style={{ marginLeft: 6 }}>cheapest</span>}
                    </td>
                    <td className="muted">{q.line}</td>
                    <td className="num">{money(q.shippingTarget, currency)}</td>
                    <td className="num">{money(q.landedTarget, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!me.pro && (
              <div className="upsell-veil">
                <span className="pill pill-accent">Pro</span>
                <b>Compare all {agents.length} agents side by side</b>
                <p className="muted" style={{ fontSize: 13, maxWidth: 260 }}>
                  See the cheapest total landed cost across every agent&apos;s fees and
                  lines. Unlock with HaulHQ Pro.
                </p>
                <a href="/pricing" className="btn btn-primary btn-sm">
                  Go Pro — $6/mo
                </a>
              </div>
            )}
          </div>
        )}

        {tab === 'split' && (
          <div className="card upsell">
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>De-minimis split planner</h3>
            <div className="ledger">
              <div className="ledger-row">
                <span className="k">Goods value (USD)</span>
                <span className="v">${Math.round(result.taxableUsd)}</span>
              </div>
              <div className="ledger-row">
                <span className="k">De-minimis threshold</span>
                <span className="v">${rule?.de_minimis_usd}</span>
              </div>
              <div className="ledger-row">
                <span className="k">Suggested parcels</span>
                <span className="v">{split.parcels}</span>
              </div>
              <div className="ledger-row total">
                <span className="k">Est. tax saved</span>
                <span className="v">{money(split.estTaxSavedTarget, currency)}</span>
              </div>
            </div>
            <p className="faint" style={{ fontSize: 13, marginTop: 12 }}>{split.reason}</p>
            {!me.pro && (
              <div className="upsell-veil">
                <span className="pill pill-accent">Pro</span>
                <b>Split-shipment planner</b>
                <p className="muted" style={{ fontSize: 13, maxWidth: 260 }}>
                  Know exactly when splitting a haul beats the tax hit. Unlock with
                  HaulHQ Pro.
                </p>
                <a href="/pricing" className="btn btn-primary btn-sm">
                  Go Pro — $6/mo
                </a>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="card">
          <div className="stack" style={{ gap: 8 }}>
            <button className="btn btn-block" onClick={copySummary}>
              Copy summary for Discord
            </button>
            {me.pro ? (
              <>
                <button className="btn btn-primary btn-block" onClick={saveHaul} disabled={busy === 'save'}>
                  {busy === 'save' ? 'Saving…' : id ? 'Update saved haul' : 'Save haul to cloud'}
                </button>
                <button className="btn btn-block" onClick={togglePublic} disabled={busy === 'share'}>
                  {busy === 'share' ? '…' : isPublic ? 'Make private' : 'Publish share page'}
                </button>
                {id && (
                  <a className="btn btn-block" href={`/api/hauls/${id}/export`}>
                    Export CSV
                  </a>
                )}
                {isPublic && slug && (
                  <div className="copybox" style={{ marginTop: 4 }}>
                    <input className="field" readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
                    <a className="btn btn-cyan btn-sm" href={`/h/${slug}`} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </div>
                )}
              </>
            ) : (
              <a href="/pricing" className="btn btn-primary btn-block">
                Save, compare &amp; share — go Pro
              </a>
            )}
          </div>
          {!loaded && <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Loading your session…</p>}
          {me.email && (
            <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
              Signed in as {me.email}
              {me.pro ? ' · Pro' : ' · Free'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
