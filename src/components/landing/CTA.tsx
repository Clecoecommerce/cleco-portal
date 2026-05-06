"use client";
import { useState } from "react";

export default function CTA() {
  const [form, setForm] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    monto: "",
    mensaje: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`https://formsubmit.co/ajax/contacto@cleco.cl`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...form,
        _subject: "Nueva consulta desde cleco.cl",
        _captcha: "false",
      }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <section id="contacto" className="bg-[#2563EB] py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
            ¿Tienes deudas pendientes?
          </h2>
          <p className="text-white/75 text-lg max-w-xl mx-auto leading-relaxed">
            Deja de perder tiempo persiguiendo pagos. Nosotros nos encargamos.
            <br />Solicita una evaluación gratuita y te contactaremos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* Form card */}
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-[#0F172A] text-xl font-bold mb-2">¡Mensaje enviado!</p>
                <p className="text-[#6B7280] text-[15px]">Te contactaremos en menos de 24 horas hábiles.</p>
              </div>
            ) : (
              <>
                <h3 className="text-[#0F172A] text-[18px] font-bold mb-1">Envíanos un mensaje</h3>
                <p className="text-[#6B7280] text-[14px] mb-6">Completa el formulario y te contactaremos.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Nombre completo</label>
                      <input
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Tu nombre"
                        className="w-full h-11 px-3.5 border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Empresa</label>
                      <input
                        name="empresa"
                        value={form.empresa}
                        onChange={handleChange}
                        placeholder="Nombre de tu empresa"
                        className="w-full h-11 px-3.5 border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Correo electrónico</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="tu@empresa.com"
                        className="w-full h-11 px-3.5 border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Teléfono</label>
                      <input
                        name="telefono"
                        type="tel"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="+56 9 1234 5678"
                        className="w-full h-11 px-3.5 border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Monto aproximado de cartera vencida</label>
                    <input
                      name="monto"
                      value={form.monto}
                      onChange={handleChange}
                      placeholder="Ej: $500.000"
                      className="w-full h-11 px-3.5 border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Mensaje</label>
                    <textarea
                      name="mensaje"
                      value={form.mensaje}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Cuéntanos más sobre tu situación y necesidades..."
                      className="w-full px-3.5 py-3 border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-60 text-white font-semibold text-[14.5px] rounded-xl transition-colors"
                  >
                    {loading ? "Enviando…" : "Solicitar evaluación gratis"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-4 lg:pt-2">
            <h3 className="text-white text-[22px] font-bold mb-6">Información de contacto</h3>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-[15px]">Correo electrónico</p>
                <p className="text-white/70 text-[14px]">contacto@cleco.cl</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-[15px]">Ubicación</p>
                <p className="text-white/70 text-[14px]">Santiago, Chile</p>
              </div>
            </div>

            <div className="mt-6 bg-white/10 rounded-2xl p-6">
              <p className="text-white font-semibold text-[15px] mb-1">Horario de atención</p>
              <p className="text-white/70 text-[14px]">Lunes a Viernes: 9:00 a.m. - 6:00 p.m.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
