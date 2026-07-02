"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ScoredFactura, ActionTier } from "@/lib/scoring";
import { ACTION_LABELS, ACTION_COLORS } from "@/lib/scoring";
import { formatCLP } from "@/lib/utils";
import { SmartUploadModal } from "@/components/ui/SmartUploadModal";
import { InvoiceDrawer } from "@/components/ui/InvoiceDrawer";
import { DebtorDrawer } from "@/components/ui/DebtorDrawer";

interface Props {
  scored: ScoredFactura[];
  firstName: string;
  profileId: string;
  profileName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const AV_COLORS = [
  ["#DBEAFE","#1E40AF"],["#E0E7FF","#3730A3"],["#CFFAFE","#0E7490"],
  ["#FEF3C7","#B7791F"],["#EDE9FE","#5B21B6"],["#E5F4EC","#1F7A4D"],
];
function getAvatar(name: string, idx: number) {
  const pair  = AV_COLORS[idx % AV_COLORS.length];
  const words = name.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ ]/g,"").trim().split(/\s+/);
  return { bg: pair[0], fg: pair[1], initials: ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() };
}

function computeStats(rows: ScoredFactura[]) {
  const count  = rows.length;
  const total  = rows.reduce((s, r) => s + r.monto, 0);
  const avg    = count ? Math.round(rows.reduce((s, r) => s + r.score, 0) / count) : 0;
  const urgent = rows.filter(r => r.action === "contactar_hoy");
  const venc   = rows.filter(r => r.moraDias > 0);
  const alDia  = rows.filter(r => r.moraDias <= 0);

  const tiers: ActionTier[] = ["contactar_hoy","recontactar","escalar","monitorear","ceder"];
  const dist: Record<string, { count: number; sum: number; pct: number }> = {};
  tiers.forEach(t => {
    const items = rows.filter(r => r.action === t);
    dist[t] = { count: items.length, sum: items.reduce((s, r) => s + r.monto, 0), pct: count ? Math.round(items.length / count * 100) : 0 };
  });

  const aging = [
    { label: "Por vencer", color: "#1F7A4D", items: rows.filter(r => r.moraDias <= 0) },
    { label: "1–30 d",     color: "#B7791F", items: rows.filter(r => r.moraDias > 0  && r.moraDias <= 30) },
    { label: "31–60 d",    color: "#C2410C", items: rows.filter(r => r.moraDias > 30 && r.moraDias <= 60) },
    { label: "61–90 d",    color: "#DC2626", items: rows.filter(r => r.moraDias > 60 && r.moraDias <= 90) },
    { label: "+90 d",      color: "#7F1D1D", items: rows.filter(r => r.moraDias > 90) },
  ].map(b => ({ ...b, sum: b.items.reduce((s, r) => s + r.monto, 0), count: b.items.length }));

  const byDebtor: Record<string, { id: string; nombre: string; sum: number; count: number; maxScore: number; action: ActionTier; row: ScoredFactura }> = {};
  rows.forEach(r => {
    const k = r.deudor_id;
    if (!byDebtor[k]) byDebtor[k] = { id: k, nombre: r.deudores?.razon_social ?? "—", sum: 0, count: 0, maxScore: 0, action: r.action, row: r };
    byDebtor[k].sum += r.monto;
    byDebtor[k].count++;
    if (r.score > byDebtor[k].maxScore) { byDebtor[k].maxScore = r.score; byDebtor[k].action = r.action; byDebtor[k].row = r; }
  });
  const topDebtors = Object.values(byDebtor).sort((a, b) => b.sum - a.sum).slice(0, 5);

  return { count, total, avg, urgent, venc, alDia, dist, aging, topDebtors, tiers };
}

// ── Score gauge ───────────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const r = 50, circ = 2 * Math.PI * r;
  const color = score >= 65 ? "#DC2626" : score >= 40 ? "#B7791F" : "#1F7A4D";
  const label = score >= 65 ? "Cartera bajo presión" : score >= 40 ? "Cartera mixta" : "Cartera saludable";
  const hint  = score >= 65 ? "Prioriza contactos urgentes del día." : score >= 40 ? "Gestión estructurada necesaria." : "Pocos casos urgentes hoy.";
  return (
    <div className="flex items-center gap-5">
      <div style={{ position: "relative", width: 112, height: 112, flexShrink: 0 }}>
        <svg width="112" height="112" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="13"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
            strokeDasharray={circ.toFixed(1)} strokeDashoffset={(circ * (1 - score / 100)).toFixed(1)}
            transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s ease" }}/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 36, fontWeight: 500, lineHeight: 1, color: "#0F172A" }}>{score}</div>
          <div style={{ fontSize: 10, letterSpacing: ".08em", color: "#9CA3AF", fontWeight: 600 }}>/ 100</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Score prom.</div>
        <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 5 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4, lineHeight: 1.45, maxWidth: 180 }}>{hint}</div>
      </div>
    </div>
  );
}

const Card = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={className} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, boxShadow: "0 1px 2px rgba(15,23,42,.05),0 10px 24px -16px rgba(15,23,42,.14)", ...style }}>
    {children}
  </div>
);

function LayoutBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "inherit", background: active ? "#FFFFFF" : "transparent", color: active ? "#0F172A" : "#6B7280", boxShadow: active ? "0 1px 2px rgba(15,23,42,.14)" : "none", transition: "all .15s" }}>
      {label}
    </button>
  );
}

type Layout = "triage" | "ejecutivo" | "compacto";

// ── Row component shared between triage & compacto ────────────────────────────
function InvoiceRow({ r, idx, onOpen, compact = false }: { r: ScoredFactura; idx: number; onOpen: (r: ScoredFactura) => void; compact?: boolean }) {
  const ac  = ACTION_COLORS[r.action];
  const av  = getAvatar(r.deudores?.razon_social ?? "—", idx);
  const dueColor = r.moraDias > 30 ? "#DC2626" : r.moraDias > 0 ? "#B7791F" : "#9CA3AF";
  const dueLabel = r.moraDias > 0 ? `${r.moraDias}d vencida` : r.moraDias === 0 ? "Vence hoy" : `En ${-r.moraDias}d`;

  if (compact) {
    return (
      <button onClick={() => onOpen(r)} style={{ display: "grid", gridTemplateColumns: "minmax(140px,2fr) 80px 100px 54px minmax(110px,1.3fr)", gap: 10, alignItems: "center", padding: "9px 16px", minWidth: 540, width: "100%", background: "none", border: "none", borderBottom: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
        onMouseLeave={e => (e.currentTarget.style.background = "")}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.deudores?.razon_social ?? "—"}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontVariantNumeric: "tabular-nums" }}>N° {r.numero}</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: dueColor, whiteSpace: "nowrap" }}>{dueLabel.replace(" vencida","v.").replace("En ","+")}  </div>
        <div style={{ textAlign: "right", fontSize: 12.5, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{formatCLP(r.monto)}</div>
        <div style={{ textAlign: "center", fontSize: 15, fontWeight: 800, color: ac.text }}>{r.score}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: ac.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ACTION_LABELS[r.action]}</div>
      </button>
    );
  }

  return (
    <button onClick={() => onOpen(r)} className="flex items-center gap-3 border-t border-[#F1F5F9] w-full text-left"
      style={{ padding: "10px 20px", background: "none", border: "none", borderTop: "1px solid #F1F5F9", cursor: "pointer", fontFamily: "inherit" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
      onMouseLeave={e => (e.currentTarget.style.background = "")}>
      <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0, background: av.bg, color: av.fg }}>{av.initials}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.deudores?.razon_social ?? "—"}</div>
        <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 1 }}>N° {r.numero} · <span style={{ color: dueColor, fontWeight: 600 }}>{dueLabel}</span></div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{formatCLP(r.monto)}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 40, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: ac.text }}>{r.score}</div>
        <div style={{ width: 28, height: 4, borderRadius: 3, background: "#E2E8F0", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${r.score}%`, background: ac.text, borderRadius: 3 }}/>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6"/></svg>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function PanelDashboard({ scored, firstName, profileId, profileName = "Equipo de Cobranza" }: Props) {
  const [layout, setLayout]         = useState<Layout>("triage");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [invoiceRow, setInvoiceRow] = useState<ScoredFactura | null>(null);
  const [debtorRow,  setDebtorRow]  = useState<ScoredFactura | null>(null);
  const router = useRouter();

  const s      = computeStats(scored);
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const today    = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const openInvoice = (r: ScoredFactura) => { setDebtorRow(null);  setInvoiceRow(r); };
  const openDebtor  = (r: ScoredFactura) => { setInvoiceRow(null); setDebtorRow(r);  };

  return (
    <>
      {/* Drawers */}
      {invoiceRow && (
        <InvoiceDrawer row={invoiceRow} onClose={() => setInvoiceRow(null)} onOpenDebtor={openDebtor} profileName={profileName} />
      )}
      {debtorRow && (
        <DebtorDrawer row={debtorRow} allRows={scored} onClose={() => setDebtorRow(null)} onOpenInvoice={openInvoice} />
      )}

      {uploadOpen && (
        <SmartUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} profileId={profileId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onCreated={(() => { setUploadOpen(false); router.refresh(); }) as any} />
      )}

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" style={{ animation: "ccIn .35s ease" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>
            Panel · {today}
          </div>
          <h1 style={{ fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, fontSize: 30, lineHeight: 1.1, letterSpacing: "-.01em", margin: 0, color: "#0F172A" }}>
            {greeting}, {firstName}
          </h1>
          <p style={{ margin: "7px 0 0", fontSize: 13.5, color: "#6B7280", lineHeight: 1.5 }}>
            {s.count} facturas en gestión
            {s.urgent.length > 0 && <> · <span style={{ color: "#DC2626", fontWeight: 700 }}>{s.urgent.length} urgentes hoy</span></>}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-white text-sm cursor-pointer border-0"
            style={{ background: "#2563EB", fontFamily: "inherit", boxShadow: "0 4px 12px -3px rgba(37,99,235,.45)", whiteSpace: "nowrap" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Subir factura
          </button>
          <div style={{ display: "flex", background: "#E2E8F0", borderRadius: 11, padding: 3, gap: 2 }}>
            <LayoutBtn active={layout === "triage"}    label="Triage"    onClick={() => setLayout("triage")} />
            <LayoutBtn active={layout === "ejecutivo"} label="Ejecutivo" onClick={() => setLayout("ejecutivo")} />
            <LayoutBtn active={layout === "compacto"}  label="Compacto"  onClick={() => setLayout("compacto")} />
          </div>
        </div>
      </div>

      {/* ════════════ TRIAGE ════════════ */}
      {layout === "triage" && (
        <div style={{ animation: "ccIn .22s ease" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <Card className="sm:col-span-2 lg:col-span-1" style={{ padding: "20px 22px" }}>
              <ScoreGauge score={s.avg} />
            </Card>
            <Card style={{ padding: "20px 22px" }}>
              <div className="flex items-center justify-between">
                <div style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>En gestión</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.9"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 40, fontWeight: 500, lineHeight: 1, marginTop: 9, color: "#0F172A" }}>{s.count}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{formatCLP(s.total)}</div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9", display: "flex", gap: 18 }}>
                <div><span style={{ fontSize: 16, fontWeight: 800, color: "#DC2626" }}>{s.venc.length}</span> <span style={{ fontSize: 12, color: "#9CA3AF" }}>vencidas</span></div>
                <div><span style={{ fontSize: 16, fontWeight: 800, color: "#1F7A4D" }}>{s.alDia.length}</span> <span style={{ fontSize: 12, color: "#9CA3AF" }}>al día</span></div>
              </div>
            </Card>
            <Card style={{ padding: "20px 22px" }}>
              <div className="flex items-center justify-between">
                <div style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Urgentes · hoy</div>
                {s.urgent.length > 0 && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#DC2626", display: "block", animation: "ccPulse 1.8s infinite" }}/>}
              </div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 40, fontWeight: 500, lineHeight: 1, marginTop: 9, color: "#DC2626" }}>{s.urgent.length}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{formatCLP(s.urgent.reduce((a, r) => a + r.monto, 0))}</div>
              {s.urgent.length > 0 ? (
                <button onClick={() => openInvoice(s.urgent[0])} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9", fontSize: 13, fontWeight: 700, color: "#2563EB", display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "12px 0 0" }}>
                  Ver más urgente →
                </button>
              ) : (
                <Link href="/dashboard/bandeja" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9", fontSize: 13, fontWeight: 700, color: "#2563EB", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
                  Ver bandeja →
                </Link>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 items-start">
            {/* Worklist */}
            <Card style={{ overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 20, fontWeight: 500, color: "#0F172A" }}>Qué hacer hoy</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Clic en cada fila para ver el detalle · {s.count} docs.</div>
                </div>
                <Link href="/dashboard/bandeja" style={{ fontSize: 12.5, fontWeight: 700, color: "#2563EB", textDecoration: "none", whiteSpace: "nowrap" }}>Ver todo →</Link>
              </div>

              {s.count === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>No hay facturas activas. Sube una para empezar.</div>
              ) : s.tiers.map(tier => {
                const items = sorted.filter(r => r.action === tier);
                if (!items.length) return null;
                const ac  = ACTION_COLORS[tier];
                const sum = items.reduce((sm, r) => sm + r.monto, 0);
                const displayed = (tier === "contactar_hoy" || tier === "recontactar") ? items : items.slice(0, 3);
                return (
                  <div key={tier}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px 6px", background: "#F8FAFC" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: ac.text, flexShrink: 0 }}/>
                      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", color: "#1E293B", textTransform: "uppercase" }}>{ACTION_LABELS[tier]}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: ac.text, background: ac.bg, padding: "1px 7px", borderRadius: 20 }}>{items.length}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}>{formatCLP(sum)}</span>
                    </div>
                    {displayed.map((r, idx) => <InvoiceRow key={r.id} r={r} idx={idx} onOpen={openInvoice} />)}
                  </div>
                );
              })}
            </Card>

            {/* Matrix */}
            <div className="flex flex-col gap-3">
              <Card style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 18, fontWeight: 500, color: "#0F172A", marginBottom: 2 }}>Distribución</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 13 }}>Cartera por acción</div>
                <div style={{ display: "flex", height: 8, borderRadius: 5, overflow: "hidden", marginBottom: 14, background: "#E2E8F0" }}>
                  {s.tiers.map(t => <div key={t} style={{ width: `${s.dist[t]?.pct ?? 0}%`, background: ACTION_COLORS[t].text }}/>)}
                </div>
                {s.tiers.map((t, i) => {
                  const ac = ACTION_COLORS[t];
                  const range = ["85–100","65–84","40–64","20–39","<20"][i];
                  return (
                    <Link href="/dashboard/bandeja" key={t} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 5px", borderRadius: 9, textDecoration: "none" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: ac.text }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>{ACTION_LABELS[t]}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>Score {range}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{s.dist[t]?.count ?? 0}</div>
                    </Link>
                  );
                })}
              </Card>
              <button onClick={() => setUploadOpen(true)} className="flex items-center justify-center gap-2 w-full h-11 rounded-xl font-bold text-sm cursor-pointer border-0"
                style={{ background: "#1E293B", color: "#E2E8F0", fontFamily: "inherit" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Nueva factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ EJECUTIVO ════════════ */}
      {layout === "ejecutivo" && (
        <div style={{ animation: "ccIn .22s ease" }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <Card style={{ padding: "18px 20px", background: "#0F172A" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Score prom.</div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 38, fontWeight: 500, lineHeight: 1, marginTop: 9, color: s.avg >= 65 ? "#FCA5A5" : s.avg >= 40 ? "#FCD34D" : "#6EE7B7" }}>{s.avg}</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>/ 100 pts.</div>
            </Card>
            <Card style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>En cartera</div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 38, fontWeight: 500, lineHeight: 1, marginTop: 9, color: "#0F172A" }}>{s.count}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{formatCLP(s.total)}</div>
            </Card>
            <Card style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Urgentes</div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 38, fontWeight: 500, lineHeight: 1, marginTop: 9, color: "#DC2626" }}>{s.urgent.length}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{formatCLP(s.urgent.reduce((a, r) => a + r.monto, 0))}</div>
            </Card>
            <Card style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Vencidas</div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 38, fontWeight: 500, lineHeight: 1, marginTop: 9, color: "#B7791F" }}>{s.venc.length}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>de {s.count} docs.</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3">
            {/* Aging chart */}
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 20, fontWeight: 500, color: "#0F172A" }}>Antigüedad de la cartera</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>Monto expuesto por tramo de mora</div>
              {(() => {
                const maxSum = Math.max(...s.aging.map(b => b.sum), 1);
                return (
                  <>
                    <div className="flex items-end justify-between gap-2" style={{ height: 130 }}>
                      {s.aging.map(b => (
                        <div key={b.label} className="flex flex-col items-center justify-end flex-1 h-full gap-1.5">
                          {b.sum > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: "#1E293B", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{formatCLP(b.sum).replace("$ ","$")}</div>}
                          <div style={{ width: "100%", maxWidth: 44, borderRadius: "6px 6px 0 0", background: b.color, height: Math.max(10, Math.round((b.sum / maxSum) * 112)) }}/>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between gap-2" style={{ padding: "10px 0 0", borderTop: "1px solid #F1F5F9" }}>
                      {s.aging.map(b => (
                        <div key={b.label} className="flex-1 text-center">
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B" }}>{b.label}</div>
                          <div style={{ fontSize: 11, color: "#9CA3AF" }}>{b.count} doc.</div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </Card>

            {/* Top debtors — click opens drawer */}
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 20, fontWeight: 500, color: "#0F172A", marginBottom: 3 }}>Mayor exposición</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>Clic para ver el deudor</div>
              {s.topDebtors.length === 0 ? (
                <div style={{ color: "#9CA3AF", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Sin datos</div>
              ) : s.topDebtors.map((d, i) => {
                const av = getAvatar(d.nombre, i);
                const maxSum = s.topDebtors[0]?.sum ?? 1;
                const ac = ACTION_COLORS[d.action];
                return (
                  <button key={i} onClick={() => openDebtor(d.row)}
                    className="flex items-center gap-3 w-full text-left"
                    style={{ padding: "9px 0", background: "none", border: "none", borderBottom: i < s.topDebtors.length - 1 ? "1px solid #F1F5F9" : "none", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0, background: av.bg, color: av.fg }}>{av.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.nombre}</div>
                      <div style={{ height: 4, borderRadius: 3, background: "#E2E8F0", overflow: "hidden", marginTop: 4 }}>
                        <div style={{ height: "100%", width: `${(d.sum / maxSum) * 100}%`, background: ac?.text ?? "#CBD5E1", borderRadius: 3 }}/>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{formatCLP(d.sum)}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{d.count} fact.</div>
                    </div>
                  </button>
                );
              })}
            </Card>
          </div>
        </div>
      )}

      {/* ════════════ COMPACTO ════════════ */}
      {layout === "compacto" && (
        <div style={{ animation: "ccIn .22s ease" }}>
          <div className="flex overflow-x-auto no-scrollbar rounded-2xl border border-[#E2E8F0] bg-white mb-3" style={{ boxShadow: "0 1px 2px rgba(15,23,42,.05)" }}>
            {[
              { label: "Score prom.", value: s.avg,          color: s.avg >= 65 ? "#DC2626" : s.avg >= 40 ? "#B7791F" : "#1F7A4D" },
              { label: "En cartera",  value: s.count,        color: "#0F172A" },
              { label: "Urgentes",    value: s.urgent.length, color: "#DC2626" },
              { label: "Vencidas",    value: s.venc.length,  color: "#B7791F" },
            ].map((k, i, arr) => (
              <div key={k.label} style={{ flex: "0 0 auto", minWidth: 100, padding: "14px 18px", borderRight: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div style={{ fontSize: 10, letterSpacing: ".1em", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
              </div>
            ))}
          </div>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,2fr) 80px 100px 54px minmax(110px,1.3fr)", gap: 10, padding: "10px 16px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 10, letterSpacing: ".06em", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", minWidth: 540 }}>
                <div>Deudor</div><div>Vence</div><div style={{ textAlign: "right" }}>Monto</div><div style={{ textAlign: "center" }}>Score</div><div>Acción</div>
              </div>
              {sorted.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Sin facturas activas</div>
              )}
              {sorted.map((r, idx) => <InvoiceRow key={r.id} r={r} idx={idx} onOpen={openInvoice} compact />)}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
