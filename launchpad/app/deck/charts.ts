import { STAGES } from "./seed";
import type { HistoryPoint, StageDef, Stage } from "./types";

export const CUR = "$";
export const ACCENT = "#c8f14a";

export function money(n: number): string {
  const s = CUR;
  n = Math.round(n || 0);
  if (Math.abs(n) >= 10000) return s + (n / 1000).toFixed(0) + "K";
  if (Math.abs(n) >= 1000) return s + (n / 1000).toFixed(1) + "K";
  return s + n;
}

export function compact(n: number): string {
  n = Math.round(n || 0);
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export function fmtVal(n: number, kind: string): string {
  if (kind === "money") return money(n);
  if (kind === "pct") return (Math.round(n * 10) / 10).toFixed(1) + "%";
  if (kind === "compact") return compact(n);
  return String(Math.round(n));
}

export function last(h?: HistoryPoint[]): HistoryPoint | null {
  return h && h.length ? h[h.length - 1] : null;
}
export function prev(h?: HistoryPoint[]): HistoryPoint | null {
  return h && h.length > 1 ? h[h.length - 2] : null;
}
export function allTime(h?: HistoryPoint[]): number {
  return (h || []).reduce((a, x) => a + (x.rev || 0), 0);
}
export function growth(h?: HistoryPoint[]): number | null {
  const l = last(h), p = prev(h);
  if (!l || !p || !p.rev) return null;
  return ((l.rev - p.rev) / p.rev) * 100;
}

const FALLBACK: StageDef = { k: "idea", label: "", sub: "", color: "#8c8675" };
export function stageMeta(k: Stage): StageDef {
  return STAGES.find((s) => s.k === k) || { ...FALLBACK, k, label: k };
}
export function stageIndex(k: Stage): number {
  const i = STAGES.findIndex((s) => s.k === k);
  return i < 0 ? 0 : i;
}

export interface PathResult {
  line: string;
  area: string;
  lastX: string | number;
  lastY: string | number;
}

export function path(vals: number[], W: number, H: number, pad: number): PathResult {
  const n = vals.length;
  const max = Math.max(1, ...vals);
  const X = (i: number) =>
    pad + (n <= 1 ? (W - 2 * pad) / 2 : (i / (n - 1)) * (W - 2 * pad));
  const Y = (v: number) => H - pad - (v / max) * (H - 2 * pad);
  if (!n) return { line: "", area: "", lastX: X(0), lastY: H - pad };
  const line = vals
    .map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1))
    .join(" ");
  const area =
    line +
    " L " + X(n - 1).toFixed(1) + "," + (H - pad).toFixed(1) +
    " L " + X(0).toFixed(1) + "," + (H - pad).toFixed(1) + " Z";
  return { line, area, lastX: X(n - 1).toFixed(1), lastY: Y(vals[n - 1]).toFixed(1) };
}

export function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

export function hash(id: string): number {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return ((h % 360) * Math.PI) / 180;
}

// Parse a CSS declaration string into a React style object.
export function css(s: string): React.CSSProperties {
  const o: Record<string, string> = {};
  s.split(";").forEach((rule) => {
    const i = rule.indexOf(":");
    if (i < 0) return;
    const k = rule.slice(0, i).trim();
    const v = rule.slice(i + 1).trim();
    if (!k) return;
    const kk = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    o[kk] = v;
  });
  return o as React.CSSProperties;
}
