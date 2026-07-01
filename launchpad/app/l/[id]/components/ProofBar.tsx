// Server component. Shows "N reserved" ONLY when the live signup count clears
// the threshold, so we never fabricate social proof at low volume.
export default function ProofBar({
  count = 0,
  threshold = 10,
  note,
}: {
  count?: number;
  threshold?: number;
  note?: string;
}) {
  const showCount = typeof count === 'number' && count >= threshold;
  if (!showCount && !note) return null;
  return (
    <div className="proofbar">
      {showCount ? (
        <span className="proof-pill">
          <span className="proof-dot" aria-hidden />
          {count.toLocaleString()} reserved
        </span>
      ) : null}
      {note ? <span>{note}</span> : null}
    </div>
  );
}
