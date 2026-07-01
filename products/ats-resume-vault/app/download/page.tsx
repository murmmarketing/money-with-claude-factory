import Link from "next/link";
import { verifyToken } from "@/lib/tokens";
import { getIndustry, industries, Industry } from "@/data/industries";
import { KIT_FILES } from "@/lib/kit";

export const dynamic = "force-dynamic";

function FileList({ industry, token }: { industry: Industry; token: string }) {
  const q = (file: string) =>
    `/api/download?token=${encodeURIComponent(token)}&industry=${encodeURIComponent(industry.slug)}&file=${file}`;
  return (
    <div style={{ marginBottom: 28 }}>
      <h3>{industry.name}</h3>
      {KIT_FILES.map((f) => (
        <div key={f.id} className="download-row">
          <div>
            <strong>{f.label}</strong>
            <div className="meta">{industry.name} · {f.filename}</div>
          </div>
          <a className="btn btn-ghost" href={q(f.id)}>Download</a>
        </div>
      ))}
    </div>
  );
}

export default function DownloadPage({
  searchParams
}: {
  searchParams: { token?: string; product?: string };
}) {
  const token = searchParams.token || "";
  const payload = verifyToken(token);

  if (!payload) {
    return (
      <section className="hero">
        <div className="narrow">
          <span className="eyebrow">Downloads</span>
          <h1>This download link isn&apos;t valid</h1>
          <p className="lead">
            The link may have expired or been mistyped. If you purchased a kit, use the
            link from your confirmation page or email — or contact support and we&apos;ll
            re-send it.
          </p>
          <p style={{ marginTop: 20 }}>
            <Link href="/pricing" className="btn">Browse kits</Link>
          </p>
        </div>
      </section>
    );
  }

  const isVault = payload.product === "all";
  const owned: Industry[] = isVault
    ? industries
    : ([getIndustry(payload.product)].filter(Boolean) as Industry[]);

  const checklistUrl = `/api/download?token=${encodeURIComponent(token)}&file=checklist`;

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Your downloads</span>
          <h1>{isVault ? "Your all-industries vault" : `Your ${owned[0]?.name} kit`}</h1>
          <p className="lead">
            Everything below is yours. The resume template opens in Word or Google Docs;
            the libraries and checklist are plain text you can copy freely. Bookmark this
            page — your link stays valid.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="download-row" style={{ marginBottom: 28 }}>
            <div>
              <strong>Beat-the-ATS checklist</strong>
              <div className="meta">One-page checklist · works for every kit</div>
            </div>
            <a className="btn" href={checklistUrl}>Download</a>
          </div>

          {owned.map((ind) => (
            <FileList key={ind.slug} industry={ind} token={token} />
          ))}

          {owned.length === 0 && (
            <p>We couldn&apos;t match your purchase to an industry. Please contact support.</p>
          )}
        </div>
      </section>
    </>
  );
}
