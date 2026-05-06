"use client";
import Link from "next/link";
import { ArrowRight, ChevronDown, CheckCircle2, TrendingUp, Clock } from "lucide-react";

const floatingCards = [
  {
    id: 1,
    icon: <CheckCircle2 size={14} className="text-green-600" />,
    label: "Factura recuperada",
    value: "$2.450.000",
    sub: "Constructora Norte S.A. · hace 2 min",
    pos: "top-[18%] right-[-2%] sm:right-[4%]",
    delay: "0.4s",
  },
  {
    id: 2,
    icon: <TrendingUp size={14} className="text-navy" />,
    label: "Tasa de recupero",
    value: "72%",
    sub: "Promedio últimos 90 días",
    pos: "bottom-[28%] left-[-2%] sm:left-[2%]",
    delay: "0.7s",
  },
  {
    id: 3,
    icon: <Clock size={14} className="text-amber-600" />,
    label: "Primer contacto",
    value: "< 48 hrs",
    sub: "Desde que subes tu cartera",
    pos: "bottom-[12%] right-[0%] sm:right-[6%]",
    delay: "1s",
  },
];

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white px-6 pt-24 pb-20"
      aria-label="Presentación principal"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e4e8ee 1px, transparent 1px), linear-gradient(to bottom, #e4e8ee 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
          opacity: 0.3,
        }}
      />
      {/* Glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(24,95,165,0.07) 0%, transparent 70%)" }}
      />

      {/* Floating UI cards */}
      {floatingCards.map((card) => (
        <div
          key={card.id}
          className={`absolute ${card.pos} hidden md:flex items-start gap-2.5 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-lg z-10 hero-float`}
          style={{ animationDelay: card.delay, maxWidth: 220 }}
        >
          <div className="mt-0.5 shrink-0">{card.icon}</div>
          <div>
            <p className="text-[11px] text-ink/50 leading-none mb-1">{card.label}</p>
            <p className="text-[15px] font-bold text-ink leading-none">{card.value}</p>
            <p className="text-[10px] text-ink/40 mt-1 leading-snug">{card.sub}</p>
          </div>
        </div>
      ))}

      {/* Badge */}
      <div className="relative mb-8 landing-fade-in" style={{ animationDelay: "0ms" }}>
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-navy/20 bg-navy/5 text-navy text-xs font-semibold tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-navy animate-pulse" />
          Cobranza B2B · Santiago, Chile · Sin costo si no recuperamos
        </span>
      </div>

      {/* Headline */}
      <h1
        className="relative max-w-4xl text-center text-5xl sm:text-6xl md:text-7xl lg:text-[82px] font-bold tracking-tight text-ink leading-[1.04] landing-fade-in"
        style={{ animationDelay: "80ms" }}
      >
        Tu plata está ahí.{" "}
        <span className="relative inline-block">
          <span className="text-navy">Nosotros</span>
          <svg
            className="absolute -bottom-2 left-0 w-full"
            viewBox="0 0 200 8"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 6 Q50 1 100 5 Q150 9 200 4"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.35"
            />
          </svg>
        </span>{" "}
        <br className="hidden md:block" />
        la vamos a buscar.
      </h1>

      {/* Subheadline */}
      <p
        className="relative mt-9 max-w-2xl text-center text-lg sm:text-xl text-ink/55 leading-relaxed landing-fade-in"
        style={{ animationDelay: "160ms" }}
      >
        Recuperamos tus cuentas por cobrar vencidas con trato respetuoso y canales modernos.{" "}
        <strong className="text-ink/80 font-semibold">
          Sin mensualidades. Sin riesgo.
        </strong>{" "}
        Solo resultados.
      </p>

      {/* CTAs */}
      <div
        className="relative mt-10 flex flex-col sm:flex-row items-center gap-4 landing-fade-in"
        style={{ animationDelay: "240ms" }}
      >
        <Link
          href="/auth/login"
          className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-navy text-white font-bold text-sm hover:bg-navy-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
          Cuéntanos cuánto tienes pendiente
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
        <a
          href="#soluciones"
          className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-gray-200 text-ink/70 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 hover:text-ink transition-all duration-200"
        >
          Ver cómo funciona
        </a>
      </div>

      {/* Tagline */}
      <p
        className="relative mt-7 text-xs text-ink/30 tracking-wide landing-fade-in"
        style={{ animationDelay: "320ms" }}
      >
        "Cobranza que no duele." — CLECO.CL · hola@cleco.cl
      </p>

      {/* Stats */}
      <div
        className="relative mt-16 w-full max-w-3xl mx-auto grid grid-cols-3 gap-6 border-t border-gray-100 pt-10 landing-fade-in"
        style={{ animationDelay: "400ms" }}
      >
        {[
          { value: "0%",    label: "Costo si no recuperamos" },
          { value: "+90 d", label: "Carteras con < 15% éxito sin gestión" },
          { value: "71%",   label: "Facturas morosas en PyMEs chilenas" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">{value}</div>
            <div className="mt-1 text-xs sm:text-sm text-ink/50 leading-snug">{label}</div>
          </div>
        ))}
      </div>

      {/* Scroll cue */}
      <a
        href="#kpis"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ink/25 hover:text-ink/50 transition-colors landing-fade-in"
        aria-label="Continuar leyendo"
        style={{ animationDelay: "500ms" }}
      >
        <ChevronDown size={20} className="animate-bounce" />
      </a>
    </section>
  );
}
