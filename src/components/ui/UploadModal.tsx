"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./Button";

interface Props { open: boolean; onClose: () => void; profileId: string; }
type Stage = "form" | "loading" | "success";

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

const iCls = "w-full h-10 px-3.5 border border-[#E4E8EE] rounded-[10px] text-[14px] text-[#0E1A2B] placeholder-[#8E9BAE] focus:outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/12 transition-all";

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-[#2B3A4F] mb-1.5">
        {label}{req && <span className="text-[#B23B3B] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function UploadModal({ open, onClose, profileId }: Props) {
  const [stage,    setStage]    = useState<Stage>("form");
  const [drag,     setDrag]     = useState(false);
  const [file,     setFile]     = useState<File | null>(null);
  const [folio,    setFolio]    = useState("");
  const [err,      setErr]      = useState("");
  const [repactar, setRepactar] = useState(false);
  const [montoRaw, setMontoRaw] = useState("");
  const [cuotas,   setCuotas]   = useState(2);
  const [rutVal,   setRutVal]   = useState("");
  const [telVal,   setTelVal]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const monto    = parseInt(montoRaw || "0", 10);
  const cuotaVal = repactar && cuotas > 0 ? Math.ceil(monto / cuotas) : 0;

  function reset() {
    setStage("form"); setFile(null); setErr("");
    setRepactar(false); setMontoRaw(""); setCuotas(2);
    setRutVal(""); setTelVal("");
  }
  function close() { if (stage !== "loading") { reset(); onClose(); } }

  function addFile(f: File) {
    if (!/\.(pdf|xml)$/i.test(f.name)) { setErr("Solo PDF o XML (máx. 10 MB)."); return; }
    if (f.size > 10 * 1024 * 1024)     { setErr("El archivo supera 10 MB."); return; }
    setErr(""); setFile(f);
  }

  function fmtMonto(raw: string) {
    const n = parseInt(raw || "0", 10);
    return n ? n.toLocaleString("es-CL") : "";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setStage("loading");
    const fd = e.currentTarget;
    const g  = (n: string) => (fd.elements.namedItem(n) as HTMLInputElement).value.trim();

    const rut           = rutVal || g("rut");
    const razon_social  = g("razon_social");
    const email_c       = g("email_contacto");
    const tel_c         = telVal || g("telefono_contacto");
    const numero        = g("numero");
    const fecha_venc    = g("fecha_vencimiento");
    const notas         = (fd.elements.namedItem("notas") as HTMLTextAreaElement).value.trim();

    if (!email_c || !tel_c) { setErr("Email y teléfono son obligatorios."); setStage("form"); return; }
    if (monto <= 0)          { setErr("Ingresa un monto válido.");          setStage("form"); return; }

    const sb = createClient();
    let archivo_url: string | null = null;

    if (file) {
      const path = `${profileId}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: upErr } = await sb.storage.from("facturas").upload(path, file);
      if (upErr) { setErr("Error al subir archivo: " + upErr.message); setStage("form"); return; }
      archivo_url = sb.storage.from("facturas").getPublicUrl(path).data.publicUrl;
    }

    const { data: deudor, error: dErr } = await sb
      .from("deudores")
      .upsert({ profile_id: profileId, rut, razon_social, mora_dias: 0, riesgo: "bajo", email_contacto: email_c, telefono_contacto: tel_c }, { onConflict: "profile_id,rut" })
      .select("id").single();

    if (dErr || !deudor) { setErr("No se pudo registrar el deudor."); setStage("form"); return; }

    const { error: fErr } = await sb.from("facturas").insert({
      profile_id: profileId, deudor_id: deudor.id, numero, monto,
      fecha_vencimiento: fecha_venc, estado: "en_gestion",
      archivo_url, notas: notas || null,
      repactado: repactar, num_cuotas: repactar ? cuotas : null, monto_cuota: repactar ? cuotaVal : null,
    });

    if (fErr) { setErr("Error al guardar factura: " + fErr.message); setStage("form"); return; }
    setFolio(`CL-2026-${numero.padStart(5, "0").slice(-5)}`);
    setStage("success");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0E1A2B]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-white w-full sm:max-w-[580px] max-h-[94vh] overflow-auto rounded-t-2xl sm:rounded-2xl shadow-lg animate-slideUp sm:animate-popIn">

        {stage !== "success" ? (
          <form onSubmit={submit}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-[#EFF2F6]">
              <div>
                <h2 className="text-[18px] font-semibold text-[#0E1A2B] tracking-tight">Subir nueva factura</h2>
                <p className="text-[13px] text-[#6B7A8F] mt-0.5">Los campos con <span className="text-[#B23B3B]">*</span> son obligatorios.</p>
              </div>
              <button type="button" onClick={close} className="w-8 h-8 rounded-lg text-[#6B7A8F] hover:bg-[#EFF2F6] inline-flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {err && <div className="px-4 py-3 rounded-[10px] bg-[#FBE9E9] text-[#B23B3B] text-[13px]">{err}</div>}

              {/* 1 — Deudor */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-3">1 · Datos del deudor</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="RUT del deudor" req>
                    <input name="rut" required placeholder="77.123.456-7" className={iCls}
                      value={rutVal}
                      onChange={e => setRutVal(formatRut(e.target.value))}
                      maxLength={12}
                    />
                  </Field>
                  <Field label="Razón social" req><input name="razon_social" required placeholder="Empresa S.A." className={iCls} /></Field>
                </div>
              </section>

              {/* 2 — Contacto */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-3">2 · Contacto del deudor</p>
                <div className="bg-[#EBF2FA]/50 border border-[#D6E5F4] rounded-[12px] p-4 space-y-3.5">
                  <p className="text-[12px] text-[#185FA5]">Necesitamos estos datos para contactar al deudor en el canal correcto.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field label="Email de contacto" req><input name="email_contacto" type="email" required placeholder="contacto@empresa.cl" className={iCls} /></Field>
                    <Field label="Teléfono / WhatsApp" req>
                      <input name="telefono_contacto" required placeholder="+56 9 8765 4321" className={iCls}
                        value={telVal}
                        onChange={e => setTelVal(formatPhone(e.target.value))}
                        maxLength={16}
                      />
                    </Field>
                  </div>
                </div>
              </section>

              {/* 3 — Factura */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-3">3 · Datos de la factura</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="N° de factura" req><input name="numero" required placeholder="0008821" className={iCls} /></Field>
                  <Field label="Fecha de vencimiento" req><input name="fecha_vencimiento" type="date" required className={iCls} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Monto total (CLP)" req>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE] text-sm">$</span>
                        <input
                          name="monto" required placeholder="1.250.000"
                          value={fmtMonto(montoRaw)}
                          onChange={(e) => setMontoRaw(e.target.value.replace(/\D/g, ""))}
                          className={`${iCls} pl-7`}
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </section>

              {/* 4 — Repactación */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-3">4 · Repactación (opcional)</p>
                <div className="border border-[#E4E8EE] rounded-[12px] overflow-hidden">
                  <button type="button" onClick={() => setRepactar(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFBFD] transition-colors">
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${repactar ? "bg-navy text-white" : "bg-[#EFF2F6] text-[#6B7A8F]"}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      </div>
                      <div>
                        <p className="text-[13.5px] font-medium text-[#0E1A2B]">Dividir deuda en cuotas</p>
                        <p className="text-[12px] text-[#6B7A8F]">Propone un plan de pago al deudor</p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${repactar ? "bg-navy" : "bg-[#E4E8EE]"}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${repactar ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </button>

                  {repactar && (
                    <div className="border-t border-[#EFF2F6] px-4 py-4 bg-[#FAFBFD] space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Número de cuotas">
                          <select value={cuotas} onChange={(e) => setCuotas(Number(e.target.value))} className={`${iCls} cursor-pointer`}>
                            {[2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n} cuotas</option>)}
                          </select>
                        </Field>
                        <div>
                          <p className="text-[12.5px] font-medium text-[#2B3A4F] mb-1.5">Valor por cuota</p>
                          <div className="h-10 px-3.5 bg-white border border-[#E4E8EE] rounded-[10px] flex items-center">
                            <span className="text-[14px] font-bold text-navy">
                              {monto > 0 ? `$ ${cuotaVal.toLocaleString("es-CL")}` : <span className="text-[#8E9BAE] font-normal text-[13px]">—</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                      {monto > 0 && (
                        <div className="bg-white border border-[#E4E8EE] rounded-[10px] p-3 text-[12.5px] space-y-1">
                          <div className="flex justify-between text-[#6B7A8F]"><span>Total</span><span className="text-[#0E1A2B] font-medium">$ {monto.toLocaleString("es-CL")}</span></div>
                          <div className="flex justify-between text-[#6B7A8F]"><span>{cuotas} cuotas de</span><span className="text-navy font-bold">$ {cuotaVal.toLocaleString("es-CL")}</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* 5 — Archivo + notas */}
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9BAE] mb-3">5 · Archivo y notas</p>
                <div
                  className={`border-[1.5px] border-dashed rounded-[10px] p-5 text-center cursor-pointer transition-all mb-3 ${drag || file ? "border-[#185FA5] bg-[#EBF2FA]" : "border-[#E4E8EE] bg-[#FAFBFD] hover:border-[#185FA5]"}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) addFile(f); }}
                >
                  {file ? (
                    <span className="inline-flex items-center gap-2 bg-white border border-[#E4E8EE] rounded-lg px-3 py-1.5 text-[12.5px] text-[#0E1A2B] font-medium">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {file.name} · {(file.size / 1024).toFixed(0)} KB
                    </span>
                  ) : (
                    <>
                      <p className="text-[13.5px] font-medium text-[#0E1A2B]">Arrastra tu factura o <b className="text-[#185FA5]">busca en tu equipo</b></p>
                      <p className="text-[12px] text-[#6B7A8F] mt-0.5">PDF o XML del SII · Máx. 10 MB · Opcional</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf,.xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); }} />
                </div>
                <Field label="Notas internas (opcional)">
                  <textarea name="notas" rows={2} placeholder="Ej: cliente prometió pagar el 15/05…"
                    className="w-full px-3.5 py-3 border border-[#E4E8EE] rounded-[10px] text-[14px] placeholder-[#8E9BAE] focus:outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/12 transition-all resize-none" />
                </Field>
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#EFF2F6]">
              <span className="flex items-center gap-1.5 text-[12px] text-[#6B7A8F]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Cifrado extremo a extremo
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={close}>Cancelar</Button>
                <Button type="submit" variant="primary" size="sm" disabled={stage === "loading"}>
                  {stage === "loading" ? "Enviando…" : "Enviar a cobranza"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="px-7 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E5F4EC] text-[#1F7A4D] inline-flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-[20px] font-semibold text-[#0E1A2B] mb-1.5">Factura enviada a cobranza</h2>
            <p className="text-[13.5px] text-[#6B7A8F] max-w-sm mx-auto">Gestión iniciará en menos de 24 horas hábiles.</p>
            <div className="mt-5 bg-[#FAFBFD] border border-[#E4E8EE] rounded-[10px] p-4 text-left max-w-sm mx-auto text-[12.5px] space-y-1.5">
              <div className="flex justify-between text-[#6B7A8F]"><span>Folio</span><b className="text-[#0E1A2B]">{folio}</b></div>
              <div className="flex justify-between text-[#6B7A8F]"><span>Inicio gestión</span>
                <b className="text-[#0E1A2B]">{new Date(Date.now() + 86400000).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</b>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-7">
              <Button variant="secondary" size="sm" onClick={reset}>Subir otra</Button>
              <Button variant="primary" size="sm" onClick={close}>Ir al panel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
