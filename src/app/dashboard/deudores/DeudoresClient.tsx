"use client";

import React, { useState } from "react";

function formatRut(val: string): string {
  const clean = val.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv   = clean.slice(-1);
  const dots  = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${dots}-${dv}`;
}

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "");
  const local  = digits.startsWith("56") ? digits.slice(2) : digits;
  if (!local) return "";
  let r = "+56";
  if (local.length >= 1) r += ` ${local[0]}`;
  if (local.length >= 2) r += ` ${local.slice(1, 5)}`;
  if (local.length >= 6) r += ` ${local.slice(5, 9)}`;
  return r;
}
import { Badge, estadoToBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/utils";
import { exportCsv } from "@/lib/exportCsv";
import { createClient } from "@/lib/supabase/client";
import type { Deudor } from "@/types/database";

type DeudorWithFacturas = Deudor & { facturas: { id: string; monto: number; estado: string }[] };
type Riesgo = "todos" | "bajo" | "medio" | "alto";
type Sort   = "deuda_total" | "mora_dias" | "razon_social";
const PER_PAGE = 10;

/* ── Modal nuevo deudor ── */
function NuevoDeudorModal({ profileId, onClose, onCreated }: { profileId: string; onClose: () => void; onCreated: (d: DeudorWithFacturas) => void }) {
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [rutVal,  setRutVal]  = useState("");
  const [telVal,  setTelVal]  = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setErr("");
    const fd = e.currentTarget;
    const g  = (n: string) => (fd.elements.namedItem(n) as HTMLInputElement).value.trim();
    const rut          = rutVal || g("rut");
    const razon_social = g("razon_social");
    const sector       = g("sector") || null;
    const email_c      = g("email_contacto") || null;
    const tel_c        = telVal || g("telefono_contacto") || null;
    const mora_dias    = parseInt(g("mora_dias") || "0", 10);

    if (!rut || !razon_social) { setErr("RUT y razón social son obligatorios."); setLoading(false); return; }

    const sb = createClient();
    const { data, error } = await sb.from("deudores")
      .insert({ profile_id: profileId, rut, razon_social, sector, mora_dias, riesgo: mora_dias >= 90 ? "alto" : mora_dias >= 30 ? "medio" : "bajo", email_contacto: email_c, telefono_contacto: tel_c })
      .select("*").single();

    if (error || !data) { setErr("Error al crear deudor: " + (error?.message ?? "")); setLoading(false); return; }
    onCreated({ ...data, facturas: [] } as DeudorWithFacturas);
    onClose();
  }

  const iCls = "w-full h-10 px-3.5 border border-[#E4E8EE] rounded-[10px] text-[14px] text-[#0E1A2B] placeholder-[#8E9BAE] focus:outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/12 transition-all";
  const L = ({ children, req }: { children: string; req?: boolean }) => (
    <label className="block text-[12.5px] font-medium text-[#2B3A4F] mb-1.5">
      {children}{req && <span className="text-[#B23B3B] ml-0.5">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-[#0E1A2B]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6 animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-[520px] max-h-[92vh] overflow-auto rounded-t-2xl sm:rounded-2xl shadow-lg animate-slideUp sm:animate-popIn">
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-[#EFF2F6]">
          <div>
            <h2 className="text-[18px] font-semibold text-[#0E1A2B] tracking-tight">Nuevo deudor</h2>
            <p className="text-[13px] text-[#6B7A8F] mt-0.5">Los campos con <span className="text-[#B23B3B]">*</span> son obligatorios.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#EFF2F6] text-[#6B7A8F] inline-flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-6">
          {err && <div className="px-4 py-3 rounded-[10px] bg-[#FBE9E9] text-[#B23B3B] text-[13px]">{err}</div>}

          {/* Sección 1 — Datos del deudor */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-3">1 · Datos del deudor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <L req>RUT del deudor</L>
                <input name="rut" required placeholder="77.123.456-7" className={iCls}
                  value={rutVal} onChange={e => setRutVal(formatRut(e.target.value))} maxLength={12} />
              </div>
              <div>
                <L req>Razón social</L>
                <input name="razon_social" required placeholder="Empresa S.A." className={iCls} />
              </div>
              <div>
                <L>Sector (opcional)</L>
                <input name="sector" placeholder="Construcción, Retail…" className={iCls} />
              </div>
              <div>
                <L>Mora (días)</L>
                <input name="mora_dias" type="number" min="0" placeholder="0" className={iCls} />
              </div>
            </div>
          </section>

          {/* Sección 2 — Contacto */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-3">2 · Contacto del deudor</p>
            <div className="bg-[#EBF2FA]/50 border border-[#D6E5F4] rounded-[12px] p-4 space-y-3.5">
              <p className="text-[12px] text-[#185FA5]">Necesitamos estos datos para contactar al deudor en el canal correcto.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <L>Email de contacto</L>
                  <input name="email_contacto" type="email" placeholder="contacto@empresa.cl" className={iCls} />
                </div>
                <div>
                  <L>Teléfono / WhatsApp</L>
                  <input name="telefono_contacto" placeholder="+56 9 8765 4321" className={iCls}
                    value={telVal} onChange={e => setTelVal(formatPhone(e.target.value))} maxLength={16} />
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#EFF2F6]">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>{loading ? "Guardando…" : "Crear deudor"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Expanded row ── */
function ExpandedRow({ deudor }: { deudor: DeudorWithFacturas }) {
  if (!deudor.facturas.length) return (
    <tr><td colSpan={8} className="px-6 py-4 bg-[#FAFBFD] text-[13px] text-[#6B7A8F]">Este deudor no tiene facturas registradas.</td></tr>
  );
  return (
    <tr>
      <td colSpan={8} className="px-6 py-4 bg-[#FAFBFD]">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-2">Facturas del deudor</p>
        <div className="space-y-1.5">
          {deudor.facturas.map(f => {
            const { variant, label } = estadoToBadge(f.estado);
            return (
              <div key={f.id} className="flex items-center justify-between bg-white border border-[#E4E8EE] rounded-[8px] px-3.5 py-2.5 text-[13px]">
                <span className="text-[#6B7A8F]">Monto:</span>
                <span className="font-medium text-[#0E1A2B]">{formatCLP(f.monto)}</span>
                <Badge variant={variant}>{label}</Badge>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

export function DeudoresClient({ deudores: initial, profileId }: { deudores: DeudorWithFacturas[]; profileId: string }) {
  const [list,       setList]       = useState<DeudorWithFacturas[]>(initial);
  const [search,     setSearch]     = useState("");
  const [riesgo,     setRiesgo]     = useState<Riesgo>("todos");
  const [sort,       setSort]       = useState<Sort>("mora_dias");
  const [page,       setPage]       = useState(1);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [nuevoModal, setNuevoModal] = useState(false);

  function deudaTotal(d: DeudorWithFacturas) {
    return (d.facturas ?? []).filter(f => f.estado !== "pagada").reduce((a, f) => a + f.monto, 0);
  }

  const filtered = list
    .filter(d => {
      const q = search.toLowerCase();
      return (!q || d.razon_social.toLowerCase().includes(q) || d.rut.toLowerCase().includes(q)) &&
             (riesgo === "todos" || d.riesgo === riesgo);
    })
    .sort((a, b) => {
      if (sort === "deuda_total")   return deudaTotal(b) - deudaTotal(a);
      if (sort === "mora_dias")     return b.mora_dias - a.mora_dias;
      if (sort === "razon_social")  return a.razon_social.localeCompare(b.razon_social, "es");
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function doExport() {
    const headers = ["Razón social", "RUT", "Sector", "Mora (días)", "Deuda total", "Riesgo"];
    const rows = filtered.map(d => [d.razon_social, d.rut, d.sector ?? "", String(d.mora_dias), String(deudaTotal(d)), d.riesgo]);
    exportCsv([headers, ...rows], `cartera-cleco-${new Date().toISOString().slice(0,10)}.csv`);
  }

  return (
    <>
      {nuevoModal && <NuevoDeudorModal profileId={profileId} onClose={() => setNuevoModal(false)} onCreated={d => setList(prev => [d, ...prev])} />}

      <div className="bg-white border border-[#E4E8EE] rounded-[14px] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3.5 border-b border-[#E4E8EE]">
          <div className="flex flex-1 gap-2 flex-col sm:flex-row max-w-none sm:max-w-[560px]">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-2.5 text-[#8E9BAE]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por razón social o RUT…"
                className="w-full h-9 pl-8 pr-3 border border-[#E4E8EE] rounded-[6px] text-[13px] placeholder-[#8E9BAE] focus:outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/10 transition-all" />
            </div>
            <select value={riesgo} onChange={e => { setRiesgo(e.target.value as Riesgo); setPage(1); }} className="h-9 px-3 border border-[#E4E8EE] rounded-[6px] text-[13px] text-[#2B3A4F] bg-white focus:outline-none focus:border-[#185FA5] cursor-pointer">
              <option value="todos">Riesgo: todos</option>
              <option value="bajo">Riesgo bajo</option>
              <option value="medio">Riesgo medio</option>
              <option value="alto">Riesgo alto</option>
            </select>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="h-9 px-3 border border-[#E4E8EE] rounded-[6px] text-[13px] text-[#2B3A4F] bg-white focus:outline-none focus:border-[#185FA5] cursor-pointer">
              <option value="mora_dias">Ordenar: mora</option>
              <option value="deuda_total">Ordenar: deuda</option>
              <option value="razon_social">Ordenar: A–Z</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={doExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar
            </Button>
            <Button variant="primary" size="sm" onClick={() => setNuevoModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo deudor
            </Button>
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="py-16 text-center text-[#6B7A8F]">
            <div className="w-11 h-11 rounded-[12px] bg-[#EFF2F6] inline-flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14"/></svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[#0E1A2B] mb-1">{search || riesgo !== "todos" ? "Sin resultados" : "Sin deudores registrados"}</h3>
            <p className="text-[13px]">{search || riesgo !== "todos" ? "Prueba con otro filtro." : "Sube una factura para registrar tu primer deudor."}</p>
          </div>
        ) : (
          <table className="invoice-table w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-[#FAFBFD]">
                {["Empresa deudora", "RUT", "Sector", "Facturas", "Mora", "Deuda total", "Riesgo", ""].map((h, i) => (
                  <th key={h + i} className="text-left text-[12px] font-medium text-[#6B7A8F] uppercase tracking-wide px-4 py-2.5 border-b border-[#E4E8EE]"
                    style={h === "Deuda total" ? { textAlign: "right" } : h === "Facturas" ? { textAlign: "center" } : {}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(d => {
                const total = deudaTotal(d);
                const { variant, label } = estadoToBadge(d.riesgo);
                const isExpanded = expanded === d.id;
                return (
                  <React.Fragment key={d.id}>
                    <tr className="border-b border-[#EFF2F6] last:border-0 hover:bg-[#FAFBFD] transition-colors">
                      <td className="td-debtor px-4 py-3.5 font-medium text-[#0E1A2B]" data-label="Empresa">{d.razon_social}</td>
                      <td className="px-4 py-3.5 font-mono text-[12.5px] text-[#2B3A4F]" data-label="RUT">{d.rut}</td>
                      <td className="px-4 py-3.5 text-[#2B3A4F]" data-label="Sector">{d.sector ?? "—"}</td>
                      <td className="px-4 py-3.5 text-center text-[#2B3A4F]" data-label="Facturas">{d.facturas?.length ?? 0}</td>
                      <td className="px-4 py-3.5 text-[#6B7A8F] tabular-nums" data-label="Mora">{d.mora_dias} días</td>
                      <td className="px-4 py-3.5 text-right font-medium text-[#0E1A2B] tabular-nums" data-label="Deuda">{formatCLP(total)}</td>
                      <td className="px-4 py-3.5" data-label="Riesgo"><Badge variant={variant}>{label}</Badge></td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setExpanded(isExpanded ? null : d.id)}
                          className={`w-7 h-7 rounded-[6px] text-[#6B7A8F] hover:bg-[#EFF2F6] hover:text-[#0E1A2B] inline-flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && <ExpandedRow deudor={d} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-[#E4E8EE] text-[12.5px] text-[#6B7A8F] gap-3">
          <span>Mostrando {paged.length} de {filtered.length} deudores</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white text-[#2B3A4F] border-[#E4E8EE] hover:bg-[#EFF2F6] disabled:opacity-40">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-[6px] border text-[12px] ${p === page ? "bg-[#185FA5] text-white border-[#185FA5]" : "bg-white text-[#2B3A4F] border-[#E4E8EE] hover:bg-[#EFF2F6]"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white text-[#2B3A4F] border-[#E4E8EE] hover:bg-[#EFF2F6] disabled:opacity-40">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
