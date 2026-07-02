"use client";

import { useMemo, useState } from "react";
import { scoreFacturas, getAction, ACTION_LABELS, ACTION_COLORS } from "@/lib/scoring";
import type { ActionTier } from "@/lib/scoring";
import { formatCLP } from "@/lib/utils";
import { DateRangeFilter, EMPTY_DATE_RANGE, inDateRange, type DateRange } from "@/components/ui/DateRangeFilter";

interface Props { facturas: any[] }

const AGING_BUCKETS = [
  { label: "0–30 días",   min: 0,  max: 30  },
  { label: "31–60 días",  min: 31, max: 60  },
  { label: "61–90 días",  min: 61, max: 90  },
  { label: "91–180 días", min: 91, max: 180 },
  { label: "+180 días",   min: 181, max: Infinity },
];

const TIER_ORDER: ActionTier[] = ["contactar_hoy", "recontactar", "escalar", "monitorear", "ceder"];

export function ReportesClient({ facturas: raw }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE_RANGE);

  const scoredAll = useMemo(() => scoreFacturas(raw), [raw]);
  const scored = useMemo(
    () => scoredAll.filter(r => inDateRange(r.fecha_vencimiento, dateRange)),
    [scoredAll, dateRange]
  );

  const totalMonto    = scored.reduce((s, r) => s + r.monto, 0);
  const urgentes      = scored.filter(r => r.action === "contactar_hoy");
  const montoUrgente  = urgentes.reduce((s, r) => s + r.monto, 0);
  const scorePromedio = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
  const moraPromedio  = scored.length ? Math.round(scored.reduce((s, r) => s + r.moraDias, 0) / scored.length) : 0;

  // Aging buckets
  const aging = AGING_BUCKETS.map(b => {
    const rows = scored.filter(r => r.moraDias >= b.min && r.moraDias <= b.max);
    return { ...b, count: rows.length, monto: rows.reduce((s, r) => s + r.monto, 0) };
  });
  const maxAgingMonto = Math.max(...aging.map(b => b.monto), 1);

  // Distribution
  const dist = TIER_ORDER.map(t => {
    const rows = scored.filter(r => r.action === t);
    return { action: t, count: rows.length, monto: rows.reduce((s, r) => s + r.monto, 0), pct: scored.length ? Math.round(rows.length / scored.length * 100) : 0 };
  });

  // Top debtors
  const byDebtor: Record<string, { name: string; count: number; monto: number; score: number }> = {};
  for (const r of scored) {
    const k = r.deudor_id ?? r.deudores?.rut ?? "sin_rut";
    if (!byDebtor[k]) byDebtor[k] = { name: r.deudores?.razon_social ?? "—", count: 0, monto: 0, score: 0 };
    byDebtor[k].count++;
    byDebtor[k].monto += r.monto;
    byDebtor[k].score = Math.max(byDebtor[k].score, r.score);
  }
  const topDebtors = Object.values(byDebtor).sort((a, b) => b.monto - a.monto).slice(0, 5);

  const empty = scored.length === 0;

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 700, color: "#2563EB", textTransform: "uppercase", marginBottom: 6 }}>
            Análisis · Cartera de cobranza
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.1 }}>Reportes</h1>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".08em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Vencimiento</div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {empty ? (
        <div style={{ padding: "80px 20px", textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "#F1F5F9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3v18h18"/><polyline points="7 14 11 10 15 13 21 7"/></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Sin datos de reporte</div>
          <div style={{ fontSize: 13.5, color: "#9CA3AF", maxWidth: 300, margin: "0 auto" }}>
            {scoredAll.length > 0
              ? "No hay facturas con vencimiento en el rango de fechas seleccionado."
              : "Sube facturas en Carga inteligente para generar reportes de tu cartera."}
          </div>
        </div>
      ) : (<>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 20 }} className="sm:grid-cols-4">
          {[
            { label: "Total en cartera",   value: formatCLP(totalMonto),        sub: `${scored.length} facturas activas`,    color: "#0F172A", accent: "#E2E8F0" },
            { label: "Monto urgente",       value: formatCLP(montoUrgente),      sub: `${urgentes.length} facturas "Contactar hoy"`, color: "#B23B3B", accent: "#FBE9E9" },
            { label: "Score promedio",      value: String(scorePromedio),        sub: "IA · Motor de priorización",           color: "#1A5FA5", accent: "#EFF6FF" },
            { label: "Mora promedio",       value: `${moraPromedio}d`,           sub: "promedio ponderado",                   color: "#B7791F", accent: "#FBF3E1" },
          ].map(k => (
            <div key={k.label} style={{ padding: "18px 20px", background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 10 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="max-lg:grid-cols-1">

          {/* Aging chart */}
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: "20px 22px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Antigüedad de mora</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Distribución por tramo · CLP</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {aging.map(b => {
                const pct = maxAgingMonto > 0 ? Math.round(b.monto / maxAgingMonto * 100) : 0;
                const isHigh = b.min >= 91;
                const barColor = isHigh ? "#DC2626" : b.min >= 31 ? "#B7791F" : "#2563EB";
                return (
                  <div key={b.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600, color: isHigh ? "#B23B3B" : "#1E293B" }}>{b.label}</span>
                      <span style={{ fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>
                        {b.count > 0 ? formatCLP(b.monto) : "—"} <span style={{ color: "#9CA3AF", fontWeight: 500 }}>({b.count})</span>
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "#F1F5F9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, transition: "width .6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action distribution */}
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: "20px 22px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Distribución por acción</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Cartera según recomendación del motor IA</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {dist.map(d => {
                const ac = ACTION_COLORS[d.action];
                return (
                  <div key={d.action} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: ac.text, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "#1E293B" }}>{ACTION_LABELS[d.action]}</span>
                        <span style={{ color: "#9CA3AF" }}>{d.count} · {d.pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "#F1F5F9", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${d.pct}%`, background: ac.text, borderRadius: 3, transition: "width .6s ease" }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 80, textAlign: "right" }}>
                      {d.monto > 0 ? formatCLP(d.monto) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top debtors */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: "20px 22px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Top deudores por monto</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Mayores concentraciones de riesgo en cartera</div>
          {topDebtors.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "24px 0" }}>Sin datos</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    {["Deudor", "Facturas", "Monto total", "Score máx."].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#9CA3AF", padding: "8px 12px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topDebtors.map((d, i) => {
                    const scoreColor = ACTION_COLORS[getAction(d.score)].text;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #F8FAFC" }}>
                        <td style={{ padding: "12px 12px", fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{d.name}</td>
                        <td style={{ padding: "12px 12px", fontSize: 13, color: "#6B7280" }}>{d.count}</td>
                        <td style={{ padding: "12px 12px", fontSize: 13.5, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{formatCLP(d.monto)}</td>
                        <td style={{ padding: "12px 12px" }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor }}>{d.score}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Methodology footer */}
        <div style={{ marginTop: 16, padding: "14px 20px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, fontSize: 12, color: "#9CA3AF" }}>
          <strong style={{ color: "#1E293B" }}>Motor IA · </strong>
          Antigüedad 30% · Monto 25% · Historial 20% · Contactos 15% · Tipo deudor 10%
        </div>
      </>)}
    </>
  );
}
