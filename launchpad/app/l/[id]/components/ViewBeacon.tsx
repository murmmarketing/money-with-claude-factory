'use client';
import { useEffect } from 'react';
import { getSid } from './session';

// Fires a server-counted 'view' event once per session via sendBeacon (falls
// back to fetch+keepalive). Renders nothing.
export default function ViewBeacon({ ideaId }: { ideaId: string }) {
  useEffect(() => {
    try {
      const flag = `_view_${ideaId}`;
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
      const payload = JSON.stringify({
        idea_id: ideaId,
        session_id: getSid(),
        name: 'view',
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/event', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/event', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* no-op */
    }
  }, [ideaId]);

  return null;
}
