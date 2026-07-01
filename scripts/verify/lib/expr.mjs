// scripts/verify/lib/expr.mjs
// Tiny, safe arithmetic-expression parser + evaluator.
// Used by tool.mjs to prove that every formula in a tool spec:
//   (1) parses, and
//   (2) only references identifiers on an explicit allowlist.
// No eval / Function — recursive-descent over a fixed grammar.

const FUNCS = {
  min: Math.min,
  max: Math.max,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sqrt: Math.sqrt,
  pow: Math.pow,
  log: Math.log,
  log10: Math.log10,
  exp: Math.exp,
  sign: Math.sign,
};
const CONSTS = { PI: Math.PI, E: Math.E };

export const ALLOWED_FUNCS = Object.keys(FUNCS);
export const ALLOWED_CONSTS = Object.keys(CONSTS);

function tokenize(src) {
  const tokens = [];
  const re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|\*\*|[-+*/%(),^])/g;
  let last = 0;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m.index !== last) throw new Error(`unexpected token near "${src.slice(last, m.index + 1)}"`);
    tokens.push(m[1]);
    last = re.lastIndex;
  }
  if (last !== src.length) throw new Error(`unexpected token near "${src.slice(last)}"`);
  return tokens;
}

// Recursive-descent parser producing an AST while collecting identifiers.
function parse(tokens) {
  let i = 0;
  const idents = new Set();
  const funcs = new Set();

  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const eat = (t) => {
    if (tokens[i] !== t) throw new Error(`expected "${t}" but got "${tokens[i] ?? '<eof>'}"`);
    i++;
  };

  function parseExpr() {
    return parseAdd();
  }
  function parseAdd() {
    let node = parseMul();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      node = { type: 'bin', op, left: node, right: parseMul() };
    }
    return node;
  }
  function parseMul() {
    let node = parseUnary();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = next();
      node = { type: 'bin', op, left: node, right: parseUnary() };
    }
    return node;
  }
  function parseUnary() {
    if (peek() === '-' || peek() === '+') {
      const op = next();
      return { type: 'unary', op, arg: parseUnary() };
    }
    return parsePow();
  }
  function parsePow() {
    const base = parsePrimary();
    if (peek() === '^' || peek() === '**') {
      next();
      return { type: 'bin', op: '^', left: base, right: parseUnary() };
    }
    return base;
  }
  function parsePrimary() {
    const t = peek();
    if (t === undefined) throw new Error('unexpected end of expression');
    if (t === '(') {
      eat('(');
      const e = parseExpr();
      eat(')');
      return e;
    }
    if (/^\d/.test(t)) {
      next();
      return { type: 'num', value: parseFloat(t) };
    }
    if (/^[A-Za-z_]/.test(t)) {
      next();
      if (peek() === '(') {
        // function call
        eat('(');
        funcs.add(t);
        const args = [];
        if (peek() !== ')') {
          args.push(parseExpr());
          while (peek() === ',') {
            next();
            args.push(parseExpr());
          }
        }
        eat(')');
        return { type: 'call', name: t, args };
      }
      idents.add(t);
      return { type: 'ident', name: t };
    }
    throw new Error(`unexpected token "${t}"`);
  }

  const ast = parseExpr();
  if (i !== tokens.length) throw new Error(`trailing tokens: "${tokens.slice(i).join(' ')}"`);
  return { ast, idents, funcs };
}

/**
 * validateExpr(expr, allowIdents)
 *  -> { ok, error, idents:string[], funcs:string[], unknown:string[] }
 * allowIdents: array/Set of identifier names allowed (input/output var names).
 * Constants (PI, E) and known math funcs are always allowed.
 */
export function validateExpr(expr, allowIdents = []) {
  const allow = new Set([...allowIdents, ...ALLOWED_CONSTS]);
  try {
    const { idents, funcs } = parse(tokenize(String(expr)));
    const unknownIdents = [...idents].filter((n) => !allow.has(n));
    const unknownFuncs = [...funcs].filter((n) => !FUNCS[n]);
    const unknown = [...unknownIdents, ...unknownFuncs.map((f) => `${f}()`)];
    return {
      ok: unknown.length === 0,
      error: unknown.length ? `disallowed identifier(s): ${unknown.join(', ')}` : null,
      idents: [...idents],
      funcs: [...funcs],
      unknown,
    };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e), idents: [], funcs: [], unknown: [] };
  }
}

/** evalExpr(expr, scope) -> number. Throws on unknown identifier/function. */
export function evalExpr(expr, scope = {}) {
  const { ast } = parse(tokenize(String(expr)));
  function ev(node) {
    switch (node.type) {
      case 'num':
        return node.value;
      case 'ident':
        if (node.name in CONSTS) return CONSTS[node.name];
        if (node.name in scope) return Number(scope[node.name]);
        throw new Error(`unknown identifier "${node.name}"`);
      case 'unary':
        return node.op === '-' ? -ev(node.arg) : +ev(node.arg);
      case 'bin': {
        const a = ev(node.left);
        const b = ev(node.right);
        switch (node.op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return a / b;
          case '%': return a % b;
          case '^': return Math.pow(a, b);
          default: throw new Error(`bad op ${node.op}`);
        }
      }
      case 'call': {
        const fn = FUNCS[node.name];
        if (!fn) throw new Error(`unknown function "${node.name}"`);
        return fn(...node.args.map(ev));
      }
      default:
        throw new Error('bad node');
    }
  }
  return ev(ast);
}
