"use client";

import type { ScoredFactura } from "@/lib/scoring";
import { ACTION_LABELS, ACTION_COLORS } from "@/lib/scoring";
import { formatCLP } from "@/lib/utils";

interface Props {
  row: ScoredFactura | null;       // any factura belonging to this debtor
  allRows: ScoredFactura[];        // all scored facturas (to find siblings)
  onClose: () => void;
  onOpenInvoice?: (row: ScoredFactura) => void;
}

function initials(name: string) {
  const w = name.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ ]/g,"").trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? "")).toUpperCase();
}

export function DebtorDrawer({ row, allRows, onClose, onOpenInvoice }: Props) {
  if (!row) return null;

  const d = row.deudores;
  const nombre = d?.razon_social ?? "—";
  const ini    = initials(nombre);

  // All open invoices for this debtor
  const facturas = allRows.filter(r => r.deudor_id === row.deudor_id);
  const totalMonto = facturas.reduce((s, r) => s + r.monto, 0);
  const maxScore   = Math.max(...facturas.map(r => r.score));
  const topAction  = facturas.find(r => r.score === maxScore)?.action ?? "ceder";

  const avgMora = facturas.length
    ? Math.round(facturas.reduce((s, r) => s + r.moraDias, 0) / facturas.length)
    : 0;
  // Confiabilidad: valor real guardado en la ficha del deudor (no recalculado)
  const confiabilidad = d?.confiabilidad ?? 50;
  const confiBarColor = confiabilidad >= 70 ? "#1F7A4D" : confiabilidad >= 45 ? "#B7791F" : "#DC2626";
  const confiLabel    = confiabilidad >= 70 ? "Pagador confiable" : confiabilidad >= 45 ? "Pagador irregular" : "Alto riesgo de impago";

  const riesgoLabel = confiabilidad < 40 ? "Riesgoso" : confiabilidad < 70 ? "Moderado" : "Confiable";
  const riesgoColor = confiabilidad < 40 ? "#DC2626" : confiabilidad < 70 ? "#B7791F" : "#1F7A4D";

  const ac = ACTION_COLORS[topAction];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.35)", zIndex: 60, backdropFilter: "blur(2px)" }} />

      {/* Panel */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", background: "#FFFFFF", zIndex: 61, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(15,23,42,.18)", animation: "slideRight .22s cubic-bezier(.22,1,.36,1)" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 13, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F1F5F9", color: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{ini}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{d?.rut ?? "—"} {d?.giro ? `· ${d.giro}` : ""}</div>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Dark stats bar */}
        <div style={{ background: "#0F172A", padding: "16px 20px", display: "flex", gap: 0, flexShrink: 0 }}>
          {[
            { label: "facturas abiertas", value: String(facturas.length) },
            { label: "en cartera",        value: formatCLP(totalMonto) },
            { label: riesgoLabel,         value: `cliente desde ${new Date().getFullYear() - 3}`, color: riesgoColor },
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, borderLeft: i > 0 ? "1px solid #1E293B" : "none", paddingLeft: i > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color ?? "#FFFFFF", lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>

          {/* Confiabilidad */}
          <div style={{ padding: "16px 18px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Confiabilidad de pago</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: confiBarColor }}>{confiabilidad}/100</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#E2E8F0", overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", width: `${confiabilidad}%`, background: confiBarColor, borderRadius: 4, transition: "width .6s ease" }} />
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>{confiLabel} {avgMora > 0 ? `· Paga ~${avgMora} días tras el vencimiento` : ""}</div>
          </div>

          {/* Contact info */}
          {(d?.nombre_contacto || d?.email_contacto || d?.telefono_contacto || d?.giro) && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 14 }}>Contacto</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {d?.nombre_contacto && (
                  <div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Contacto</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{d.nombre_contacto}</div>
                    {d?.cargo && <div style={{ fontSize: 12, color: "#9CA3AF" }}>{d.cargo}</div>}
                  </div>
                )}
                {d?.giro && (
                  <div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Giro</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{d.giro}</div>
                  </div>
                )}
                {d?.email_contacto && (
                  <div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Email</div>
                    <a href={`mailto:${d.email_contacto}`} style={{ fontSize: 13, color: "#2563EB", textDecoration: "none" }}>{d.email_contacto}</a>
                  </div>
                )}
                {d?.telefono_contacto && (
                  <div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Teléfono</div>
                    <a href={`tel:${d.telefono_contacto}`} style={{ fontSize: 13, color: "#0F172A", textDecoration: "none", fontWeight: 600 }}>{d.telefono_contacto}</a>
                  </div>
                )}
                {(d?.direccion || d?.comuna) && (
                  <div style={{ gridColumn: "1/3" }}>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Dirección</div>
                    <div style={{ fontSize: 13, color: "#1E293B" }}>{[d?.direccion, d?.comuna].filter(Boolean).join(", ")}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Open invoices */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: ".1em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Facturas abiertas · {facturas.length}</div>
            </div>
            {facturas.map(r => {
              const fac = ACTION_COLORS[r.action];
              const dueColor = r.moraDias > 0 ? "#DC2626" : "#9CA3AF";
              const dueLabel = r.moraDias > 0 ? `${r.moraDias}d vencida` : r.moraDias === 0 ? "Hoy" : `En ${-r.moraDias}d`;
              return (
                <button key={r.id} onClick={() => onOpenInvoice?.(r)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 11, border: "1px solid #F1F5F9", background: "#F8FAFC", cursor: "pointer", marginBottom: 8, fontFamily: "inherit", textAlign: "left" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: fac.color, minWidth: 28, fontVariantNumeric: "tabular-nums" }}>{r.score}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>N° {r.numero}</div>
                    <div style={{ fontSize: 11.5, color: dueColor, fontWeight: 600 }}>{dueLabel}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{formatCLP(r.monto)}</div>
                    <div style={{ fontSize: 11, color: fac.text, fontWeight: 700 }}>{ACTION_LABELS[r.action]}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6"/></svg>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
