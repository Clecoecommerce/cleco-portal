"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRUT, validarRUT } from "@/lib/utils";
import { enviarCobranzaConsolidada } from "@/lib/email";
import { getTramoMora, TRAMO_LABELS, TRAMO_COLORS } from "@/lib/scoring";
import { Button } from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
  profileId: string;
  onCreated?: () => void;
  /** Salida hacia la carga desde archivo. Vive acá y no en la barra del panel
   *  para que el usuario elija el camino cuando ya sabe cuántas facturas trae. */
  onCargaMasiva?: () => void;
}

interface DeudorOpcion {
  id: string;
  rut: string;
  razon_social: string;
  email_contacto: string | null;
  telefono_contacto: string | null;
}

interface FilaDoc {
  key: string;
  numero: string;
  emision: string;
  vencimiento: string;
  montoRaw: string;
}

const iCls = "w-full h-10 px-3.5 border border-[#E2E8F0] rounded-[10px] text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all";
const iErr = "!border-[#B23B3B] focus:!border-[#B23B3B]";

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

function nuevaFila(): FilaDoc {
  return { key: Math.random().toString(36).slice(2), numero: "", emision: "", vencimiento: "", montoRaw: "" };
}

function moraDe(vencimiento: string): number | null {
  if (!vencimiento) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = new Date(vencimiento + "T12:00:00");
  if (isNaN(venc.getTime())) return null;
  return Math.floor((hoy.getTime() - venc.getTime()) / 86_400_000);
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">
        {label}{req && <span className="text-[#B23B3B] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function CargarDocumentosModal({ open, onClose, profileId, onCreated, onCargaMasiva }: Props) {
  const [paso,     setPaso]     = useState<1 | 2>(1);
  const [guardando, setGuardando] = useState(false);
  const [listo,    setListo]    = useState(false);
  const [err,      setErr]      = useState("");

  // Paso 1 — deudor
  const [deudores,   setDeudores]   = useState<DeudorOpcion[]>([]);
  const [busqueda,   setBusqueda]   = useState("");
  const [seleccionado, setSeleccionado] = useState<DeudorOpcion | null>(null);
  const [modoNuevo,  setModoNuevo]  = useState(false);
  const [rut,        setRut]        = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [cargo,      setCargo]      = useState("");
  const [email,      setEmail]      = useState("");
  const [telefono,   setTelefono]   = useState("");

  // Paso 2 — documentos
  const [filas,     setFilas]     = useState<FilaDoc[]>([nuevaFila()]);
  const [situacion, setSituacion] = useState("");
  const [notificar, setNotificar] = useState(false);
  const [resumen,   setResumen]   = useState<{ guardadas: number; notificadas: number; omitidas: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    createClient()
      .from("deudores")
      .select("id, rut, razon_social, email_contacto, telefono_contacto")
      .eq("profile_id", profileId)
      .order("razon_social")
      .then(({ data }) => {
        setDeudores(data ?? []);
        // Sin deudores el buscador es un muro: lleva directo al formulario.
        if (!data || data.length === 0) setModoNuevo(true);
      });
  }, [open, profileId]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return deudores.slice(0, 6);
    return deudores
      .filter(d => d.razon_social.toLowerCase().includes(q) || d.rut.toLowerCase().includes(q))
      .slice(0, 6);
  }, [deudores, busqueda]);

  const total = useMemo(
    () => filas.reduce((s, f) => s + (parseInt(f.montoRaw || "0", 10) || 0), 0),
    [filas]
  );
  const vencidas = useMemo(
    () => filas.filter(f => { const m = moraDe(f.vencimiento); return m !== null && m > 0; }).length,
    [filas]
  );

  const nombreDeudor = seleccionado?.razon_social ?? razonSocial;
  const emailDeudor  = seleccionado?.email_contacto ?? email;

  function reset() {
    setPaso(1); setGuardando(false); setListo(false); setErr("");
    setBusqueda(""); setSeleccionado(null); setModoNuevo(false);
    setRut(""); setRazonSocial(""); setNombreContacto(""); setCargo("");
    setEmail(""); setTelefono("");
    setFilas([nuevaFila()]); setSituacion(""); setNotificar(false); setResumen(null);
  }
  function close() { if (!guardando) { reset(); onClose(); } }

  function actualizarFila(key: string, campo: keyof FilaDoc, valor: string) {
    setFilas(prev => prev.map(f => (f.key === key ? { ...f, [campo]: valor } : f)));
    setErr("");
  }

  function continuar() {
    if (seleccionado) { setErr(""); setPaso(2); return; }
    if (!validarRUT(rut))  { setErr("RUT inválido. Verifica el dígito verificador."); return; }
    if (!razonSocial.trim()) { setErr("La razón social es obligatoria."); return; }
    if (!email.trim())     { setErr("El email de contacto es obligatorio para poder cobrar."); return; }
    setErr(""); setPaso(2);
  }

  async function guardar() {
    const validas = filas.filter(f => f.numero.trim() && f.vencimiento && parseInt(f.montoRaw || "0", 10) > 0);
    if (validas.length === 0) {
      setErr("Agrega al menos un documento con número, vencimiento y monto.");
      return;
    }
    if (validas.length !== filas.length) {
      setErr("Hay documentos incompletos. Complétalos o elimínalos antes de continuar.");
      return;
    }

    setErr(""); setGuardando(true);
    const sb = createClient();

    let deudorId = seleccionado?.id ?? null;
    if (!deudorId) {
      const { data, error } = await sb
        .from("deudores")
        .upsert(
          {
            profile_id: profileId,
            rut,
            razon_social: razonSocial.trim(),
            nombre_contacto: nombreContacto.trim() || null,
            cargo: cargo.trim() || null,
            email_contacto: email.trim() || null,
            telefono_contacto: telefono.trim() || null,
          },
          { onConflict: "profile_id,rut" }
        )
        .select("id").single();
      if (error || !data) { setErr("No se pudo registrar el deudor."); setGuardando(false); return; }
      deudorId = data.id;
    }

    const { error: fErr } = await sb.from("facturas").insert(
      validas.map(f => ({
        profile_id: profileId,
        deudor_id: deudorId,
        numero: f.numero.trim(),
        monto: parseInt(f.montoRaw, 10),
        fecha_emision: f.emision || null,
        fecha_vencimiento: f.vencimiento,
        estado: "en_gestion",
        notas: situacion.trim() || null,
      }))
    );
    if (fErr) { setErr("Error al guardar los documentos: " + fErr.message); setGuardando(false); return; }

    let notificadas = 0, omitidas = 0;
    if (notificar && emailDeudor) {
      try {
        const r = await enviarCobranzaConsolidada({
          profileId,
          emailDeudor,
          nombreDeudor,
          facturas: validas.map(f => ({
            numero: f.numero.trim(),
            monto: parseInt(f.montoRaw, 10),
            fechaVencimiento: f.vencimiento,
          })),
        });
        notificadas = r.notificadas;
        omitidas    = r.omitidas;
      } catch {
        // El correo es accesorio: los documentos ya quedaron guardados.
      }
    }

    setResumen({ guardadas: validas.length, notificadas, omitidas });
    setGuardando(false);
    setListo(true);
    onCreated?.();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6 animate-fadeIn"
      onClick={e => e.target === e.currentTarget && close()}
    >
      <div className="bg-white w-full sm:max-w-[720px] max-h-[94vh] overflow-auto rounded-t-2xl sm:rounded-2xl shadow-lg animate-slideUp sm:animate-popIn">

        {listo ? (
          <div className="px-7 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E5F4EC] text-[#1F7A4D] inline-flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-[20px] font-semibold text-[#0F172A] mb-1.5">
              {resumen?.guardadas === 1 ? "Documento cargado" : `${resumen?.guardadas} documentos cargados`}
            </h2>
            <p className="text-[13.5px] text-[#6B7280] max-w-sm mx-auto">{nombreDeudor}</p>

            <div className="mt-5 bg-[#FAFBFD] border border-[#E2E8F0] rounded-[10px] p-4 text-left max-w-sm mx-auto text-[12.5px] space-y-1.5">
              <div className="flex justify-between text-[#6B7280]">
                <span>Total cargado</span>
                <b className="text-[#0F172A]">$ {total.toLocaleString("es-CL")}</b>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Cobranza al deudor</span>
                {!notificar ? (
                  <span className="text-[#9CA3AF]">No enviada</span>
                ) : resumen && resumen.notificadas > 0 ? (
                  <b className="text-[#1F7A4D]">✓ 1 correo · {resumen.notificadas} vencida{resumen.notificadas === 1 ? "" : "s"}</b>
                ) : (
                  <span className="text-[#9CA3AF]">Sin facturas vencidas</span>
                )}
              </div>
              {notificar && resumen && resumen.omitidas > 0 && (
                <div className="flex justify-between text-[#6B7280]">
                  <span>Aún no vencen</span>
                  <b className="text-[#0F172A]">{resumen.omitidas}</b>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 mt-7">
              <Button variant="secondary" size="sm" onClick={reset}>Cargar otro deudor</Button>
              <Button variant="primary" size="sm" onClick={close}>Ir al panel</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header + pasos */}
            <div className="px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#0F172A] tracking-tight">Cargar documentos a cobranza</h2>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    {paso === 1 ? "Primero indica a quién le vas a cobrar." : "Ahora agrega todos sus documentos impagos."}
                  </p>
                </div>
                <button type="button" onClick={close} className="w-8 h-8 rounded-lg text-[#6B7280] hover:bg-[#F1F5F9] inline-flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="flex items-center gap-2 mt-4">
                {([1, 2] as const).map(n => (
                  <div key={n} className="flex items-center gap-2 flex-1">
                    <span className={`w-6 h-6 rounded-full text-[11px] font-semibold inline-flex items-center justify-center shrink-0 ${paso >= n ? "bg-navy text-white" : "bg-[#F1F5F9] text-[#9CA3AF]"}`}>{n}</span>
                    <span className={`text-[12.5px] font-medium ${paso >= n ? "text-[#0F172A]" : "text-[#9CA3AF]"}`}>
                      {n === 1 ? "Deudor" : "Documentos"}
                    </span>
                    {n === 1 && <div className={`h-px flex-1 ${paso === 2 ? "bg-navy" : "bg-[#E2E8F0]"}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {err && <div className="px-4 py-3 rounded-[10px] bg-[#FBE9E9] text-[#B23B3B] text-[13px]">{err}</div>}

              {paso === 1 ? (
                <>
                  {!modoNuevo ? (
                    <>
                      <Field label="Buscar deudor existente">
                        <input
                          className={iCls}
                          placeholder="Razón social o RUT…"
                          value={busqueda}
                          onChange={e => { setBusqueda(e.target.value); setSeleccionado(null); }}
                        />
                      </Field>

                      <div className="space-y-1.5">
                        {filtrados.length === 0 ? (
                          <p className="text-[13px] text-[#6B7280] py-3 text-center">
                            {deudores.length === 0 ? "Todavía no tienes deudores registrados." : "Ningún deudor coincide con la búsqueda."}
                          </p>
                        ) : filtrados.map(d => (
                          <button
                            key={d.id} type="button"
                            onClick={() => { setSeleccionado(d); setErr(""); }}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] border text-left transition-colors ${
                              seleccionado?.id === d.id
                                ? "border-[#2563EB] bg-[#EFF6FF]"
                                : "border-[#E2E8F0] hover:bg-[#FAFBFD]"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-[13.5px] font-medium text-[#0F172A] truncate">{d.razon_social}</p>
                              <p className="text-[12px] text-[#6B7280]">
                                {d.rut}{d.email_contacto ? ` · ${d.email_contacto}` : " · sin email"}
                              </p>
                            </div>
                            {seleccionado?.id === d.id && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </button>
                        ))}
                      </div>

                      {seleccionado && !seleccionado.email_contacto && (
                        <div className="px-4 py-3 rounded-[10px] bg-[#FBF3E1] text-[#B7791F] text-[12.5px]">
                          Este deudor no tiene email registrado: podrás cargar los documentos, pero no enviarle cobranza.
                        </div>
                      )}

                      <button type="button" onClick={() => { setModoNuevo(true); setSeleccionado(null); setErr(""); }}
                        className="w-full h-10 rounded-[10px] border border-dashed border-[#E2E8F0] text-[13px] font-medium text-[#2563EB] hover:border-[#2563EB] hover:bg-[#EFF6FF]/50 transition-colors">
                        + Registrar un deudor nuevo
                      </button>
                    </>
                  ) : (
                    <>
                      <section className="space-y-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                          Empresa deudora
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <Field label="RUT" req>
                            <input
                              className={`${iCls} ${err.includes("RUT") ? iErr : ""}`} placeholder="77.123.456-7" maxLength={12}
                              value={rut} onChange={e => { setRut(formatRUT(e.target.value)); setErr(""); }}
                            />
                          </Field>
                          <Field label="Razón social" req>
                            <input className={iCls} placeholder="Empresa S.A."
                              value={razonSocial} onChange={e => { setRazonSocial(e.target.value); setErr(""); }} />
                          </Field>
                        </div>
                      </section>

                      <section className="space-y-3.5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                            ¿Con quién hablamos?
                          </p>
                          <p className="text-[12px] text-[#6B7280] mt-1">
                            La persona que aprueba o paga las facturas en esa empresa.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <Field label="Nombre del contacto">
                            <input className={iCls} placeholder="Eduardo Briones"
                              value={nombreContacto} onChange={e => setNombreContacto(e.target.value)} />
                          </Field>
                          <Field label="Cargo">
                            <input className={iCls} placeholder="Jefe de finanzas"
                              value={cargo} onChange={e => setCargo(e.target.value)} />
                          </Field>
                        </div>
                        <Field label="Correo electrónico" req>
                          <input className={iCls} type="email" placeholder="pagos@empresa.cl"
                            value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} />
                          <p className="mt-1.5 text-[12px] text-[#6B7280]">
                            Sin correo no podemos cobrar automáticamente. Es el campo que más mueve la recuperación.
                          </p>
                        </Field>
                        <Field label="Teléfono / WhatsApp">
                          <input className={iCls} placeholder="+56 9 8765 4321" maxLength={16}
                            value={telefono} onChange={e => setTelefono(formatPhone(e.target.value))} />
                        </Field>
                      </section>

                      {deudores.length > 0 && (
                        <button type="button" onClick={() => { setModoNuevo(false); setErr(""); }}
                          className="text-[13px] font-medium text-[#2563EB] hover:underline">
                          ← Buscar entre mis deudores
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-[#EFF6FF]/60 border border-[#DBEAFE]">
                    <span className="text-[13px] text-[#1E293B]">
                      Cobrando a <b>{nombreDeudor}</b>
                      {emailDeudor && <span className="text-[#6B7280]"> · {emailDeudor}</span>}
                    </span>
                    <button type="button" onClick={() => setPaso(1)} className="ml-auto text-[12.5px] font-medium text-[#2563EB] hover:underline shrink-0">
                      Cambiar
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {filas.map((f, i) => {
                      const mora  = moraDe(f.vencimiento);
                      const tramo = mora === null ? null : getTramoMora(mora);
                      return (
                        <div key={f.key} className="border border-[#E2E8F0] rounded-[12px] p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                              Documento {i + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {tramo && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: TRAMO_COLORS[tramo].bg, color: TRAMO_COLORS[tramo].text }}>
                                  {TRAMO_LABELS[tramo]}
                                </span>
                              )}
                              {filas.length > 1 && (
                                <button type="button" onClick={() => setFilas(prev => prev.filter(x => x.key !== f.key))}
                                  className="w-7 h-7 rounded-lg text-[#9CA3AF] hover:bg-[#FBE9E9] hover:text-[#B23B3B] inline-flex items-center justify-center transition-colors"
                                  aria-label={`Eliminar documento ${i + 1}`}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <Field label="N° documento" req>
                              <input className={iCls} placeholder="0008821"
                                value={f.numero} onChange={e => actualizarFila(f.key, "numero", e.target.value)} />
                            </Field>
                            <Field label="Emisión">
                              <input className={iCls} type="date"
                                value={f.emision} onChange={e => actualizarFila(f.key, "emision", e.target.value)} />
                            </Field>
                            <Field label="Vencimiento" req>
                              <input className={iCls} type="date"
                                value={f.vencimiento} onChange={e => actualizarFila(f.key, "vencimiento", e.target.value)} />
                            </Field>
                            <Field label="Monto" req>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
                                <input
                                  className={`${iCls} pl-7`} placeholder="1.250.000"
                                  value={parseInt(f.montoRaw || "0", 10) ? parseInt(f.montoRaw, 10).toLocaleString("es-CL") : ""}
                                  onChange={e => actualizarFila(f.key, "montoRaw", e.target.value.replace(/\D/g, ""))}
                                />
                              </div>
                            </Field>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" onClick={() => setFilas(prev => [...prev, nuevaFila()])}
                    className="w-full h-10 rounded-[10px] border border-dashed border-[#E2E8F0] text-[13px] font-medium text-[#2563EB] hover:border-[#2563EB] hover:bg-[#EFF6FF]/50 transition-colors">
                    + Agregar otro documento
                  </button>

                  <div className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-[#FAFBFD] border border-[#E2E8F0]">
                    <span className="text-[13px] text-[#6B7280]">
                      {filas.length} documento{filas.length === 1 ? "" : "s"}
                      {vencidas > 0 && <span className="text-[#B23B3B]"> · {vencidas} vencido{vencidas === 1 ? "" : "s"}</span>}
                    </span>
                    <span className="text-[15px] font-bold text-navy">$ {total.toLocaleString("es-CL")}</span>
                  </div>

                  <Field label="¿Por qué no te han pagado? (opcional)">
                    <textarea
                      rows={2} value={situacion} onChange={e => setSituacion(e.target.value)}
                      placeholder="Ej: El trabajo se realizó y a la fecha no he recibido el pago."
                      className="w-full px-3.5 py-3 border border-[#E2E8F0] rounded-[10px] text-[14px] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all resize-none"
                    />
                    <p className="mt-1.5 text-[12px] text-[#6B7280]">
                      Queda como nota interna tuya. No se le envía al deudor.
                    </p>
                  </Field>

                  <label className={`flex items-start gap-3 px-4 py-3.5 rounded-[12px] border transition-colors ${emailDeudor ? "border-[#E2E8F0] cursor-pointer hover:bg-[#FAFBFD]" : "border-[#E2E8F0] opacity-55"}`}>
                    <input
                      type="checkbox" className="mt-0.5 w-4 h-4 accent-[#2563EB] shrink-0"
                      checked={notificar} disabled={!emailDeudor}
                      onChange={e => setNotificar(e.target.checked)}
                    />
                    <span className="text-[13px] text-[#1E293B]">
                      <b>Enviar cobranza al deudor ahora</b>
                      <span className="block text-[12px] text-[#6B7280] mt-0.5">
                        {!emailDeudor
                          ? "Este deudor no tiene email registrado."
                          : vencidas > 0
                            ? `Un solo correo con ${vencidas === filas.length ? "todos los documentos" : `los ${vencidas} documentos vencidos`}. Los que aún no vencen no se cobran.`
                            : "Ningún documento está vencido todavía, así que no se enviará nada."}
                      </span>
                    </span>
                  </label>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#F1F5F9]">
              {paso === 1 && onCargaMasiva ? (
                <button type="button" onClick={onCargaMasiva}
                  className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#2563EB] hover:underline text-left">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  ¿Son muchas? Súbelas desde un archivo
                </button>
              ) : (
                <span className="text-[12px] text-[#6B7280]">
                  {paso === 2 && `${filas.length} documento${filas.length === 1 ? "" : "s"} · $ ${total.toLocaleString("es-CL")}`}
                </span>
              )}
              <div className="flex gap-2">
                {paso === 2 && <Button type="button" variant="secondary" size="sm" onClick={() => setPaso(1)}>Atrás</Button>}
                {paso === 1 ? (
                  <Button type="button" variant="primary" size="sm" onClick={continuar} disabled={!seleccionado && !modoNuevo}>
                    Continuar
                  </Button>
                ) : (
                  <Button type="button" variant="primary" size="sm" onClick={guardar} disabled={guardando}>
                    {guardando ? "Guardando…" : `Cargar ${filas.length} documento${filas.length === 1 ? "" : "s"}`}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
