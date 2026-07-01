// Self-contained, non-eval arithmetic evaluator + tool compute.
//
// The frontend spec says to import compute() from backend B3 (lib/toolCompute.ts),
// but lib/ is owned by another package and may not exist at build time, so this
// frontend-owned implementation keeps the tool route compiling and runnable
// standalone. It mirrors the (spec, inputs) -> outputs contract. If B3 ships a
// canonical lib/toolCompute.ts, the main thread can re-point these imports.

import type { ToolSpec, ToolInput, ToolOutput } from '../../../components/types';

// ---- tokenizer ----
type Tok =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'lp' }
  | { t: 'rp' }
  | { t: 'comma' };

function tokenize(expr: string): Tok[] {
  const toks: Tok[] = [];
  const s = expr;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if ((c >= '0' && c <= '9') || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      if (j < s.length && (s[j] === 'e' || s[j] === 'E')) {
        j++;
        if (s[j] === '+' || s[j] === '-') j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      toks.push({ t: 'num', v: parseFloat(s.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      toks.push({ t: 'id', v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '(') {
      toks.push({ t: 'lp' });
      i++;
      continue;
    }
    if (c === ')') {
      toks.push({ t: 'rp' });
      i++;
      continue;
    }
    if (c === ',') {
      toks.push({ t: 'comma' });
      i++;
      continue;
    }
    if ('+-*/%^'.includes(c)) {
      toks.push({ t: 'op', v: c });
      i++;
      continue;
    }
    i++; // skip unknown char defensively
  }
  return toks;
}

const PREC: Record<string, number> = { '+': 2, '-': 2, '*': 3, '/': 3, '%': 3, '^': 4, 'u-': 5 };
const RIGHT = new Set(['^', 'u-']);

const FUNCS: Record<string, (...a: number[]) => number> = {
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  sum: (...a) => a.reduce((x, y) => x + y, 0),
  avg: (...a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0),
  round: (x, d = 0) => {
    const f = Math.pow(10, d);
    return Math.round(x * f) / f;
  },
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  abs: (x) => Math.abs(x),
  sqrt: (x) => Math.sqrt(x),
  pow: (x, y) => Math.pow(x, y),
  log: (x) => Math.log(x),
  log10: (x) => Math.log(x) / Math.LN10,
  exp: (x) => Math.exp(x),
  clamp: (x, lo, hi) => Math.max(lo, Math.min(hi, x)),
  if: (cond, a, b) => (cond ? a : b),
};

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E, true: 1, false: 0 };

type RTok =
  | { t: 'num'; v: number }
  | { t: 'var'; v: string }
  | { t: 'op'; v: string }
  | { t: 'fn'; v: string; argc: number };

function toRpn(toks: Tok[]): RTok[] {
  const out: RTok[] = [];
  const ops: ({ k: 'op'; v: string } | { k: 'fn'; v: string } | { k: 'lp' })[] = [];
  const parens: { isFunc: boolean; argc: number; hasContent: boolean }[] = [];
  let prev: Tok | null = null;

  const markContent = () => {
    if (parens.length) parens[parens.length - 1].hasContent = true;
  };

  for (let k = 0; k < toks.length; k++) {
    const tk = toks[k];
    if (tk.t === 'num') {
      out.push({ t: 'num', v: tk.v });
      markContent();
    } else if (tk.t === 'id') {
      const next = toks[k + 1];
      if (next && next.t === 'lp') {
        ops.push({ k: 'fn', v: tk.v });
      } else {
        out.push({ t: 'var', v: tk.v });
        markContent();
      }
    } else if (tk.t === 'comma') {
      while (ops.length && ops[ops.length - 1].k !== 'lp') out.push(popToRtok(ops.pop()!));
      if (parens.length) parens[parens.length - 1].argc++;
    } else if (tk.t === 'op') {
      let op = tk.v;
      const unary =
        !prev || prev.t === 'op' || prev.t === 'lp' || prev.t === 'comma';
      if (op === '-' && unary) op = 'u-';
      if (op === '+' && unary) {
        prev = tk;
        continue;
      }
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.k === 'op') {
          const cmp = RIGHT.has(op) ? PREC[op] < PREC[top.v] : PREC[op] <= PREC[top.v];
          if (cmp) {
            out.push(popToRtok(ops.pop()!));
            continue;
          }
        } else if (top.k === 'fn') {
          out.push(popToRtok(ops.pop()!));
          continue;
        }
        break;
      }
      ops.push({ k: 'op', v: op });
    } else if (tk.t === 'lp') {
      const isFunc = ops.length > 0 && ops[ops.length - 1].k === 'fn';
      ops.push({ k: 'lp' });
      parens.push({ isFunc, argc: 0, hasContent: false });
    } else if (tk.t === 'rp') {
      while (ops.length && ops[ops.length - 1].k !== 'lp') out.push(popToRtok(ops.pop()!));
      ops.pop(); // discard lp
      const p = parens.pop();
      if (p && p.isFunc) {
        const fn = ops.pop();
        const argc = p.hasContent ? p.argc + 1 : 0;
        if (fn && fn.k === 'fn') out.push({ t: 'fn', v: fn.v, argc });
      }
      markContent();
    }
    prev = tk;
  }
  while (ops.length) {
    const top = ops.pop()!;
    if (top.k !== 'lp') out.push(popToRtok(top));
  }
  return out;
}

function popToRtok(o: { k: 'op'; v: string } | { k: 'fn'; v: string } | { k: 'lp' }): RTok {
  if (o.k === 'op') return { t: 'op', v: o.v };
  return { t: 'fn', v: (o as any).v, argc: 0 };
}

function evalRpn(rpn: RTok[], scope: Record<string, number>): number {
  const st: number[] = [];
  for (const tk of rpn) {
    if (tk.t === 'num') {
      st.push(tk.v);
    } else if (tk.t === 'var') {
      const key = tk.v;
      if (scope[key] !== undefined) st.push(scope[key]);
      else if (CONSTS[key.toLowerCase()] !== undefined) st.push(CONSTS[key.toLowerCase()]);
      else st.push(0);
    } else if (tk.t === 'fn') {
      const fn = FUNCS[tk.v.toLowerCase()];
      const args: number[] = [];
      for (let a = 0; a < tk.argc; a++) args.unshift(st.pop() ?? 0);
      st.push(fn ? fn(...args) : 0);
    } else if (tk.t === 'op') {
      if (tk.v === 'u-') {
        st.push(-(st.pop() ?? 0));
        continue;
      }
      const b = st.pop() ?? 0;
      const a = st.pop() ?? 0;
      switch (tk.v) {
        case '+':
          st.push(a + b);
          break;
        case '-':
          st.push(a - b);
          break;
        case '*':
          st.push(a * b);
          break;
        case '/':
          st.push(b === 0 ? 0 : a / b);
          break;
        case '%':
          st.push(b === 0 ? 0 : a % b);
          break;
        case '^':
          st.push(Math.pow(a, b));
          break;
      }
    }
  }
  const r = st.pop();
  return typeof r === 'number' && isFinite(r) ? r : 0;
}

function evalExpr(expr: string, scope: Record<string, number>): number {
  try {
    return evalRpn(toRpn(tokenize(expr)), scope);
  } catch {
    return 0;
  }
}

// ---- input coercion + defaults ----
export function defaultInputs(spec: ToolSpec): Record<string, number | string | boolean> {
  const o: Record<string, number | string | boolean> = {};
  for (const inp of spec.inputs || []) {
    if (inp.default !== undefined) o[inp.key] = inp.default;
    else if (inp.type === 'boolean') o[inp.key] = false;
    else if (inp.type === 'select' && inp.options && inp.options.length) o[inp.key] = inp.options[0].value;
    else if (typeof inp.min === 'number') o[inp.key] = inp.min;
    else o[inp.key] = 0;
  }
  return o;
}

function toNumberScope(
  inputs: Record<string, number | string | boolean>,
  defs: ToolInput[],
): Record<string, number> {
  const scope: Record<string, number> = {};
  const byKey = new Map(defs.map((d) => [d.key, d] as const));
  for (const [k, v] of Object.entries(inputs)) {
    if (typeof v === 'number') scope[k] = v;
    else if (typeof v === 'boolean') scope[k] = v ? 1 : 0;
    else {
      const num = parseFloat(v);
      if (!isNaN(num) && String(num) === v.trim()) scope[k] = num;
      else {
        const def = byKey.get(k);
        if (def && def.options) {
          const idx = def.options.findIndex((o) => String(o.value) === v);
          scope[k] = idx >= 0 ? Number(def.options[idx].value) || idx : 0;
        } else scope[k] = 0;
      }
    }
  }
  return scope;
}

export type ComputedOutput = {
  key: string;
  label: string;
  value: number;
  display: string;
  unit?: string;
};

function formatOutput(value: number, out: ToolOutput): string {
  const precision =
    out.precision ?? (out.format === 'integer' ? 0 : out.format === 'percent' ? 0 : 2);
  if (out.format === 'currency') {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: out.currency || 'EUR',
        maximumFractionDigits: precision,
      }).format(value);
    } catch {
      return `${out.currency || 'EUR'} ${value.toFixed(precision)}`;
    }
  }
  if (out.format === 'percent') {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: precision })}%`;
  }
  if (out.format === 'integer') {
    return Math.round(value).toLocaleString();
  }
  const s = value.toLocaleString(undefined, { maximumFractionDigits: precision });
  return out.unit ? `${s} ${out.unit}` : s;
}

/** Evaluate every output for a set of inputs. Prior outputs feed later expressions. */
export function compute(
  spec: ToolSpec,
  inputs: Record<string, number | string | boolean>,
): ComputedOutput[] {
  const scope = toNumberScope(inputs, spec.inputs || []);
  const results: ComputedOutput[] = [];
  for (const out of spec.outputs || []) {
    const value = evalExpr(out.expr, scope);
    scope[out.key] = value; // chain
    results.push({
      key: out.key,
      label: out.label,
      value,
      display: formatOutput(value, out),
      unit: out.format === 'currency' || out.format === 'percent' ? undefined : out.unit,
    });
  }
  return results;
}
