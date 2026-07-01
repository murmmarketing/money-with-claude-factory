"use client";

import { useEffect, useRef } from "react";
import { STAGES } from "./seed";
import {
  ACCENT, allTime, growth, hash, last, money, rgba, stageIndex, stageMeta,
} from "./charts";
import type { Venture } from "./types";

interface CoreNode {
  id: string;
  x: number;
  y: number;
  r: number;
  name: string;
  mrr: number;
  col: string;
  stage: string;
  model: string;
  growth: number | null;
}

interface Props {
  ventures: Venture[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  readoutRef: React.RefObject<HTMLDivElement>;
  accent?: string;
}

export default function CoreCanvas({
  ventures, selectedId, onSelect, readoutRef, accent = ACCENT,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const venturesRef = useRef(ventures);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const hoverRef = useRef<string | null>(null);
  const nodesRef = useRef<CoreNode[]>([]);
  const lastReadoutRef = useRef<string | null>("__init");
  const updateReadoutRef = useRef<() => void>(() => {});

  venturesRef.current = ventures;
  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;

    let cw = 0;
    let ch = 0;
    let raf = 0;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, r.width * dpr);
      cv.height = Math.max(1, r.height * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cw = r.width;
      ch = r.height;
    };

    const updateReadout = () => {
      const el = readoutRef.current;
      if (!el) return;
      const id = hoverRef.current || selectedRef.current;
      if (id === lastReadoutRef.current) return;
      lastReadoutRef.current = id;
      const v = id ? venturesRef.current.find((x) => x.id === id) : null;
      if (!v) {
        el.innerHTML =
          '<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:.12em;color:#4d5a55">▸ AWAITING SELECTION</div><div style="font-size:15px;font-weight:700;color:#8a9a94;margin-top:6px">Hover a node to read telemetry</div>';
        return;
      }
      const sm = stageMeta(v.stage);
      const mrr = (last(v.history) || { rev: 0 }).rev || 0;
      const gr = growth(v.history);
      const grc = gr == null ? "#6d7d76" : gr >= 0 ? "#c8f14a" : "#ff6b8a";
      const grt = gr == null ? "—" : (gr >= 0 ? "▲ " : "▼ ") + Math.abs(Math.round(gr)) + "% MoM";
      el.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:.1em;color:' + sm.color + '"><span style="width:8px;height:8px;border-radius:50%;background:' + sm.color + ';box-shadow:0 0 8px ' + sm.color + '"></span>' + sm.label.toUpperCase() + " · " + v.channel.toUpperCase() + "</div>" +
        '<div style="font-size:19px;font-weight:800;letter-spacing:-.01em;color:#e8f2ee;margin-top:7px">' + v.name + "</div>" +
        '<div style="display:flex;gap:18px;margin-top:9px;font-family:\'JetBrains Mono\',monospace"><div><div style="font-size:9px;color:#6d7d76;letter-spacing:.08em">' + (v.model === "sub" ? "MRR" : "REV/MO") + '</div><div style="font-size:16px;font-weight:700;color:#e8f2ee">' + money(mrr) + '</div></div><div><div style="font-size:9px;color:#6d7d76;letter-spacing:.08em">GROWTH</div><div style="font-size:16px;font-weight:700;color:' + grc + '">' + grt + '</div></div><div><div style="font-size:9px;color:#6d7d76;letter-spacing:.08em">ALL-TIME</div><div style="font-size:16px;font-weight:700;color:#e8f2ee">' + money(allTime(v.history)) + "</div></div></div>" +
        '<div style="font-family:\'JetBrains Mono\',monospace;font-size:9.5px;color:#4d5a55;margin-top:9px;letter-spacing:.06em">CLICK ▸ OPEN FULL FEED</div>';
    };
    updateReadoutRef.current = updateReadout;

    const draw = (now: number) => {
      const W = cw, H = ch;
      if (!W || !H) return;
      const ax = W / 2, ay = H / 2;
      const maxR = Math.min(W, H) * 0.42;
      const t = now || 0;
      cx.clearRect(0, 0, W, H);
      const ringR = [0.36, 0.58, 0.79, 1.0].map((f) => f * maxR);

      // rings + ticks
      for (let s = 0; s < 4; s++) {
        const R = ringR[s], col = STAGES[s].color;
        cx.beginPath();
        cx.arc(ax, ay, R, 0, Math.PI * 2);
        cx.strokeStyle = rgba(col, 0.16);
        cx.lineWidth = 1;
        cx.stroke();
        if (s === 3) {
          cx.strokeStyle = rgba(col, 0.3);
          for (let a = 0; a < 360; a += 15) {
            const rad = (a * Math.PI) / 180;
            const r1 = R, r2 = R + (a % 45 === 0 ? 8 : 4);
            cx.beginPath();
            cx.moveTo(ax + Math.cos(rad) * r1, ay + Math.sin(rad) * r1);
            cx.lineTo(ax + Math.cos(rad) * r2, ay + Math.sin(rad) * r2);
            cx.stroke();
          }
        }
      }
      // moving data motes on rings
      for (let s = 0; s < 4; s++) {
        const R = ringR[s], col = STAGES[s].color, dir = s % 2 ? -1 : 1, spd = 0.00016 - s * 0.00003;
        for (let k = 0; k < 3; k++) {
          const a = dir * t * spd + k * ((Math.PI * 2) / 3) + s;
          const x = ax + Math.cos(a) * R, y = ay + Math.sin(a) * R;
          cx.beginPath();
          cx.arc(x, y, 1.4, 0, Math.PI * 2);
          cx.fillStyle = rgba(col, 0.5);
          cx.fill();
        }
      }

      // radar sweep
      const sweep = t * 0.0006;
      cx.save();
      cx.translate(ax, ay);
      const grad = cx.createLinearGradient(0, 0, Math.cos(sweep) * maxR, Math.sin(sweep) * maxR);
      grad.addColorStop(0, rgba(accent, 0.16));
      grad.addColorStop(1, rgba(accent, 0));
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.arc(0, 0, maxR, sweep - 0.5, sweep);
      cx.closePath();
      cx.fillStyle = grad;
      cx.fill();
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.lineTo(Math.cos(sweep) * maxR, Math.sin(sweep) * maxR);
      cx.strokeStyle = rgba(accent, 0.4);
      cx.lineWidth = 1;
      cx.stroke();
      cx.restore();

      // core reactor
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.002);
      const cr = maxR * 0.12;
      const rg = cx.createRadialGradient(ax, ay, 0, ax, ay, cr * 2.4);
      rg.addColorStop(0, rgba(accent, 0.9));
      rg.addColorStop(0.4, rgba("#46e6d4", 0.35 + pulse * 0.25));
      rg.addColorStop(1, rgba(accent, 0));
      cx.beginPath();
      cx.arc(ax, ay, cr * 2.4, 0, Math.PI * 2);
      cx.fillStyle = rg;
      cx.fill();
      cx.beginPath();
      cx.arc(ax, ay, cr * (0.7 + pulse * 0.12), 0, Math.PI * 2);
      cx.fillStyle = rgba("#eafff2", 0.9);
      cx.fill();

      // nodes
      const nodes: CoreNode[] = [];
      const active = venturesRef.current.filter((v) => v.stage !== "parked");
      const perStage: Record<string, number> = {};
      active.forEach((v) => { perStage[v.stage] = (perStage[v.stage] || 0) + 1; });
      const idxIn: Record<string, number> = {};
      active.forEach((v) => {
        const si = stageIndex(v.stage);
        const R = ringR[si], col = STAGES[si].color, dir = si % 2 ? -1 : 1, spd = 0.00018 - si * 0.000032;
        const cnt = perStage[v.stage] || 1;
        idxIn[v.stage] = idxIn[v.stage] || 0;
        const spread = cnt > 1 ? (idxIn[v.stage] / cnt) * Math.PI * 2 : 0;
        idxIn[v.stage]++;
        const a = hash(v.id) + spread + dir * t * spd;
        const x = ax + Math.cos(a) * R, y = ay + Math.sin(a) * R;
        const mrr = (last(v.history) || { rev: 0 }).rev || 0;
        const nr = Math.max(4.5, Math.min(21, 5 + Math.sqrt(mrr) / 6));
        const sel = selectedRef.current === v.id, hov = hoverRef.current === v.id;
        // feed line
        cx.beginPath();
        cx.moveTo(ax, ay);
        cx.lineTo(x, y);
        cx.strokeStyle = rgba(col, sel || hov ? 0.5 : 0.12);
        cx.lineWidth = 1;
        cx.stroke();
        // glow
        const gg = cx.createRadialGradient(x, y, 0, x, y, nr * 3);
        gg.addColorStop(0, rgba(col, 0.55));
        gg.addColorStop(1, rgba(col, 0));
        cx.beginPath();
        cx.arc(x, y, nr * 3, 0, Math.PI * 2);
        cx.fillStyle = gg;
        cx.fill();
        // node
        cx.beginPath();
        cx.arc(x, y, nr * (hov ? 1.25 : 1), 0, Math.PI * 2);
        cx.fillStyle = col;
        cx.fill();
        cx.strokeStyle = rgba("#05070a", 0.6);
        cx.lineWidth = 1.5;
        cx.stroke();
        if (sel || hov) {
          cx.beginPath();
          cx.arc(x, y, nr + 6 + (sel ? 2 * Math.sin(t * 0.006) : 0), 0, Math.PI * 2);
          cx.strokeStyle = rgba(col, 0.9);
          cx.lineWidth = 1.4;
          cx.stroke();
        }
        if (sel) {
          const br = nr + 12;
          cx.strokeStyle = rgba(col, 0.9);
          cx.lineWidth = 1.6;
          [0, 90, 180, 270].forEach((deg) => {
            const ra = ((deg + t * 0.03) * Math.PI) / 180;
            cx.beginPath();
            cx.arc(x, y, br, ra, ra + 0.5);
            cx.stroke();
          });
        }
        nodes.push({ id: v.id, x, y, r: nr, name: v.name, mrr, col, stage: v.stage, model: v.model, growth: growth(v.history) });
      });
      nodesRef.current = nodes;

      // hover label in canvas
      const hv = nodes.find((n) => n.id === hoverRef.current);
      if (hv) {
        cx.font = "600 12px 'JetBrains Mono', monospace";
        const lx = hv.x + hv.r + 10, ly = hv.y - hv.r - 8;
        cx.strokeStyle = rgba(hv.col, 0.6);
        cx.lineWidth = 1;
        cx.beginPath();
        cx.moveTo(hv.x, hv.y);
        cx.lineTo(lx, ly);
        cx.stroke();
        const label = hv.name.toUpperCase();
        const w = cx.measureText(label).width;
        cx.fillStyle = rgba("#05070a", 0.82);
        cx.fillRect(lx, ly - 14, w + 12, 19);
        cx.fillStyle = hv.col;
        cx.fillText(label, lx + 6, ly);
      }
    };

    const coreXY = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const hitNode = (x: number, y: number) => {
      let best: CoreNode | null = null, bd = 1e9;
      (nodesRef.current || []).forEach((n) => {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < n.r + 9 && d < bd) { bd = d; best = n; }
      });
      return best;
    };
    const onMove = (e: MouseEvent) => {
      const { x, y } = coreXY(e);
      const n = hitNode(x, y);
      const id = n ? (n as CoreNode).id : null;
      if (id !== hoverRef.current) {
        hoverRef.current = id;
        cv.style.cursor = id ? "pointer" : "default";
        updateReadout();
      }
    };
    const onLeave = () => {
      if (hoverRef.current) { hoverRef.current = null; updateReadout(); }
      cv.style.cursor = "default";
    };
    const onClick = (e: MouseEvent) => {
      const { x, y } = coreXY(e);
      const n = hitNode(x, y);
      if (n) onSelectRef.current((n as CoreNode).id);
    };

    resize();
    window.addEventListener("resize", resize);
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("mouseleave", onLeave);
    cv.addEventListener("click", onClick);

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cv.removeEventListener("mousemove", onMove);
      cv.removeEventListener("mouseleave", onLeave);
      cv.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh readout when selection or data changes externally.
  useEffect(() => {
    lastReadoutRef.current = "__x";
    updateReadoutRef.current();
  }, [selectedId, ventures]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
