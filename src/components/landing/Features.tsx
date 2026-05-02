"use client";
import { useInView } from "@/hooks/useInView";
import {
  Banknote,
  Bot,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import clsx from "clsx";

interface BentoCardProps {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  accent?: boolean;
  large?: boolean;
  className?: string;
  delay?: number;
  inView: boolean;
}

function BentoCard({
  icon,
  eyebrow,
  title,
  body,
  accent,
  className,
  delay = 0,
  inView,
}: BentoCardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-2xl border p-7 flex flex-col gap-4 overflow-hidden transition-all duration-700",
        accent
          ? "bg-navy text-white border-navy"
          : "bg-white text-ink border-gray-100 hover:border-gray-200 hover:shadow-md",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background texture for accent card */}
      {accent && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Icon */}
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          accent ? "bg-white/15" : "bg-navy/8"
        )}
      >
        <span className={accent ? "text-white" : "text-navy"}>{icon}</span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2 relative z-10">
        {eyebrow && (
          <span
            className={clsx(
              "text-xs font-semibold uppercase tracking-widest",
              accent ? "text-white/60" : "text-navy/60"
            )}
          >
            {eyebrow}
          </span>
        )}
        <h3
          className={clsx(
            "font-bold leading-snug",
            accent ? "text-white text-xl" : "text-ink text-lg"
          )}
        >
          {title}
        </h3>
        <p
          className={clsx(
            "text-sm leading-relaxed",
            accent ? "text-white/70" : "text-ink/55"
          )}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

export default function Features() {
  const { ref, inView } = useInView();

  return (
    <section
      id="soluciones"
      ref={ref}
      className="bg-white py-28 px-6"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div
          className={clsx(
            "max-w-2xl mb-16 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-navy/60">
            Por qué Cleco
          </span>
          <h2
            id="features-heading"
            className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight"
          >
            La cobranza inteligente
            <br className="hidden sm:block" /> que tu empresa necesitaba.
          </h2>
          <p className="mt-4 text-lg text-ink/55 leading-relaxed">
            Combinamos IA, canales modernos y un modelo sin riesgo para que
            recuperes lo que te deben sin desgastar tus relaciones comerciales.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {/* Large accent card — spans 2 cols on lg */}
          <BentoCard
            inView={inView}
            delay={0}
            accent
            icon={<Banknote size={20} />}
            eyebrow="Modelo sin riesgo"
            title="Solo pagas si recuperamos. Punto."
            body="Sin mensualidades, sin contratos largos, sin letra chica. Nuestros honorarios son un porcentaje de lo que recuperamos. Si no hay resultado, no hay cobro."
            className="lg:col-span-2"
          />

          {/* Normal card */}
          <BentoCard
            inView={inView}
            delay={80}
            icon={<Bot size={20} />}
            eyebrow="Tecnología"
            title="IA que gestiona en el momento exacto"
            body="Nuestro motor analiza patrones de pago y contacta al deudor en el canal y horario con mayor probabilidad de éxito."
          />

          {/* Normal card */}
          <BentoCard
            inView={inView}
            delay={160}
            icon={<LayoutDashboard size={20} />}
            eyebrow="Visibilidad"
            title="Tu cartera en tiempo real, siempre"
            body="Dashboard con estado de cada factura, historial de contactos y proyección de recupero. Cero cajas negras."
          />

          {/* Normal card */}
          <BentoCard
            inView={inView}
            delay={240}
            icon={<MessageCircle size={20} />}
            eyebrow="Canales modernos"
            title="WhatsApp, email y llamadas. Lo que funciona."
            body="Multicanal inteligente: priorizamos WhatsApp porque tiene 98% de tasa de apertura. Sin llamadas agresivas."
          />

          {/* Normal card */}
          <BentoCard
            inView={inView}
            delay={320}
            icon={<ShieldCheck size={20} />}
            eyebrow="Relación comercial"
            title="Cobramos sin dañar tu relación con el cliente"
            body="Tono respetuoso, profesional y sin presión. Tu cliente moroso de hoy puede ser tu mejor cliente mañana."
          />

          {/* Stat card — spans 2 cols on lg, 2 on sm */}
          <div
            className={clsx(
              "rounded-2xl border border-gray-100 bg-gray-50 p-7 flex flex-col justify-between sm:col-span-2 lg:col-span-1 transition-all duration-700",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center">
                <Zap size={20} className="text-navy" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-navy/60">
                Resultados
              </span>
            </div>
            <div>
              <div className="text-5xl font-bold text-navy tracking-tight leading-none">
                +$1.200M
              </div>
              <div className="mt-2 text-sm text-ink/50 leading-relaxed">
                en deuda recuperada para empresas chilenas. Y sumando.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
