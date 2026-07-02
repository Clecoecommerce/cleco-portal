"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { scoreFacturas, ACTION_LABELS, ACTION_COLORS, TIPO_LABELS } from "@/lib/scoring";
import type { ScoredFactura, ActionTier } from "@/lib/scoring";
import { formatCLP, formatDate } from "@/lib/utils";
import { InvoiceDrawer } from "@/components/ui/InvoiceDrawer";
import { DebtorDrawer } from "@/components/ui/DebtorDrawer";
import { DateRangeFilter, EMPTY_DATE_RANGE, inDateRange, type DateRange } from "@/components/ui/DateRangeFilter";

// ── Avatar util ───────────────────────────────────────────────────────────────
const AV = [["#DBEAFE","#1E40AF"],["#E0E7FF","#3730A3"],["#CFFAFE","#0E7490"],["#FEF3C7","#B7791F"],["#EDE9FE","#5B21B6"]];
function avatarStyle(name: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % AV.length;
  return { bg: AV[idx][0], fg: AV[idx][1] };
}
function initials(name: string) {
  const w = (name ?? "").replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ ]/g,"").trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? "")).toUpperCase() || "?";
}

// ── Chip filter ───────────────────────────────────────────────────────────────
type FilterKey = "todas" | ActionTier;

const CHIP_ROWS: { key: FilterKey; label: string; shortLabel?: string }[][] = [
  [
    { key: "todas",        label: "Todas" },
    { key: "contactar_hoy", label: "Contactar hoy" },
    { key: "recontactar",   label: "Recontactar" },
  ],
  [
    { key: "escalar",    label: "Escalar / Negociar" },
    { key: "monitorear", label: "Monitorear" },
    { key: "ceder",      label: "Ceder / Condonar" },
  ],
];

// Columnas exactas del diseño (Deudor · N°/RUT · Vencimiento · Monto · Score · Acción · chevron)
const GRID_COLS = "minmax(0,2.3fr) 1.05fr 1.15fr 1fr 86px minmax(0,1.5fr) 26px";

type SortKey = "deudor" | "venc" | "monto" | "score";

// ── Main ──────────────────────────────────────────────────────────────────────
export function BandejaClient({ facturas: raw, profileName = "Equipo de Cobranza" }: { facturas: any[]; profileName?: string }) {
  const params       = useSearchParams();
  const [filter, setFilter]       = useState<FilterKey>("todas");
  const [search, setSearch]       = useState(params?.get("q") ?? "");
  const [invoiceRow, setInvoiceRow] = useState<ScoredFactura | null>(null);
  const [debtorRow,  setDebtorRow]  = useState<ScoredFactura | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE_RANGE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };
  const sortArrow = (key: SortKey) => (sortKey === key ? (sortDir === "desc" ? "↓" : "↑") : "");

  // sync header search param
  useEffect(() => {
    const q = params?.get("q");
    if (q) setSearch(q);
  }, [params]);

  const scored = useMemo(() => scoreFacturas(raw), [raw]);

  const counts = useMemo(() => scored.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] ?? 0) + 1;
    return acc;
  }, { todas: scored.length }), [scored]);

  const filtered = useMemo(() => scored.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q
      || r.deudores?.razon_social?.toLowerCase().includes(q)
      || r.deudores?.rut?.toLowerCase().includes(q)
      || r.numero?.toLowerCase().includes(q);
    const matchF = filter === "todas" || r.action === filter;
    const matchD = inDateRange(r.fecha_vencimiento, dateRange);
    return matchQ && matchF && matchD;
  }), [scored, search, filter, dateRange]);

  const sorted = useMemo(() => {
    const dir = sortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "deudor": return dir * (a.deudores?.razon_social ?? "").localeCompare(b.deudores?.razon_social ?? "");
        case "venc":   return dir * (new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());
        case "monto":  return dir * (a.monto - b.monto);
        default:       return dir * (a.score - b.score);
      }
    });
  }, [filtered, sortKey, sortDir]);

  const totalFiltered = filtered.reduce((s, r) => s + r.monto, 0);

  const openInvoice = (row: ScoredFactura) => { setDebtorRow(null); setInvoiceRow(row); };
  const openDebtor  = (row: ScoredFactura) => { setInvoiceRow(null); setDebtorRow(row); };

  return (
    <>
      {/* Drawers */}
      {invoiceRow && (
        <InvoiceDrawer row={invoiceRow} onClose={() => setInvoiceRow(null)} onOpenDebtor={openDebtor} profileName={profileName} />
      )}
      {debtorRow && (
        <DebtorDrawer row={debtorRow} allRows={scored} onClose={() => setDebtorRow(null)} onOpenInvoice={openInvoice} />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 700, color: "#2563EB", textTransform: "uppercase", marginBottom: 6 }}>
          Cobranza · Priorizada por score
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1.1, margin: 0 }}>Bandeja de cobranza</h1>
          <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>
            {scored.length} facturas · {filter === "todas" ? "todas las acciones" : ACTION_LABELS[filter as ActionTier]}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar deudor, RUT o N°…"
              style={{ width: "100%", height: 34, paddingLeft: 32, paddingRight: 12, border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#0F172A", background: "#F8FAFC" }}
              onFocus={e => (e.target.style.borderColor = "#2563EB")}
              onBlur={e => (e.target.style.borderColor = "#E2E8F0")} />
          </div>
          {search && (
            <button onClick={() => setSearch("")} style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontFamily: "inherit" }}>Limpiar</button>
          )}
          {/* Vencimiento */}
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Chip rows */}
        {CHIP_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: ri === 0 ? 0 : 6 }}>
            {row.map(({ key, label }) => {
              const isActive = filter === key;
              let chipBg = isActive ? "#0F172A" : "#F1F5F9";
              let chipColor = isActive ? "#FFFFFF" : "#6B7280";
              if (!isActive && key !== "todas") {
                const ac = ACTION_COLORS[key as ActionTier];
                chipBg = ac.bg;
                chipColor = ac.text;
              }
              return (
                <button key={key} onClick={() => setFilter(key)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: isActive ? "none" : "1px solid transparent", background: chipBg, color: chipColor, transition: "all .12s" }}>
                  {key !== "todas" && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#FFFFFF" : (ACTION_COLORS[key as ActionTier]?.text ?? "#9CA3AF"), display: "inline-block", flexShrink: 0 }} />
                  )}
                  {label}
                  <span style={{ opacity: .75, fontSize: 11.5 }}>({key === "todas" ? scored.length : (counts[key] ?? 0)})</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,.05)", overflow: "hidden" }}>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F1F5F9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
              {scored.length === 0 ? "Bandeja vacía" : "Sin resultados"}
            </div>
            <div style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 280, margin: "0 auto" }}>
              {scored.length === 0 ? "Sube facturas desde el Panel para empezar." : "Prueba con otro filtro o búsqueda."}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: GRID_COLS, gap: 14, padding: "13px 22px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 11, letterSpacing: ".07em", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase" }}>
              <div onClick={() => toggleSort("deudor")} style={{ cursor: "pointer", userSelect: "none" }}>Deudor {sortArrow("deudor")}</div>
              <div>N° / RUT</div>
              <div onClick={() => toggleSort("venc")} style={{ cursor: "pointer", userSelect: "none" }}>Vencimiento {sortArrow("venc")}</div>
              <div onClick={() => toggleSort("monto")} style={{ cursor: "pointer", userSelect: "none", textAlign: "right" }}>Monto CLP {sortArrow("monto")}</div>
              <div onClick={() => toggleSort("score")} style={{ cursor: "pointer", userSelect: "none", textAlign: "center" }}>Score {sortArrow("score")}</div>
              <div>Acción recomendada</div>
              <div />
            </div>

            {/* Rows */}
            {sorted.map(r => {
              const ac   = ACTION_COLORS[r.action];
              const av   = avatarStyle(r.deudores?.razon_social ?? "");
              const ini  = initials(r.deudores?.razon_social ?? "");
              const mora = r.moraDias;
              const moraLabel = mora > 0 ? `${mora}d vencida` : mora === 0 ? "Vence hoy" : `En ${-mora}d`;
              const moraColor = mora > 0 ? "#DC2626" : mora === 0 ? "#B7791F" : "#9CA3AF";
              const tipoLabel = r.deudores?.tipo ? TIPO_LABELS[r.deudores.tipo] : null;
              const subLabel  = [tipoLabel, r.deudores?.comuna].filter(Boolean).join(" · ");

              return (
                <div key={r.id}
                  onClick={() => openInvoice(r)}
                  style={{ display: "grid", gridTemplateColumns: GRID_COLS, gap: 14, alignItems: "center", padding: "13px 22px", borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background .12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>

                  {/* Deudor */}
                  <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); openDebtor(r); }}
                      style={{ width: 36, height: 36, borderRadius: 9, background: av.bg, color: av.fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0, border: "none", cursor: "pointer" }}>
                      {ini}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.deudores?.razon_social ?? "—"}
                      </div>
                      {subLabel && (
                        <div style={{ fontSize: 11.5, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subLabel}</div>
                      )}
                    </div>
                  </div>

                  {/* N° / RUT */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", fontVariantNumeric: "tabular-nums" }}>N° {r.numero}</div>
                    <div style={{ fontSize: 11.5, color: "#9CA3AF", fontVariantNumeric: "tabular-nums" }}>{r.deudores?.rut ?? "—"}</div>
                  </div>

                  {/* Vencimiento */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{formatDate(r.fecha_vencimiento)}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: moraColor }}>{moraLabel}</div>
                  </div>

                  {/* Monto */}
                  <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{formatCLP(r.monto)}</div>

                  {/* Score */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 9px", borderRadius: 9, background: ac.bg, minWidth: 46 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: ac.color, fontVariantNumeric: "tabular-nums" }}>{r.score}</div>
                    </div>
                  </div>

                  {/* Acción */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: ac.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: ac.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ACTION_LABELS[r.action]}</span>
                  </div>

                  {/* Chevron */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div style={{ padding: "11px 16px", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: "#9CA3AF" }}>
            <span>{filtered.length} facturas · Total <strong style={{ color: "#0F172A" }}>{formatCLP(totalFiltered)}</strong></span>
            <span>Score promedio <strong style={{ color: "#0F172A" }}>{Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length)}</strong></span>
          </div>
        )}
      </div>
    </>
  );
}
