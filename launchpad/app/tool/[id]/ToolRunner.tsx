'use client';
import { useEffect, useMemo, useState } from 'react';
import type { ToolSpec } from '../../../components/types';
import { compute, defaultInputs } from './compute';

function getSid(): string {
  try {
    let s = localStorage.getItem('_fsid');
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('_fsid', s);
    }
    return s;
  } catch {
    return 'nosid';
  }
}

// Interactive calculator: controlled inputs, in-browser compute on every change
// (zero network), fires a single 'tool_compute' event per session.
export default function ToolRunner({ spec }: { spec: ToolSpec }) {
  const [values, setValues] = useState<Record<string, number | string | boolean>>(() =>
    defaultInputs(spec),
  );

  const outputs = useMemo(() => compute(spec, values), [spec, values]);

  useEffect(() => {
    try {
      const flag = `_tc_${spec.id}`;
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
      fetch('/api/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idea_id: spec.id, session_id: getSid(), name: 'tool_compute' }),
      }).catch(() => {});
    } catch {
      /* no-op */
    }
    // once per mount/session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.id]);

  function set(key: string, v: number | string | boolean) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <div className="tool-io">
      <div className="io-group">
        {(spec.inputs || []).map((inp) => {
          const val = values[inp.key];
          const labelId = `lbl-${inp.key}`;
          return (
            <div className="io-field" key={inp.key}>
              <label id={labelId} htmlFor={`in-${inp.key}`}>
                {inp.label}
                {inp.unit ? <span className="unit"> ({inp.unit})</span> : null}
              </label>
              {inp.type === 'select' && inp.options ? (
                <select
                  id={`in-${inp.key}`}
                  className="field"
                  value={String(val)}
                  onChange={(e) => set(inp.key, e.target.value)}
                >
                  {inp.options.map((o) => (
                    <option key={String(o.value)} value={String(o.value)}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : inp.type === 'boolean' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}>
                  <input
                    id={`in-${inp.key}`}
                    type="checkbox"
                    checked={!!val}
                    onChange={(e) => set(inp.key, e.target.checked)}
                  />
                  {inp.help || 'Enabled'}
                </label>
              ) : inp.type === 'range' ? (
                <div>
                  <input
                    id={`in-${inp.key}`}
                    type="range"
                    min={inp.min}
                    max={inp.max}
                    step={inp.step ?? 1}
                    value={Number(val) || 0}
                    onChange={(e) => set(inp.key, Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span className="unit">{String(val)}</span>
                </div>
              ) : (
                <input
                  id={`in-${inp.key}`}
                  type="number"
                  className="field"
                  min={inp.min}
                  max={inp.max}
                  step={inp.step ?? 'any'}
                  value={Number(val) || 0}
                  onChange={(e) => set(inp.key, e.target.value === '' ? 0 : Number(e.target.value))}
                />
              )}
              {inp.help && inp.type !== 'boolean' ? (
                <span className="unit" style={{ fontSize: 12 }}>
                  {inp.help}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="io-group" aria-live="polite">
        {outputs.map((o) => (
          <div className="output-card" key={o.key}>
            <div className="output-label">{o.label}</div>
            <div className="output-value">{o.display}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
