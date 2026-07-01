"use client";

interface Props {
  filename: string;
  markdown: string;
}

export default function PackActions({ filename, markdown }: Props) {
  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "10px 0 24px" }}>
      <button className="btn" type="button" onClick={() => window.print()}>
        🖨️ Print / Save as PDF
      </button>
      <button className="btn secondary" type="button" onClick={download}>
        ⬇️ Download as text
      </button>
    </div>
  );
}
