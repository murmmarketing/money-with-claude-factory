import { Parser } from 'expr-eval';

/**
 * Single source of truth for calculator/tool evaluation. Imported by both the
 * server route (/api/tool/[id]) and — via the same module — the in-browser
 * ToolRunner (frontend F4) and the verifier's golden tests (V3), so results are
 * identical everywhere.
 *
 * Security model: expr-eval is a pure-JS parser with NO eval/Function and NO
 * member access. We additionally whitelist every identifier a formula may
 * reference (only declared inputs + already-computed vars) and every function
 * it may call, so a spec can never reach `constructor`, `process`, globals, etc.
 */

// Hard caps to bound work and block abuse.
const MAX_INPUTS = 20;
const MAX_EXPR_LEN = 500;

// Whitelisted math functions exposed to formulas.
const FN: Record<string, (...a: number[]) => number> = {
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sqrt: Math.sqrt,
  pow: Math.pow,
  log: Math.log,
  exp: Math.exp,
};
const FN_NAMES = new Set(Object.keys(FN));

export type ToolInputSpec = {
  key: string;
  type: 'number' | 'select';
  min?: number;
  max?: number;
  options?: Array<string | number>;
  default?: number | string;
};

export type ToolExpr = { key: string; expr: string; precision?: number };

export type ToolSpec = {
  inputs: ToolInputSpec[];
  vars?: ToolExpr[];
  outputs: ToolExpr[];
};

export type ComputeResult = {
  outputs: Record<string, number>;
  vars: Record<string, number>;
};

// expr-eval configured with member access and assignment disabled: formulas can
// only read whitelisted identifiers and call whitelisted functions.
const parser = new Parser({
  operators: {
    logical: true,
    comparison: true,
    concatenate: false,
    conditional: true,
    // block anything exotic
    assignment: false,
    array: false,
    fndef: false,
  },
});
// Replace expr-eval's default function surface (sin, random, fac, ...) with
// ONLY our whitelist, so a formula can never call anything unexpected.
parser.functions = { ...FN };

function coerceInputs(
  inputs: ToolInputSpec[],
  raw: Record<string, unknown>
): Record<string, number> {
  if (!Array.isArray(inputs) || inputs.length > MAX_INPUTS) {
    throw new Error('too many inputs');
  }
  const scope: Record<string, number> = {};
  for (const inp of inputs) {
    if (!inp || typeof inp.key !== 'string' || !/^[A-Za-z_]\w*$/.test(inp.key)) {
      throw new Error('bad input key');
    }
    const provided = raw?.[inp.key];
    if (inp.type === 'select') {
      const opts = (inp.options || []).map((o) => Number(o));
      let v = Number(provided ?? inp.default ?? opts[0]);
      if (!opts.includes(v)) {
        // fall back to first allowed option rather than trusting arbitrary input
        v = opts[0];
      }
      if (!Number.isFinite(v)) throw new Error('bad select value');
      scope[inp.key] = v;
    } else {
      let v = Number(provided ?? inp.default ?? 0);
      if (!Number.isFinite(v)) v = Number(inp.default ?? 0);
      if (typeof inp.min === 'number' && v < inp.min) v = inp.min;
      if (typeof inp.max === 'number' && v > inp.max) v = inp.max;
      if (!Number.isFinite(v)) throw new Error('non-finite input');
      scope[inp.key] = v;
    }
  }
  return scope;
}

function evalExpr(
  expr: string,
  allowed: Set<string>,
  scope: Record<string, number>
): number {
  if (typeof expr !== 'string' || expr.length === 0 || expr.length > MAX_EXPR_LEN) {
    throw new Error('bad expr');
  }
  const ast = parser.parse(expr);
  // Every referenced identifier must be a declared input or an already-computed
  // var. Unknown identifiers (constructor, process, window, ...) throw here.
  for (const v of ast.variables({ withMembers: false })) {
    if (!allowed.has(v) && !FN_NAMES.has(v)) {
      throw new Error(`unknown identifier: ${v}`);
    }
  }
  const out = ast.evaluate({ ...scope, ...FN });
  if (typeof out !== 'number' || !Number.isFinite(out)) {
    throw new Error('non-finite result');
  }
  return out;
}

function roundTo(n: number, precision?: number): number {
  const p = Number.isInteger(precision) ? (precision as number) : 2;
  const f = Math.pow(10, Math.max(0, Math.min(10, p)));
  return Math.round(n * f) / f;
}

/**
 * Evaluate a tool spec against raw (untrusted) inputs. Throws on any invalid
 * spec/input rather than returning partial garbage.
 */
export function compute(
  spec: ToolSpec,
  rawInputs: Record<string, unknown>
): ComputeResult {
  if (!spec || typeof spec !== 'object' || !Array.isArray(spec.inputs)) {
    throw new Error('bad spec');
  }

  const scope = coerceInputs(spec.inputs, rawInputs || {});
  const allowed = new Set<string>(Object.keys(scope));

  const vars: Record<string, number> = {};
  for (const v of spec.vars || []) {
    if (!v || typeof v.key !== 'string' || !/^[A-Za-z_]\w*$/.test(v.key)) {
      throw new Error('bad var key');
    }
    const value = evalExpr(v.expr, allowed, scope);
    const rounded = Number.isInteger(v.precision)
      ? roundTo(value, v.precision)
      : value;
    vars[v.key] = rounded;
    scope[v.key] = rounded;
    allowed.add(v.key); // subsequent vars/outputs may reference this one
  }

  const outputs: Record<string, number> = {};
  if (!Array.isArray(spec.outputs) || spec.outputs.length === 0) {
    throw new Error('no outputs');
  }
  for (const o of spec.outputs) {
    if (!o || typeof o.key !== 'string' || !/^[A-Za-z_]\w*$/.test(o.key)) {
      throw new Error('bad output key');
    }
    outputs[o.key] = roundTo(evalExpr(o.expr, allowed, scope), o.precision);
  }

  return { outputs, vars };
}
