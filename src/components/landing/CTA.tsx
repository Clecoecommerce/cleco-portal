"use client";
import { useInView } from "@/hooks/useInView";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

export default function CTA() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className="bg-white py-28 px-6"
      aria-label="Llamada a la acción"
    >
      <div className="max-w-4xl mx-auto">
        <div
          className={clsx(
            "rounded-3xl bg-navy p-10 sm:p-16 flex flex-col items-center text-center overflow-hidden relative transition-all duration-700",
            inView ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          )}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)",
            }}
          />

          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            Cero costo de entrada
          </span>

          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight max-w-2xl">
            ¿Cuánto tienes en facturas sin cobrar?
          </h2>
          <p className="relative mt-5 text-white/65 text-lg max-w-xl leading-relaxed">
            Cuéntanos tu situación. Sin compromiso. En 24 horas hábiles te
            decimos si podemos ayudarte y cuánto podríamos recuperar.
          </p>

          <div className="relative mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/auth/login"
              className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white text-navy font-bold text-sm hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              Diagnóstico gratuito de cartera
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <p className="relative mt-6 text-white/35 text-xs">
            Sin contrato. Sin mensualidades. Solo comisión por éxito.
          </p>
        </div>
      </div>
    </section>
  );
}
