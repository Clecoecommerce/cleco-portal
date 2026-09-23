"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Edición de una factura ya cargada.
 *
 * Se usa desde el Panel y desde la bandeja de cobranza: el cliente sube la
 * nómina, ve un dato mal extraído (monto, folio, fechas) y necesita corregirlo
 * sin volver a subir el archivo.
 *
 * No se edita el estado desde aquí: pasar a "pagada" tiene que registrar el
 * pago para que la cartola cuadre, y eso lo hace ConfirmarPagoModal.
 */

export interface FacturaEditable {
  id: string;
  numero: string;
  monto: number;
  fecha_emision?: string | null;
  fecha_vencimiento: string;
  notas?: string | null;
  deudores?: { razon_social?: string | null } | null;
}

export interface CambiosFactura {
  numero: string;
  monto: number;
  fecha_emision: string | null;
  fecha_vencimiento: string;
  notas: string | null;
}

interface Props {
  factura: FacturaEditable;
  onClose: () => void;
  onSaved: (cambios: CambiosFactura) => void;
}

const iCls =
  "w-full h-10 px-3.5 border border-[#E2E8F0] rounded-[10px] text-[14px] text-[#0F172A] placeholder-[#9CA3AF] " +
  "focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all";

export function EditInvoiceModal({ factura, onClose, onSaved }: Props) {
  const [monto, setMonto] = useState(String(factura.monto));
  const [numero, setNumero] = useState(factura.numero);
  const [emision, setEmision] = useState(factura.fecha_emision ?? "");
  const [fecha, setFecha] = useState(factura.fecha_vencimiento);
  const [notas, setNotas] = useState(factura.notas ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    const montoNum = parseInt(monto.replace(/\D/g, "") || "0", 10);
    if (montoNum <= 0) { setErr("El monto debe ser mayor a $0"); return; }
    if (!numero.trim()) { setErr("El número de factura es obligatorio"); return; }
    if (!fecha) { setErr("La fecha de vencimiento es obligatoria"); return; }
    if (emision && emision > new Date().toISOString().slice(0, 10)) {
      setErr("La fecha de emisión no puede ser futura"); return;
    }
    if (emision && fecha < emision) {
      setErr("El vencimiento no puede ser anterior a la emisión"); return;
    }

    const cambios: CambiosFactura = {
      numero: numero.trim(),
      monto: montoNum,
      fecha_emision: emision || null,
      fecha_vencimiento: fecha,
      notas: notas.trim() || null,
    };

    setLoading(true);
    const sb = createClient();
    const { error } = await sb.from("facturas").update(cambios).eq("id", factura.id);
    setLoading(false);
    if (error) { setErr("Error al guardar: " + error.message); return; }
    onSaved(cambios);
  }

  return (
    <div
      className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-6"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[17px] font-semibold text-[#0F172A]">Editar factura</h2>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5">
              N° {factura.numero}{factura.deudores?.razon_social ? ` · ${factura.deudores.razon_social}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-[#6B7280] hover:bg-[#F1F5F9] inline-flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {err && <div className="px-4 py-3 rounded-[10px] bg-[#FBE9E9] text-[#B23B3B] text-[13px]">{err}</div>}

          <div>
            <label className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">N° de factura</label>
            <input value={numero} onChange={e => setNumero(e.target.value)} className={iCls} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">Emisión</label>
              <input type="date" value={emision} onChange={e => setEmision(e.target.value)} className={iCls} />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">Vencimiento</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={iCls} required />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">Monto total (CLP)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
              <input
                value={parseInt(monto.replace(/\D/g, "") || "0").toLocaleString("es-CL")}
                onChange={e => setMonto(e.target.value.replace(/\D/g, ""))}
                className={`${iCls} pl-7`} required
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">Notas internas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Opcional…"
              className="w-full px-3.5 py-3 border border-[#E2E8F0] rounded-[10px] text-[14px] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all resize-none" />
          </div>
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
