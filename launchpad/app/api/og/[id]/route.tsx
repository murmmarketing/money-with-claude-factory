import { ImageResponse } from 'next/og';

// Dynamic per-idea OG/Twitter unfurl card. Edge runtime; next 14.2.5 ships
// next/og so no new dependency. Reads headline/subhead/brand straight from the
// landing_pages REST endpoint (edge-safe fetch) with the anon key.
export const runtime = 'edge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function monogram(headline: string, id: string, override?: string): string {
  if (override) return override.slice(0, 2).toUpperCase();
  const src = (headline || id || '').trim();
  const words = src.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase() || '·';
}

async function fetchPage(id: string) {
  if (!SUPABASE_URL || !ANON) return null;
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/landing_pages?id=eq.${encodeURIComponent(id)}` +
      `&live=eq.true&select=id,headline,subhead,brand&limit=1`;
    const r = await fetch(url, {
      headers: { apikey: ANON, authorization: `Bearer ${ANON}` },
      // OG cards can be cached at the edge
      next: { revalidate: 300 },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const page = await fetchPage(params.id);
  const headline: string = page?.headline || 'Lab';
  const subhead: string = page?.subhead || '';
  const brand = page?.brand || {};
  const accent: string = brand.accent || '#2f6df6';
  const bg: string = brand.bg || '#0b1220';
  const ink: string = brand.ink || '#ffffff';
  const mono = monogram(headline, params.id, brand.monogram);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: `linear-gradient(135deg, ${bg} 0%, ${accent} 160%)`,
          color: ink,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '24px',
              background: accent,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 800,
            }}
          >
            {mono}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1.05, maxWidth: '1000px' }}>
            {headline}
          </div>
          {subhead ? (
            <div style={{ fontSize: '30px', opacity: 0.82, marginTop: '20px', maxWidth: '960px' }}>
              {subhead}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
