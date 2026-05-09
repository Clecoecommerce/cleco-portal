"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Clock, Handshake, DollarSign, Trophy, Heart, BarChart2, Zap,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

/* ── Intersection-observer fade-in ─────────────────────── */
function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  };
}

/* ── Avatar con fallback ────────────────────────────────── */
function FounderAvatar({ src, name, grayscale }: { src: string; name: string; grayscale?: boolean }) {
  const [errored, setErrored] = useState(false);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");

  return (
    <div className="w-36 h-36 rounded-full overflow-hidden shadow-[0_8px_30px_rgba(37,99,235,.18)] border-4 border-white mx-auto mb-5 bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
      {!errored ? (
        <Image
          src={src}
          alt={name}
          width={144}
          height={144}
          className={`object-cover w-full h-full${grayscale ? " grayscale" : ""}`}
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="text-[#2563EB] text-3xl font-bold">{initials}</span>
      )}
    </div>
  );
}

/* ── Sección 2 — Tarjeta fundador ───────────────────────── */
function FounderCard({
  src, name, role, badge, bio, delay, grayscale,
}: {
  src: string; name: string; role: string; badge: string;
  bio: string; delay: number; grayscale?: boolean;
}) {
  const fade = useFadeIn(delay);
  return (
    <div ref={fade.ref} style={fade.style}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
    >
      <FounderAvatar src={src} name={name} grayscale={grayscale} />
      <p className="text-[18px] font-bold text-[#0F172A] mb-0.5">{name}</p>
      <p className="text-[13.5px] text-[#6B7280] mb-3">{role}</p>
      <span className="inline-block bg-[#EFF6FF] text-[#2563EB] text-[11.5px] font-semibold px-3 py-1 rounded-full mb-4">
        {badge}
      </span>
      <p className="text-[14px] text-[#1E293B] leading-[1.6]">{bio}</p>
    </div>
  );
}

/* ── Sección 3 — Tarjeta dolor ─────────────────────────── */
function PainCard({
  icon, title, text, delay,
}: {
  icon: React.ReactNode; title: string; text: string; delay: number;
}) {
  const fade = useFadeIn(delay);
  return (
    <div ref={fade.ref} style={fade.style}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] mb-5">
        {icon}
      </div>
      <p className="text-[16px] font-bold text-[#0F172A] mb-2">{title}</p>
      <p className="text-[14px] text-[#6B7280] leading-[1.6]">{text}</p>
    </div>
  );
}

/* ── Sección 5 — Tarjeta valor ─────────────────────────── */
function ValueCard({
  icon, title, text, delay,
}: {
  icon: React.ReactNode; title: string; text: string; delay: number;
}) {
  const fade = useFadeIn(delay);
  return (
    <div ref={fade.ref} style={fade.style}
      className="flex gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-[15.5px] font-bold text-[#0F172A] mb-1">{title}</p>
        <p className="text-[13.5px] text-[#6B7280] leading-[1.6]">{text}</p>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function NosotrosPage() {
  const heroFade  = useFadeIn(0);
  const s3title   = useFadeIn(0);
  const s5title   = useFadeIn(0);
  const s4fade    = useFadeIn(0);

  return (
    <div className="bg-white text-[#0F172A] min-h-screen">
      <Navbar />

      {/* ── S1 Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-32 pb-24 px-6">
        {/* grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
            opacity: 0.35,
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <div ref={heroFade.ref} style={heroFade.style}>
            <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]/60 mb-5">
              Sobre nosotros
            </span>
            <h1 className="text-[38px] sm:text-[52px] font-bold tracking-tight text-[#0F172A] leading-[1.12] mb-6">
              Dos personas que decidieron{" "}
              <span className="text-[#2563EB]">resolver un problema real</span>
            </h1>
            <p className="text-[17px] text-[#6B7280] leading-[1.7] max-w-2xl mx-auto">
              Vimos cómo empresas perdían millones cada año, no porque no tuvieran cómo cobrar,
              sino porque nadie quería hacer el trabajo incómodo. Los equipos internos lo evitaban.
              Los softwares enviaban recordatorios que nadie leía. Las agencias tradicionales
              cobraban caro por resultados mediocres.{" "}
              <span className="text-[#0F172A] font-semibold">Ahí nació CLECO.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── S2 Equipo ─────────────────────────────────────── */}
      <section className="bg-[#EFF6FF] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]/60 text-center mb-2">
            El equipo
          </p>
          <h2 className="text-[30px] sm:text-[36px] font-bold text-[#0F172A] text-center mb-12 tracking-tight">
            Las personas detrás de CLECO
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FounderCard
              src="/clemente-icaran.png"
              name="Clemente Icarán"
              role="Fundador & Director de Operaciones"
              badge="+6 años en Cobranza · Negociación"
              bio="Más de 6 años liderando procesos de recuperación de cartera. Conoce cada etapa de la cobranza desde adentro — desde el primer contacto hasta el acuerdo de pago. En CLECO diseña y dirige toda la operación."
              delay={0}
              grayscale
            />
            <FounderCard
              src="/benjamin-herrera.png"
              name="Benjamín Herrera"
              role="Co-Fundador & Director Comercial"
              badge="Automatización · Growth B2B"
              bio="Especialista en automatización de procesos comerciales y estrategia de crecimiento B2B. En CLECO lidera la captación de clientes y el desarrollo de tecnología que hace la cobranza más inteligente."
              delay={120}
            />
          </div>
        </div>
      </section>

      {/* ── S3 Dolores ────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div ref={s3title.ref} style={s3title.style} className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]/60 mb-2">
              Por qué existimos
            </p>
            <h2 className="text-[30px] sm:text-[36px] font-bold text-[#0F172A] tracking-tight">
              ¿Te suena familiar alguno de estos problemas?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <PainCard
              icon={<Clock size={20} />}
              title="Tu equipo pierde horas cobrando"
              text="Administración o finanzas dedica tiempo a perseguir deudores en vez de hacer su trabajo. El costo oculto es enorme y nadie lo mide."
              delay={0}
            />
            <PainCard
              icon={<Handshake size={20} />}
              title="Miedo a dañar la relación con tu cliente"
              text="No puedes ser agresivo con alguien que también te compra. Necesitas un intermediario que cobre sin comprometer el vínculo comercial."
              delay={100}
            />
            <PainCard
              icon={<DollarSign size={20} />}
              title="Pagas aunque no recuperes nada"
              text="Las agencias tradicionales cobran mensualidad igual. Nosotros solo cobramos cuando tú cobras. Cero riesgo financiero."
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* ── S4 Propuesta de valor ─────────────────────────── */}
      <section className="bg-[#0F172A] py-24 px-6">
        <div
          ref={s4fade.ref}
          style={s4fade.style}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">
            Nuestra promesa
          </p>
          <h2 className="text-[32px] sm:text-[44px] font-bold text-white leading-tight tracking-tight mb-6">
            Nuestra promesa es simple
          </h2>
          <p className="text-[18px] sm:text-[22px] text-white/80 leading-[1.55] mb-4 font-medium">
            Recuperamos lo que te deben usando inteligencia artificial y gestión humana,
            sin que pierdas tiempo ni dañes tus relaciones comerciales.
          </p>
          <p className="text-[16px] text-white/45 mb-10 italic">
            Y solo te cobramos si recuperamos.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#2563EB] font-bold text-[15px] hover:bg-[#EFF6FF] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Solicitar evaluación gratuita
          </Link>
        </div>
      </section>

      {/* ── S5 Valores ────────────────────────────────────── */}
      <section className="bg-[#EFF6FF] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div ref={s5title.ref} style={s5title.style} className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]/60 mb-2">
              Nuestra cultura
            </p>
            <h2 className="text-[30px] sm:text-[36px] font-bold text-[#0F172A] tracking-tight">
              Cómo trabajamos
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            <ValueCard
              icon={<Trophy size={18} />}
              title="Resultados antes que honorarios"
              text="Si no recuperamos, no cobramos. Nuestros incentivos están 100% alineados con los tuyos."
              delay={0}
            />
            <ValueCard
              icon={<Heart size={18} />}
              title="El deudor también es persona"
              text="Gestionamos con respeto porque sabemos que tu relación comercial vale más que una sola deuda."
              delay={80}
            />
            <ValueCard
              icon={<BarChart2 size={18} />}
              title="Transparencia total"
              text="Ves cada gestión en tiempo real. Sin cajas negras, sin sorpresas al final del mes."
              delay={160}
            />
            <ValueCard
              icon={<Zap size={18} />}
              title="Tecnología con propósito"
              text="Usamos IA para escalar la gestión, no para reemplazar el criterio humano cuando más importa."
              delay={240}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
