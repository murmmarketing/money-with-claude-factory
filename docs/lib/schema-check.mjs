// docs/lib/schema-check.mjs
// Minimal, dependency-free JSON-Schema (draft-07 subset) validator.
// Supports: type, required, properties, additionalProperties, enum, items,
// minItems, minLength, maxLength, minimum, maximum, pattern. Enough to fully
// enforce docs/lib/tool-spec.schema.json. Returns {ok, errors:[...]}.

export function validate(schema, data, path = '$') {
  const errors = [];
  check(schema, data, path, errors);
  return { ok: errors.length === 0, errors };
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v; // number, string, boolean, object
}

function check(schema, data, path, errors) {
  if (schema == null || typeof schema !== 'object') return;

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const t = typeOf(data);
    const ok = types.some((want) =>
      want === t ||
      (want === 'number' && t === 'integer') ||
      (want === 'object' && t === 'object')
    );
    if (!ok) {
      errors.push(`${path}: expected ${types.join('|')}, got ${t}`);
      return;
    }
  }

  if (schema.enum && !schema.enum.some((e) => e === data)) {
    errors.push(`${path}: value not in enum [${schema.enum.join(', ')}]`);
  }

  if (typeof data === 'string') {
    if (schema.minLength != null && data.length < schema.minLength)
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    if (schema.maxLength != null && data.length > schema.maxLength)
      errors.push(`${path}: longer than maxLength ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(data))
      errors.push(`${path}: does not match pattern ${schema.pattern}`);
  }

  if (typeof data === 'number') {
    if (schema.minimum != null && data < schema.minimum)
      errors.push(`${path}: below minimum ${schema.minimum}`);
    if (schema.maximum != null && data > schema.maximum)
      errors.push(`${path}: above maximum ${schema.maximum}`);
  }

  if (Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems)
      errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    if (schema.items) data.forEach((el, i) => check(schema.items, el, `${path}[${i}]`, errors));
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in data)) errors.push(`${path}: missing required '${key}'`);
      }
    }
    const props = schema.properties || {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!(key in props)) errors.push(`${path}: unexpected property '${key}'`);
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in data) check(sub, data[key], `${path}.${key}`, errors);
    }
  }
}
