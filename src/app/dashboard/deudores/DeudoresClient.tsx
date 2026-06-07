"use client";

import React, { useState } from "react";
import { Badge, estadoToBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCLP, formatRUT, validarRUT, calcularEstado } from "@/lib/utils";
import { exportCsv } from "@/lib/exportCsv";
import { createClient } from "@/lib/supabase/client";
import type { Deudor } from "@/types/database";

type FacturaResumen = { id: string; numero: string; monto: number; fecha_vencimiento: string; estado: string };
type DeudorWithFacturas = Deudor & { facturas: FacturaResumen[] };
type Riesgo = "todos" | "bajo" | "medio" | "alto";
type Sort   = "deuda_total" | "mora_dias" | "razon_social";
const PER_PAGE = 10;

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

// Calcula mora en días basado en la factura activa más antigua vencida
function calcularMoraDias(facturas: FacturaResumen[]): number {
  const hoy = new Date();
  const vencidas = facturas.filter(f =>
    f.estado !== "pagada" && new Date(f.fecha_vencimiento) < hoy
  );
  if (!vencidas.length) return 0;
  const masAntigua = Math.min(...vencidas.map(f => new Date(f.fecha_vencimiento).getTime()));
  return Math.floor((hoy.getTime() - masAntigua) / 86_400_000);
}

const iCls = "w-full h-10 px-3.5 border border-[#E2E8F0] rounded-[10px] text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all";
const L = ({ children, req }: { children: string; req?: boolean }) => (
  <label className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">
    {children}{req && <span className="text-[#B23B3B] ml-0.5">*</span>}
  </label>
);

/* ── Modal nuevo deudor ── */
function NuevoDeudorModal({ profileId, onClose, onCreated }: { profileId: string; onClose: () => void; onCreated: (d: DeudorWithFacturas) => void }) {
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [rutVal,  setRutVal]  = useState("");
  const [rutError,setRutError]= useState("");
  const [telVal,  setTelVal]  = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setErr("");
    const fd = e.currentTarget;
    const g  = (n: string) => (fd.elements.namedItem(n) as HTMLInputElement).value.trim();
    const rut          = rutVal;
    const razon_social = g("razon_social");
    const sector       = g("sector") || null;
    const email_c      = g("email_contacto") || null;
    const tel_c        = telVal || g("telefono_contacto") || null;

    if (!rut || !razon_social) { setErr("RUT y razón social son obligatorios."); setLoading(false); return; }
    if (!validarRUT(rut)) { setRutError("RUT inválido"); setLoading(false); return; }

    const sb = createClient();
    const { data, error } = await sb.from("deudores")
      .insert({ profile_id: profileId, rut, razon_social, sector, mora_dias: 0, riesgo: "bajo", email_contacto: email_c, telefono_contacto: tel_c })
      .select("*").single();

    if (error || !data) { setErr("Error al crear deudor: " + (error?.message ?? "")); setLoading(false); return; }
    onCreated({ ...data, facturas: [] } as DeudorWithFacturas);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6 animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-[520px] max-h-[92vh] overflow-auto rounded-t-2xl sm:rounded-2xl shadow-lg">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[18px] font-semibold text-[#0F172A]">Nuevo deudor</h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5">Los campos con <span className="text-[#B23B3B]">*</span> son obligatorios.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#6B7280] inline-flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          {err && <div className="px-4 py-3 rounded-[10px] bg-[#FBE9E9] text-[#B23B3B] text-[13px]">{err}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <L req>RUT del deudor</L>
              <input name="rut" required placeholder="77.123.456-7" className={`${iCls} ${rutError ? "border-[#B23B3B]" : ""}`}
                value={rutVal}
                onChange={e => { setRutVal(formatRUT(e.target.value)); setRutError(""); }}
                onBlur={() => { if (rutVal && !validarRUT(rutVal)) setRutError("RUT inválido"); }}
                maxLength={12} />
              {rutError && <p className="mt-1 text-[12px] text-[#B23B3B]">{rutError}</p>}
            </div>
            <div><L req>Razón social</L><input name="razon_social" required placeholder="Empresa S.A." className={iCls} /></div>
            <div><L>Sector</L><input name="sector" placeholder="Construcción, Retail…" className={iCls} /></div>
            <div><L>Email contacto</L><input name="email_contacto" type="email" placeholder="contacto@empresa.cl" className={iCls} /></div>
            <div className="sm:col-span-2">
              <L>Teléfono / WhatsApp</L>
              <input name="telefono_contacto" placeholder="+56 9 8765 4321" className={iCls}
                value={telVal} onChange={e => setTelVal(formatPhone(e.target.value))} maxLength={16} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-[#F1F5F9]">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={loading}>{loading ? "Guardando…" : "Crear deudor"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal editar deudor ── */
function EditarDeudorModal({ deudor, onClose, onSaved }: {
  deudor: DeudorWithFacturas;
  onClose: () => void;
  onSaved: (updated: Partial<Deudor>) => void;
}) {
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState("");
  const [razonSocial,setRazonSocial]= useState(deudor.razon_social);
  const [sector,     setSector]     = useState(deudor.sector ?? "");
  const [email,      setEmail]      = useState(deudor.email_contacto ?? "");
  const [tel,        setTel]        = useState(deudor.telefono_contacto ?? "");

  async function save() {
    if (!razonSocial.trim()) { setErr("La razón social es obligatoria."); return; }
    setLoading(true);
    const sb = createClient();
    const update = {
      razon_social: razonSocial.trim(),
      sector: sector.trim() || null,
      email_contacto: email.trim() || null,
      telefono_contacto: tel.trim() || null,
    };
    const { error } = await sb.from("deudores").update(update).eq("id", deudor.id);
    setLoading(false);
    if (error) { setErr("Error al guardar: " + error.message); return; }
    onSaved(update);
  }

  return (
    <div className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl shadow-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[17px] font-semibold text-[#0F172A]">Editar deudor</h2>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5 font-mono">{deudor.rut}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#6B7280] inline-flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3.5">
          {err && <div className="px-4 py-3 rounded-[10px] bg-[#FBE9E9] text-[#B23B3B] text-[13px]">{err}</div>}
          <div><L req>Razón social</L><input value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className={iCls} /></div>
          <div><L>Sector</L><input value={sector} onChange={e => setSector(e.target.value)} placeholder="Construcción, Retail…" className={iCls} /></div>
          <div><L>Email contacto</L><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@empresa.cl" className={iCls} /></div>
          <div><L>Teléfono / WhatsApp</L><input value={tel} onChange={e => setTel(formatPhone(e.target.value))} placeholder="+56 9 8765 4321" className={iCls} maxLength={16} /></div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#F1F5F9]">
          <button onClick={onClose} className="h-9 px-4 text-[13.5px] font-medium text-[#1E293B] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F1F5F9] transition-all">Cancelar</button>
          <button onClick={save} disabled={loading} className="h-9 px-4 text-[13.5px] font-medium text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-[8px] disabled:opacity-60 transition-all">
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Historial expandido ── */
function ExpandedRow({ deudor }: { deudor: DeudorWithFacturas }) {
  const facturas = deudor.facturas ?? [];
  const totalActivo = facturas.filter(f => f.estado !== "pagada").reduce((a, f) => a + f.monto, 0);
  const totalPagado = facturas.filter(f => f.estado === "pagada").reduce((a, f) => a + f.monto, 0);

  const contacto = deudor.email_contacto || deudor.telefono_contacto;

  return (
    <tr>
      <td colSpan={8} className="px-5 py-4 bg-[#FAFBFD] border-b border-[#F1F5F9]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Columna contacto */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">Contacto</p>
            {deudor.email_contacto
              ? <p className="text-[13px] text-[#1E293B]"><span className="text-[#6B7280]">Email: </span>{deudor.email_contacto}</p>
              : <p className="text-[12.5px] text-[#9CA3AF]">Sin email registrado</p>
            }
            {deudor.telefono_contacto
              ? <p className="text-[13px] text-[#1E293B]"><span className="text-[#6B7280]">Tel: </span>{deudor.telefono_contacto}</p>
              : <p className="text-[12.5px] text-[#9CA3AF]">Sin teléfono registrado</p>
            }
            {!contacto && <p className="text-[11.5px] text-[#F59E0B] bg-[#FEF3C7] px-2 py-1 rounded-[6px] inline-block">Completa el contacto para activar cobros automáticos</p>}
          </div>

          {/* Columna resumen financiero */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">Resumen financiero</p>
            <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 text-[12.5px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total adeudado</span>
                <span className="font-semibold text-[#B23B3B]">{formatCLP(totalActivo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total pagado</span>
                <span className="font-semibold text-[#1F7A4D]">{formatCLP(totalPagado)}</span>
              </div>
              <div className="flex justify-between border-t border-[#F1F5F9] pt-1.5">
                <span className="text-[#6B7280]">Total histórico</span>
                <span className="font-semibold text-[#0F172A]">{formatCLP(totalActivo + totalPagado)}</span>
              </div>
            </div>
          </div>

          {/* Columna facturas */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-2">
              Facturas ({facturas.length})
            </p>
            {facturas.length === 0 ? (
              <p className="text-[12.5px] text-[#9CA3AF]">Sin facturas registradas.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-auto">
                {facturas.map(f => {
                  const estadoDisplay = calcularEstado(f.estado, f.fecha_vencimiento);
                  const { variant, label } = estadoToBadge(estadoDisplay);
                  return (
                    <div key={f.id} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[12.5px] gap-2">
                      <span className="font-mono text-[#6B7280] shrink-0">N°{f.numero}</span>
                      <span className="font-medium text-[#0F172A] tabular-nums">{formatCLP(f.monto)}</span>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ── Componente principal ── */
export function DeudoresClient({ deudores: initial, profileId }: { deudores: DeudorWithFacturas[]; profileId: string }) {
  const [list,         setList]         = useState<DeudorWithFacturas[]>(initial);
  const [search,       setSearch]       = useState("");
  const [riesgo,       setRiesgo]       = useState<Riesgo>("todos");
  const [sort,         setSort]         = useState<Sort>("mora_dias");
  const [page,         setPage]         = useState(1);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [nuevoModal,   setNuevoModal]   = useState(false);
  const [editDeudor,   setEditDeudor]   = useState<DeudorWithFacturas | null>(null);

  function deudaTotal(d: DeudorWithFacturas) {
    return (d.facturas ?? []).filter(f => f.estado !== "pagada").reduce((a, f) => a + f.monto, 0);
  }

  const filtered = list
    .map(d => ({ ...d, mora_dias: calcularMoraDias(d.facturas ?? []) }))
    .filter(d => {
      const q = search.toLowerCase();
      return (!q || d.razon_social.toLowerCase().includes(q) || d.rut.toLowerCase().includes(q)) &&
             (riesgo === "todos" || d.riesgo === riesgo);
    })
    .sort((a, b) => {
      if (sort === "deuda_total")  return deudaTotal(b) - deudaTotal(a);
      if (sort === "mora_dias")    return b.mora_dias - a.mora_dias;
      if (sort === "razon_social") return a.razon_social.localeCompare(b.razon_social, "es");
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function doExport() {
    const headers = ["Razón social", "RUT", "Sector", "Email", "Teléfono", "Mora (días)", "Deuda total", "Riesgo"];
    const rows = filtered.map(d => [d.razon_social, d.rut, d.sector ?? "", d.email_contacto ?? "", d.telefono_contacto ?? "", String(d.mora_dias), String(deudaTotal(d)), d.riesgo]);
    exportCsv([headers, ...rows], `cartera-cleco-${new Date().toISOString().slice(0,10)}.csv`);
  }

  function applyEdit(id: string, updated: Partial<Deudor>) {
    setList(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
  }

  const riesgoDeudor = (mora: number): "bajo" | "medio" | "alto" =>
    mora >= 90 ? "alto" : mora >= 30 ? "medio" : "bajo";

  return (
    <>
      {nuevoModal && <NuevoDeudorModal profileId={profileId} onClose={() => setNuevoModal(false)} onCreated={d => setList(prev => [d, ...prev])} />}
      {editDeudor && <EditarDeudorModal deudor={editDeudor} onClose={() => setEditDeudor(null)} onSaved={updated => { applyEdit(editDeudor.id, updated); setEditDeudor(null); }} />}

      <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3.5 border-b border-[#E2E8F0]">
          <div className="flex flex-1 gap-2 flex-col sm:flex-row max-w-none sm:max-w-[560px]">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-2.5 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por razón social o RUT…"
                className="w-full h-9 pl-8 pr-3 border border-[#E2E8F0] rounded-[6px] text-[13px] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
            </div>
            <select value={riesgo} onChange={e => { setRiesgo(e.target.value as Riesgo); setPage(1); }} className="h-9 px-3 border border-[#E2E8F0] rounded-[6px] text-[13px] text-[#1E293B] bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer">
              <option value="todos">Riesgo: todos</option>
              <option value="bajo">Riesgo bajo</option>
              <option value="medio">Riesgo medio</option>
              <option value="alto">Riesgo alto</option>
            </select>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="h-9 px-3 border border-[#E2E8F0] rounded-[6px] text-[13px] text-[#1E293B] bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer">
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
          <div className="py-16 text-center text-[#6B7280]">
            <div className="w-11 h-11 rounded-[12px] bg-[#F1F5F9] inline-flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14"/></svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">{search || riesgo !== "todos" ? "Sin resultados" : "Sin deudores registrados"}</h3>
            <p className="text-[13px]">{search || riesgo !== "todos" ? "Prueba con otro filtro." : "Sube una factura para registrar tu primer deudor."}</p>
          </div>
        ) : (
          <table className="invoice-table w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-[#FAFBFD]">
                {["Empresa deudora", "RUT", "Sector", "Facturas", "Mora", "Deuda total", "Riesgo", ""].map((h, i) => (
                  <th key={h + i} className="text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wide px-4 py-2.5 border-b border-[#E2E8F0]"
                    style={h === "Deuda total" ? { textAlign: "right" } : h === "Facturas" ? { textAlign: "center" } : {}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(d => {
                const mora = d.mora_dias;
                const riesgoCalc = riesgoDeudor(mora);
                const total = deudaTotal(d);
                const { variant, label } = estadoToBadge(riesgoCalc);
                const isExpanded = expanded === d.id;
                return (
                  <React.Fragment key={d.id}>
                    <tr className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFD] transition-colors">
                      <td className="td-debtor px-4 py-3.5 font-medium text-[#0F172A]" data-label="Empresa">{d.razon_social}</td>
                      <td className="px-4 py-3.5 font-mono text-[12.5px] text-[#1E293B]" data-label="RUT">{d.rut}</td>
                      <td className="px-4 py-3.5 text-[#6B7280]" data-label="Sector">{d.sector ?? "—"}</td>
                      <td className="px-4 py-3.5 text-center text-[#1E293B]" data-label="Facturas">{d.facturas?.length ?? 0}</td>
                      <td className="px-4 py-3.5 tabular-nums" data-label="Mora">
                        <span className={mora > 0 ? mora >= 90 ? "text-[#B23B3B] font-medium" : mora >= 30 ? "text-[#B7791F]" : "text-[#6B7280]" : "text-[#9CA3AF]"}>
                          {mora > 0 ? `${mora} días` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-[#0F172A] tabular-nums" data-label="Deuda">{formatCLP(total)}</td>
                      <td className="px-4 py-3.5" data-label="Riesgo"><Badge variant={variant}>{label}</Badge></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Editar */}
                          <button onClick={() => setEditDeudor(d)} title="Editar"
                            className="w-7 h-7 rounded-[6px] text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#0F172A] inline-flex items-center justify-center">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {/* Expandir */}
                          <button onClick={() => setExpanded(isExpanded ? null : d.id)}
                            className={`w-7 h-7 rounded-[6px] text-[#6B7280] hover:bg-[#F1F5F9] hover:text-[#0F172A] inline-flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <ExpandedRow deudor={d} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-[#E2E8F0] text-[12.5px] text-[#6B7280] gap-3">
          <span>Mostrando {paged.length} de {filtered.length} deudores</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-[6px] border text-[12px] ${p === page ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F1F5F9]"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
