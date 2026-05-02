"use client";
import { useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { useCounter } from "@/hooks/useCounter";
import clsx from "clsx";

interface KpiItem {
  prefix?: string;
  suffix?: string;
  end: number;
  label: string;
  description: string;
  duration?: number;
}

const kpis: KpiItem[] = [
  {
    prefix: "+$",
    suffix: "M",
    end: 1200,
    label: "Recuperado para clientes",
    description: "En deuda gestionada exitosamente para empresas chilenas desde nuestra fundación.",
    duration: 2000,
  },
  {
    suffix: "%",
    end: 72,
    label: "Tasa de recupero promedio",
    description: "De las carteras gestionadas terminan con al menos un pago parcial o total.",
    duration: 1600,
  },
  {
    prefix: "<",
    suffix: " hrs",
    end: 48,
    label: "Para el primer contacto",
    description: "Desde que subes tu cartera, nuestro equipo ya está gestionando en el canal correcto.",
    duration: 1200,
  },
  {
    suffix: "%",
    end: 0,
    label: "Costo si no recuperamos",
    description: "Modelo 100% por comisión. Si no hay resultado, no hay cobro. Sin letra chica.",
    duration: 800,
  },
];

function KpiCard({ item, inView }: { item: KpiItem; inView: boolean }) {
  const { count, trigger } = useCounter(item.end, item.duration ?? 1800);

  useEffect(() => {
    if (inView) trigger();
  }, [inView]);

  return (
    <div className="flex flex-col gap-3 p-7 rounded-2xl bg-white border border-gray-100 hover:border-navy/20 hover:shadow-md transition-all duration-300 group">
      <div className="text-4xl sm:text-5xl font-bold text-navy tracking-tight tabular-nums leading-none">
        {item.prefix ?? ""}
        {count.toLocaleString("es-CL")}
        {item.suffix ?? ""}
      </div>
      <div>
        <p className="text-sm font-semibold text-ink mb-1">{item.label}</p>
        <p className="text-sm text-ink/50 leading-relaxed">{item.description}</p>
      </div>
      <div className="mt-auto h-0.5 w-8 bg-navy/20 rounded-full group-hover:w-full group-hover:bg-navy/40 transition-all duration-500" />
    </div>
  );
}

export default function KPIs() {
  const { ref, inView } = useInView();

  return (
    <section
      id="kpis"
      ref={ref}
      className="bg-gray-50 border-y border-gray-100 py-24 px-6"
      aria-labelledby="kpis-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className={clsx(
            "max-w-xl mb-12 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-navy/60">
            Resultados reales
          </span>
          <h2
            id="kpis-heading"
            className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight"
          >
            Números que
            <br />
            hablan solos.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((item, i) => (
            <div
              key={item.label}
              className={clsx(
                "transition-all duration-700",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <KpiCard item={item} inView={inView} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
