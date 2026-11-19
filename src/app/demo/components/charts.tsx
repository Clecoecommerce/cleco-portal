"use client";
import React, { useState } from "react";

export function LineChart({ data, height = 220, suffix = "%", color = "#2563EB", decimals = 1 }: { data: { label: string; v: number }[]; height?: number; suffix?: string; color?: string; decimals?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, P = { l: 40, r: 16, t: 16, b: 28 };
  const max = Math.ceil(Math.max(...data.map((d) => d.v)) * 1.1);
  const min = Math.floor(Math.min(...data.map((d) => d.v)) * 0.85);
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / (data.length - 1);
  const y = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.v)}`).join(" ");
  const area = `${path} L${x(data.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const ticks = [min, (min + max) / 2, max];
  const fmt = (v: number) => v.toFixed(decimals).replace(".", ",") + suffix;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseLeave={() => setHover(null)} role="img" aria-label="Gráfico de evolución">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".18" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#E2E8F0" strokeDasharray={i ? "3 4" : undefined} />
          <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94A3B8">{fmt(t)}</text>
        </g>
      ))}
      <path d={area} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i} onMouseEnter={() => setHover(i)}>
          <rect x={x(i) - (W / data.length) / 2} y={0} width={W / data.length} height={H} fill="transparent" />
          {(i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94A3B8">{d.label}</text>}
        </g>
      ))}
      {hover !== null && (
        <g pointerEvents="none">
          <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#CBD5E1" />
          <circle cx={x(hover)} cy={y(data[hover].v)} r="5" fill="#fff" stroke={color} strokeWidth="2.5" />
          <g transform={`translate(${Math.min(x(hover) + 10, W - 120)},${Math.max(y(data[hover].v) - 40, 4)})`}>
            <rect width="110" height="34" rx="8" fill="#0F172A" />
            <text x="10" y="14" fontSize="10.5" fill="#94A3B8">{data[hover].label}</text>
            <text x="10" y="28" fontSize="13" fontWeight="700" fill="#fff">{fmt(data[hover].v)}</text>
          </g>
        </g>
      )}
    </svg>
  );
}

export function Bars({ data, height = 200, color = "#2563EB", format }: { data: { label: string; v: number; v2?: number }[]; height?: number; color?: string; format: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, P = { l: 8, r: 8, t: 22, b: 26 };
  const max = Math.max(...data.map((d) => d.v + (d.v2 ?? 0))) * 1.08;
  const bw = (W - P.l - P.r) / data.length;
  const h = (v: number) => (v / max) * (H - P.t - P.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseLeave={() => setHover(null)} role="img" aria-label="Gráfico de barras">
      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="#E2E8F0" />
      {data.map((d, i) => {
        const x = P.l + i * bw + bw * 0.18, w = bw * 0.64;
        const h1 = h(d.v), h2 = h(d.v2 ?? 0);
        return (
          <g key={i} onMouseEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.55}>
            <rect x={x} y={H - P.b - h1} width={w} height={h1} rx="4" fill={color} />
            {d.v2 ? <rect x={x} y={H - P.b - h1 - h2 - 2} width={w} height={h2} rx="4" fill="#BFDBFE" /> : null}
            <text x={x + w / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#94A3B8">{d.label}</text>
            {hover === i && <text x={x + w / 2} y={H - P.b - h1 - h2 - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0F172A">{format(d.v + (d.v2 ?? 0))}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({ parts, size = 132, label, sub }: { parts: { v: number; color: string }[]; size?: number; label: string; sub: string }) {
  const total = parts.reduce((a, b) => a + b.v, 0) || 1;
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 132 132" width={size} height={size} role="img" aria-label={label + " " + sub}>
      <circle cx="66" cy="66" r={r} fill="none" stroke="#F1F5F9" strokeWidth="14" />
      {parts.map((p, i) => {
        const len = (p.v / total) * c;
        const el = <circle key={i} cx="66" cy="66" r={r} fill="none" stroke={p.color} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 66 66)" />;
        acc += len;
        return el;
      })}
      <text x="66" y="64" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0F172A">{label}</text>
      <text x="66" y="82" textAnchor="middle" fontSize="10.5" fill="#64748B">{sub}</text>
    </svg>
  );
}
