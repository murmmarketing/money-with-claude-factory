"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CoreCanvas from "./CoreCanvas";
import {
  CATS, CHANNELS, STAGES, monthKey, monthShort, monthsBack, seedInitial,
} from "./seed";
import {
  ACCENT, allTime, compact, css, fmtVal, growth, last, money, prev, rgba,
  stageMeta, path,
} from "./charts";
import type {
  FormState, ModalMode, ModalState, Persist, Stage, Venture,
} from "./types";

export const dynamic = "force-static";

const PERSIST_KEY = "mmc.factory.v5";
const ACC = ACCENT;

/* ---------- small presentational helpers ---------- */

function EqBars({ c }: { c: string }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px", alignItems: "flex-end" }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: "2px", height: "11px", transformOrigin: "bottom",
            background: c, opacity: 0.7, display: "inline-block",
            animation: `eq ${0.9 + i * 0.18}s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function CountUp({
  value, kind, animKey, style,
}: { value: number; kind: string; animKey: number; style: React.CSSProperties }) {
  const [txt, setTxt] = useState(() => fmtVal(value, kind));
  useEffect(() => { setTxt(fmtVal(value, kind)); }, [value, kind]);
  useEffect(() => {
    let raf = 0;
    const dur = 1100, start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setTxt(fmtVal(value * e, kind));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);
  return <span style={style}>{txt}</span>;
}

/* ---------- page ---------- */

export default function Deck() {
  const [mounted, setMounted] = useState(false);
  const [ventures, setVentures] = useState<Venture[]>(() => seedInitial());
  const [isDemo, setIsDemo] = useState(false);
  const [stage, setStage] = useState<string>("all");
  const [sort, setSort] = useState<string>("mrr");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [formError, setFormError] = useState("");
  const [intro, setIntro] = useState(true);
  const [booting, setBooting] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverPipe, setHoverPipe] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const btnTopRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const t0Ref = useRef<number>(0);
  const parRaf = useRef<number | null>(null);
  const scrollRaf = useRef<number | null>(null);

  /* ---- mount: hydrate from localStorage, reduced-motion, boot ---- */
  useEffect(() => {
    setMounted(true);
    let p: Persist | null = null;
    try { p = JSON.parse(localStorage.getItem(PERSIST_KEY) || "null"); } catch { /* noop */ }
    if (p && Array.isArray(p.ventures)) {
      setVentures(p.ventures);
      setIsDemo(!!p.isDemo);
    }
    let reduce = false;
    try { reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch { /* noop */ }
    if (!reduce) {
      setBooting(true);
      const bt = setTimeout(() => setBooting(false), 1500);
      const it = setTimeout(() => setIntro(false), 1300);
      t0Ref.current = Date.now();
      return () => { clearTimeout(bt); clearTimeout(it); };
    }
    t0Ref.current = Date.now();
    setIntro(false);
  }, []);

  /* ---- persist ---- */
  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(PERSIST_KEY, JSON.stringify({ ventures, isDemo })); } catch { /* noop */ }
  }, [ventures, isDemo, mounted]);

  /* ---- clock ---- */
  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      const el = clockRef.current;
      if (!el) return;
      const s = Math.floor((Date.now() - (t0Ref.current || Date.now())) / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, "0");
      const mm = String(Math.floor(s / 60) % 60).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      const utc = new Date().toISOString().slice(11, 19);
      el.textContent = "T+ " + hh + ":" + mm + ":" + ss + "  ·  UTC " + utc;
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [mounted]);

  /* ---- scroll progress + scroll-to-top ---- */
  useEffect(() => {
    if (!mounted) return;
    const onScroll = () => {
      if (scrollRaf.current) return;
      scrollRaf.current = requestAnimationFrame(() => {
        scrollRaf.current = null;
        const h = document.documentElement;
        const y = h.scrollTop || window.scrollY;
        const el = progRef.current;
        if (el) {
          const max = h.scrollHeight - h.clientHeight || 1;
          el.style.width = Math.min(100, Math.max(0, (y / max) * 100)) + "%";
        }
        const b = btnTopRef.current;
        if (b) {
          const on = y > 640;
          b.style.opacity = on ? "1" : "0";
          b.style.pointerEvents = on ? "auto" : "none";
          b.style.transform = on ? "translateY(0)" : "translateY(8px)";
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  /* ---- keyboard ---- */
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = ((e.target as HTMLElement)?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";
      if (e.key === "Escape") {
        if (modal) closeModal();
      } else if ((e.key === "n" || e.key === "N") && !typing && !modal) {
        openLaunch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, modal]);

  /* ---- parallax ---- */
  const onRootMove = useCallback((e: React.MouseEvent) => {
    const mx = e.clientX / window.innerWidth - 0.5;
    const my = e.clientY / window.innerHeight - 0.5;
    if (parRaf.current) return;
    parRaf.current = requestAnimationFrame(() => {
      parRaf.current = null;
      const g = gridRef.current, gl = glowRef.current;
      if (g) g.style.transform = "translate(" + mx * -14 + "px," + my * -14 + "px)";
      if (gl) gl.style.transform = "translate(" + mx * 22 + "px," + my * 22 + "px)";
    });
  }, []);

  /* ---- helpers ---- */
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const skipBoot = () => setBooting(false);
  const mutate = (id: string, fn: (v: Venture) => Venture) =>
    setVentures((vs) => vs.map((v) => (v.id === id ? fn({ ...v }) : v)));

  const scrollToVenture = (id: string) => {
    const root = rootRef.current;
    const el = root && root.querySelector('[data-n="' + id + '"]');
    if (el) {
      const top = (el as HTMLElement).getBoundingClientRect().top + (window.scrollY || 0) - 90;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  };

  const onSelectNode = (id: string) => {
    setSelectedId(id);
    setExpanded((ex) => ({ ...ex, [id]: true }));
    setTimeout(() => scrollToVenture(id), 60);
  };

  /* ---- row / stage / task interactions ---- */
  const toggleRow = (id: string) => {
    setExpanded((ex) => {
      const open = !ex[id];
      setSelectedId((sel) => (open ? id : sel === id ? null : sel));
      return { ...ex, [id]: open };
    });
  };
  const selectStage = (k: string) => setStage((s) => (s === k ? "all" : k));

  const toggleTask = (id: string, i: number) =>
    mutate(id, (v) => {
      v.tasks = v.tasks.map((t, j) => (j === i ? { ...t, done: !t.done } : t));
      return v;
    });

  const advanceStage = (id: string) => {
    const order: Stage[] = ["idea", "build", "launch", "scale"];
    mutate(id, (v) => {
      const i = order.indexOf(v.stage);
      if (i >= 0 && i < order.length - 1) {
        v.stage = order[i + 1];
        v.events = [{ ts: monthKey(0), text: "Advanced to " + stageMeta(v.stage).label + "." }].concat(v.events || []);
      }
      return v;
    });
    setIsDemo(false);
  };

  const togglePark = (id: string) =>
    mutate(id, (v) => {
      if (v.stage === "parked") { v.stage = v.prevStage || "launch"; }
      else { v.prevStage = v.stage; v.stage = "parked"; }
      return v;
    });

  const deleteVenture = (id: string) => {
    setVentures((vs) => vs.filter((v) => v.id !== id));
    setExpanded((ex) => ({ ...ex, [id]: false }));
    setSelectedId((sel) => (sel === id ? null : sel));
  };

  const resetDemo = () => {
    setVentures(seedInitial());
    setIsDemo(false);
    setExpanded({});
    setSelectedId(null);
    setStage("all");
    setAnimKey((k) => k + 1);
  };

  /* ---- modals ---- */
  const openLaunch = () => {
    setModal({ mode: "launch" });
    setFormError("");
    setForm({ name: "", cat: "product", channel: "Marketplace search", model: "oneoff", stage: "build", goal: "", startRev: "", ideaN: null });
  };
  const openLog = (id: string) => {
    const v = ventures.find((x) => x.id === id);
    const l = last(v?.history);
    setModal({ mode: "log", id });
    setFormError("");
    setForm({ month: monthKey(0), rev: l ? String(l.rev) : "", vis: "", units: "" });
  };
  const openEdit = (id: string) => {
    const v = ventures.find((x) => x.id === id);
    if (!v) return;
    setModal({ mode: "edit", id });
    setFormError("");
    setForm({ name: v.name, cat: v.cat, channel: v.channel, model: v.model, stage: v.stage, goal: String(v.goal || ""), tasksText: (v.tasks || []).map((t) => t.t).join("\n") });
  };
  const closeModal = () => { setModal(null); setFormError(""); };
  const onFormInput = (k: string, val: string) => setForm((f) => ({ ...f, [k]: val }));

  const submitModal = () => {
    const m = modal, f = form;
    if (!m) return;
    const num = (x: unknown) => {
      const n = parseFloat(String(x).replace(/[^0-9.]/g, ""));
      return isNaN(n) ? 0 : n;
    };
    if (m.mode === "launch") {
      if (!f.name || !f.name.trim()) { setFormError("Give your venture a name."); return; }
      const startRev = num(f.startRev);
      let history: Venture["history"] = [];
      if (startRev > 0) {
        const ramp = [0.18, 0.4, 0.68, 1].map((r) => Math.round(startRev * r));
        const mk = [3, 2, 1, 0];
        history = ramp.map((rev, i) => ({ m: monthKey(-mk[i]), rev, vis: Math.round(rev * 4.2), units: Math.max(1, Math.round(rev / 28)) }));
      }
      const v: Venture = {
        id: "v" + Date.now().toString(36), name: f.name.trim(), ideaN: f.ideaN || null,
        cat: f.cat || "product", channel: f.channel || "Direct / other", model: f.model || "oneoff",
        stage: f.stage || "build", goal: num(f.goal), created: Date.now(), demo: false,
        traffic: [{ src: (f.channel || "Primary").split(" ")[0] || "Primary", pct: 68 }, { src: "Google", pct: 20 }, { src: "Direct", pct: 12 }],
        tasks: [], history, events: [{ ts: monthKey(0), text: "Venture launched into the factory." }],
      };
      setVentures((vs) => [v, ...vs]);
      setIsDemo(false);
      setModal(null);
      setSelectedId(v.id);
      setExpanded((ex) => ({ ...ex, [v.id]: true }));
    } else if (m.mode === "log" && m.id) {
      const rev = num(f.rev), vis = num(f.vis), units = num(f.units), key = f.month || monthKey(0);
      mutate(m.id, (v) => {
        const h = (v.history || []).filter((x) => x.m !== key);
        h.push({ m: key, rev, vis, units });
        h.sort((a, b) => (a.m < b.m ? -1 : 1));
        v.history = h;
        v.events = [{ ts: key, text: "Logged " + money(rev) + " · " + compact(vis) + " visitors." }].concat(v.events || []).slice(0, 8);
        return v;
      });
      setIsDemo(false);
      setModal(null);
    } else if (m.mode === "edit" && m.id) {
      if (!f.name || !f.name.trim()) { setFormError("Name can’t be empty."); return; }
      mutate(m.id, (v) => {
        v.name = (f.name || "").trim();
        v.cat = f.cat || v.cat;
        v.channel = f.channel || v.channel;
        v.model = f.model || v.model;
        v.stage = f.stage || v.stage;
        v.goal = num(f.goal);
        const lines = (f.tasksText || "").split("\n").map((x) => x.trim()).filter(Boolean);
        const prevTasks = v.tasks || [];
        v.tasks = lines.map((t) => {
          const ex = prevTasks.find((p) => p.t === t);
          return { t, done: ex ? ex.done : false };
        });
        return v;
      });
      setIsDemo(false);
      setModal(null);
    }
  };

  /* ---- derived (renderVals) ---- */
  const D = useMemo(() => {
    const V = ventures;
    const live = V.filter((v) => v.stage !== "parked");
    const monthlyRev = live.reduce((a, v) => a + ((last(v.history) || { rev: 0 }).rev || 0), 0);
    const prevRev = live.reduce((a, v) => a + ((prev(v.history) || { rev: 0 }).rev || 0), 0);
    const allTimeTotal = V.reduce((a, v) => a + allTime(v.history), 0);
    const monthlyVis = live.reduce((a, v) => a + ((last(v.history) || { vis: 0 }).vis || 0), 0);
    const monthlyUnits = live.reduce((a, v) => a + ((last(v.history) || { units: 0 }).units || 0), 0);
    const avgConv = monthlyVis ? (monthlyUnits / monthlyVis) * 100 : 0;
    const liveCount = V.filter((v) => v.stage === "launch" || v.stage === "scale").length;
    const pfGrowth = prevRev ? ((monthlyRev - prevRev) / prevRev) * 100 : null;
    const best = live.slice().sort((a, b) => ((last(b.history) || { rev: 0 }).rev || 0) - ((last(a.history) || { rev: 0 }).rev || 0))[0];
    const bestMRR = best ? (last(best.history) || { rev: 0 }).rev || 0 : 0;

    const dstyle = (val: number | null) =>
      val == null ? "display:none" : "font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:" + (val >= 0 ? "#c8f14a" : "#ff6b8a");
    const vs = "font-weight:800;font-size:24px;line-height:1;letter-spacing:-.02em";

    const kpis = [
      { label: "REVENUE / MO", raw: monthlyRev, kind: "money", valStyle: vs, delta: pfGrowth == null ? "" : (pfGrowth >= 0 ? "▲" : "▼") + Math.abs(Math.round(pfGrowth)) + "%", deltaStyle: dstyle(pfGrowth), sub: live.length + " active", eqc: "#c8f14a" },
      { label: "ALL-TIME", raw: allTimeTotal, kind: "money", valStyle: vs, delta: "", deltaStyle: "display:none", sub: "since first launch", eqc: "#46e6d4" },
      { label: "VISITORS / MO", raw: monthlyVis, kind: "compact", valStyle: vs, delta: "", deltaStyle: "display:none", sub: "faceless traffic", eqc: "#46e6d4" },
      { label: "CONVERSION", raw: avgConv, kind: "pct", valStyle: vs, delta: "", deltaStyle: "display:none", sub: monthlyUnits + " sales/mo", eqc: "#7aa2ff" },
      { label: "LIVE UNITS", raw: liveCount, kind: "int", valStyle: vs, delta: "", deltaStyle: "display:none", sub: V.length + " in factory", eqc: "#ffcf4a" },
      { label: "TOP EARNER", raw: bestMRR, kind: "money", valStyle: "font-weight:800;font-size:20px;line-height:1.05;letter-spacing:-.015em", delta: "", deltaStyle: "display:none", sub: best ? best.name : "—", eqc: "#c8f14a" },
    ];

    const pipeline = STAGES.map((st) => {
      const inStage = V.filter((v) => v.stage === st.k);
      const val = inStage.reduce((a, v) => a + ((last(v.history) || { rev: 0 }).rev || 0), 0);
      const activeSel = stage === st.k;
      return {
        k: st.k, label: st.label, labelU: st.label.toUpperCase(), sub: inStage.length === 1 ? "unit" : "units",
        color: st.color, count: inStage.length,
        value: st.k === "idea" ? "pre-revenue" : money(val) + "/mo",
        cardStyle: "position:relative;z-index:1;cursor:pointer;background:" + (activeSel ? "rgba(70,230,212,.06)" : "linear-gradient(180deg,rgba(16,24,22,.6),rgba(8,13,12,.5))") + ";border:1px solid " + (activeSel ? st.color : "rgba(120,140,135,.16)") + ";border-radius:5px;padding:14px 15px;transition:all .15s",
      };
    });

    const window10 = monthsBack(10);
    const pfVals = window10.map((mo) => live.reduce((a, v) => { const h = (v.history || []).find((x) => x.m === mo.key); return a + (h ? h.rev : 0); }, 0));
    const anyRev = pfVals.some((x) => x > 0);
    const pp = path(pfVals, 940, 200, 12);
    const pfCur = pfVals[pfVals.length - 1] || 0, pfPrev = pfVals[pfVals.length - 2] || 0;
    const pfDelta = pfPrev ? ((pfCur - pfPrev) / pfPrev) * 100 : null;
    const bestMonth = Math.max(0, ...pfVals);
    const pf = {
      hasData: anyRev, noData: !anyRev, area: pp.area, line: pp.line, lastX: pp.lastX, lastY: pp.lastY,
      months: window10.map((m) => m.short), curDisplay: money(pfCur), allTime: money(allTimeTotal), best: money(bestMonth),
      delta: pfDelta == null ? "—" : (pfDelta >= 0 ? "▲ " : "▼ ") + Math.abs(Math.round(pfDelta)) + "%",
      deltaStyle: "font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:" + (pfDelta == null ? "#6d7d76" : pfDelta >= 0 ? "#c8f14a" : "#ff6b8a"),
    };

    const tabA = "cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:12px;letter-spacing:.03em;color:#05070a;background:#c8f14a;padding:6px 13px;border-radius:5px;border:1px solid #c8f14a;white-space:nowrap;transition:all .15s";
    const tabI = "cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:500;font-size:12px;letter-spacing:.03em;color:#8a9a94;background:transparent;padding:6px 13px;border-radius:5px;border:1px solid rgba(120,140,135,.22);white-space:nowrap;transition:all .15s";
    const parkedCount = V.filter((v) => v.stage === "parked").length;
    const stageTabs = ([{ k: "all", label: "ALL", count: V.length }] as { k: string; label: string; count: number }[])
      .concat(STAGES.map((s) => ({ k: s.k, label: s.label.toUpperCase(), count: V.filter((v) => v.stage === s.k).length })))
      .concat(parkedCount ? [{ k: "parked", label: "PARKED", count: parkedCount }] : [])
      .map((t) => ({ k: t.k, label: t.label, count: t.count, style: stage === t.k ? tabA : tabI }));

    // filter + sort
    let listOut = V.slice();
    if (stage !== "all") listOut = listOut.filter((v) => v.stage === stage);
    const g = (h?: Venture["history"]) => { const x = growth(h); return x == null ? -1e9 : x; };
    if (sort === "mrr") listOut.sort((a, b) => ((last(b.history) || { rev: 0 }).rev || 0) - ((last(a.history) || { rev: 0 }).rev || 0));
    else if (sort === "growth") listOut.sort((a, b) => g(b.history) - g(a.history));
    else if (sort === "allTime") listOut.sort((a, b) => allTime(b.history) - allTime(a.history));
    else if (sort === "visitors") listOut.sort((a, b) => ((last(b.history) || { vis: 0 }).vis || 0) - ((last(a.history) || { vis: 0 }).vis || 0));
    else if (sort === "newest") listOut.sort((a, b) => (b.created || 0) - (a.created || 0));

    const rows = listOut.map((v, idx) => {
      const sm = stageMeta(v.stage), open = !!expanded[v.id], selected = selectedId === v.id;
      const l = last(v.history), p = prev(v.history);
      const mrr = l ? l.rev : 0, gr = growth(v.history);
      const revSeries = (v.history || []).map((x) => x.rev);
      const sp = path(revSeries.length ? revSeries : [0, 0], 100, 34, 3);
      const grStyle = "font-family:'JetBrains Mono',monospace;font-weight:700;font-size:13px;color:" + (gr == null ? "#6d7d76" : gr >= 0 ? "#c8f14a" : "#ff6b8a");

      const at = allTime(v.history), vis = l ? l.vis : 0, units = l ? l.units : 0, conv = vis ? (units / vis) * 100 : 0;
      const goalPct = v.goal ? Math.min(100, Math.round((mrr / v.goal) * 100)) : 0;
      const C = 2 * Math.PI * 18;
      const cs = path(revSeries.length ? revSeries : [0], 640, 190, 12);
      const tmax = Math.max(1, ...(v.traffic || []).map((t) => t.pct));
      const eng = Math.round(vis * 0.34);
      const fmax = Math.max(1, vis);
      const fbar = (val: number, color: string) => "height:20px;border-radius:4px;background:" + color + ";width:" + Math.max(3, Math.round((val / fmax) * 100)) + "%";
      const tasks = v.tasks || [];

      return {
        id: v.id, name: v.name,
        catName: ((CATS.find((c) => c.k === v.cat) || { label: v.cat }).label || v.cat).toUpperCase(),
        channel: v.channel, modelLabel: v.model === "sub" ? "MRR" : "ONE-OFF",
        stageColor: sm.color, stageBorder: rgba(sm.color, 0.45), stageLabelU: sm.label.toUpperCase(),
        stageDotStyle: "width:6px;height:6px;border-radius:50%;background:" + sm.color + (v.stage === "scale" || v.stage === "launch" ? ";animation:pulseDot 2.2s ease-in-out infinite" : ""),
        ideaLabel: v.ideaN ? "IDEA-" + String(v.ideaN).padStart(3, "0") : "CUSTOM",
        mrrDisplay: money(mrr), mrrLabel: v.model === "sub" ? "MRR" : "LAST MO",
        growthText: gr == null ? "—" : Math.abs(Math.round(gr)) + "%", growthArrow: gr == null ? "" : gr >= 0 ? "▲" : "▼", growthStyle: grStyle,
        sparkLine: sp.line, sparkArea: sp.area,
        rowBg: open ? "rgba(70,230,212,.05)" : selected ? "rgba(70,230,212,.03)" : "transparent",
        toggleIcon: open ? "[-]" : "[+]",
        selBar: selected || open ? sm.color : "transparent", selGlow: selected || open ? "0 0 10px " + sm.color : "none",
        entranceStyle: intro ? "animation:fadeUp .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:" + Math.min(idx * 0.05, 0.4).toFixed(2) + "s" : "",
        isOpen: open,
        tiles: [
          { label: v.model === "sub" ? "MRR" : "THIS MONTH", val: money(mrr), color: "#e8f2ee", sub: p ? "was " + money(p.rev) : "first month" },
          { label: "ALL-TIME", val: money(at), color: "#e8f2ee", sub: (v.history || []).length + " months" },
          { label: "VISITORS", val: compact(vis), color: "#e8f2ee", sub: "this month" },
          { label: "CONVERSION", val: conv.toFixed(1) + "%", color: "#e8f2ee", sub: units + " sales" },
          { label: "TRAFFIC→$", val: vis ? "$" + (mrr / vis).toFixed(2) : "—", color: "#e8f2ee", sub: "per visitor" },
        ],
        goalDash: ((C * goalPct) / 100).toFixed(1) + " " + C.toFixed(1),
        goalPct: (v.goal ? goalPct : 0) + "%", goalSub: v.goal ? "of " + money(v.goal) : "no goal",
        hasChart: revSeries.length > 0 && at > 0, noChart: !(revSeries.length > 0 && at > 0),
        chartArea: cs.area, chartLine: cs.line, chartLastX: cs.lastX, chartLastY: cs.lastY,
        chartMonths: (v.history || []).map((x) => monthShort(x.m)),
        traffic: (v.traffic || []).map((t) => ({ src: t.src, pct: t.pct, barStyle: "height:100%;width:" + Math.round((t.pct / tmax) * 100) + "%;background:linear-gradient(90deg,#46e6d4,#c8f14a);border-radius:3px" })),
        funnel: [
          { label: "VISITORS", val: compact(vis), barStyle: fbar(vis, "rgba(122,162,255,.5)") },
          { label: "ENGAGED", val: compact(eng), barStyle: fbar(eng, "rgba(70,230,212,.55)") },
          { label: "BUYERS", val: compact(units), barStyle: fbar(units, "#c8f14a") },
        ],
        convRate: conv.toFixed(2) + "%",
        hasTasks: tasks.length > 0, noTasks: tasks.length === 0,
        tasks: tasks.map((t, i) => ({
          i, text: t.t, check: t.done ? "✓" : "",
          boxStyle: "width:16px;height:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;margin-top:1px;" + (t.done ? "background:#c8f14a;color:#05070a" : "border:1.5px solid rgba(120,140,135,.3);color:transparent"),
          textStyle: "font-size:13px;line-height:1.4;color:" + (t.done ? "#4d5a55" : "#c3d0cb") + (t.done ? ";text-decoration:line-through" : ""),
        })),
        events: (v.events || []).slice(0, 5).map((e) => ({ text: e.text, when: e.ts ? monthShort(e.ts) : "", color: sm.color })),
        canAdvance: ["idea", "build", "launch"].includes(v.stage),
        advanceLabel: ({ idea: "START BUILDING", build: "MARK LAUNCHED", launch: "MARK SCALING" } as Record<string, string>)[v.stage] || "ADVANCE",
        isParked: v.stage === "parked", parkLabel: v.stage === "parked" ? "↑ REOPEN" : "⇊ PARK",
        hasIdea: !!v.ideaN, // ideas catalogue not present in this app
      };
    });

    const evAll: string[] = [];
    V.forEach((v) => (v.events || []).slice(0, 2).forEach((e) => evAll.push("▸ " + v.name.toUpperCase() + " — " + e.text)));
    const tickerText = "  " + (evAll.length ? evAll.join("     ◇     ") : "NO ACTIVITY YET — LAUNCH A VENTURE") + "     ◇     ";

    const monthOpts = monthsBack(6).slice().reverse()
      .concat([{ key: monthKey(1), short: monthShort(monthKey(1)), full: monthShort(monthKey(1)) + " (next)" }])
      .map((m) => ({ key: m.key, label: m.full }));

    return {
      kpis, pipeline, pf, stageTabs, rows, tickerText, count: listOut.length,
      showEmpty: listOut.length === 0,
      emptyTitle: stage === "all" ? "No ventures in the factory." : "Nothing in this stage.",
      emptyHint: stage === "all" ? "Launch your first faceless business to start tracking telemetry." : "Move a venture here, or view all.",
      showReset: ventures.length > 0, monthOpts,
    };
  }, [ventures, stage, sort, expanded, selectedId, intro, isDemo]);

  const md: ModalMode | null = modal ? modal.mode : null;
  const logV = modal && modal.id ? ventures.find((v) => v.id === modal.id) : null;
  const inputStyle = "width:100%;background:rgba(6,11,10,.9);border:1px solid rgba(120,140,135,.22);border-radius:4px;padding:10px 12px;color:#e8f2ee;font-size:14px";
  const selectStyle = inputStyle + ";cursor:pointer";

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "#05070a" }} />;
  }

  const labelMono = "'JetBrains Mono',monospace";

  return (
    <div
      ref={rootRef}
      onMouseMove={onRootMove}
      style={{
        position: "relative", minHeight: "100vh", background: "#05070a", color: "#e8f2ee",
        fontFamily: "'Schibsted Grotesk',system-ui,sans-serif", overflow: "hidden",
        ["--ac" as string]: ACC,
      }}
    >
      <style>{STYLES}</style>

      <div ref={progRef} style={{ position: "fixed", top: 0, left: 0, height: "2px", width: "0%", background: "linear-gradient(90deg,#46e6d4,var(--ac,#c8f14a))", zIndex: 60, boxShadow: "0 0 10px var(--ac,#c8f14a)" }} />

      {/* living background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div ref={gridRef} style={css("position:absolute;inset:-4%;background-image:linear-gradient(rgba(90,120,112,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(90,120,112,.10) 1px,transparent 1px);background-size:52px 52px;animation:gridDrift 7s linear infinite;mask-image:radial-gradient(ellipse 90% 80% at 50% 30%,#000 40%,transparent 100%);-webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 30%,#000 40%,transparent 100%)")} />
        <div ref={glowRef} style={{ position: "absolute", inset: 0 }}>
          <div style={css("position:absolute;width:54vw;height:54vw;left:-12vw;top:-16vw;background:radial-gradient(circle,rgba(70,230,212,.10),transparent 66%);filter:blur(30px)")} />
          <div style={css("position:absolute;width:50vw;height:50vw;right:-14vw;bottom:-18vw;background:radial-gradient(circle,rgba(200,241,74,.09),transparent 68%);filter:blur(40px)")} />
        </div>
        <div style={css("position:absolute;inset:0;opacity:.5;background-image:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,.18) 3px)")} />
        <div style={css("position:absolute;inset:0;background:radial-gradient(ellipse 120% 80% at 50% 0%,transparent 55%,rgba(0,0,0,.55) 100%)")} />
        <div style={css("position:absolute;left:0;right:0;top:0;height:34px;opacity:.5;background:linear-gradient(180deg,rgba(70,230,212,.14),transparent);animation:scan 9s linear infinite")} />
      </div>

      {/* top status bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 55, height: "30px", display: "flex", alignItems: "center", gap: "16px", padding: "0 16px", background: "rgba(5,8,10,.86)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(120,140,135,.14)", fontFamily: labelMono, fontSize: "10.5px", letterSpacing: ".06em", color: "#7c8b86" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "7px", color: "#c8f14a" }}><span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#c8f14a", boxShadow: "0 0 8px #c8f14a", animation: "pulseDot 2s ease-in-out infinite" }} />SYSTEM ONLINE</span>
        <span style={{ color: "#3f4a45" }}>│</span>
        <span>FACTORY CORE <span style={{ color: "#46e6d4" }}>v2.0</span></span>
        <span style={{ color: "#3f4a45" }}>│</span>
        <span ref={clockRef}>T+ 00:00:00</span>
        <div style={css("flex:1;overflow:hidden;margin-left:6px;mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)")}>
          <div style={{ display: "inline-flex", whiteSpace: "nowrap", animation: "ticker 34s linear infinite" }}>
            <span style={{ color: "#6d7d76" }}>{D.tickerText}</span><span style={{ color: "#6d7d76" }}>{D.tickerText}</span>
          </div>
        </div>
        <span style={{ color: "#46e6d4" }}>◉ REC</span>
      </div>

      {/* boot overlay */}
      {booting && (
        <div onClick={skipBoot} style={{ position: "fixed", inset: 0, zIndex: 70, background: "#05070a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "22px", cursor: "pointer", transition: "opacity .6s ease" }}>
          <div style={{ position: "relative", width: "88px", height: "88px" }}>
            <div style={{ position: "absolute", inset: 0, border: "1.5px solid rgba(70,230,212,.5)", borderRadius: "50%", borderTopColor: "#46e6d4", animation: "gridDrift 1s linear infinite,blink 1.4s ease infinite" }} />
            <div style={{ position: "absolute", inset: "16px", border: "1.5px solid rgba(200,241,74,.5)", borderRadius: "50%", borderBottomColor: "#c8f14a" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: labelMono, fontSize: "11px", color: "#c8f14a", fontWeight: 700 }}>CORE</div>
          </div>
          <div style={{ fontFamily: labelMono, fontSize: "12px", color: "#7c8b86", textAlign: "center", lineHeight: 1.9 }}>
            <div style={{ animation: "bootline .3s ease .1s both" }}>▸ INITIALIZING TELEMETRY GRID</div>
            <div style={{ animation: "bootline .3s ease .45s both" }}>▸ SYNCING VENTURE MANIFEST</div>
            <div style={{ animation: "bootline .3s ease .8s both", color: "#c8f14a" }}>▸ FACTORY CORE ONLINE</div>
          </div>
          <div style={{ width: "230px", height: "3px", background: "rgba(120,140,135,.18)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,#46e6d4,#c8f14a)", animation: "bootbar 1.25s cubic-bezier(.6,.1,.2,1) forwards" }} />
          </div>
          <div style={{ fontFamily: labelMono, fontSize: "9.5px", color: "#3f4a45", letterSpacing: ".1em" }}>CLICK TO SKIP</div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, paddingTop: "30px" }}>

        {/* header */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "44px 26px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "24px", flexWrap: "wrap" }}>
            <div style={{ animation: "fadeUp .6s ease .1s both" }}>
              <div style={{ fontFamily: labelMono, fontSize: "11px", letterSpacing: ".22em", color: "#46e6d4", marginBottom: "14px", display: "flex", alignItems: "center", gap: "9px" }}><span style={{ width: "22px", height: "1px", background: "#46e6d4" }} />VENTURE FACTORY · ORBITAL COMMAND</div>
              <h1 style={{ fontWeight: 900, fontSize: "clamp(38px,6vw,74px)", lineHeight: 0.9, letterSpacing: "-.04em", margin: 0, textTransform: "uppercase" }}>Factory<br />Launchpad</h1>
              <div style={{ marginTop: "16px", fontSize: "15px", color: "#8a9a94", maxWidth: "52ch", lineHeight: 1.5 }}>Every faceless business you&apos;ve launched, in orbit around one core. Hover a node to read its telemetry — click to open the full analytics feed.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end", animation: "fadeUp .6s ease .2s both" }}>
              <span className="lp-launch" onClick={openLaunch} style={{ position: "relative", cursor: "pointer", fontFamily: labelMono, fontSize: "13px", fontWeight: 700, letterSpacing: ".06em", color: "#05070a", background: "linear-gradient(90deg,#c8f14a,#9fe84a)", borderRadius: "5px", padding: "13px 20px", whiteSpace: "nowrap", boxShadow: "0 8px 30px -8px rgba(200,241,74,.6)", overflow: "hidden" }}>＋ LAUNCH VENTURE<span style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%)", backgroundSize: "200% 100%", animation: "sheen 4.5s ease-in-out infinite" }} /></span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "16px 26px 6px", animation: "fadeUp .6s ease .28s both" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "10px" }}>
            {D.kpis.map((k, i) => (
              <div key={i} className="lp-kpi" style={{ position: "relative", background: "linear-gradient(180deg,rgba(16,24,22,.7),rgba(8,13,12,.6))", border: "1px solid rgba(120,140,135,.16)", borderRadius: "5px", padding: "13px 14px", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "11px" }}>
                  <span style={{ fontFamily: labelMono, fontSize: "9.5px", fontWeight: 600, letterSpacing: ".1em", color: "#6d7d76", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.label}</span>
                  <span style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "11px" }}><EqBars c={k.eqc} /></span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <CountUp value={k.raw} kind={k.kind} animKey={animKey} style={css(k.valStyle)} />
                  <span style={css(k.deltaStyle)}>{k.delta}</span>
                </div>
                <div style={{ fontFamily: labelMono, fontSize: "9.5px", color: "#4d5a55", marginTop: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* THE CORE */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "14px 26px 6px", animation: "revIn .7s cubic-bezier(.2,.7,.2,1) .34s both" }}>
          <div style={{ position: "relative", background: "radial-gradient(ellipse 80% 90% at 50% 45%,rgba(12,22,20,.55),rgba(5,8,10,.35))", border: "1px solid rgba(120,140,135,.18)", borderRadius: "6px", overflow: "hidden" }}>
            {[
              "top:-1px;left:-1px;width:15px;height:15px;border-top:1.5px solid #46e6d4;border-left:1.5px solid #46e6d4;z-index:3",
              "top:-1px;right:-1px;width:15px;height:15px;border-top:1.5px solid #46e6d4;border-right:1.5px solid #46e6d4;z-index:3",
              "bottom:-1px;left:-1px;width:15px;height:15px;border-bottom:1.5px solid #46e6d4;border-left:1.5px solid #46e6d4;z-index:3",
              "bottom:-1px;right:-1px;width:15px;height:15px;border-bottom:1.5px solid #46e6d4;border-right:1.5px solid #46e6d4;z-index:3",
            ].map((s, i) => <span key={i} style={{ position: "absolute", ...css(s) }} />)}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(120,140,135,.12)", fontFamily: labelMono }}>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".14em", color: "#c8f14a", display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#c8f14a", boxShadow: "0 0 8px #c8f14a", animation: "pulseDot 1.8s ease-in-out infinite" }} />FACTORY CORE — ORBITAL TELEMETRY</span>
              <span style={{ fontSize: "10px", color: "#4d5a55", letterSpacing: ".1em" }}>SYS-01 · REALTIME</span>
            </div>

            <div style={{ position: "relative", width: "100%", height: "min(60vh,540px)", minHeight: "400px" }}>
              <CoreCanvas ventures={ventures} selectedId={selectedId} onSelect={onSelectNode} readoutRef={readoutRef} accent={ACC} />

              {/* ring legend */}
              <div style={{ position: "absolute", top: "14px", left: "16px", display: "flex", flexDirection: "column", gap: "7px", pointerEvents: "none" }}>
                <div style={{ fontFamily: labelMono, fontSize: "9px", letterSpacing: ".14em", color: "#4d5a55", marginBottom: "2px" }}>ORBIT · STAGE</div>
                {D.pipeline.map((p) => (
                  <div key={p.k} style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: labelMono, fontSize: "10.5px", color: "#8a9a94" }}><span style={{ width: "9px", height: "9px", borderRadius: "50%", background: p.color, boxShadow: "0 0 8px " + p.color }} />{p.label} <span style={{ color: "#4d5a55" }}>×{p.count}</span></div>
                ))}
              </div>

              {/* hint */}
              <div style={{ position: "absolute", top: "14px", right: "16px", textAlign: "right", fontFamily: labelMono, fontSize: "9.5px", letterSpacing: ".08em", color: "#4d5a55", lineHeight: 1.7, pointerEvents: "none" }}>
                <div>HOVER ▸ TELEMETRY</div>
                <div>CLICK ▸ OPEN FEED</div>
              </div>

              {/* readout */}
              <div ref={readoutRef} style={{ position: "absolute", bottom: "16px", left: "16px", minWidth: "240px", maxWidth: "min(90%,360px)", background: "rgba(6,11,10,.82)", border: "1px solid rgba(120,140,135,.2)", borderLeft: "2px solid #46e6d4", borderRadius: "5px", padding: "12px 15px", backdropFilter: "blur(6px)", pointerEvents: "none" }}>
                <div style={{ fontFamily: labelMono, fontSize: "10px", letterSpacing: ".12em", color: "#4d5a55" }}>▸ AWAITING SELECTION</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#8a9a94", marginTop: "6px" }}>Hover a node to read telemetry</div>
              </div>
            </div>
          </div>
        </div>

        {/* pipeline conduit */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "16px 26px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "11px", fontFamily: labelMono }}>
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".14em", color: "#6d7d76" }}>ASSEMBLY CONDUIT</span>
            <span style={{ fontSize: "10px", color: "#4d5a55", letterSpacing: ".08em" }}>click a stage to filter the manifest</span>
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "11px" }}>
            <div style={css("position:absolute;left:9%;right:9%;top:33px;height:2px;background:repeating-linear-gradient(90deg,rgba(70,230,212,.5) 0 10px,transparent 10px 26px);background-size:26px 2px;animation:gridDrift 1.1s linear infinite;z-index:0")} />
            {D.pipeline.map((p) => (
              <div key={p.k} onClick={() => selectStage(p.k)}
                onMouseEnter={() => setHoverPipe(p.k)} onMouseLeave={() => setHoverPipe(null)}
                style={{ ...css(p.cardStyle), ...(hoverPipe === p.k ? { borderColor: p.color } : null) }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", background: p.color, boxShadow: "0 0 10px " + p.color }} /><span style={{ fontFamily: labelMono, fontWeight: 600, fontSize: "12px", letterSpacing: ".06em", color: "#c3d0cb" }}>{p.labelU}</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}><span style={{ fontWeight: 800, fontSize: "28px", lineHeight: 1, letterSpacing: "-.02em", color: p.color }}>{p.count}</span><span style={{ fontFamily: labelMono, fontSize: "10px", color: "#6d7d76" }}>{p.sub}</span></div>
                <div style={{ fontFamily: labelMono, fontSize: "11px", color: "#8a9a94", marginTop: "8px" }}>{p.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* portfolio trend */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "18px 26px 6px" }}>
          <div style={{ position: "relative", background: "linear-gradient(180deg,rgba(16,24,22,.6),rgba(8,13,12,.5))", border: "1px solid rgba(120,140,135,.16)", borderRadius: "6px", padding: "18px 20px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
              <div>
                <div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, letterSpacing: ".14em", color: "#6d7d76", marginBottom: "9px" }}>◇ PORTFOLIO REVENUE · 10-MONTH TRACE</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "11px" }}>
                  <span style={{ fontWeight: 800, fontSize: "30px", lineHeight: 1, letterSpacing: "-.02em" }}>{D.pf.curDisplay}</span>
                  <span style={css(D.pf.deltaStyle)}>{D.pf.delta}</span>
                  <span style={{ fontSize: "12px", color: "#4d5a55", fontFamily: labelMono }}>vs prev</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "22px" }}>
                <div><div style={{ fontFamily: labelMono, fontSize: "9.5px", color: "#6d7d76", marginBottom: "4px" }}>ALL-TIME</div><div style={{ fontFamily: labelMono, fontSize: "15px", fontWeight: 600, color: "#c3d0cb" }}>{D.pf.allTime}</div></div>
                <div><div style={{ fontFamily: labelMono, fontSize: "9.5px", color: "#6d7d76", marginBottom: "4px" }}>PEAK</div><div style={{ fontFamily: labelMono, fontSize: "15px", fontWeight: 600, color: "#c3d0cb" }}>{D.pf.best}</div></div>
              </div>
            </div>
            {D.pf.hasData ? (
              <>
                <svg viewBox="0 0 940 200" preserveAspectRatio="none" style={{ width: "100%", height: "150px", display: "block" }}>
                  <defs>
                    <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#46e6d4" stopOpacity="0.32" /><stop offset="1" stopColor="#46e6d4" stopOpacity="0" /></linearGradient>
                  </defs>
                  <path d={D.pf.area} fill="url(#pfGrad)" />
                  <path d={D.pf.line} fill="none" stroke="#46e6d4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" style={{ animation: "drawStroke 1.6s ease .5s forwards" }} />
                  <circle cx={D.pf.lastX} cy={D.pf.lastY} r="4.5" fill="#c8f14a" />
                </svg>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "7px" }}>{D.pf.months.map((m, i) => <span key={i} style={{ fontSize: "9.5px", color: "#4d5a55", fontFamily: labelMono }}>{m}</span>)}</div>
              </>
            ) : (
              <div style={{ padding: "34px 0", textAlign: "center", color: "#4d5a55", fontSize: "13px", fontFamily: labelMono }}>◇ NO SIGNAL — launch a venture and log a month</div>
            )}
          </div>
        </div>

        {/* controls */}
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "18px 26px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {D.stageTabs.map((t) => (
              <span key={t.k} onClick={() => selectStage(t.k)} style={css(t.style)}>{t.label} <span style={{ opacity: 0.6, fontSize: "11px" }}>{t.count}</span></span>
            ))}
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ marginLeft: "auto", background: "#0a1210", color: "#c3d0cb", border: "1px solid rgba(120,140,135,.22)", borderRadius: "6px", padding: "7px 10px", fontSize: "12px", fontWeight: 600, fontFamily: labelMono, cursor: "pointer" }}>
              <option value="mrr">SORT ▸ REVENUE/MO</option>
              <option value="growth">SORT ▸ GROWTH</option>
              <option value="allTime">SORT ▸ ALL-TIME</option>
              <option value="visitors">SORT ▸ TRAFFIC</option>
              <option value="newest">SORT ▸ NEWEST</option>
            </select>
          </div>
        </div>

        {/* manifest */}
        <div ref={listRef} style={{ maxWidth: "1180px", margin: "0 auto", padding: "8px 26px 10px" }}>
          <div style={{ fontFamily: labelMono, fontSize: "10px", letterSpacing: ".14em", color: "#4d5a55", padding: "8px 4px 4px" }}>VENTURE MANIFEST // {D.count} UNITS</div>
          {D.rows.map((it) => (
            <div key={it.id} style={{ borderTop: "1px solid rgba(120,140,135,.12)", ...css(it.entranceStyle) }}>
              <div data-n={it.id} onClick={() => toggleRow(it.id)}
                onMouseEnter={() => setHoverRow(it.id)} onMouseLeave={() => setHoverRow(null)}
                style={{ display: "grid", gridTemplateColumns: "3px 1fr auto 28px", gap: "18px", alignItems: "center", padding: "17px 8px 17px 0", cursor: "pointer", background: hoverRow === it.id ? "rgba(70,230,212,.05)" : it.rowBg, transition: "background .15s" }}>
                <div style={{ width: "3px", height: "100%", minHeight: "44px", background: it.selBar, borderRadius: "2px", boxShadow: it.selGlow }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: labelMono, fontSize: "9.5px", fontWeight: 600, letterSpacing: ".06em", color: it.stageColor, border: "1px solid " + it.stageBorder, borderRadius: "4px", padding: "3px 8px" }}><span style={css(it.stageDotStyle)} />{it.stageLabelU}</span>
                    <span style={{ fontFamily: labelMono, fontSize: "9.5px", letterSpacing: ".05em", color: "#6d7d76" }}>{it.catName}</span>
                    <span style={{ fontFamily: labelMono, fontSize: "9px", fontWeight: 600, color: "#6d7d76", border: "1px solid rgba(120,140,135,.2)", padding: "2px 7px", borderRadius: "4px" }}>{it.modelLabel}</span>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: "20px", lineHeight: 1.1, margin: 0, letterSpacing: "-.015em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: labelMono, fontSize: "10.5px", color: "#6d7d76", flexWrap: "wrap" }}><span style={{ color: "#8a9a94" }}>{it.channel}</span><span>·</span><span>{it.ideaLabel}</span></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
                  <div style={{ textAlign: "right" }}><div style={{ fontWeight: 800, fontSize: "22px", lineHeight: 1, letterSpacing: "-.015em" }}>{it.mrrDisplay}</div><div style={{ fontFamily: labelMono, fontSize: "9.5px", color: "#6d7d76", marginTop: "5px" }}>{it.mrrLabel}</div></div>
                  <div style={{ textAlign: "right", minWidth: "52px" }}><div style={css(it.growthStyle)}>{it.growthArrow} {it.growthText}</div><div style={{ fontFamily: labelMono, fontSize: "9.5px", color: "#6d7d76", marginTop: "5px" }}>MoM</div></div>
                  <svg viewBox="0 0 100 34" preserveAspectRatio="none" style={{ width: "94px", height: "34px", display: "block", flexShrink: 0 }}>
                    <path d={it.sparkArea} fill={it.stageColor} opacity="0.14" />
                    <path d={it.sparkLine} fill="none" stroke={it.stageColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "center", color: "#6d7d76", fontSize: "20px", lineHeight: 1, userSelect: "none", fontFamily: labelMono }}>{it.toggleIcon}</div>
              </div>

              {it.isOpen && (
                <div style={{ padding: "2px 8px 26px 0", animation: "fadeUp .4s cubic-bezier(.2,.7,.2,1) both" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr) auto", gap: "10px", marginBottom: "18px" }}>
                    {it.tiles.map((tl, i) => (
                      <div key={i} style={{ background: "rgba(10,18,16,.6)", border: "1px solid rgba(120,140,135,.14)", borderRadius: "5px", padding: "12px 13px" }}>
                        <div style={{ fontFamily: labelMono, fontSize: "9px", fontWeight: 600, letterSpacing: ".08em", color: "#6d7d76", marginBottom: "9px", whiteSpace: "nowrap" }}>{tl.label}</div>
                        <div style={{ fontWeight: 800, fontSize: "18px", lineHeight: 1, letterSpacing: "-.01em", color: tl.color }}>{tl.val}</div>
                        <div style={{ fontFamily: labelMono, fontSize: "9.5px", color: "#4d5a55", marginTop: "6px" }}>{tl.sub}</div>
                      </div>
                    ))}
                    <div style={{ background: "rgba(10,18,16,.6)", border: "1px solid rgba(120,140,135,.14)", borderRadius: "5px", padding: "10px 13px", display: "flex", alignItems: "center", gap: "11px" }}>
                      <svg viewBox="0 0 44 44" style={{ width: "42px", height: "42px", flexShrink: 0, transform: "rotate(-90deg)" }}><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(120,140,135,.2)" strokeWidth="4" /><circle cx="22" cy="22" r="18" fill="none" stroke="#c8f14a" strokeWidth="4" strokeLinecap="round" strokeDasharray={it.goalDash} /></svg>
                      <div><div style={{ fontFamily: labelMono, fontSize: "9px", fontWeight: 600, letterSpacing: ".06em", color: "#6d7d76", marginBottom: "5px" }}>GOAL</div><div style={{ fontWeight: 800, fontSize: "15px", lineHeight: 1, color: "#c8f14a" }}>{it.goalPct}</div><div style={{ fontFamily: labelMono, fontSize: "9px", color: "#4d5a55", marginTop: "4px" }}>{it.goalSub}</div></div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ background: "rgba(10,18,16,.55)", border: "1px solid rgba(120,140,135,.14)", borderRadius: "6px", padding: "15px 16px 11px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}><span style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, letterSpacing: ".12em", color: "#6d7d76" }}>▸ REVENUE TRACE</span><span style={css(it.growthStyle)}>{it.growthArrow} {it.growthText} MoM</span></div>
                        {it.hasChart ? (
                          <>
                            <svg viewBox="0 0 640 190" preserveAspectRatio="none" style={{ width: "100%", height: "130px", display: "block" }}><defs><linearGradient id={"vGrad-" + it.id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c8f14a" stopOpacity="0.28" /><stop offset="1" stopColor="#c8f14a" stopOpacity="0" /></linearGradient></defs><path d={it.chartArea} fill={"url(#vGrad-" + it.id + ")"} /><path d={it.chartLine} fill="none" stroke="#c8f14a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /><circle cx={it.chartLastX} cy={it.chartLastY} r="4.5" fill="#c8f14a" /></svg>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>{it.chartMonths.map((m, i) => <span key={i} style={{ fontSize: "9px", color: "#4d5a55", fontFamily: labelMono }}>{m}</span>)}</div>
                          </>
                        ) : (
                          <div style={{ padding: "26px 0", textAlign: "center", color: "#4d5a55", fontSize: "12px", fontFamily: labelMono }}>NO MONTHS LOGGED — hit LOG MONTH</div>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div style={{ background: "rgba(10,18,16,.55)", border: "1px solid rgba(120,140,135,.14)", borderRadius: "6px", padding: "14px 15px" }}>
                          <div style={{ fontFamily: labelMono, fontSize: "9.5px", fontWeight: 600, letterSpacing: ".1em", color: "#6d7d76", marginBottom: "13px" }}>TRAFFIC SOURCES</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>{it.traffic.map((tr, i) => (
                            <div key={i}><div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "5px", fontFamily: labelMono }}><span style={{ color: "#c3d0cb" }}>{tr.src}</span><span style={{ color: "#6d7d76" }}>{tr.pct}%</span></div><div style={{ height: "5px", borderRadius: "3px", background: "rgba(120,140,135,.14)", overflow: "hidden" }}><div style={css(tr.barStyle)} /></div></div>
                          ))}</div>
                        </div>
                        <div style={{ background: "rgba(10,18,16,.55)", border: "1px solid rgba(120,140,135,.14)", borderRadius: "6px", padding: "14px 15px" }}>
                          <div style={{ fontFamily: labelMono, fontSize: "9.5px", fontWeight: 600, letterSpacing: ".1em", color: "#6d7d76", marginBottom: "13px" }}>CONVERSION FUNNEL</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{it.funnel.map((fn, i) => (
                            <div key={i}><div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px", fontFamily: labelMono }}><span style={{ color: "#c3d0cb" }}>{fn.label}</span><span style={{ color: "#6d7d76" }}>{fn.val}</span></div><div style={css(fn.barStyle)} /></div>
                          ))}</div>
                          <div style={{ marginTop: "11px", paddingTop: "9px", borderTop: "1px solid rgba(120,140,135,.12)", display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: labelMono }}><span style={{ color: "#6d7d76" }}>CVR</span><span style={{ color: "#c8f14a", fontWeight: 700 }}>{it.convRate}</span></div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ background: "rgba(10,18,16,.6)", border: "1px solid rgba(120,140,135,.16)", borderLeft: "2px solid #c8f14a", borderRadius: "6px", padding: "15px 16px" }}>
                        <div style={{ fontFamily: labelMono, fontSize: "9.5px", fontWeight: 700, letterSpacing: ".1em", color: "#c8f14a", marginBottom: "12px" }}>▸ NEXT ACTIONS · NO CONTACT</div>
                        {it.hasTasks ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>{it.tasks.map((tk) => (
                            <div key={tk.i} onClick={(e) => { e.stopPropagation(); toggleTask(it.id, tk.i); }} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: "9px", alignItems: "start", cursor: "pointer" }}><span style={css(tk.boxStyle)}>{tk.check}</span><span style={css(tk.textStyle)}>{tk.text}</span></div>
                          ))}</div>
                        ) : (
                          <div style={{ fontSize: "12px", color: "#4d5a55" }}>No actions yet — add some via Edit.</div>
                        )}
                      </div>
                      <div style={{ background: "rgba(10,18,16,.55)", border: "1px solid rgba(120,140,135,.14)", borderRadius: "6px", padding: "15px 16px" }}>
                        <div style={{ fontFamily: labelMono, fontSize: "9.5px", fontWeight: 600, letterSpacing: ".1em", color: "#6d7d76", marginBottom: "12px" }}>▸ ACTIVITY LOG</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>{it.events.map((ev, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "10px 1fr", gap: "11px", alignItems: "start" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ev.color, marginTop: "5px", boxShadow: "0 0 6px " + ev.color }} /><div><div style={{ fontSize: "12.5px", color: "#c3d0cb", lineHeight: 1.4 }}>{ev.text}</div><div style={{ fontSize: "10px", color: "#4d5a55", fontFamily: labelMono, marginTop: "2px" }}>{ev.when}</div></div></div>
                        ))}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", borderTop: "1px solid rgba(120,140,135,.12)", marginTop: "16px", paddingTop: "14px" }}>
                    <span onClick={(e) => { e.stopPropagation(); openLog(it.id); }} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "11.5px", fontWeight: 700, letterSpacing: ".04em", color: "#05070a", background: "#c8f14a", borderRadius: "5px", padding: "9px 15px" }}>＋ LOG MONTH</span>
                    {it.canAdvance && <span onClick={(e) => { e.stopPropagation(); advanceStage(it.id); }} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "11.5px", fontWeight: 600, color: "#c3d0cb", background: "rgba(70,230,212,.08)", border: "1px solid rgba(70,230,212,.3)", borderRadius: "5px", padding: "9px 15px" }}>{it.advanceLabel} →</span>}
                    <span onClick={(e) => { e.stopPropagation(); openEdit(it.id); }} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "11.5px", fontWeight: 600, color: "#c3d0cb", background: "transparent", border: "1px solid rgba(120,140,135,.22)", borderRadius: "5px", padding: "9px 15px" }}>✎ EDIT</span>
                    {it.hasIdea && <span style={{ fontFamily: labelMono, fontSize: "11.5px", fontWeight: 600, color: "#b7a3ff", background: "transparent", border: "1px solid rgba(183,163,255,.35)", borderRadius: "5px", padding: "9px 15px", opacity: 0.65, cursor: "default" }}>◆ PLAYBOOK</span>}
                    <span onClick={(e) => { e.stopPropagation(); togglePark(it.id); }} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "11.5px", fontWeight: 600, color: "#6d7d76", background: "transparent", border: "1px solid rgba(120,140,135,.22)", borderRadius: "5px", padding: "9px 15px", marginLeft: "auto" }}>{it.parkLabel}</span>
                    {it.isParked && <span onClick={(e) => { e.stopPropagation(); deleteVenture(it.id); }} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "11.5px", fontWeight: 600, color: "#ff6b8a", background: "transparent", border: "1px solid rgba(255,107,138,.35)", borderRadius: "5px", padding: "9px 15px" }}>DELETE</span>}
                  </div>
                </div>
              )}
            </div>
          ))}

          {D.showEmpty && (
            <div style={{ padding: "52px 0", textAlign: "center", borderTop: "1px solid rgba(120,140,135,.12)" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{D.emptyTitle}</div>
              <div style={{ fontSize: "14px", color: "#6d7d76", marginBottom: "18px" }}>{D.emptyHint}</div>
              <span onClick={openLaunch} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "12.5px", fontWeight: 700, color: "#05070a", background: "#c8f14a", padding: "10px 18px", borderRadius: "5px" }}>＋ LAUNCH FIRST VENTURE</span>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ borderTop: "1px solid rgba(120,140,135,.12)", marginTop: "20px" }}>
          <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "24px 26px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#4d5a55", maxWidth: "66ch", lineHeight: 1.5, fontFamily: labelMono }}>// A private command deck for the faceless businesses you actually run. All telemetry lives in your browser — nothing transmitted. Log a month whenever you check your dashboards; the core re-calibrates automatically.</span>
            {D.showReset && <span className="lp-reset" onClick={resetDemo} style={{ cursor: "pointer", fontSize: "10.5px", color: "#4d5a55", fontFamily: labelMono, border: "1px solid rgba(120,140,135,.2)", borderRadius: "5px", padding: "6px 11px" }}>↻ RESET</span>}
          </div>
        </div>
      </div>

      {/* modal */}
      {modal && (
        <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(3,5,7,.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "64px 20px", overflow: "auto", animation: "fadeUp .2s ease both" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "560px", background: "linear-gradient(180deg,rgba(14,22,20,.96),rgba(8,13,12,.96))", border: "1px solid rgba(120,140,135,.24)", borderRadius: "6px", boxShadow: "0 40px 90px -20px rgba(0,0,0,.8)", animation: "revIn .34s cubic-bezier(.2,.7,.2,1) both" }}>
            <span style={{ position: "absolute", top: "-1px", left: "-1px", width: "14px", height: "14px", borderTop: "1.5px solid #46e6d4", borderLeft: "1.5px solid #46e6d4" }} />
            <span style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "14px", height: "14px", borderBottom: "1.5px solid #46e6d4", borderRight: "1.5px solid #46e6d4" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "17px 20px", borderBottom: "1px solid rgba(120,140,135,.14)" }}>
              <div style={{ fontFamily: labelMono, fontWeight: 700, fontSize: "14px", letterSpacing: ".06em", color: "#e8f2ee", display: "flex", alignItems: "center", gap: "9px" }}><span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#46e6d4", boxShadow: "0 0 8px #46e6d4" }} />{md === "launch" ? "LAUNCH VENTURE" : md === "log" ? "LOG A MONTH" : "EDIT VENTURE"}</div>
              <span className="lp-close" onClick={closeModal} style={{ cursor: "pointer", color: "#6d7d76", fontSize: "18px", lineHeight: 1, width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "5px" }}>✕</span>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
              {md === "launch" && (
                <>
                  <div>
                    <div style={{ fontFamily: labelMono, fontSize: "9.5px", fontWeight: 600, letterSpacing: ".08em", color: "#6d7d76", marginBottom: "9px" }}>START FROM A SHORTLISTED IDEA</div>
                    <div style={{ fontSize: "12px", color: "#4d5a55", lineHeight: 1.5 }}>No shortlisted ideas yet — just fill it in below.</div>
                  </div>
                  <div style={{ height: "1px", background: "rgba(120,140,135,.14)" }} />
                </>
              )}
              {(md === "launch" || md === "edit") && (
                <>
                  <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>VENTURE NAME</div><input data-f="name" value={form.name || ""} onChange={(e) => onFormInput("name", e.target.value)} placeholder="e.g. Plumber Canva Pack Shop" style={css(inputStyle)} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>CATEGORY</div><select value={form.cat || "product"} onChange={(e) => onFormInput("cat", e.target.value)} style={css(selectStyle)}>{CATS.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}</select></div>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>MARKETING CHANNEL</div><select value={form.channel || "Marketplace search"} onChange={(e) => onFormInput("channel", e.target.value)} style={css(selectStyle)}>{CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>REVENUE MODEL</div><select value={form.model || "oneoff"} onChange={(e) => onFormInput("model", e.target.value)} style={css(selectStyle)}><option value="oneoff">One-off sales</option><option value="sub">Subscription (MRR)</option></select></div>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>STAGE</div><select value={form.stage || "build"} onChange={(e) => onFormInput("stage", e.target.value)} style={css(selectStyle)}><option value="idea">Idea · backlog</option><option value="build">Building</option><option value="launch">Launched</option><option value="scale">Scaling</option></select></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>MONTHLY GOAL</div><input value={form.goal || ""} onChange={(e) => onFormInput("goal", e.target.value)} inputMode="numeric" placeholder="2000" style={css(inputStyle)} /></div>
                    {md === "launch" && <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>CURRENT REVENUE/MO</div><input value={form.startRev || ""} onChange={(e) => onFormInput("startRev", e.target.value)} inputMode="numeric" placeholder="0" style={css(inputStyle)} /></div>}
                  </div>
                </>
              )}
              {md === "edit" && (
                <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>NEXT ACTIONS <span style={{ color: "#4d5a55" }}>(one per line)</span></div><textarea value={form.tasksText || ""} onChange={(e) => onFormInput("tasksText", e.target.value)} rows={4} placeholder={"Ship 25 new pins\nA/B test pricing"} style={{ ...css(inputStyle), resize: "vertical", lineHeight: 1.5 }} /></div>
              )}
              {md === "log" && (
                <>
                  <div style={{ fontSize: "12.5px", color: "#6d7d76", lineHeight: 1.5, marginBottom: "-4px" }}>Logging for <span style={{ color: "#e8f2ee", fontWeight: 600 }}>{logV ? logV.name : ""}</span>. Enter this month&apos;s numbers.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>MONTH</div><select value={form.month || monthKey(0)} onChange={(e) => onFormInput("month", e.target.value)} style={css(selectStyle)}>{D.monthOpts.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></div>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>REVENUE ($)</div><input value={form.rev || ""} onChange={(e) => onFormInput("rev", e.target.value)} inputMode="numeric" placeholder="0" style={css(inputStyle)} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>VISITORS / VIEWS</div><input value={form.vis || ""} onChange={(e) => onFormInput("vis", e.target.value)} inputMode="numeric" placeholder="0" style={css(inputStyle)} /></div>
                    <div><div style={{ fontFamily: labelMono, fontSize: "10px", fontWeight: 600, color: "#6d7d76", marginBottom: "6px" }}>SALES / CUSTOMERS</div><input value={form.units || ""} onChange={(e) => onFormInput("units", e.target.value)} inputMode="numeric" placeholder="0" style={css(inputStyle)} /></div>
                  </div>
                </>
              )}
              {formError && <div style={{ fontSize: "12px", color: "#ff6b8a", background: "rgba(255,107,138,.08)", border: "1px solid rgba(255,107,138,.3)", borderRadius: "5px", padding: "9px 12px", fontFamily: labelMono }}>{formError}</div>}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
                <span onClick={closeModal} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "12.5px", fontWeight: 600, color: "#c3d0cb", padding: "10px 16px", borderRadius: "5px", border: "1px solid rgba(120,140,135,.22)" }}>CANCEL</span>
                <span onClick={submitModal} style={{ cursor: "pointer", fontFamily: labelMono, fontSize: "12.5px", fontWeight: 700, color: "#05070a", background: "#c8f14a", padding: "10px 18px", borderRadius: "5px" }}>{md === "launch" ? "LAUNCH IT →" : md === "log" ? "SAVE MONTH" : "SAVE CHANGES"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={btnTopRef} onClick={scrollTop} style={{ position: "fixed", right: "20px", bottom: "20px", zIndex: 50, width: "42px", height: "42px", borderRadius: "50%", background: "rgba(10,18,16,.9)", border: "1px solid rgba(70,230,212,.3)", color: "#46e6d4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", cursor: "pointer", opacity: 0, pointerEvents: "none", transform: "translateY(8px)", transition: "opacity .2s,transform .2s", backdropFilter: "blur(6px)" }}>↑</div>
    </div>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
::placeholder{color:#4d5a55}
::selection{background:#c8f14a;color:#05070a}
@keyframes revIn{from{opacity:0;transform:translateY(16px);clip-path:inset(0 0 100% 0)}to{opacity:1;transform:none;clip-path:inset(0 0 0 0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes gridDrift{from{background-position:0 0}to{background-position:52px 52px}}
@keyframes scan{0%{transform:translateY(-100%)}100%{transform:translateY(2200%)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.18}}
@keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes eq{0%,100%{transform:scaleY(.28)}50%{transform:scaleY(1)}}
@keyframes bootbar{from{width:0}to{width:100%}}
@keyframes bootline{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes drawStroke{to{stroke-dashoffset:0}}
@keyframes sheen{0%{background-position:-140% 0}60%,100%{background-position:240% 0}}
@keyframes coreGlow{0%,100%{opacity:.5}50%{opacity:.9}}
.lp-launch:hover{box-shadow:0 10px 40px -6px rgba(200,241,74,.85)!important}
.lp-kpi:hover{border-color:rgba(70,230,212,.4)!important}
.lp-reset:hover{color:#ff6b8a!important;border-color:rgba(255,107,138,.35)!important}
.lp-close:hover{background:rgba(120,140,135,.14)!important;color:#e8f2ee!important}
@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important}}
`;
