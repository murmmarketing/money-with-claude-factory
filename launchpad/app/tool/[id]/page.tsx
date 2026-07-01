import { notFound } from 'next/navigation';
import { sb } from '../../../lib/supabase';
import type { Brand, ToolSpec } from '../../../components/types';
import { brandToCssVars } from '../../../components/theme';
import { compute, defaultInputs } from './compute';
import ToolRunner from './ToolRunner';

export const revalidate = 60;
export const dynamicParams = true;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

async function getSpec(id: string): Promise<ToolSpec | null> {
  const { data } = await sb()
    .from('tool_specs')
    .select('*')
    .eq('id', id)
    .eq('live', true)
    .maybeSingle();
  if (!data) return null;
  // The ToolSpec fields live in the `spec` jsonb column; flatten them onto the row.
  const row = data as any;
  return { ...(row.spec || {}), id: row.id, live: row.live, promoted: row.promoted } as ToolSpec;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const spec = await getSpec(params.id);
  if (!spec) return { title: 'Tool', robots: { index: false, follow: false } };
  const promoted = spec.promoted === true;
  return {
    title: spec.title,
    description: spec.description || '',
    robots: { index: promoted, follow: promoted },
  };
}

export default async function ToolPage({ params }: { params: { id: string } }) {
  const spec = await getSpec(params.id);
  if (!spec) notFound();

  const brand: Brand = spec.brand || {};
  const inputs = spec.inputs || [];
  const examples =
    spec.examples && spec.examples.length
      ? spec.examples
      : [{ label: 'Worked example', inputs: defaultInputs(spec) }];

  // Pre-compute every example server-side so real numbers ship in the HTML (pSEO).
  const computedExamples = examples.map((ex) => ({
    label: ex.label,
    inputs: ex.inputs,
    outputs: compute(spec, ex.inputs),
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: spec.title,
        description: spec.description || '',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: SITE ? `${SITE}/tool/${spec.id}` : undefined,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      {
        '@type': 'HowTo',
        name: `How to use ${spec.title}`,
        step: inputs.map((inp, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: inp.label,
          text: inp.help || `Enter ${inp.label}${inp.unit ? ` in ${inp.unit}` : ''}.`,
        })),
      },
    ],
  };

  return (
    <div style={brandToCssVars(brand)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="container container-wide">
        <h1 className="hero-title">{spec.title}</h1>
        {spec.description ? <p className="hero-sub">{spec.description}</p> : null}
        {spec.intro ? <p style={{ color: 'var(--muted)' }}>{spec.intro}</p> : null}

        {/* Inputs summary (SSR, crawlable) */}
        {inputs.length > 0 && (
          <section style={{ margin: '28px 0' }}>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Inputs</h2>
            <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: 20 }}>
              {inputs.map((inp) => (
                <li key={inp.key}>
                  <strong style={{ color: 'var(--ink)' }}>{inp.label}</strong>
                  {inp.unit ? ` (${inp.unit})` : ''}
                  {inp.help ? ` — ${inp.help}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Interactive calculator */}
        <section style={{ margin: '28px 0' }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Calculator</h2>
          <ToolRunner spec={spec} />
        </section>

        {/* Worked examples with real numbers rendered in HTML */}
        <section style={{ margin: '28px 0' }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Worked examples</h2>
          {computedExamples.map((ex, i) => (
            <div className="card" key={i} style={{ marginBottom: 16 }}>
              {ex.label ? <strong>{ex.label}</strong> : null}
              <table className="example-table">
                <thead>
                  <tr>
                    <th>Input</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inputs.map((inp) => (
                    <tr key={inp.key}>
                      <td>{inp.label}</td>
                      <td>
                        {String(ex.inputs[inp.key] ?? '')}
                        {inp.unit ? ` ${inp.unit}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="example-table">
                <thead>
                  <tr>
                    <th>Result</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {ex.outputs.map((o) => (
                    <tr key={o.key}>
                      <td>{o.label}</td>
                      <td>
                        <strong>{o.display}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {spec.unitsNote ? (
          <p className="trust-line">{spec.unitsNote}</p>
        ) : null}
      </main>
    </div>
  );
}
