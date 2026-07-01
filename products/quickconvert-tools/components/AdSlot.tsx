// Env-toggled display ad slot for the free tier.
// Renders nothing when NEXT_PUBLIC_AD_CLIENT is unset, so the free
// experience stays clean until the owner connects an ad network.
export default function AdSlot({ label = 'Advertisement' }: { label?: string }) {
  const client = process.env.NEXT_PUBLIC_AD_CLIENT;
  const slot = process.env.NEXT_PUBLIC_AD_SLOT;

  if (!client || !slot) {
    return null;
  }

  // Standard AdSense-style ins element. The publisher's global ad script
  // (added in the OWNER checklist) picks these up and fills them.
  return (
    <div className="ad-slot" aria-label={label}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <span style={{ display: 'block', marginTop: 6 }}>{label}</span>
    </div>
  );
}
