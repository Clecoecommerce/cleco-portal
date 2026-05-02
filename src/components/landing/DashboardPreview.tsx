"use client";
import { useInView } from "@/hooks/useInView";
import clsx from "clsx";

const facturasMock = [
  { empresa: "Constructora Norte S.A.", rut: "77.234.100-5", numero: "0091", monto: "$4.200.000", estado: "en_gestion", vence: "15 mar 2026" },
  { empresa: "Distribuidora El Volcán",  rut: "76.512.890-3", numero: "0087", monto: "$1.850.000", estado: "pagada",     vence: "01 mar 2026" },
  { empresa: "Ferretería Andes Ltda.",   rut: "76.543.210-K", numero: "0085", monto: "$3.100.000", estado: "pendiente",  vence: "22 feb 2026" },
  { empresa: "Servicios Cóndor SpA",     rut: "77.001.234-8", numero: "0082", monto: "$980.000",   estado: "en_gestion", vence: "10 feb 2026" },
];

const estadoStyle: Record<string, { label: string; cls: string }> = {
  en_gestion: { label: "En gestión", cls: "bg-blue-bg text-blue" },
  pagada:     { label: "Pagada",     cls: "bg-green-bg text-green" },
  pendiente:  { label: "Pendiente",  cls: "bg-amber-bg text-amber" },
};

const metrics = [
  { label: "Facturas activas", value: "12", delta: "+3 esta semana" },
  { label: "Monto en gestión", value: "$18.430.000", delta: "+5,2% vs mes anterior", amber: true },
  { label: "Recuperado",       value: "$6.200.000",  delta: "+18% vs mes anterior" },
];

export default function DashboardPreview() {
  const { ref, inView } = useInView();

  return (
    <section
      id="portal"
      ref={ref}
      className="bg-white py-28 px-6 overflow-hidden"
      aria-labelledby="preview-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className={clsx(
            "max-w-2xl mb-14 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-navy/60">
            Portal de clientes
          </span>
          <h2
            id="preview-heading"
            className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight"
          >
            Visibilidad total
            <br />de tu cartera.
          </h2>
          <p className="mt-4 text-lg text-ink/55 leading-relaxed">
            Desde el primer día tienes acceso a un panel donde puedes ver el estado de cada
            factura, el historial de contactos y cuánto se ha recuperado. Sin cajas negras.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div
          className={clsx(
            "rounded-2xl border border-gray-100 shadow-lg overflow-hidden transition-all duration-1000",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
          style={{ transitionDelay: "150ms" }}
        >
          {/* Browser chrome */}
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-yellow-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
            </div>
            <div className="flex-1 max-w-xs mx-auto">
              <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-ink/40 font-mono text-center">
                portal.cleco.cl/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard body */}
          <div className="bg-[#F6F8FB] p-5 sm:p-7">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mb-1">
                  Panel principal
                </p>
                <h3 className="text-base font-semibold text-ink">Buenos días, Ferretería Andes</h3>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-ink/60">
                Últimos 30 días
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {metrics.map(({ label, value, delta, amber }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-[11px] text-ink/50 mb-2 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-xl font-bold text-ink">{value}</p>
                  <p className={clsx("text-[11px] mt-1", amber ? "text-amber" : "text-green")}>{delta}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Mis facturas</span>
                <span className="text-[11px] bg-navy/8 text-navy font-semibold px-2 py-0.5 rounded-full">
                  {facturasMock.filter(f => f.estado !== "pagada").length} activas
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Empresa deudora", "N° Factura", "Monto", "Vencimiento", "Estado"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-ink/40 border-b border-gray-100">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facturasMock.map((f, i) => {
                      const { label, cls } = estadoStyle[f.estado];
                      return (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-medium text-ink">{f.empresa}</td>
                          <td className="px-4 py-3 font-mono text-ink/60">N° {f.numero}</td>
                          <td className="px-4 py-3 font-semibold text-ink tabular-nums">{f.monto}</td>
                          <td className="px-4 py-3 text-ink/50">{f.vence}</td>
                          <td className="px-4 py-3">
                            <span className={clsx("text-[10px] font-semibold px-2 py-1 rounded-full", cls)}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <p className="mt-5 text-center text-sm text-ink/35">
          Así se ve tu portal — acceso inmediato tras activar tu cuenta.
        </p>
      </div>
    </section>
  );
}
