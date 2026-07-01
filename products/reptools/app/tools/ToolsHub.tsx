'use client';

import { useMemo, useState } from 'react';
import type { Agent, CustomsRule } from '../../lib/referenceData';
import { FX_PRESETS, DEFAULT_USD_PER_CNY } from '../../lib/referenceData';
import { money, cny, grams, currencySymbol } from '../../lib/format';

interface Props {
  agents: Agent[];
  customs: CustomsRule[];
}

function num(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function ToolsHub({ agents, customs }: Props) {
  const [tab, setTab] = useState<'convert' | 'shipping' | 'customs'>('convert');
  return (
    <>
      <div className="tabs">
        <button className={`tab ${tab === 'convert' ? 'active' : ''}`} onClick={() => setTab('convert')}>
          CNY converter
        </button>
        <button className={`tab ${tab === 'shipping' ? 'active' : ''}`} onClick={() => setTab('shipping')}>
          Shipping estimator
        </button>
        <button className={`tab ${tab === 'customs' ? 'active' : ''}`} onClick={() => setTab('customs')}>
          Customs quick-check
        </button>
      </div>
      {tab === 'convert' && <Converter />}
      {tab === 'shipping' && <ShippingEstimator agents={agents} />}
      {tab === 'customs' && <CustomsCheck customs={customs} />}
    </>
  );
}

/* -------------------------- CNY converter --------------------------------- */
function Converter() {
  const [cnyVal, setCnyVal] = useState(100);
  const [currency, setCurrency] = useState('USD');
  const [rate, setRate] = useState(FX_PRESETS.USD);
  const sym = currencySymbol(currency);
  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="stack" style={{ gap: 14 }}>
          <div>
            <label>Amount in CNY (¥)</label>
            <input className="field field-num" type="number" value={cnyVal} onChange={(e) => setCnyVal(num(e.target.value))} />
          </div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div>
              <label>Currency</label>
              <select
                className="field"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  if (FX_PRESETS[e.target.value]) setRate(FX_PRESETS[e.target.value]);
                }}
              >
                {Object.keys(FX_PRESETS).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>FX rate ({sym}/¥1)</label>
              <input className="field field-num" type="number" step="0.001" value={rate} onChange={(e) => setRate(num(e.target.value, rate))} />
            </div>
          </div>
        </div>
      </div>
      <div className="card card-2">
        <div className="ledger">
          <div className="ledger-row">
            <span className="k">{cny(cnyVal)}</span>
            <span className="v">→</span>
          </div>
          <div className="ledger-row total">
            <span className="k">{currency}</span>
            <span className="v">{money(cnyVal * rate, currency)}</span>
          </div>
        </div>
        <p className="faint" style={{ fontSize: 12, marginTop: 12 }}>
          Rates are editable presets, not live — check your agent&apos;s checkout
          rate for the exact figure. Common quick refs: ¥100 ≈{' '}
          {money(100 * FX_PRESETS.USD, 'USD')} / {money(100 * FX_PRESETS.EUR, 'EUR')} /{' '}
          {money(100 * FX_PRESETS.GBP, 'GBP')}.
        </p>
      </div>
    </div>
  );
}

/* -------------------------- Shipping estimator ---------------------------- */
function ShippingEstimator({ agents }: { agents: Agent[] }) {
  const [agentId, setAgentId] = useState(agents[0]?.id || 'kakobuy');
  const agent = agents.find((a) => a.id === agentId) || agents[0];
  const [lineName, setLineName] = useState(agent?.shipping_lines[0]?.line || '');
  const line = agent?.shipping_lines.find((l) => l.line === lineName) || agent?.shipping_lines[0];
  const [weightG, setWeightG] = useState(1500);
  const [volumeCm3, setVolumeCm3] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const rate = FX_PRESETS[currency] || FX_PRESETS.USD;

  const divisor = line?.volumetric_divisor || 6000;
  const volWeightG = volumeCm3 > 0 ? (volumeCm3 / divisor) * 1000 : 0;
  const chargeableG = Math.max(weightG, volWeightG);
  const shippingCny = (line?.base_cost || 0) + (line?.per_kg || 0) * (chargeableG / 1000);
  const volApplies = volWeightG > weightG && volumeCm3 > 0;

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="stack" style={{ gap: 12 }}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div>
              <label>Agent</label>
              <select
                className="field"
                value={agentId}
                onChange={(e) => {
                  setAgentId(e.target.value);
                  const a = agents.find((x) => x.id === e.target.value);
                  setLineName(a?.shipping_lines[0]?.line || '');
                }}
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Shipping line</label>
              <select className="field" value={lineName} onChange={(e) => setLineName(e.target.value)}>
                {(agent?.shipping_lines || []).map((l) => (
                  <option key={l.line} value={l.line}>
                    {l.line}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Actual weight (g)</label>
              <input className="field field-num" type="number" value={weightG} onChange={(e) => setWeightG(num(e.target.value))} />
            </div>
            <div>
              <label>Currency</label>
              <select className="field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {Object.keys(FX_PRESETS).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label>Parcel volume (cm³, optional — for volumetric weight)</label>
            <input className="field field-num" type="number" value={volumeCm3 || ''} placeholder="L×W×H in cm" onChange={(e) => setVolumeCm3(num(e.target.value))} />
          </div>
        </div>
      </div>
      <div className="card card-2">
        <div className="ledger">
          <div className="ledger-row">
            <span className="k">Base ({line?.line})</span>
            <span className="v">{money((line?.base_cost || 0) * rate, currency)}</span>
          </div>
          <div className="ledger-row">
            <span className="k">Per-kg × {grams(chargeableG)}</span>
            <span className="v">{money((line?.per_kg || 0) * (chargeableG / 1000) * rate, currency)}</span>
          </div>
          <div className="ledger-row total">
            <span className="k">Est. shipping</span>
            <span className="v">{money(shippingCny * rate, currency)}</span>
          </div>
        </div>
        {volApplies && (
          <div className="notice warn" style={{ marginTop: 12, fontSize: 13 }}>
            ⚠ Volumetric weight ({grams(volWeightG)}) exceeds actual weight —
            you&apos;ll be billed on the larger figure. Pack tighter or pick a line
            with a higher divisor.
          </div>
        )}
        <p className="faint" style={{ fontSize: 12, marginTop: 12 }}>
          Ballpark planning numbers in CNY, converted at {money(1, currency)} =
          ¥{(1 / rate).toFixed(2)}. Always confirm on the agent before you ship.
        </p>
      </div>
    </div>
  );
}

/* -------------------------- Customs quick-check --------------------------- */
function CustomsCheck({ customs }: { customs: CustomsRule[] }) {
  const [country, setCountry] = useState('US');
  const [goodsCny, setGoodsCny] = useState(2000);
  const rule = customs.find((c) => c.country_code === country) || customs[0];
  const goodsUsd = goodsCny * DEFAULT_USD_PER_CNY;
  const overDeMinimis = goodsUsd > (rule?.de_minimis_usd || 0);
  const rate = FX_PRESETS[rule?.currency || 'USD'] || FX_PRESETS.USD;
  const estTax = overDeMinimis ? goodsCny * rate * ((rule?.vat_pct || 0) / 100) : 0;

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="stack" style={{ gap: 12 }}>
          <div>
            <label>Destination country</label>
            <select className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
              {customs.map((c) => (
                <option key={c.country_code} value={c.country_code}>
                  {c.country_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Haul goods value (¥)</label>
            <input className="field field-num" type="number" value={goodsCny} onChange={(e) => setGoodsCny(num(e.target.value))} />
            <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>
              ≈ ${Math.round(goodsUsd)} USD for the de-minimis check.
            </p>
          </div>
        </div>
      </div>
      <div className="card card-2">
        <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}>
          <span className="pill">VAT/GST {rule?.vat_pct}%</span>
          <span className="pill">de-minimis ${rule?.de_minimis_usd}</span>
          <span className={`pill ${overDeMinimis ? 'pill-warn' : 'pill-accent'}`}>
            {overDeMinimis ? 'likely taxed' : 'likely tax-free'}
          </span>
        </div>
        <div className="ledger">
          <div className="ledger-row total">
            <span className="k">Est. import tax</span>
            <span className="v">{money(estTax, rule?.currency || 'USD')}</span>
          </div>
        </div>
        <p className="faint" style={{ fontSize: 13, marginTop: 12 }}>
          {rule?.duty_notes}
        </p>
      </div>
    </div>
  );
}
