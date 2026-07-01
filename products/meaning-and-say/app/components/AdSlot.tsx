"use client";

import { useEffect } from "react";

/**
 * Display-ad slot. Renders a real AdSense unit when the publisher env vars
 * are present; renders nothing at all when they are absent (no empty boxes,
 * no layout shift). The owner just adds their publisher ID to go live.
 */
export default function AdSlot() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

  useEffect(() => {
    if (!client || !slot) return;
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* no-op */
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className="ad-slot">
      <span className="ad-note">Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
