// docs/lib/expr.mjs
// Safe arithmetic expression evaluator for tool-spec output exprs.
// Hard allowlist: only whitelisted identifiers (declared input/output ids + a
// small Math surface) may appear. Anything else (require, process, import,
// eval, fetch, window, backticks, member access on non-Math objects, etc.)
// makes checkAllowlist() fail BEFORE any evaluation happens.

const MATH_FUNCS = new Set([
  'abs', 'ceil', 'floor', 'round', 'trunc', 'sign',
  'min', 'max', 'pow', 'sqrt', 'cbrt', 'exp', 'log', 'log2', 'log10',
  'sin', 'cos', 'tan', 'atan', 'atan2', 'hypot',
]);
const MATH_CONSTS = new Set(['PI', 'E']);

// Tokens that must never appear anywhere in an expression.
const BANNED = [
  'require', 'process', 'import', 'eval', 'Function', 'fetch', 'globalThis',
  'window', 'global', 'module', 'exports', '__proto__', 'constructor',
  'prototype', 'this', 'async', 'await', 'while', 'for', 'new', 'delete',
  'void', 'typeof', 'yield', 'class', 'function', 'return', 'setTimeout',
];

// Verify every identifier in `expr` is either an allowed variable, `Math`,
// a Math member, or a numeric literal. Returns {ok, reason?, ident?}.
export function checkAllowlist(expr, allowedVars) {
  if (typeof expr !== 'string' || !expr.trim()) {
    return { ok: false, reason: 'empty_expr' };
  }
  // No backticks, template strings, comments, statement separators, or assignment.
  if (/[`;]|=>|\/\/|\/\*|\bdo\b/.test(expr)) {
    return { ok: false, reason: 'forbidden_syntax' };
  }
  // No bare '=' assignment (allow ==, ===, <=, >=, != only).
  if (/(^|[^=!<>])=(?![=])/.test(expr)) {
    return { ok: false, reason: 'assignment_forbidden' };
  }
  for (const b of BANNED) {
    if (new RegExp(`\\b${b}\\b`).test(expr)) {
      return { ok: false, reason: `banned_token:${b}` };
    }
  }
  const allowed = new Set(allowedVars);
  // Match identifiers and Math.member chains.
  const idRe = /[A-Za-z_$][A-Za-z0-9_$]*(?:\s*\.\s*[A-Za-z_$][A-Za-z0-9_$]*)*/g;
  let m;
  while ((m = idRe.exec(expr))) {
    const token = m[0].replace(/\s+/g, '');
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts[0] !== 'Math' || parts.length !== 2) {
        return { ok: false, reason: 'member_access', ident: token };
      }
      const fn = parts[1];
      if (!MATH_FUNCS.has(fn) && !MATH_CONSTS.has(fn)) {
        return { ok: false, reason: 'math_member', ident: token };
      }
      continue;
    }
    if (token === 'Math') continue;
    if (allowed.has(token)) continue;
    if (/^(true|false)$/.test(token)) continue;
    return { ok: false, reason: 'unknown_identifier', ident: token };
  }
  return { ok: true };
}

// Evaluate a validated expression with a scope of variables.
// checkAllowlist MUST pass first (caller enforces). Uses Function with an
// explicit, closed parameter list — no access to outer scope or globals.
export function evalExpr(expr, scope, allowedVars) {
  const guard = checkAllowlist(expr, allowedVars);
  if (!guard.ok) throw new Error(`allowlist:${guard.reason}${guard.ident ? ':' + guard.ident : ''}`);
  const names = Array.from(allowedVars);
  const args = names.map((n) => (n in scope ? Number(scope[n]) : undefined));
  // eslint-disable-next-line no-new-func
  const fn = new Function('Math', ...names, `"use strict";return (${expr});`);
  return fn(Math, ...args);
}
