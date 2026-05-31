"use client";
import { useInView } from "@/hooks/useInView";
import {
  Banknote,
  Bot,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Zap,
  User,
  BarChart3,
  Handshake,
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
            body="Sin contratos largos, sin letra chica. Nuestros honorarios son un porcentaje de lo que recuperamos. Si no hay resultado, no hay cobro."
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
            title="El canal correcto, en el momento correcto."
            body="Multicanal inteligente: elegimos el medio de contacto según el perfil del deudor. Sin presión, sin llamadas agresivas."
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
                72%
              </div>
              <div className="mt-2 text-sm text-ink/50 leading-relaxed">
                tasa de recuperación promedio en carteras gestionadas por Cleco.
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 perfiles de cliente ─────────────────────── */}
        <div
          className={clsx(
            "mt-16 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: "500ms" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-navy/60 mb-2 text-center">
            ¿Para quién es CLECO?
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-ink text-center mb-10 tracking-tight">
            Tres problemas distintos. Una misma solución.
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <User size={20} />,
                perfil: "Dueño de PyME",
                dolor: "Pierdes horas persiguiendo clientes que no pagan. Te incomoda cobrar, temes dañar la relación y terminas resignándote a perder ese dinero.",
                solución: "Nosotros ponemos los recursos. Tú pones la cartera. Si no recuperamos, no cobramos nada.",
              },
              {
                icon: <BarChart3 size={20} />,
                perfil: "CFO / Gerente Financiero",
                dolor: "DSO elevado, flujo de caja comprometido y cartera vencida que crece. Necesitas resultados sin aumentar tu equipo.",
                solución: "Gestión activa desde el día 1. Dashboard en tiempo real. Recuperación medible en semanas.",
              },
              {
                icon: <Handshake size={20} />,
                perfil: "Gerente Comercial",
                dolor: "Tienes un cliente moroso que también es tu mejor cliente. No puedes ser agresivo porque lo pierdes. No puedes ignorarlo porque afecta tu flujo.",
                solución: "Cobramos nosotros para que tú no te manches. La relación con tu cliente, intacta.",
              },
            ].map(({ icon, perfil, dolor, solución }, i) => (
              <div
                key={perfil}
                className={clsx(
                  "rounded-2xl border border-gray-100 bg-white p-7 flex flex-col gap-4 transition-all duration-700",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${520 + i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center text-navy flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-navy/60 mb-1">{perfil}</p>
                  <p className="text-sm text-ink/60 leading-relaxed mb-3">{dolor}</p>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-sm font-semibold text-ink leading-relaxed">{solución}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
