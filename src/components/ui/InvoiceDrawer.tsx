"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScoredFactura } from "@/lib/scoring";
import { ACTION_LABELS, ACTION_COLORS, ACTION_DESCRIPTIONS, TIPO_LABELS, factorBarColor } from "@/lib/scoring";
import { formatCLP, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Props {
  row: ScoredFactura | null;
  onClose: () => void;
  onOpenDebtor?: (row: ScoredFactura) => void;
  profileName?: string;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const AV = [["#DBEAFE","#1E40AF"],["#E0E7FF","#3730A3"],["#CFFAFE","#0E7490"],["#FEF3C7","#B7791F"],["#EDE9FE","#5B21B6"]];
function initials(name: string) {
  const w = (name ?? "").replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ ]/g,"").trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? "")).toUpperCase() || "?";
}
function avatarStyle(name: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % AV.length;
  return { bg: AV[idx][0], fg: AV[idx][1] };
}

// ── Factor row ────────────────────────────────────────────────────────────────
function FactorBar({ label, weight, detail, score }: { label: string; weight: number; detail: string; score: number }) {
  const color = factorBarColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
      <div style={{ width: 108, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
          {label} <span style={{ fontWeight: 600, color: "#6B7280", fontSize: 11 }}>{weight}%</span>
        </div>
        <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>{detail}</div>
      </div>
      <div style={{ flex: 1, height: 8, borderRadius: 5, background: "#E2E8F0", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 5, transition: "width .7s ease" }} />
      </div>
      <div style={{ width: 30, textAlign: "right", fontSize: 13, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{score}</div>
    </div>
  );
}

// ── Contact templates ─────────────────────────────────────────────────────────
function ContactTemplates({ row, profileName }: { row: ScoredFactura; profileName: string }) {
  const [tab, setTab] = useState<"whatsapp"|"email"|"sms">("whatsapp");
  const [copied, setCopied] = useState(false);

  const deudor   = row.deudores?.razon_social ?? "el deudor";
  const monto    = formatCLP(row.monto);
  const numero   = `N° ${row.numero}`;
  const venc     = formatDate(row.fecha_vencimiento);
  const moraDias = row.moraDias;
  const moraStr  = moraDias > 0 ? ` (${moraDias} días)` : "";

  const templates: Record<typeof tab, string> = {
    whatsapp:
`Hola, le escribimos de ${profileName} 👋

Le recordamos la factura electrónica ${numero} por ${monto}, que venció el ${venc}${moraStr}.

¿Podría confirmarnos la fecha de pago? Quedamos atentos para coordinar.

Saludos,
Equipo de Cobranza`,
    email:
`Estimado/a ${deudor},

Mi nombre es [nombre] y me comunico en nombre de ${profileName}.

Le escribimos en relación a la factura ${numero} por ${monto}, con vencimiento el ${venc}${moraDias > 0 ? ` y actualmente con ${moraDias} días de mora` : ""}.

Le solicitamos coordinar el pago a la brevedad o indicarnos si existe alguna observación que impida su cancelación.

Quedamos a su disposición.

Atentamente,
Equipo de Cobranza — ${profileName}`,
    sms:
`${profileName}: Recordatorio factura ${numero} por ${monto} vencida el ${venc}${moraStr}. Contacte para coordinar pago.`,
  };

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "whatsapp", label: "WhatsApp" },
    { key: "email",    label: "Email" },
    { key: "sms",      label: "SMS" },
  ];

  const copy = () => {
    navigator.clipboard.writeText(templates[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 12 }}>
        Plantillas de contacto
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, height: 36, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "none", transition: "all .12s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: active ? "#0F172A" : "#F1F5F9",
                color:      active ? "#FFFFFF"  : "#6B7280" }}>
              {t.key === "whatsapp" && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              )}
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 15px", fontSize: 13, color: "#1E293B", lineHeight: 1.65, whiteSpace: "pre-wrap", fontFamily: "inherit", minHeight: 120 }}>
        {templates[tab]}
      </div>
      <button onClick={copy}
        style={{ width: "100%", textAlign: "center", fontSize: 13.5, fontWeight: 700, color: copied ? "#1F7A4D" : "#2563EB", background: "none", border: "none", cursor: "pointer", padding: "12px 0 4px", fontFamily: "inherit" }}>
        {copied ? "✓ Copiado" : "Copiar plantilla"}
      </button>
    </>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────
export function InvoiceDrawer({ row, onClose, onOpenDebtor, profileName = "Equipo de Cobranza" }: Props) {
  const router = useRouter();
  if (!row) return null;

  const ac  = ACTION_COLORS[row.action];
  const av  = avatarStyle(row.deudores?.razon_social ?? "?");
  const ini = initials(row.deudores?.razon_social ?? "?");

  const moraDias  = row.moraDias;
  const dueLabel  = moraDias > 0 ? `${moraDias} d vencida` : moraDias === 0 ? "Vence hoy" : `En ${-moraDias}d`;
  const dueColor  = moraDias > 0 ? "#DC2626" : moraDias === 0 ? "#B7791F" : "#1F7A4D";
  const emitida   = row.created_at ? formatDate(row.created_at) : null;

  const onMarcarAccion = async () => {
    const supabase = createClient();
    await supabase
      .from("facturas")
      .update({ contactos_intentados: (row.contactos_intentados ?? 0) + 1 })
      .eq("id", row.id);
    onClose();
    router.refresh();
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.35)", zIndex: 60, backdropFilter: "blur(2px)" }} />

      {/* Panel */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 100vw)", background: "#FFFFFF", zIndex: 61, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(15,23,42,.18)", animation: "slideRight .22s cubic-bezier(.22,1,.36,1)" }}>

        {/* Header */}
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: av.bg, color: av.fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{ini}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {row.deudores?.razon_social ?? "—"}
              </span>
              {onOpenDebtor && (
                <button onClick={() => onOpenDebtor(row)} title="Ver perfil"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9CA3AF", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </button>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>
              N° {row.numero} · {row.deudores?.rut ?? "—"}{row.deudores?.tipo ? ` · ${TIPO_LABELS[row.deudores.tipo]}` : ""}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 12px" }}>

          {/* Score + action */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 46, fontWeight: 500, lineHeight: 1, color: ac.color }}>{row.score}</div>
              <div style={{ fontSize: 10.5, letterSpacing: ".1em", color: "#9CA3AF", fontWeight: 700 }}>SCORE</div>
            </div>
            <div style={{ paddingTop: 4 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: ac.text, background: ac.bg, padding: "5px 12px", borderRadius: 20, marginBottom: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: ac.color }} />
                {ACTION_LABELS[row.action]}
              </span>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{ACTION_DESCRIPTIONS[row.action]}</p>
            </div>
          </div>

          {/* Desglose del score */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 2 }}>Desglose del score</div>
            <FactorBar label="Antigüedad"           weight={row.factors.antiguedad.weight}  detail={row.factors.antiguedad.detail}  score={row.factors.antiguedad.score} />
            <FactorBar label="Monto"                weight={row.factors.monto.weight}       detail={row.factors.monto.detail}       score={row.factors.monto.score} />
            <FactorBar label="Historial deudor"     weight={row.factors.historial.weight}   detail={row.factors.historial.detail}   score={row.factors.historial.score} />
            <FactorBar label="Contactos intentados" weight={row.factors.contactos.weight}   detail={row.factors.contactos.detail}   score={row.factors.contactos.score} />
            <FactorBar label="Tipo de deudor"       weight={row.factors.tipoDeudor.weight}  detail={row.factors.tipoDeudor.detail}  score={row.factors.tipoDeudor.score} />
          </div>

          {/* Monto + Vencimiento */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ padding: "13px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12 }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Monto total</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{formatCLP(row.monto)}</div>
            </div>
            <div style={{ padding: "13px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12 }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Vencimiento</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{formatDate(row.fecha_vencimiento)}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: dueColor, marginTop: 3 }}>{dueLabel}</div>
            </div>
          </div>

          {/* Detalle / notas */}
          {(row.notas || emitida) && (
            <div style={{ padding: "13px 14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Detalle</div>
              {row.notas && <div style={{ fontSize: 13.5, color: "#0F172A", lineHeight: 1.55 }}>{row.notas}</div>}
              {emitida && (
                <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: row.notas ? 6 : 0 }}>Emitida {emitida}</div>
              )}
            </div>
          )}

          {/* Quick contact buttons */}
          {(row.deudores?.telefono_contacto || row.deudores?.email_contacto) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {row.deudores?.telefono_contacto && (
                <a href={`tel:${row.deudores.telefono_contacto}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#1E293B", textDecoration: "none" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 012 2.18 2 2 0 014 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                  Llamar
                </a>
              )}
              {row.deudores?.telefono_contacto && (
                <a href={`https://wa.me/${row.deudores.telefono_contacto.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "1px solid #dcfce7", background: "#f0fdf4", color: "#166534", textDecoration: "none" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
              {row.deudores?.email_contacto && (
                <a href={`mailto:${row.deudores.email_contacto}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#1E293B", textDecoration: "none" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Correo
                </a>
              )}
            </div>
          )}

          {/* Templates */}
          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 18 }}>
            <ContactTemplates row={row} profileName={profileName} />
          </div>
        </div>

        {/* Sticky bottom CTA */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid #F1F5F9", background: "#FFFFFF", flexShrink: 0, display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onMarcarAccion}
            style={{ flex: 1, height: 46, borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", border: "none", color: "#FFFFFF", background: ac.color, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 14px -2px ${ac.color}55` }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Marcar como &ldquo;{ACTION_LABELS[row.action]}&rdquo;
          </button>
          {onOpenDebtor && (
            <button onClick={(e) => { e.stopPropagation(); onOpenDebtor(row); }} title="Ver perfil del deudor"
              style={{ width: 46, height: 46, borderRadius: 12, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>
                <path d="M16 5.2a3.2 3.2 0 0 1 0 6M18 20a5.5 5.5 0 0 0-3-4.9"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
