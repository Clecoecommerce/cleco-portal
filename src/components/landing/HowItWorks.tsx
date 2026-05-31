"use client";
import { useInView } from "@/hooks/useInView";
import clsx from "clsx";
import { Upload, Bot, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <Upload size={22} />,
    title: "Nos entregas tu cartera",
    body: "Compartes la lista de tus facturas vencidas con datos de contacto. Hacemos la validación inicial en menos de 24 horas hábiles y activamos la gestión.",
  },
  {
    number: "02",
    icon: <Bot size={22} />,
    title: "CLECO gestiona por ti",
    body: "Contactamos al deudor en el canal correcto y en el momento adecuado — email, teléfono o el medio con mayor probabilidad de éxito según el perfil del caso.",
  },
  {
    number: "03",
    icon: <TrendingUp size={22} />,
    title: "Recibes tu dinero. Nosotros, nuestra comisión.",
    body: "El monto recuperado llega a tu cuenta. Nuestros honorarios se descuentan directamente del monto gestionado. Proceso simple, liquidación transparente.",
  },
];

export default function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section
      id="nosotros"
      ref={ref}
      className="bg-gray-50 py-28 px-6 border-y border-gray-100"
      aria-labelledby="how-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className={clsx(
            "max-w-xl mb-16 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-navy/60">
            Proceso
          </span>
          <h2
            id="how-heading"
            className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight"
          >
            Así de simple.
          </h2>
          <p className="mt-4 text-lg text-ink/55 leading-relaxed">
            Tres pasos para dejar de perseguir deudores y volver a enfocarte en
            hacer crecer tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map(({ number, icon, title, body }, i) => (
            <div
              key={number}
              className={clsx(
                "relative transition-all duration-700",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-5 left-[calc(100%-8px)] w-full h-px bg-gray-200 z-0"
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10">
                {/* Number + icon */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white shrink-0">
                    {icon}
                  </div>
                  <span className="text-2xl font-bold text-gray-200 font-mono">
                    {number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
                <p className="text-sm text-ink/55 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
