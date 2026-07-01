'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Tool } from '@/lib/tools';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function useToast(): [(msg: string) => void, React.ReactNode] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1600);
  }, []);
  const node = msg ? <div className="toast">{msg}</div> : null;
  return [show, node];
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function download(filename: string, dataUrlOrText: string, isDataUrl = false) {
  const a = document.createElement('a');
  a.href = isDataUrl
    ? dataUrlOrText
    : URL.createObjectURL(new Blob([dataUrlOrText], { type: 'text/plain' }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (!isDataUrl) URL.revokeObjectURL(a.href);
}

function ProUpsell({ label }: { label: string }) {
  return (
    <div className="pro-banner" role="note">
      <p>
        <strong>{label}</strong> is part of QuickConvert Pro.
      </p>
      <Link className="btn btn-primary" href="/pricing" style={{ padding: '8px 14px' }}>
        Unlock Pro
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Image converter (PNG / JPG / WEBP)                               */
/* ------------------------------------------------------------------ */

function ImageConverter() {
  const [drag, setDrag] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(0.9);
  const [outputs, setOutputs] = useState<
    { name: string; url: string; size: number }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isProBuild = false; // No subscription session in this build → batch is gated.

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) {
      setError('Please choose an image file.');
      return;
    }
    setError(null);
    setFiles(isProBuild ? arr : arr.slice(0, 1));
    setOutputs([]);
  };

  const convertOne = (file: File): Promise<{ name: string; url: string; size: number }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objUrl);
          reject(new Error('Canvas is not supported in this browser.'));
          return;
        }
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff'; // JPG has no alpha; flatten onto white.
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const mime = `image/${format}`;
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objUrl);
            if (!blob) {
              reject(new Error('Conversion failed.'));
              return;
            }
            const base = file.name.replace(/\.[^.]+$/, '');
            const ext = format === 'jpeg' ? 'jpg' : format;
            resolve({
              name: `${base}.${ext}`,
              url: URL.createObjectURL(blob),
              size: blob.size,
            });
          },
          mime,
          format === 'png' ? undefined : quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        reject(new Error('Could not read that image.'));
      };
      img.src = objUrl;
    });

  const run = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const results = [];
      for (const f of files) {
        results.push(await convertOne(f));
      }
      setOutputs(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="converter">
      <div
        className={`dropzone${drag ? ' drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pickFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        {files.length > 0
          ? `${files.length} file${files.length > 1 ? 's' : ''} ready — ${files
              .map((f) => f.name)
              .join(', ')}`
          : 'Drag an image here, or click to choose a PNG, JPG or WEBP file'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => pickFiles(e.target.files)}
        />
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Output format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
            <option value="png">PNG (lossless, keeps transparency)</option>
            <option value="jpeg">JPG (smaller, no transparency)</option>
            <option value="webp">WEBP (modern, small + transparent)</option>
          </select>
        </div>
        {format !== 'png' && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Quality: {Math.round(quality * 100)}%</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={run} disabled={busy || files.length === 0}>
          {busy ? 'Converting…' : 'Convert'}
        </button>
        {files.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFiles([]);
              setOutputs([]);
              setError(null);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="hint" style={{ color: '#dc2626' }}>{error}</p>}

      {!isProBuild && (
        <ProUpsell label="Batch conversion (multiple files at once)" />
      )}

      {outputs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {outputs.map((o) => (
            <div
              key={o.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderTop: '1px solid var(--border)',
                paddingTop: 12,
                marginTop: 12,
              }}
            >
              <img
                src={o.url}
                alt={o.name}
                style={{ maxHeight: 64, borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ fontSize: 14 }}>{o.name}</div>
                <div className="hint">{(o.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => download(o.name, o.url, true)}
                style={{ padding: '8px 14px' }}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Unit converter                                                   */
/* ------------------------------------------------------------------ */

type UnitDef = { label: string; toBase: number };
const UNIT_CATS: Record<string, { units: Record<string, UnitDef>; temp?: boolean }> = {
  Length: {
    units: {
      mm: { label: 'Millimetre', toBase: 0.001 },
      cm: { label: 'Centimetre', toBase: 0.01 },
      m: { label: 'Metre', toBase: 1 },
      km: { label: 'Kilometre', toBase: 1000 },
      in: { label: 'Inch', toBase: 0.0254 },
      ft: { label: 'Foot', toBase: 0.3048 },
      yd: { label: 'Yard', toBase: 0.9144 },
      mi: { label: 'Mile', toBase: 1609.344 },
    },
  },
  Weight: {
    units: {
      mg: { label: 'Milligram', toBase: 0.001 },
      g: { label: 'Gram', toBase: 1 },
      kg: { label: 'Kilogram', toBase: 1000 },
      oz: { label: 'Ounce', toBase: 28.349523125 },
      lb: { label: 'Pound', toBase: 453.59237 },
      st: { label: 'Stone', toBase: 6350.29318 },
    },
  },
  Temperature: { temp: true, units: { C: { label: 'Celsius', toBase: 1 }, F: { label: 'Fahrenheit', toBase: 1 }, K: { label: 'Kelvin', toBase: 1 } } },
  Volume: {
    units: {
      ml: { label: 'Millilitre', toBase: 0.001 },
      l: { label: 'Litre', toBase: 1 },
      tsp: { label: 'Teaspoon (US)', toBase: 0.00492892 },
      tbsp: { label: 'Tablespoon (US)', toBase: 0.0147868 },
      cup: { label: 'Cup (US)', toBase: 0.236588 },
      pt: { label: 'Pint (US)', toBase: 0.473176 },
      gal: { label: 'Gallon (US)', toBase: 3.78541 },
    },
  },
  Data: {
    units: {
      B: { label: 'Byte', toBase: 1 },
      KB: { label: 'Kilobyte', toBase: 1000 },
      MB: { label: 'Megabyte', toBase: 1e6 },
      GB: { label: 'Gigabyte', toBase: 1e9 },
      TB: { label: 'Terabyte', toBase: 1e12 },
      KiB: { label: 'Kibibyte', toBase: 1024 },
      MiB: { label: 'Mebibyte', toBase: 1048576 },
      GiB: { label: 'Gibibyte', toBase: 1073741824 },
    },
  },
};

function tempToC(v: number, from: string): number {
  if (from === 'C') return v;
  if (from === 'F') return (v - 32) * (5 / 9);
  return v - 273.15; // K
}
function tempFromC(c: number, to: string): number {
  if (to === 'C') return c;
  if (to === 'F') return c * (9 / 5) + 32;
  return c + 273.15;
}

function fmt(n: number): string {
  if (!isFinite(n)) return '';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 0.0001 || abs >= 1e12) return n.toExponential(4);
  return parseFloat(n.toPrecision(8)).toString();
}

function UnitConverter() {
  const [cat, setCat] = useState('Length');
  const [source, setSource] = useState<{ unit: string; value: string }>({
    unit: 'm',
    value: '1',
  });
  const [toast, toastNode] = useToast();
  const cfg = UNIT_CATS[cat];

  useEffect(() => {
    const first = Object.keys(UNIT_CATS[cat].units)[0];
    setSource({ unit: first, value: '1' });
  }, [cat]);

  const results = useMemo(() => {
    const val = parseFloat(source.value);
    const out: Record<string, string> = {};
    // Guard: on the render right after a category switch, source.unit may not
    // yet belong to the new category (the effect resets it next tick).
    if (isNaN(val) || !cfg.units[source.unit]) return out;
    Object.keys(cfg.units).forEach((u) => {
      if (cfg.temp) {
        out[u] = fmt(tempFromC(tempToC(val, source.unit), u));
      } else {
        const base = val * cfg.units[source.unit].toBase;
        out[u] = fmt(base / cfg.units[u].toBase);
      }
    });
    return out;
  }, [source, cfg]);

  return (
    <div className="converter">
      <div className="seg" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.keys(UNIT_CATS).map((c) => (
          <button key={c} className={c === cat ? 'active' : ''} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="row">
        <div className="field" style={{ marginBottom: 0, flex: 2 }}>
          <label>Value</label>
          <input
            type="number"
            value={source.value}
            onChange={(e) => setSource((s) => ({ ...s, value: e.target.value }))}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>From</label>
          <select
            value={source.unit}
            onChange={(e) => setSource((s) => ({ ...s, unit: e.target.value }))}
          >
            {Object.entries(cfg.units).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} ({k})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="result-grid" style={{ marginTop: 18 }}>
        {Object.entries(cfg.units).map(([k, v]) => (
          <div
            key={k}
            className="result-cell copyable"
            onClick={async () => {
              if (results[k] && (await copyText(results[k]))) toast('Copied');
            }}
            title="Click to copy"
          >
            <div className="k">
              {v.label} ({k})
            </div>
            <div className="v">{results[k] ?? '—'}</div>
          </div>
        ))}
      </div>
      <p className="hint">Click any result to copy it.</p>
      {toastNode}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. CSV → JSON                                                       */
/* ------------------------------------------------------------------ */

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // ignore; handled by \n
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function CsvJsonConverter() {
  const [input, setInput] = useState(
    'name,role,active\n"Smith, John",Engineer,true\nJane,Designer,false'
  );
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [toast, toastNode] = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const { output, error } = useMemo(() => {
    try {
      const rows = parseCsv(input, delimiter);
      if (rows.length === 0) return { output: '[]', error: null };
      let json: unknown;
      if (hasHeader) {
        const headers = rows[0];
        json = rows.slice(1).map((r) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => (obj[h] = r[i] ?? ''));
          return obj;
        });
      } else {
        json = rows;
      }
      return { output: JSON.stringify(json, null, 2), error: null };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Parse error' };
    }
  }, [input, delimiter, hasHeader]);

  const loadFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result));
    reader.readAsText(file);
  };

  return (
    <div className="converter">
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Delimiter</label>
          <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
            <option value=",">Comma ,</option>
            <option value=";">Semicolon ;</option>
            <option value={'\t'}>Tab</option>
            <option value="|">Pipe |</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            id="hdr"
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            style={{ width: 'auto' }}
          />
          <label htmlFor="hdr" style={{ margin: 0 }}>
            First row is a header
          </label>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <button className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
            Load .csv file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => loadFile(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="field">
        <label>CSV input</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      </div>

      <div className="field">
        <label>JSON output</label>
        <textarea value={error ? `// ${error}` : output} readOnly spellCheck={false} />
      </div>

      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (await copyText(output)) toast('JSON copied');
          }}
          disabled={!!error}
        >
          Copy JSON
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => download('data.json', output)}
          disabled={!!error}
        >
          Download .json
        </button>
      </div>
      {toastNode}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Timestamp / epoch                                                */
/* ------------------------------------------------------------------ */

function TimestampConverter() {
  const [raw, setRaw] = useState('');
  const [unit, setUnit] = useState<'s' | 'ms'>('s');
  const [now, setNow] = useState(Date.now());
  const [toast, toastNode] = useToast();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-detect s vs ms from digit count on input.
  useEffect(() => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 12) setUnit('ms');
    else if (digits.length > 0 && digits.length <= 11) setUnit('s');
  }, [raw]);

  const date = useMemo(() => {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return null;
    const ms = unit === 's' ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }, [raw, unit]);

  const rows = date
    ? [
        { k: 'ISO 8601 (UTC)', v: date.toISOString() },
        { k: 'UTC string', v: date.toUTCString() },
        { k: 'Local time', v: date.toLocaleString() },
        { k: 'Relative', v: relative(date.getTime()) },
      ]
    : [];

  const copy = async (v: string) => {
    if (await copyText(v)) toast('Copied');
  };

  return (
    <div className="converter">
      <div
        className="result-cell copyable"
        style={{ marginBottom: 16 }}
        onClick={() => copy(String(unit === 's' ? Math.floor(now / 1000) : now))}
        title="Click to copy current timestamp"
      >
        <div className="k">Current timestamp ({unit === 's' ? 'seconds' : 'ms'}) — click to copy</div>
        <div className="v">{unit === 's' ? Math.floor(now / 1000) : now}</div>
      </div>

      <div className="row">
        <div className="field" style={{ marginBottom: 0, flex: 2 }}>
          <label>Unix timestamp</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1751328000"
            value={raw}
            onChange={(e) => setRaw(e.target.value.trim())}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Unit</label>
          <div className="seg">
            <button className={unit === 's' ? 'active' : ''} onClick={() => setUnit('s')}>
              Seconds
            </button>
            <button className={unit === 'ms' ? 'active' : ''} onClick={() => setUnit('ms')}>
              Millis
            </button>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="result-grid" style={{ marginTop: 16 }}>
          {rows.map((r) => (
            <div key={r.k} className="result-cell copyable" onClick={() => copy(r.v)} title="Click to copy">
              <div className="k">{r.k}</div>
              <div className="v">{r.v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="field" style={{ marginTop: 18 }}>
        <label>Or pick a date/time to get the timestamp</label>
        <input
          type="datetime-local"
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) {
              const t = unit === 's' ? Math.floor(d.getTime() / 1000) : d.getTime();
              setRaw(String(t));
            }
          }}
        />
      </div>
      {toastNode}
    </div>
  );
}

function relative(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [31536000000, 'year'],
    [2592000000, 'month'],
    [86400000, 'day'],
    [3600000, 'hour'],
    [60000, 'minute'],
    [1000, 'second'],
  ];
  for (const [u, name] of units) {
    if (abs >= u) {
      const n = Math.round(abs / u);
      return diff < 0 ? `${n} ${name}${n > 1 ? 's' : ''} ago` : `in ${n} ${name}${n > 1 ? 's' : ''}`;
    }
  }
  return 'just now';
}

/* ------------------------------------------------------------------ */
/* 5. Color converter                                                  */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function ColorConverter() {
  const [rgb, setRgb] = useState<[number, number, number]>([59, 130, 246]);
  const [toast, toastNode] = useToast();
  const [hexInput, setHexInput] = useState('#3b82f6');

  const hex = rgbToHex(...rgb);
  const hsl = rgbToHsl(...rgb);
  const rgbStr = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  const hslStr = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;

  const copy = async (v: string) => {
    if (await copyText(v)) toast('Copied');
  };

  const applyHex = (val: string) => {
    setHexInput(val);
    const parsed = hexToRgb(val);
    if (parsed) setRgb(parsed);
  };

  return (
    <div className="converter">
      <div className="swatch" style={{ background: hex }} />
      <div className="row">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Pick</label>
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              const p = hexToRgb(e.target.value);
              if (p) {
                setRgb(p);
                setHexInput(e.target.value);
              }
            }}
            style={{ height: 42, padding: 4 }}
          />
        </div>
        <div className="field" style={{ marginBottom: 0, flex: 2 }}>
          <label>HEX</label>
          <input type="text" value={hexInput} onChange={(e) => applyHex(e.target.value)} className="mono" />
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        {(['R', 'G', 'B'] as const).map((c, i) => (
          <div key={c} className="field" style={{ marginBottom: 0 }}>
            <label>{c}</label>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb[i]}
              onChange={(e) => {
                const next = [...rgb] as [number, number, number];
                next[i] = parseInt(e.target.value || '0', 10);
                setRgb(next);
                setHexInput(rgbToHex(...next));
              }}
            />
          </div>
        ))}
      </div>

      <div className="result-grid" style={{ marginTop: 16 }}>
        {[
          ['HEX', hex],
          ['RGB', rgbStr],
          ['HSL', hslStr],
        ].map(([k, v]) => (
          <div key={k} className="result-cell copyable" onClick={() => copy(v)} title="Click to copy">
            <div className="k">{k}</div>
            <div className="v">{v}</div>
          </div>
        ))}
      </div>
      <p className="hint">Edit HEX, RGB or the picker — everything stays in sync. Click a value to copy.</p>
      {toastNode}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Base64                                                           */
/* ------------------------------------------------------------------ */

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function base64ToUtf8(b64: string): string {
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function Base64Converter() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('Hello, 世界 😀');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [toast, toastNode] = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { output, error } = useMemo(() => {
    try {
      if (!input) return { output: '', error: null };
      return { output: mode === 'encode' ? utf8ToBase64(input) : base64ToUtf8(input), error: null };
    } catch {
      return { output: '', error: mode === 'decode' ? 'That is not valid Base64.' : 'Could not encode.' };
    }
  }, [input, mode]);

  const loadFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMode('encode');
      // FileReader gives a full data: URL — perfect for embedding.
      setInput('');
      const url = String(reader.result);
      // Show data URL directly as output by placing it into a synthetic state:
      setDataUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const shownOutput = dataUrl ?? output;

  return (
    <div className="converter">
      <div className="seg" style={{ marginBottom: 16 }}>
        <button
          className={mode === 'encode' ? 'active' : ''}
          onClick={() => {
            setMode('encode');
            setDataUrl(null);
          }}
        >
          Encode
        </button>
        <button
          className={mode === 'decode' ? 'active' : ''}
          onClick={() => {
            setMode('decode');
            setDataUrl(null);
          }}
        >
          Decode
        </button>
      </div>

      <div className="field">
        <label>{mode === 'encode' ? 'Text to encode' : 'Base64 to decode'}</label>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setDataUrl(null);
          }}
          spellCheck={false}
        />
      </div>

      {mode === 'encode' && (
        <div className="toolbar" style={{ marginTop: 0, marginBottom: 12 }}>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            Encode a file → data URL
          </button>
          <input ref={fileRef} type="file" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
        </div>
      )}

      <div className="field">
        <label>Result</label>
        <textarea value={error ? `// ${error}` : shownOutput} readOnly spellCheck={false} />
      </div>

      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (await copyText(shownOutput)) toast('Copied');
          }}
          disabled={!!error || !shownOutput}
        >
          Copy result
        </button>
      </div>
      {toastNode}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Text case                                                        */
/* ------------------------------------------------------------------ */

function splitWords(s: string): string[] {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s_\-]+/)
    .filter(Boolean);
}

const CASES: Record<string, (s: string) => string> = {
  UPPERCASE: (s) => s.toUpperCase(),
  lowercase: (s) => s.toLowerCase(),
  'Sentence case': (s) =>
    s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()),
  'Title Case': (s) =>
    s
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  camelCase: (s) =>
    splitWords(s)
      .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
      .join(''),
  PascalCase: (s) =>
    splitWords(s)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(''),
  snake_case: (s) => splitWords(s).map((w) => w.toLowerCase()).join('_'),
  'kebab-case': (s) => splitWords(s).map((w) => w.toLowerCase()).join('-'),
  CONSTANT_CASE: (s) => splitWords(s).map((w) => w.toUpperCase()).join('_'),
};

function CaseConverter() {
  const [input, setInput] = useState('the quick brown fox jumps over the lazy dog');
  const [active, setActive] = useState('Title Case');
  const [toast, toastNode] = useToast();

  const output = CASES[active](input);
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const chars = input.length;

  return (
    <div className="converter">
      <div className="field">
        <label>Your text</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        <p className="hint">
          {words} word{words !== 1 ? 's' : ''} · {chars} character{chars !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="seg" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.keys(CASES).map((c) => (
          <button key={c} className={c === active ? 'active' : ''} onClick={() => setActive(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="field">
        <label>{active}</label>
        <textarea value={output} readOnly spellCheck={false} />
      </div>

      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (await copyText(output)) toast('Copied');
          }}
        >
          Copy result
        </button>
      </div>
      {toastNode}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export default function Converter({ tool }: { tool: Tool }) {
  switch (tool.component) {
    case 'image':
      return <ImageConverter />;
    case 'units':
      return <UnitConverter />;
    case 'csv-json':
      return <CsvJsonConverter />;
    case 'timestamp':
      return <TimestampConverter />;
    case 'color':
      return <ColorConverter />;
    case 'base64':
      return <Base64Converter />;
    case 'case':
      return <CaseConverter />;
    default:
      return null;
  }
}
