"use client";

import { useState } from "react";
import { Badge, estadoToBadge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { UploadModal } from "@/components/ui/UploadModal";
import { formatCLP } from "@/lib/utils";
import { exportCsv } from "@/lib/exportCsv";
import { createClient } from "@/lib/supabase/client";
import type { FacturaWithDeudor } from "@/types/database";

const TABS    = ["facturas", "historial", "reportes"] as const;
type Tab      = (typeof TABS)[number];
type Estado   = "todos" | "en_gestion" | "pendiente" | "pagada";
type Periodo  = "todos" | "30" | "60" | "90";
const PER_PAGE = 10;

/* ── Detail side panel ── */
function DetailPanel({ f, onClose }: { f: FacturaWithDeudor; onClose: () => void }) {
  const { variant, label } = estadoToBadge(f.estado);
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-[#0F172A]/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-50 w-full max-w-sm bg-white border-l border-[#E2E8F0] shadow-lg h-full overflow-y-auto animate-slideRight">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <h3 className="font-semibold text-[#0F172A] text-[15px]">Detalle de factura</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#6B7280] inline-flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-5 py-5 space-y-5">
          <Row label="Deudor"       value={f.deudores?.razon_social ?? "—"} bold />
          <Row label="RUT"          value={f.deudores?.rut ?? "—"} mono />
          <Row label="N° Factura"   value={`N° ${f.numero}`} mono />
          <Row label="Monto"        value={formatCLP(f.monto)} bold />
          <Row label="Vencimiento"  value={new Date(f.fecha_vencimiento).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })} />
          <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9]">
            <span className="text-[12.5px] text-[#6B7280]">Estado</span>
            <Badge variant={variant}>{label}</Badge>
          </div>
          {f.repactado && (
            <div className="bg-[#EFF6FF] rounded-[10px] p-3.5 text-[13px] space-y-1.5">
              <p className="font-semibold text-[#2563EB] mb-2">Repactación activa</p>
              <Row label="Cuotas"         value={`${f.num_cuotas ?? "—"}`} />
              <Row label="Valor por cuota" value={f.monto_cuota ? formatCLP(f.monto_cuota) : "—"} />
            </div>
          )}
          {f.notas && (
            <div>
              <p className="text-[12.5px] text-[#6B7280] mb-1">Notas</p>
              <p className="text-[13.5px] text-[#1E293B]">{f.notas}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#F1F5F9] last:border-0">
      <span className="text-[12.5px] text-[#6B7280] shrink-0">{label}</span>
      <span className={`text-[13.5px] text-right ${bold ? "font-semibold text-[#0F172A]" : "text-[#1E293B]"} ${mono ? "font-mono text-[12.5px]" : ""}`}>{value}</span>
    </div>
  );
}

/* ── Row action menu ── */
function RowMenu({ factura, onMarcarPagada }: { factura: FacturaWithDeudor; onMarcarPagada: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="w-7 h-7 rounded-[6px] text-[#6B7280] hover:bg-[#F1F5F9] inline-flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-[#E2E8F0] rounded-[10px] shadow-md p-1 text-[13px]">
            <button
              onClick={() => { navigator.clipboard.writeText(factura.numero); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-[#1E293B] hover:bg-[#F1F5F9]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copiar N° folio
            </button>
            {factura.estado !== "pagada" && (
              <button
                onClick={() => { onMarcarPagada(factura.id); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-[#1F7A4D] hover:bg-[#E5F4EC]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Marcar como pagada
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main component ── */
export function PanelClient({ facturas: initial, profileId }: { facturas: FacturaWithDeudor[]; profileId: string }) {
  const [facturas,  setFacturas]  = useState<FacturaWithDeudor[]>(initial);
  const [tab,       setTab]       = useState<Tab>("facturas");
  const [modal,     setModal]     = useState(false);
  const [search,    setSearch]    = useState("");
  const [estado,    setEstado]    = useState<Estado>("todos");
  const [periodo,   setPeriodo]   = useState<Periodo>("todos");
  const [page,      setPage]      = useState(1);
  const [detail,    setDetail]    = useState<FacturaWithDeudor | null>(null);

  const cutoff = periodo !== "todos"
    ? new Date(Date.now() - parseInt(periodo) * 86400000).toISOString()
    : null;

  const active    = facturas.filter(f => f.estado !== "pagada");
  const historial = facturas.filter(f => f.estado === "pagada");

  const base = tab === "facturas" ? active : historial;
  const filtered = base.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.deudores?.razon_social?.toLowerCase().includes(q) || f.deudores?.rut?.toLowerCase().includes(q) || f.numero?.toLowerCase().includes(q);
    const matchEstado = estado === "todos" || f.estado === estado;
    const matchPeriodo = !cutoff || f.created_at >= cutoff;
    return matchSearch && matchEstado && matchPeriodo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleEstado(v: Estado) { setEstado(v); setPage(1); }
  function handlePeriodo(v: Periodo) { setPeriodo(v); setPage(1); }

  async function marcarPagada(id: string) {
    const sb = createClient();
    await sb.from("facturas").update({ estado: "pagada" }).eq("id", id);
    setFacturas(prev => prev.map(f => f.id === id ? { ...f, estado: "pagada" } : f));
  }

  function doExport() {
    const headers = ["Deudor", "RUT", "N° Factura", "Vencimiento", "Monto", "Estado"];
    const rows = filtered.map(f => [
      f.deudores?.razon_social ?? "",
      f.deudores?.rut ?? "",
      f.numero,
      f.fecha_vencimiento,
      String(f.monto),
      f.estado,
    ]);
    exportCsv([headers, ...rows], `facturas-cleco-${new Date().toISOString().slice(0,10)}.csv`);
  }

  return (
    <>
      {modal && <UploadModal open={modal} onClose={() => setModal(false)} profileId={profileId} />}
      {detail && <DetailPanel f={detail} onClose={() => setDetail(null)} />}

      <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center justify-between px-4 pt-2 border-b border-[#E2E8F0] no-scrollbar overflow-x-auto">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }}
                className={`px-3.5 py-3 text-[13.5px] font-medium border-b-2 mb-[-1px] transition-colors capitalize ${t === tab ? "text-[#2563EB] border-[#2563EB]" : "text-[#6B7280] border-transparent hover:text-[#1E293B]"}`}>
                {t === "facturas" ? "Mis facturas" : t === "historial" ? "Historial" : "Reportes"}
                {t === "facturas" && <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${t === tab ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F1F5F9] text-[#1E293B]"}`}>{active.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {tab === "facturas" || tab === "historial" ? (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3.5 border-b border-[#E2E8F0]">
              <div className="flex flex-1 gap-2 flex-col sm:flex-row max-w-none sm:max-w-[520px]">
                <div className="relative flex-1">
                  <svg className="absolute left-2.5 top-2.5 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Buscar deudor, RUT o N° factura…"
                    className="w-full h-9 pl-8 pr-3 border border-[#E2E8F0] rounded-[6px] text-[13px] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
                </div>
                <select value={estado} onChange={e => handleEstado(e.target.value as Estado)}
                  className="h-9 px-3 border border-[#E2E8F0] rounded-[6px] text-[13px] text-[#1E293B] focus:outline-none focus:border-[#2563EB] bg-white cursor-pointer">
                  <option value="todos">Todos los estados</option>
                  <option value="en_gestion">En gestión</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagada">Pagada</option>
                </select>
                <select value={periodo} onChange={e => handlePeriodo(e.target.value as Periodo)}
                  className="h-9 px-3 border border-[#E2E8F0] rounded-[6px] text-[13px] text-[#1E293B] focus:outline-none focus:border-[#2563EB] bg-white cursor-pointer">
                  <option value="todos">Todo el tiempo</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="60">Últimos 60 días</option>
                  <option value="90">Últimos 90 días</option>
                </select>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <IconButton title="Exportar CSV" onClick={doExport}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </IconButton>
                <Button size="sm" variant="primary" onClick={() => setModal(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Subir factura
                </Button>
              </div>
            </div>

            {paged.length === 0 ? (
              <div className="py-16 text-center text-[#6B7280]">
                <div className="w-11 h-11 rounded-[12px] bg-[#F1F5F9] inline-flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">{search || estado !== "todos" ? "Sin resultados" : tab === "facturas" ? "Sin facturas activas" : "Sin historial"}</h3>
                <p className="text-[13px] max-w-xs mx-auto">{search || estado !== "todos" ? "Prueba con otro filtro." : tab === "facturas" ? "Sube tu primera factura para iniciar la gestión." : "Las facturas pagadas aparecerán aquí."}</p>
              </div>
            ) : (
              <table className="invoice-table w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="bg-[#FAFBFD]">
                    {["Deudor", "RUT", "N° Factura", "Vencimiento", "Monto", "Estado", ""].map(h => (
                      <th key={h} className="text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wide px-4 py-2.5 border-b border-[#E2E8F0]" style={h === "Monto" ? { textAlign: "right" } : {}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(f => {
                    const { variant, label } = estadoToBadge(f.estado);
                    return (
                      <tr key={f.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFD] transition-colors">
                        <td className="td-debtor px-4 py-3.5 font-medium text-[#0F172A]" data-label="Deudor">{f.deudores?.razon_social ?? "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-[12.5px] text-[#1E293B]" data-label="RUT">{f.deudores?.rut ?? "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-[12.5px] text-[#1E293B]" data-label="N° Factura">N° {f.numero}</td>
                        <td className="px-4 py-3.5 text-[#6B7280] tabular-nums" data-label="Vencimiento">{new Date(f.fecha_vencimiento).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td className="px-4 py-3.5 text-right font-medium text-[#0F172A] tabular-nums" data-label="Monto">{formatCLP(f.monto)}</td>
                        <td className="px-4 py-3.5" data-label="Estado"><Badge variant={variant}>{label}</Badge></td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setDetail(f)} title="Ver detalle" className="w-7 h-7 rounded-[6px] text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#0F172A] inline-flex items-center justify-center">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <RowMenu factura={f} onMarcarPagada={marcarPagada} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-[#E2E8F0] text-[12.5px] text-[#6B7280] gap-3">
              <span>Mostrando {Math.min(filtered.length, (page - 1) * PER_PAGE + paged.length)} de {filtered.length} facturas</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-[6px] border text-[12px] ${p === page ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F1F5F9]"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40">›</button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-[#6B7280]">
            <div className="w-11 h-11 rounded-[12px] bg-[#F1F5F9] inline-flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><polyline points="7 14 11 10 15 13 21 7"/></svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">Reportes mensuales</h3>
            <p className="text-[13px] max-w-xs mx-auto">Descarga el CSV desde el botón <b>Exportar</b> en la pestaña Mis facturas o Historial.</p>
          </div>
        )}
      </div>
    </>
  );
}
