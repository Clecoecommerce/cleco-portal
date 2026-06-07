"use client";

import { useState } from "react";
import { Badge, estadoToBadge } from "@/components/ui/Badge";
import { formatCLP, calcularEstado } from "@/lib/utils";
import type { FacturaWithDeudor } from "@/types/database";

interface Pago { monto_bruto: number; honorarios_pct: number; fecha: string; }
interface Props { facturas: FacturaWithDeudor[]; pagos: Pago[]; }

type AgingBucket = "al_dia" | "1_30" | "31_60" | "61_90" | "90plus";

/* ─── Cálculos base ─── */
function usarAnalytics(facturas: FacturaWithDeudor[], pagos: Pago[]) {
  const hoy = new Date();
  const mora = (f: FacturaWithDeudor) => {
    if (f.estado === "pagada") return 0;
    const d = new Date(f.fecha_vencimiento);
    return d < hoy ? Math.floor((hoy.getTime() - d.getTime()) / 86_400_000) : 0;
  };

  const activas  = facturas.filter(f => f.estado !== "pagada");
  const vencidas = activas.filter(f => new Date(f.fecha_vencimiento) < hoy);
  const sum      = (arr: FacturaWithDeudor[]) => arr.reduce((a, f) => a + f.monto, 0);

  const aging: Record<AgingBucket, FacturaWithDeudor[]> = {
    al_dia:  activas.filter(f => mora(f) === 0),
    "1_30":  activas.filter(f => mora(f) >= 1  && mora(f) <= 30),
    "31_60": activas.filter(f => mora(f) >= 31 && mora(f) <= 60),
    "61_90": activas.filter(f => mora(f) >= 61 && mora(f) <= 90),
    "90plus":activas.filter(f => mora(f) > 90),
  };

  const montoActivo   = sum(activas);
  const montoVencido  = sum(vencidas);
  const recuperado    = pagos.reduce((a, p) => a + p.monto_bruto, 0);
  const totalHistorico = montoActivo + recuperado;
  const tasaRecupero   = totalHistorico > 0 ? Math.round((recuperado / totalHistorico) * 100) : 0;

  // Concentración por deudor
  const porDeudor = activas.reduce<Record<string, { nombre: string; monto: number }>>((acc, f) => {
    const id = f.deudor_id;
    const nombre = f.deudores?.razon_social ?? "—";
    if (!acc[id]) acc[id] = { nombre, monto: 0 };
    acc[id].monto += f.monto;
    return acc;
  }, {});
  const topDeudores = Object.values(porDeudor)
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5)
    .map(d => ({ ...d, pct: montoActivo > 0 ? Math.round((d.monto / montoActivo) * 100) : 0 }));

  // Portfolio Health Score (0–100)
  let score = 100;
  if (montoActivo > 0) score -= Math.round((montoVencido / montoActivo) * 50);
  if (tasaRecupero < 30) score -= 15;
  else if (tasaRecupero > 60) score += 10;
  if (topDeudores[0]?.pct > 40) score -= 10;
  score = Math.min(100, Math.max(0, score));

  // Próximas a vencer (7 días)
  const proxVencer7 = activas.filter(f => {
    const diff = (new Date(f.fecha_vencimiento).getTime() - hoy.getTime()) / 86_400_000;
    return diff >= 0 && diff <= 7;
  });

  // Proyección 30 días (facturas que vencen en 30d)
  const proyeccion30 = sum(activas.filter(f => {
    const diff = (new Date(f.fecha_vencimiento).getTime() - hoy.getTime()) / 86_400_000;
    return diff >= 0 && diff <= 30;
  }));

  // Mora promedio ponderada
  const moraProm = activas.length > 0
    ? Math.round(activas.reduce((a, f) => a + mora(f), 0) / activas.length)
    : 0;

  return { activas, vencidas, aging, montoActivo, montoVencido, recuperado,
    tasaRecupero, topDeudores, score, proxVencer7, proyeccion30, moraProm, mora };
}

/* ─── Componente gauge de score ─── */
function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#1F7A4D" : score >= 45 ? "#B7791F" : "#B23B3B";
  const label = score >= 70 ? "Cartera saludable" : score >= 45 ? "Atención requerida" : "Riesgo elevado";
  const angle  = (score / 100) * 180 - 90; // -90 a +90 grados

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-16">
        <svg viewBox="0 0 120 68" className="w-full h-full">
          {/* Track */}
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round"/>
          {/* Score arc */}
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 157} 157`}/>
          {/* Needle */}
          <line
            x1="60" y1="60"
            x2={60 + 38 * Math.cos(((angle - 90) * Math.PI) / 180)}
            y2={60 + 38 * Math.sin(((angle - 90) * Math.PI) / 180)}
            stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="60" cy="60" r="4" fill="#0F172A"/>
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <span className="text-[22px] font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

/* ─── Modal de aging bucket ─── */
function AgingModal({ bucket, facturas, onClose }: {
  bucket: string; facturas: FacturaWithDeudor[]; onClose: () => void;
}) {
  const hoy = new Date();
  const mora = (f: FacturaWithDeudor) => {
    const d = new Date(f.fecha_vencimiento);
    return d < hoy ? Math.floor((hoy.getTime() - d.getTime()) / 86_400_000) : 0;
  };
  const sorted = [...facturas].sort((a, b) => mora(b) - mora(a));

  return (
    <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-[640px] max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9] shrink-0">
          <div>
            <h3 className="text-[17px] font-semibold text-[#0F172A]">{bucket}</h3>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5">{facturas.length} facturas · {formatCLP(facturas.reduce((a, f) => a + f.monto, 0))}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#6B7280] inline-flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="overflow-auto flex-1">
          {sorted.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13px] text-[#9CA3AF]">No hay facturas en este rango.</p>
          ) : (
            <table className="w-full text-[13px] border-collapse">
              <thead className="bg-[#FAFBFD]">
                <tr>
                  {["Deudor", "N° Factura", "Vencimiento", "Mora", "Monto", "Estado"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide px-4 py-2.5 border-b border-[#E2E8F0]"
                      style={h === "Monto" ? { textAlign: "right" } : {}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(f => {
                  const m = mora(f);
                  const est = calcularEstado(f.estado, f.fecha_vencimiento);
                  const { variant, label } = estadoToBadge(est);
                  return (
                    <tr key={f.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFD]">
                      <td className="px-4 py-3 font-medium text-[#0F172A]">{f.deudores?.razon_social ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#6B7280]">N°{f.numero}</td>
                      <td className="px-4 py-3 text-[#6B7280] tabular-nums">{new Date(f.fecha_vencimiento).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {m > 0 ? <span className={`font-semibold ${m >= 90 ? "text-[#B23B3B]" : m >= 30 ? "text-[#B7791F]" : "text-[#6B7280]"}`}>{m}d</span> : <span className="text-[#1F7A4D]">Al día</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#0F172A] tabular-nums">{formatCLP(f.monto)}</td>
                      <td className="px-4 py-3"><Badge variant={variant}>{label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modal de concentración de deudores ─── */
function ConcentracionModal({ deudores, total, onClose }: {
  deudores: { nombre: string; monto: number; pct: number }[];
  total: number; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-[17px] font-semibold text-[#0F172A]">Concentración de riesgo</h3>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5">Top deudores por exposición total</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#6B7280] inline-flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {deudores.map((d, i) => (
            <div key={d.nombre}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#E2E8F0] text-[#6B7280] text-[10px] font-bold inline-flex items-center justify-center">{i + 1}</span>
                  <span className="text-[13.5px] font-medium text-[#0F172A] truncate max-w-[200px]">{d.nombre}</span>
                </div>
                <div className="text-right">
                  <span className="text-[13.5px] font-semibold text-[#0F172A]">{formatCLP(d.monto)}</span>
                  <span className="text-[12px] text-[#6B7280] ml-2">{d.pct}%</span>
                </div>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${d.pct}%`, background: d.pct > 40 ? "#B23B3B" : d.pct > 25 ? "#F59E0B" : "#2563EB" }} />
              </div>
            </div>
          ))}
          <p className="text-[11.5px] text-[#9CA3AF] pt-2 border-t border-[#F1F5F9]">
            Cartera activa total: {formatCLP(total)} · Riesgo de concentración &gt; 40%: crítico
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal de proyección ─── */
function ProyeccionModal({ facturas, onClose }: { facturas: FacturaWithDeudor[]; onClose: () => void }) {
  const hoy = new Date();
  const buckets = [
    { label: "Esta semana (0–7d)", fs: facturas.filter(f => { const d = (new Date(f.fecha_vencimiento).getTime() - hoy.getTime()) / 86_400_000; return d >= 0 && d <= 7; }) },
    { label: "8–15 días",          fs: facturas.filter(f => { const d = (new Date(f.fecha_vencimiento).getTime() - hoy.getTime()) / 86_400_000; return d > 7 && d <= 15; }) },
    { label: "16–30 días",         fs: facturas.filter(f => { const d = (new Date(f.fecha_vencimiento).getTime() - hoy.getTime()) / 86_400_000; return d > 15 && d <= 30; }) },
  ];

  return (
    <div className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-[17px] font-semibold text-[#0F172A]">Proyección de vencimientos</h3>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5">Próximos 30 días</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#6B7280] inline-flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {buckets.map(b => (
            <div key={b.label} className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-[10px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#0F172A]">{b.label}</span>
                <span className="text-[13px] font-bold text-[#2563EB]">{formatCLP(b.fs.reduce((a, f) => a + f.monto, 0))}</span>
              </div>
              {b.fs.length === 0 ? (
                <p className="text-[12px] text-[#9CA3AF]">Sin facturas</p>
              ) : (
                <div className="space-y-1">
                  {b.fs.slice(0, 3).map(f => (
                    <div key={f.id} className="flex justify-between text-[12px]">
                      <span className="text-[#6B7280] truncate max-w-[220px]">{f.deudores?.razon_social ?? "—"}</span>
                      <span className="text-[#1E293B] font-medium tabular-nums">{formatCLP(f.monto)}</span>
                    </div>
                  ))}
                  {b.fs.length > 3 && <p className="text-[11.5px] text-[#9CA3AF]">+{b.fs.length - 3} más</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
export function DashboardAnalytics({ facturas, pagos }: Props) {
  const D = usarAnalytics(facturas, pagos);
  const [agingModal, setAgingModal]   = useState<AgingBucket | null>(null);
  const [showConc,   setShowConc]     = useState(false);
  const [showProy,   setShowProy]     = useState(false);

  const agingConfig: { key: AgingBucket; label: string; sub: string; color: string; bg: string; border: string }[] = [
    { key: "al_dia",  label: "Al día",   sub: "Sin mora",      color: "#1F7A4D", bg: "#E5F4EC", border: "#1F7A4D/20" },
    { key: "1_30",    label: "1–30d",    sub: "Mora temprana", color: "#B7791F", bg: "#FBF3E1", border: "#B7791F/20" },
    { key: "31_60",   label: "31–60d",   sub: "Mora media",    color: "#D97706", bg: "#FEF3C7", border: "#D97706/20" },
    { key: "61_90",   label: "61–90d",   sub: "Mora avanzada", color: "#B23B3B", bg: "#FBE9E9", border: "#B23B3B/20" },
    { key: "90plus",  label: "+90d",     sub: "Mora crítica",  color: "#7F1D1D", bg: "#FEE2E2", border: "#7F1D1D/20" },
  ];

  // Insights automáticos
  const insights: { icon: string; title: string; body: string; type: "danger" | "warning" | "info" | "success"; action?: () => void; actionLabel?: string }[] = [];

  if (D.aging["90plus"].length > 0) {
    const m = D.aging["90plus"].reduce((a, f) => a + f.monto, 0);
    const pct = D.montoActivo > 0 ? Math.round((m / D.montoActivo) * 100) : 0;
    insights.push({ icon: "🔴", type: "danger", title: "Mora crítica (+90 días)",
      body: `${D.aging["90plus"].length} factura${D.aging["90plus"].length > 1 ? "s" : ""} acumulan ${formatCLP(m)} (${pct}% de la cartera). Requieren gestión extrajudicial urgente.`,
      action: () => setAgingModal("90plus"), actionLabel: "Ver facturas" });
  }

  if (D.topDeudores[0]?.pct > 30) {
    insights.push({ icon: "⚠️", type: "warning", title: "Concentración de riesgo",
      body: `${D.topDeudores[0].nombre} concentra el ${D.topDeudores[0].pct}% de tu cartera activa (${formatCLP(D.topDeudores[0].monto)}). Alta dependencia de un único deudor.`,
      action: () => setShowConc(true), actionLabel: "Ver análisis" });
  }

  if (D.proxVencer7.length > 0) {
    const m = D.proxVencer7.reduce((a, f) => a + f.monto, 0);
    insights.push({ icon: "📅", type: "info", title: "Vencimientos esta semana",
      body: `${D.proxVencer7.length} factura${D.proxVencer7.length > 1 ? "s" : ""} por ${formatCLP(m)} vencen en los próximos 7 días. Contacta a los deudores hoy para evitar mora.`,
      action: () => setAgingModal("al_dia"), actionLabel: "Ver listado" });
  }

  if (D.tasaRecupero >= 50) {
    insights.push({ icon: "✅", type: "success", title: "Tasa de recupero favorable",
      body: `Has recuperado el ${D.tasaRecupero}% de tu cartera histórica (${formatCLP(D.recuperado)} sobre ${formatCLP(D.montoActivo + D.recuperado)}). Gestión eficiente.` });
  } else if (D.activas.length > 0) {
    insights.push({ icon: "📊", type: "info", title: "Proyección próximos 30 días",
      body: `${formatCLP(D.proyeccion30)} en facturas vence en los próximos 30 días. Gestión proactiva ahora puede mejorar el flujo de caja.`,
      action: () => setShowProy(true), actionLabel: "Ver proyección" });
  }

  const insightColors = {
    danger:  { bg: "#FBE9E9", border: "#B23B3B", text: "#B23B3B", btn: "bg-[#B23B3B]/10 text-[#B23B3B] hover:bg-[#B23B3B]/20" },
    warning: { bg: "#FBF3E1", border: "#B7791F", text: "#B7791F", btn: "bg-[#B7791F]/10 text-[#B7791F] hover:bg-[#B7791F]/20" },
    info:    { bg: "#EFF6FF", border: "#2563EB", text: "#2563EB", btn: "bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20" },
    success: { bg: "#E5F4EC", border: "#1F7A4D", text: "#1F7A4D", btn: "bg-[#1F7A4D]/10 text-[#1F7A4D] hover:bg-[#1F7A4D]/20" },
  };

  // Acciones prioritarias
  const prioridades = [
    ...D.aging["90plus"].slice(0, 2).map(f => ({ f, urgencia: "Crítica", color: "#B23B3B", bg: "#FBE9E9" })),
    ...D.aging["61_90"].slice(0, 1).map(f => ({ f, urgencia: "Alta",     color: "#D97706", bg: "#FEF3C7" })),
    ...D.proxVencer7.slice(0, 1).map(f => ({ f, urgencia: "Próximo",  color: "#2563EB", bg: "#EFF6FF" })),
  ].slice(0, 3);

  const montoVencidoPct = D.montoActivo > 0 ? Math.round((D.montoVencido / D.montoActivo) * 100) : 0;

  return (
    <>
      {/* Modals */}
      {agingModal && (
        <AgingModal
          bucket={agingConfig.find(a => a.key === agingModal)?.label ?? agingModal}
          facturas={D.aging[agingModal]}
          onClose={() => setAgingModal(null)}
        />
      )}
      {showConc && <ConcentracionModal deudores={D.topDeudores} total={D.montoActivo} onClose={() => setShowConc(false)} />}
      {showProy && <ProyeccionModal facturas={D.activas} onClose={() => setShowProy(false)} />}

      <div className="space-y-4 mb-6">

        {/* ── Row 1: Health Score + KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

          {/* Health Score */}
          <div className="bg-white border border-[#E2E8F0] rounded-[14px] px-5 py-4 shadow-sm flex flex-col items-center justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">Score de cartera</p>
            <ScoreGauge score={D.score} />
            <p className="text-[11px] text-[#9CA3AF] mt-2 text-center">
              {montoVencidoPct}% vencido · mora prom. {D.moraProm}d
            </p>
          </div>

          {/* KPI: Monto activo */}
          <button onClick={() => setAgingModal("al_dia")}
            className="bg-white border border-[#E2E8F0] rounded-[14px] px-5 py-4 shadow-sm text-left hover:border-[#2563EB] hover:shadow-md transition-all group">
            <div className="flex items-center gap-2 text-[12px] text-[#6B7280] font-medium mb-3">
              <span className="w-[22px] h-[22px] inline-flex items-center justify-center rounded-[6px] bg-[#EFF6FF] text-[#2563EB]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
              Cartera activa
            </div>
            <p className="text-[28px] font-bold text-[#0F172A]">{D.activas.length}</p>
            <p className="text-[12px] text-[#6B7280] mt-1">{formatCLP(D.montoActivo)} en gestión</p>
            <p className="text-[11px] text-[#2563EB] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Ver detalle →</p>
          </button>

          {/* KPI: Vencidas */}
          <button onClick={() => setAgingModal("90plus")}
            className="bg-white border border-[#E2E8F0] rounded-[14px] px-5 py-4 shadow-sm text-left hover:border-[#B23B3B] hover:shadow-md transition-all group">
            <div className="flex items-center gap-2 text-[12px] text-[#6B7280] font-medium mb-3">
              <span className="w-[22px] h-[22px] inline-flex items-center justify-center rounded-[6px] bg-[#FBE9E9] text-[#B23B3B]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </span>
              Vencidas
            </div>
            <p className="text-[28px] font-bold text-[#B23B3B]">{D.vencidas.length}</p>
            <p className="text-[12px] text-[#6B7280] mt-1">{formatCLP(D.montoVencido)} · {montoVencidoPct}% del total</p>
            <p className="text-[11px] text-[#B23B3B] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Ver mora crítica →</p>
          </button>

          {/* KPI: Tasa recupero */}
          <button onClick={() => setShowProy(true)}
            className="bg-white border border-[#E2E8F0] rounded-[14px] px-5 py-4 shadow-sm text-left hover:border-[#1F7A4D] hover:shadow-md transition-all group">
            <div className="flex items-center gap-2 text-[12px] text-[#6B7280] font-medium mb-3">
              <span className="w-[22px] h-[22px] inline-flex items-center justify-center rounded-[6px] bg-[#E5F4EC] text-[#1F7A4D]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Tasa de recupero
            </div>
            <p className="text-[28px] font-bold text-[#1F7A4D]">{D.tasaRecupero}%</p>
            <p className="text-[12px] text-[#6B7280] mt-1">{formatCLP(D.proyeccion30)} vence en 30d</p>
            <p className="text-[11px] text-[#1F7A4D] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Ver proyección →</p>
          </button>
        </div>

        {/* ── Row 2: Aging analysis ── */}
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-[13.5px] font-semibold text-[#0F172A]">Análisis de antigüedad (Aging)</h2>
              <p className="text-[12px] text-[#6B7280]">Haz clic en cualquier rango para ver las facturas</p>
            </div>
            {D.montoActivo > 0 && (
              <div className="hidden sm:flex h-2 w-48 rounded-full overflow-hidden gap-px">
                {agingConfig.map(c => {
                  const m = D.aging[c.key].reduce((a, f) => a + f.monto, 0);
                  const pct = Math.max(1, Math.round((m / D.montoActivo) * 100));
                  return m > 0 ? <div key={c.key} style={{ width: `${pct}%`, background: c.color }} title={`${c.label}: ${pct}%`} /> : null;
                })}
              </div>
            )}
          </div>
          <div className="grid grid-cols-5">
            {agingConfig.map((c, i) => {
              const bucket = D.aging[c.key];
              const monto  = bucket.reduce((a, f) => a + f.monto, 0);
              const pct    = D.montoActivo > 0 ? Math.round((monto / D.montoActivo) * 100) : 0;
              return (
                <button key={c.key} onClick={() => setAgingModal(c.key)}
                  className={`flex flex-col items-center px-3 py-4 text-center transition-all hover:opacity-80 active:scale-[0.98] ${i < 4 ? "border-r border-[#F1F5F9]" : ""}`}
                  style={{ background: bucket.length > 0 ? c.bg + "80" : "#FAFBFD" }}>
                  <span className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: c.color }}>{c.label}</span>
                  <span className="text-[22px] font-bold text-[#0F172A]">{bucket.length}</span>
                  <span className="text-[12px] text-[#6B7280] mt-0.5 tabular-nums">{monto > 0 ? formatCLP(monto) : "—"}</span>
                  {pct > 0 && <span className="text-[11px] mt-1 font-medium" style={{ color: c.color }}>{pct}%</span>}
                  <span className="text-[10.5px] text-[#9CA3AF] mt-1">{c.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Row 3: Insights + Prioridades ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Insights (2/3) */}
          <div className="sm:col-span-2 space-y-3">
            <h2 className="text-[13.5px] font-semibold text-[#0F172A] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold inline-flex items-center justify-center">AI</span>
              Insights del analista
            </h2>
            {insights.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] px-5 py-8 text-center text-[13px] text-[#9CA3AF]">
                No hay alertas activas. Tu cartera está en buen estado.
              </div>
            ) : (
              insights.map((ins, i) => {
                const c = insightColors[ins.type];
                return (
                  <div key={i} className="bg-white border rounded-[12px] px-4 py-3.5 flex items-start gap-3 shadow-sm"
                    style={{ borderColor: c.border + "40" }}>
                    <span className="text-[18px] shrink-0 mt-0.5">{ins.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: c.text }}>{ins.title}</p>
                      <p className="text-[12.5px] text-[#475569] mt-0.5 leading-relaxed">{ins.body}</p>
                    </div>
                    {ins.action && (
                      <button onClick={ins.action}
                        className={`shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-[6px] transition-colors ${c.btn}`}>
                        {ins.actionLabel}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Acciones prioritarias (1/3) */}
          <div>
            <h2 className="text-[13.5px] font-semibold text-[#0F172A] mb-3">Acción inmediata</h2>
            {prioridades.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] px-4 py-6 text-center">
                <span className="text-[24px]">✅</span>
                <p className="text-[13px] font-medium text-[#0F172A] mt-2">Sin prioridades</p>
                <p className="text-[12px] text-[#9CA3AF] mt-1">No hay facturas urgentes</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {prioridades.map(({ f, urgencia, color, bg }, i) => (
                  <div key={f.id} className="bg-white border border-[#E2E8F0] rounded-[12px] p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>{urgencia}</span>
                      <span className="text-[12px] font-bold text-[#0F172A] tabular-nums">{formatCLP(f.monto)}</span>
                    </div>
                    <p className="text-[12.5px] font-medium text-[#0F172A] truncate">{f.deudores?.razon_social ?? "—"}</p>
                    <p className="text-[11.5px] text-[#6B7280] mt-0.5">N°{f.numero} · vence {new Date(f.fecha_vencimiento).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}</p>
                  </div>
                ))}
                <button onClick={() => setShowConc(true)}
                  className="w-full text-[12px] text-[#2563EB] font-medium py-2 border border-[#DBEAFE] rounded-[8px] hover:bg-[#EFF6FF] transition-colors bg-white">
                  Ver análisis completo →
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
