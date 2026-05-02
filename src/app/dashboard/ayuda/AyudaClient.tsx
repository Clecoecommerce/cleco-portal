"use client";

import { useState } from "react";

type Category = { icon: React.ReactNode; title: string; count: number; keywords: string[] };

const categories: Category[] = [
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: "Facturas y documentos", count: 12, keywords: ["factura", "documento", "subir", "xml", "pdf", "sii"] },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, title: "Plazos y proceso de cobranza", count: 8, keywords: ["plazo", "cobranza", "proceso", "gestión", "días", "mora"] },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, title: "Pagos, honorarios y liquidaciones", count: 9, keywords: ["pago", "honorario", "liquidación", "comisión", "desembolso"] },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><polyline points="7 14 11 10 15 13 21 7"/></svg>, title: "Cobranza judicial y Ley 21.131", count: 6, keywords: ["judicial", "ley", "21131", "tribunal", "demanda"] },
];

const faqs = [
  { q: "¿Cuánto tarda Cleco en iniciar la gestión?", a: "Una vez recibida la factura, iniciamos la gestión extrajudicial dentro de las primeras <b>24 horas hábiles</b>. El primer contacto al deudor ocurre normalmente al segundo día hábil.", keywords: ["plazo", "proceso", "gestión", "días", "cobranza"] },
  { q: "¿Qué porcentaje cobra Cleco?", a: 'Operamos bajo el modelo <b>"no cobramos si no recuperamos"</b>. La comisión estándar es <b>12%</b> sobre el monto efectivamente recuperado. Para carteras superiores a UF 1.000 mensuales, evaluamos planes a medida.', keywords: ["honorario", "comisión", "pago", "porcentaje", "12%"] },
  { q: "¿Pueden gestionar facturas con más de 90 días de mora?", a: "Sí. Aceptamos facturas con cualquier antigüedad dentro del plazo de prescripción civil (3 años para mercaderías, 5 años para honorarios profesionales según el Código Civil chileno).", keywords: ["mora", "plazo", "90", "días", "cobranza"] },
  { q: "¿Qué documentos debo subir al portal?", a: "El PDF de la factura electrónica timbrada por el SII y, si la tienes, la guía de despacho o nota de venta firmada. También aceptamos el XML del DTE.", keywords: ["factura", "documento", "subir", "xml", "pdf", "sii"] },
  { q: "¿Cuándo se inicia un proceso judicial?", a: "Después de 60 días de gestión extrajudicial sin respuesta efectiva, te enviamos una propuesta para escalar a cobranza judicial. La decisión final es siempre tuya.", keywords: ["judicial", "ley", "tribunal", "proceso", "demanda"] },
  { q: "¿Cómo y cuándo me desembolsan el dinero recuperado?", a: "Las liquidaciones se realizan cada <b>5 días hábiles</b>. Los pagos confirmados antes de las 14:00 hrs se incluyen en el ciclo siguiente a tu cuenta corriente registrada.", keywords: ["pago", "liquidación", "desembolso", "dinero", "días"] },
];

const resources = [
  { label: "Guía de uso del portal (PDF)", ext: true },
  { label: "Contrato marco vigente", ext: false },
  { label: "Términos y condiciones", ext: true },
  { label: "Estado de servicios", ext: true },
];

export function AyudaClient() {
  const [query,    setQuery]    = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const q = query.toLowerCase();

  const filteredFaqs = faqs.filter(f => {
    const matchQuery = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.keywords.some(k => k.includes(q));
    const matchCat   = !catFilter || f.keywords.some(k => catFilter.split(",").some(ck => k.includes(ck)));
    return matchQuery && matchCat;
  });

  function toggleCategory(cat: Category) {
    const key = cat.keywords.join(",");
    setCatFilter(prev => prev === key ? null : key);
    setQuery("");
  }

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B7A8F] mb-2">Soporte</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#0E1A2B] mb-1">Centro de ayuda</h1>
        <p className="text-[13.5px] text-[#6B7A8F]">Resuelve dudas frecuentes o contacta a tu ejecutivo asignado.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-[560px] mb-6">
        <svg className="absolute left-3 top-3.5 text-[#8E9BAE]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setCatFilter(null); }}
          className="w-full h-11 pl-9 pr-10 border border-[#E4E8EE] rounded-[10px] text-[14px] text-[#0E1A2B] placeholder-[#8E9BAE] focus:outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/12 transition-all"
          placeholder="¿Cómo podemos ayudarte? Ej: subir factura, plazos…"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-3.5 text-[#8E9BAE] hover:text-[#0E1A2B]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div>
          {/* Categories */}
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6B7A8F] mb-3">Categorías</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
            {categories.map(cat => {
              const key = cat.keywords.join(",");
              const active = catFilter === key;
              return (
                <button key={cat.title} onClick={() => toggleCategory(cat)}
                  className={`text-left border rounded-[10px] p-[18px] transition-all ${active ? "border-[#185FA5] bg-[#EBF2FA] shadow-sm" : "bg-white border-[#E4E8EE] hover:border-[#D6E5F4] hover:shadow-sm"}`}>
                  <div className={`w-8 h-8 rounded-[8px] inline-flex items-center justify-center mb-3 ${active ? "bg-[#185FA5] text-white" : "bg-[#EBF2FA] text-[#185FA5]"}`}>{cat.icon}</div>
                  <p className="text-[14px] font-semibold text-[#0E1A2B] mb-1 tracking-tight">{cat.title}</p>
                  <p className="text-[12.5px] text-[#6B7A8F]">{cat.count} artículos</p>
                </button>
              );
            })}
          </div>

          {/* FAQs */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6B7A8F]">Preguntas frecuentes</p>
            {(query || catFilter) && (
              <button onClick={() => { setQuery(""); setCatFilter(null); }} className="text-[12px] text-[#185FA5] hover:underline">Limpiar filtro</button>
            )}
          </div>

          <div className="bg-white border border-[#E4E8EE] rounded-[14px] shadow-sm overflow-hidden">
            {filteredFaqs.length === 0 ? (
              <div className="py-10 text-center text-[#6B7A8F]">
                <p className="text-[14px] font-medium text-[#0E1A2B] mb-1">Sin resultados</p>
                <p className="text-[13px]">Prueba con otro término o contacta a tu ejecutivo.</p>
              </div>
            ) : filteredFaqs.map(({ q: fq, a }, i) => (
              <details key={i} className="faq border-b border-[#EFF2F6] last:border-0">
                <summary className="flex items-center justify-between gap-3 px-[18px] py-4 cursor-pointer hover:bg-[#FAFBFD] font-medium text-[13.5px] text-[#0E1A2B] transition-colors list-none">
                  {fq}
                  <span className="chev text-[18px] text-[#8E9BAE] flex-shrink-0 transition-transform">+</span>
                </summary>
                <div className="px-[18px] pb-[18px] text-[13.5px] text-[#2B3A4F] leading-[1.55]" dangerouslySetInnerHTML={{ __html: a }} />
              </details>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6B7A8F] mb-3">Tu ejecutivo</p>
          <div className="bg-white border border-[#E4E8EE] rounded-[14px] shadow-sm p-5 mb-4">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-11 h-11 rounded-full bg-[#185FA5] text-white inline-flex items-center justify-center text-[14px] font-semibold">CM</div>
              <div>
                <p className="text-[14.5px] font-semibold text-[#0E1A2B]">Carolina Méndez</p>
                <p className="text-[12.5px] text-[#6B7A8F]">Ejecutiva senior · Cleco</p>
              </div>
            </div>
            <p className="text-[13px] text-[#2B3A4F] leading-[1.5] mb-3.5">
              Atención lunes a viernes, 9:00 a 18:00 hrs. Respuesta promedio:{" "}
              <b className="text-[#0E1A2B]">2 hrs hábiles</b>.
              <br /><span className="text-[12px] text-[#8E9BAE]">contacto@cleco.cl</span>
            </p>
            <a
              href="mailto:contacto@cleco.cl?subject=Consulta%20desde%20Portal%20Cleco"
              className="w-full h-9 bg-[#185FA5] hover:bg-[#134d85] text-white text-[13px] font-semibold rounded-[10px] flex items-center justify-center gap-2 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2h-7l-4 4v-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Iniciar conversación
            </a>
            <a
              href="tel:+56220000000"
              className="w-full h-9 mt-2 bg-white border border-[#E4E8EE] hover:bg-[#EFF2F6] text-[#2B3A4F] text-[13px] font-medium rounded-[10px] flex items-center justify-center gap-2 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92V21a1 1 0 01-1.11 1A19.86 19.86 0 012 4.11 1 1 0 013 3h4.09a1 1 0 011 .75c.13.97.36 1.92.7 2.81a1 1 0 01-.23 1L6.91 9.09a16 16 0 008 8l1.53-1.65a1 1 0 011-.23c.89.34 1.84.57 2.81.7a1 1 0 01.75 1z"/></svg>
              Llamar +56 2 2000 0000
            </a>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6B7A8F] mb-3">Recursos</p>
          <div className="bg-white border border-[#E4E8EE] rounded-[14px] shadow-sm overflow-hidden">
            {resources.map(({ label, ext }) => (
              <a key={label} href="#" title="Próximamente disponible"
                className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#2B3A4F] border-b border-[#EFF2F6] last:border-0 hover:bg-[#FAFBFD] hover:text-[#185FA5] transition-colors">
                {ext
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7A8F] flex-shrink-0"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6B7A8F] flex-shrink-0"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                }
                {label}
              </a>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
