"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { leerArchivoXml, SiiDatosExtraidos } from "@/lib/parseSiiXml";
import { formatRUT, validarRUT } from "@/lib/utils";
import { enviarEmailCobranza } from "@/lib/email";

interface Props { open: boolean; onClose: () => void; profileId: string; onCreated?: () => void; }

interface FilaFactura {
  id: string;
  file: File;
  datos: SiiDatosExtraidos | null;
  emailContacto: string;
  telefonoContacto: string;
  estado: "pendiente" | "ok" | "error" | "subiendo";
  errorMsg: string;
}

const iCls = "w-full h-9 px-3 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all";

export function BulkUploadModal({ open, onClose, profileId, onCreated }: Props) {
  const [filas,    setFilas]    = useState<FilaFactura[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [resumen,  setResumen]  = useState<{ ok: number; err: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function close() {
    if (loading) return;
    setFilas([]); setResumen(null); onClose();
  }

  async function agregarArchivos(files: FileList) {
    const nuevas: FilaFactura[] = [];
    for (const file of Array.from(files)) {
      if (!/\.xml$/i.test(file.name)) continue;
      const datos = await leerArchivoXml(file);
      nuevas.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        datos,
        emailContacto: "",
        telefonoContacto: "",
        estado: "pendiente",
        errorMsg: "",
      });
    }
    setFilas(prev => [...prev, ...nuevas]);
  }

  function quitarFila(id: string) {
    setFilas(prev => prev.filter(f => f.id !== id));
  }

  function actualizarFila(id: string, campo: "emailContacto" | "telefonoContacto", valor: string) {
    setFilas(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  }

  async function subirTodo() {
    const validas = filas.filter(f => f.datos && validarRUT(f.datos.rutDeudor));
    if (validas.length === 0) return;

    setLoading(true);
    const sb = createClient();
    let ok = 0, err = 0;

    for (const fila of validas) {
      const d = fila.datos!;

      setFilas(prev => prev.map(f => f.id === fila.id ? { ...f, estado: "subiendo" } : f));

      try {
        const { data: deudor, error: dErr } = await sb
          .from("deudores")
          .upsert({
            profile_id: profileId,
            rut: d.rutDeudor,
            razon_social: d.razonSocialDeudor,
            mora_dias: 0, riesgo: "bajo",
            email_contacto: fila.emailContacto || null,
            telefono_contacto: fila.telefonoContacto || null,
          }, { onConflict: "profile_id,rut" })
          .select("id").single();

        if (dErr || !deudor) throw new Error("No se pudo crear el deudor");

        const monto = parseInt(d.monto, 10);
        const { error: fErr } = await sb.from("facturas").insert({
          profile_id: profileId,
          deudor_id: deudor.id,
          numero: d.folio,
          monto,
          fecha_vencimiento: d.fechaVencimiento || new Date().toISOString().slice(0, 10),
          estado: "en_gestion",
          archivo_url: null,
          notas: null,
          repactado: false,
          num_cuotas: null,
          monto_cuota: null,
        });

        if (fErr) throw new Error(fErr.message);

        // Email automático si hay email de contacto
        if (fila.emailContacto) {
          enviarEmailCobranza({
            profileId,
            emailDeudor: fila.emailContacto,
            nombreDeudor: d.razonSocialDeudor,
            numeroFactura: d.folio,
            monto,
            fechaVencimiento: d.fechaVencimiento,
          }).catch(() => {});
        }

        setFilas(prev => prev.map(f => f.id === fila.id ? { ...f, estado: "ok" } : f));
        ok++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setFilas(prev => prev.map(f => f.id === fila.id ? { ...f, estado: "error", errorMsg: msg } : f));
        err++;
      }
    }

    setLoading(false);
    setResumen({ ok, err });
    onCreated?.();
  }

  if (!open) return null;

  const hayValidas = filas.some(f => f.datos && validarRUT(f.datos.rutDeudor));

  return (
    <div className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={e => e.target === e.currentTarget && close()}>
      <div className="bg-white w-full sm:max-w-[780px] max-h-[92vh] overflow-auto rounded-t-2xl sm:rounded-2xl shadow-lg flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9] shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold text-[#0F172A]">Subida masiva de facturas</h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5">Sube varios XMLs del SII a la vez. Se extraen los datos automáticamente.</p>
          </div>
          <button onClick={close} disabled={loading} className="w-8 h-8 rounded-lg text-[#6B7280] hover:bg-[#F1F5F9] inline-flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">

          {/* Resumen final */}
          {resumen && (
            <div className={`px-4 py-3 rounded-[10px] text-[13.5px] font-medium ${resumen.err === 0 ? "bg-[#E5F4EC] text-[#1F7A4D]" : "bg-[#FBF3E1] text-[#B7791F]"}`}>
              {resumen.ok} factura{resumen.ok !== 1 ? "s" : ""} subida{resumen.ok !== 1 ? "s" : ""} correctamente
              {resumen.err > 0 && ` · ${resumen.err} con error`}
            </div>
          )}

          {/* Drop zone */}
          {!resumen && (
            <div
              className="border-[1.5px] border-dashed border-[#E2E8F0] rounded-[12px] p-8 text-center cursor-pointer hover:border-[#2563EB] hover:bg-[#FAFBFD] transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); agregarArchivos(e.dataTransfer.files); }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] inline-flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <p className="text-[14px] font-medium text-[#0F172A]">Arrastra tus XMLs del SII aquí</p>
              <p className="text-[12.5px] text-[#6B7280] mt-1">o haz clic para seleccionar · Solo archivos .xml</p>
              <input ref={fileRef} type="file" accept=".xml" multiple className="hidden"
                onChange={e => { if (e.target.files) agregarArchivos(e.target.files); }} />
            </div>
          )}

          {/* Tabla de facturas */}
          {filas.length > 0 && (
            <div className="space-y-2">
              {filas.map(fila => (
                <div key={fila.id}
                  className={`border rounded-[10px] p-3.5 text-[13px] transition-all ${
                    fila.estado === "ok"      ? "border-[#1F7A4D]/30 bg-[#F0FBF4]" :
                    fila.estado === "error"   ? "border-[#B23B3B]/30 bg-[#FBE9E9]" :
                    fila.estado === "subiendo"? "border-[#2563EB]/30 bg-[#EFF6FF]" :
                    fila.datos               ? "border-[#E2E8F0] bg-white" :
                                               "border-[#FBF3E1] bg-[#FFFBF0]"
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Nombre del archivo */}
                      <p className="font-mono text-[11px] text-[#9CA3AF] truncate mb-1.5">{fila.file.name}</p>

                      {fila.datos ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[12.5px]">
                          <span className="text-[#6B7280]">Deudor: <b className="text-[#0F172A]">{fila.datos.razonSocialDeudor || "—"}</b></span>
                          <span className="text-[#6B7280]">RUT: <b className="text-[#0F172A] font-mono">{fila.datos.rutDeudor}</b></span>
                          <span className="text-[#6B7280]">Folio: <b className="text-[#0F172A]">N°{fila.datos.folio}</b></span>
                          <span className="text-[#6B7280]">Monto: <b className="text-[#0F172A]">${parseInt(fila.datos.monto).toLocaleString("es-CL")}</b></span>
                          {fila.datos.fechaVencimiento && (
                            <span className="text-[#6B7280]">Vence: <b className="text-[#0F172A]">{new Date(fila.datos.fechaVencimiento + "T12:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</b></span>
                          )}
                          {!validarRUT(fila.datos.rutDeudor) && (
                            <span className="text-[#B23B3B] font-medium col-span-full">⚠ RUT inválido — se omitirá</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[#B7791F] text-[12.5px]">⚠ No se pudo leer el XML del SII</p>
                      )}

                      {/* Email y teléfono */}
                      {fila.datos && fila.estado === "pendiente" && (
                        <div className="grid grid-cols-2 gap-2 mt-2.5">
                          <input
                            type="email" placeholder="Email contacto (opcional)"
                            className={iCls} value={fila.emailContacto}
                            onChange={e => actualizarFila(fila.id, "emailContacto", e.target.value)}
                          />
                          <input
                            type="tel" placeholder="Teléfono (opcional)"
                            className={iCls} value={fila.telefonoContacto}
                            onChange={e => actualizarFila(fila.id, "telefonoContacto", e.target.value)}
                          />
                        </div>
                      )}

                      {fila.estado === "error" && (
                        <p className="text-[#B23B3B] text-[12px] mt-1">{fila.errorMsg}</p>
                      )}
                    </div>

                    {/* Estado / botón eliminar */}
                    <div className="shrink-0 flex items-center gap-2">
                      {fila.estado === "ok" && (
                        <span className="text-[#1F7A4D]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      )}
                      {fila.estado === "subiendo" && (
                        <span className="text-[#2563EB] animate-spin inline-block">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>
                        </span>
                      )}
                      {fila.estado === "pendiente" && (
                        <button onClick={() => quitarFila(fila.id)} className="w-6 h-6 rounded text-[#9CA3AF] hover:text-[#B23B3B] hover:bg-[#FBE9E9] inline-flex items-center justify-center">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filas.length === 0 && !resumen && (
            <p className="text-center text-[13px] text-[#9CA3AF]">Aún no has agregado archivos.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#F1F5F9] shrink-0">
          <span className="text-[12.5px] text-[#6B7280]">
            {filas.length > 0 && !resumen && `${filas.filter(f => f.datos && validarRUT(f.datos.rutDeudor)).length} de ${filas.length} listas para subir`}
          </span>
          <div className="flex gap-2">
            <button onClick={close} disabled={loading}
              className="h-9 px-4 text-[13.5px] font-medium text-[#1E293B] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F1F5F9] disabled:opacity-50 transition-all">
              {resumen ? "Cerrar" : "Cancelar"}
            </button>
            {!resumen && (
              <button onClick={subirTodo} disabled={loading || !hayValidas}
                className="h-9 px-4 text-[13.5px] font-medium text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-[8px] disabled:opacity-50 transition-all flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>
                    Subiendo…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Subir {filas.filter(f => f.datos && validarRUT(f.datos.rutDeudor)).length} facturas
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
