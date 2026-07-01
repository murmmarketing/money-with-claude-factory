-- 0004_tool_specs.sql
-- Tools as declarative data. A tool is NEVER a runner-generated route file;
-- it is a single frozen jsonb spec consumed by:
--   * backend  B3  (toolCompute + /api/tool/[id])
--   * frontend F4  (renderer)
--   * verifier V3  (golden tests)
--   * pipeline P3  (AGENTS emit/upsert)
-- Project: tcatgldshmpgttmputzo

begin;

create table if not exists public.tool_specs (
  id         text primary key,             -- idea id (matches landing_pages.id)
  spec       jsonb not null,
  live       boolean default false,
  promoted   boolean default false,
  updated_at timestamptz default now()
);
create index if not exists tool_specs_live_idx on public.tool_specs (live);

alter table public.tool_specs enable row level security;

-- Mirror landing_pages policy: anon may read only live specs; service-role does the rest.
drop policy if exists tool_specs_anon_select_live on public.tool_specs;
create policy tool_specs_anon_select_live
  on public.tool_specs
  for select
  to anon
  using (live = true);

grant select on public.tool_specs to anon;

-- Reuse the shared updated_at trigger from 0002.
drop trigger if exists tool_specs_set_updated_at on public.tool_specs;
create trigger tool_specs_set_updated_at
  before update on public.tool_specs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- FROZEN SPEC SHAPE (also mirrored verbatim in data/tool-spec.schema.json,
-- JSON Schema, additionalProperties:false). exprs are plain formula strings
-- over input keys + previously-declared var keys — NO code, NO callbacks.
--
-- {
--   "version": 1,
--   "kind": "calculator" | "converter",
--   "title": string,
--   "description": string,
--   "inputs": [
--     { "key": string, "label": string, "type": "number"|"select",
--       "min"?: number, "max"?: number, "step"?: number, "default"?: number,
--       "unit"?: string,
--       "options"?: [ { "label": string, "value": number } ] }
--   ],
--   "vars":    { "<name>": "<exprString>" },
--   "outputs": [ { "key": string, "label": string, "expr": string,
--                  "unit"?: string, "precision"?: int } ],
--   "tests":   [ { "inputs": { "<key>": number }, "expect": { "<outKey>": number },
--                  "tol"?: number } ],
--   "examples":[ { "label": string, "inputs": { "<key>": number } } ]
-- }
-- ---------------------------------------------------------------------------
comment on table public.tool_specs is
  'Declarative tool definition. spec jsonb is frozen: {version:1, kind:calculator|converter, title, description, inputs:[{key,label,type:number|select,min,max,step,default,unit,options?}], vars:{name:exprString}, outputs:[{key,label,expr,unit,precision}], tests:[{inputs,expect,tol}], examples:[{label,inputs}]}. exprs are formula strings over input+prior var keys; no code/callbacks. Canonical JSON Schema: data/tool-spec.schema.json.';

commit;
