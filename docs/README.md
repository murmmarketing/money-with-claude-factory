# Factory Pipeline — code, contracts, and wiring

This directory holds the **gated pipeline** for the Idea Factory: the non-LLM demand collector,
the mechanical verifier gate, and their shared libraries. `AGENTS.md` (repo root) is the run-loop
that orchestrates them. Everything here is plain Node ESM (`.mjs`), Node ≥18, **zero npm deps**
(uses global `fetch`, `crypto`, `fs`). Invoke from the repo root.

> **Path note:** the `pipeline` package owns `AGENTS.md` and `docs/**`, so these scripts live under
> `docs/pipeline/` and `docs/verifiers/` rather than top-level `pipeline/` / `verifiers/`. AGENTS.md
> references them at their `docs/…` paths. If the runner later relocates them to repo-root
> `pipeline/`/`verifiers/`, update the `node …` invocations in AGENTS.md STEP 2.b / 2.c-tool / 2.5
> to match — nothing else changes.

## Commands

| Command | Purpose | Exit codes |
|---|---|---|
| `node docs/pipeline/validate.mjs <id>` | Collect demand signal → `kits/<id>/evidence/validation.json` + upsert `validations` | `0` evidence gathered · `2` zero providers returned data (runner SKIPs) |
| `node docs/verifiers/run-all.mjs <id>` | Run all verifiers → `kits/<id>/verify.jsonl` + `evidence/<name>.txt` | `0` all blocking checks pass · `1` a blocking check failed · `2` bad usage |
| `node docs/verifiers/tool.mjs <id> [specPath]` | Validate + golden-test a tool spec | `0` PASS · `1` schema/allowlist/golden fail · `2` no spec |

## The verifiers (STEP 2.5 gate)

`run-all.mjs` runs each module's `run(ctx)` where `ctx = {id, idea, kitDir, repo}`. Each returns
`{name, pass, flag, evidence}`. **Blocking** = `flag:false`; the overall gate passes only if every
blocking check passes. `verify.jsonl` ends with `{"name":"OVERALL","result":"PASS|FAIL"}` — that
line is the physical delivery token AGENTS.md STEP 3 greps for.

| Module | Check | Blocking? |
|---|---|---|
| `antislop.mjs` | no lorem/TODO/placeholder/AI-tells/hype-cliché/template tokens | **yes** |
| `price.mjs` | README price(s) exist and match landing-copy; no contradictions | **yes** |
| `statsource.mjs` | every %/research/authority claim has a source URL in its paragraph | **yes** |
| `tool.mjs` | tool spec: schema-valid, allowlist-clean exprs, ≥3 golden tests match | **yes** (only when `kits/<id>/tool-spec.json` exists; skipped otherwise) |
| `contrast.mjs` | landing copy states a differentiator (unlike/instead-of/built-for) | advisory FLAG |
| `livechecks.mjs` | `FACTORY_BASE_URL/l/<id>` → 200, noindex, headline present | advisory FLAG unless base URL set & reachable, then blocking on 404/missing-noindex |

## Tool-spec contract (tools are DATA, never routes)

A `tool` idea produces a `tool_specs` row (schema: `docs/lib/tool-spec.schema.json`, or the
canonical `data/tool-spec.schema.json` if the backend ships it) rendered by the single generic
`/tool/[id]` route. **Never** write `app/tool/**` files or per-idea routes. Output `expr` strings
are sandboxed by `docs/lib/expr.mjs`: only declared input/output ids + a small `Math` surface are
allowed; `require`, `process`, `import`, `eval`, `Function`, member access, assignment, backticks,
and control-flow keywords are rejected before any evaluation. Spec shape:

```jsonc
{
  "id": "S3-42", "title": "…", "type": "calculator" | "generator",
  "inputs":  [{ "id": "hours", "label": "…", "type": "number", "default": 25 }],
  "outputs": [{ "id": "rate", "label": "…", "expr": "Math.ceil(total / hours)", "format": "currency" }],
  "tests":   [{ "inputs": { "hours": 25 }, "expect": { "rate": 79 }, "tol": 1e-6 }]   // ≥3 required
}
```

## Supabase tables the pipeline reads/writes (service-role, best-effort)

Writes degrade to no-ops when `FACTORY_SUPABASE_SERVICE_ROLE_KEY` is absent (on-disk evidence is
the source of truth). Owned/migrated by the backend package (migration `0005`); the pipeline only
reads/upserts.

| Table | Used by | Key / unique |
|---|---|---|
| `validations` | `validate.mjs` upsert | `id` |
| `tool_specs` | AGENTS 2.c-tool upsert (`live=true, promoted=false`) | `id` |
| `pipeline` | STATE machine upsert (`{id, stage, updated_at}`) | `id` |
| `landing_pages` | AGENTS 2.e upsert (`live=true, noindex=true`) | `id` |
| `tg_processed` | STEP 0.2 idempotency (`update_id`, `callback_id`) | `INSERT … ON CONFLICT DO NOTHING` |
| `approvals` | STEP 0.2 record / STEP 3.1 consume | `unique(idea_id, action)` |
| `ledger` / `events` | STEP 6 stop-condition (real paid conversions only) | — |

`docs/lib/factory-db.mjs` exposes `upsert`, `select`, `patch`, `haveService()` and never throws.

## Environment variables

| Var | Used by | Absent → |
|---|---|---|
| `FACTORY_SUPABASE_URL` | all DB writes | writes skipped |
| `FACTORY_SUPABASE_SERVICE_ROLE_KEY` | all DB writes | writes skipped (no-op) |
| `FACTORY_SUPABASE_ANON_KEY` | fallback reads | — |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | volume/kd/saturation | provider skipped |
| `REDDIT_UA` | Reddit hits (default UA is 403'd) | provider skipped |
| `META_AD_LIBRARY_TOKEN` | active advertiser count | provider skipped |
| `FACTORY_BASE_URL` | `livechecks.mjs` | live check downgrades to FLAG |

If **all four** validation providers are absent/blocked, `validate.mjs` exits `2` and the runner
SKIPs the idea — the factory never builds on zero evidence.
