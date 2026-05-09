"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";
import clsx from "clsx";

/* ── CountUp ─────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1500, active = false) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, target, duration]);

  return value;
}

/* ── Metric card ─────────────────────────────────────────── */
function MetricCard({
  label, prefix = "", suffix = "", target, inView, delay = 0,
}: {
  label: string; prefix?: string; suffix?: string;
  target: number; inView: boolean; delay?: number;
}) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t);
  }, [inView, delay]);

  const val = useCountUp(target, 1400, active);

  const formatted =
    suffix === "%" ? val.toString() :
    prefix === "$" ? val.toLocaleString("es-CL") :
    val.toLocaleString("es-CL");

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col gap-1">
      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#6B7280]">{label}</p>
      <p className="text-[22px] font-bold text-[#0F172A] tabular-nums leading-tight">
        {prefix}{formatted}{suffix}
      </p>
    </div>
  );
}

/* ── Bar chart (SVG) ──────────────────────────────────────── */
const barData = [
  { mes: "Ene", monto: 8_200_000 },
  { mes: "Feb", monto: 14_100_000 },
  { mes: "Mar", monto: 18_700_000 },
  { mes: "Abr", monto: 24_500_000 },
];

function BarChart({ inView }: { inView: boolean }) {
  const max = Math.max(...barData.map(d => d.monto));
  const W = 280;
  const H = 100;
  const barW = 38;
  const gap = (W - barData.length * barW) / (barData.length + 1);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
        Recuperación mensual
      </p>
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" aria-hidden>
        {barData.map((d, i) => {
          const barH = (d.monto / max) * H;
          const x = gap + i * (barW + gap);
          const y = H - barH;
          const label = `$${(d.monto / 1_000_000).toFixed(1)}M`;

          return (
            <g key={d.mes}>
              {/* background track */}
              <rect x={x} y={0} width={barW} height={H} rx={6} fill="#EFF6FF" />
              {/* animated bar */}
              <rect
                x={x} y={inView ? y : H} width={barW} height={inView ? barH : 0} rx={6}
                fill="#2563EB"
                style={{
                  transition: `y 0.7s cubic-bezier(0.34,1.1,0.64,1) ${i * 100}ms, height 0.7s cubic-bezier(0.34,1.1,0.64,1) ${i * 100}ms`,
                }}
              />
              {/* value label */}
              <text
                x={x + barW / 2} y={inView ? y - 4 : H - 4}
                textAnchor="middle" fontSize="8" fill="#2563EB" fontWeight="700"
                style={{ transition: `y 0.7s cubic-bezier(0.34,1.1,0.64,1) ${i * 100}ms`, opacity: inView ? 1 : 0 }}
              >
                {label}
              </text>
              {/* month label */}
              <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="#6B7280" fontWeight="600">
                {d.mes}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Debtors table ───────────────────────────────────────── */
const deudores = [
  { empresa: "Constructora Norte S.A.",  monto: "$4.200.000",  mora: 45,  estado: "en_gestion" },
  { empresa: "Distribuidora El Volcán",  monto: "$1.850.000",  mora: 12,  estado: "acuerdo"    },
  { empresa: "Ferretería Andes Ltda.",   monto: "$3.100.000",  mora: 67,  estado: "en_gestion" },
  { empresa: "Servicios Cóndor SpA",     monto: "$980.000",    mora: 90,  estado: "pendiente"  },
  { empresa: "Transportes Sur Ltda.",    monto: "$2.400.000",  mora: 30,  estado: "acuerdo"    },
];

const badge: Record<string, { label: string; bg: string; text: string }> = {
  en_gestion: { label: "En gestión",       bg: "#EFF6FF", text: "#2563EB" },
  acuerdo:    { label: "Acuerdo alcanzado", bg: "#E5F4EC", text: "#1F7A4D" },
  pendiente:  { label: "Pendiente",         bg: "#FBF3E1", text: "#B7791F" },
};

/* ── Main component ──────────────────────────────────────── */
export default function DashboardPreview() {
  const { ref, inView } = useInView({ threshold: 0.08 });

  return (
    <section
      id="portal"
      ref={ref}
      className="bg-white py-24 px-6 overflow-hidden"
      aria-labelledby="preview-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div
          className={clsx(
            "max-w-2xl mb-12 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]/60">
            Portal de clientes
          </span>
          <h2
            id="preview-heading"
            className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight"
          >
            Visibilidad total
            <br />de tu cartera.
          </h2>
          <p className="mt-4 text-lg text-[#0F172A]/55 leading-relaxed">
            Desde el primer día tienes acceso a un panel donde puedes ver el estado de cada
            factura, el historial de contactos y cuánto se ha recuperado. Sin cajas negras.
          </p>
        </div>

        {/* App window */}
        <div
          className={clsx(
            "rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,.18),0_8px_18px_rgba(15,23,42,.08)] border border-[#E2E8F0] transition-all duration-1000",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
          style={{ transitionDelay: "150ms" }}
        >
          {/* macOS chrome */}
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex items-center gap-3">
            <div className="flex gap-[6px]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 max-w-[240px] mx-auto">
              <div className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1 text-[11px] text-[#0F172A]/40 font-mono text-center">
                portal.cleco.cl/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard body */}
          <div className="bg-[#EFF6FF] p-5 sm:p-7 space-y-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-0.5">
                  Panel principal
                </p>
                <h3 className="text-[15px] font-semibold text-[#0F172A]">Buenos días, Ferretería Andes</h3>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[11.5px] text-[#6B7280] font-medium">
                Últimos 30 días
              </span>
            </div>

            {/* Animated metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard label="Cartera gestionada" prefix="$" target={24_500_000} inView={inView} delay={0} />
              <MetricCard label="Tasa de recuperación" suffix="%" target={68} inView={inView} delay={120} />
              <MetricCard label="Casos activos" target={47} inView={inView} delay={240} />
            </div>

            {/* Chart + table row */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
              {/* Bar chart */}
              <BarChart inView={inView} />

              {/* Debtors table */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#0F172A]">Deudores activos</span>
                  <span className="text-[10.5px] bg-[#EFF6FF] text-[#2563EB] font-semibold px-2.5 py-0.5 rounded-full">
                    {deudores.filter(d => d.estado !== "acuerdo").length} en proceso
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[#FAFBFD]">
                        {["Empresa", "Monto", "Mora", "Estado"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] border-b border-[#F1F5F9]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deudores.map((d, i) => {
                        const b = badge[d.estado];
                        return (
                          <tr
                            key={i}
                            className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFD] transition-colors"
                            style={{
                              opacity: inView ? 1 : 0,
                              transform: inView ? "translateY(0)" : "translateY(8px)",
                              transition: `opacity 0.4s ease ${300 + i * 60}ms, transform 0.4s ease ${300 + i * 60}ms`,
                            }}
                          >
                            <td className="px-4 py-3 font-medium text-[#0F172A] whitespace-nowrap">{d.empresa}</td>
                            <td className="px-4 py-3 font-semibold text-[#0F172A] tabular-nums">{d.monto}</td>
                            <td className="px-4 py-3 text-[#6B7280]">{d.mora} días</td>
                            <td className="px-4 py-3">
                              <span
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                                style={{ background: b.bg, color: b.text }}
                              >
                                {b.label}
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
        </div>

        <p className="mt-5 text-center text-[13px] text-[#0F172A]/35">
          Así se ve tu portal — acceso inmediato tras activar tu cuenta.
        </p>
      </div>
    </section>
  );
}
