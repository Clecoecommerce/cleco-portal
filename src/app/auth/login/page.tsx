import { login } from "./actions";
import Link from "next/link";
import Image from "next/image";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen grid md:grid-cols-2 bg-white">
      {/* ── Left pane ── */}
      <div className="flex flex-col justify-between px-6 py-10 sm:px-14 min-h-screen">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
          <div className="relative h-9 w-[108px] overflow-hidden">
            <Image src="/logo.png" alt="cleCo" fill className="object-contain" style={{ transform: "scale(3.5)", transformOrigin: "50% 52%" }} priority />
          </div>
        </Link>

        {/* Form */}
        <div className="w-full max-w-sm mx-auto py-16 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#6B7A8F] mb-5">
            Portal de clientes
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0E1A2B] mb-2 leading-tight">
            Ingresa a tu cuenta
          </h1>
          <p className="text-[14.5px] text-[#6B7A8F] mb-9">
            Gestiona tus facturas en cobranza y revisa el estado de tus recuperos.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-[10px] bg-[#FBE9E9] border border-[#B23B3B]/20 text-[#B23B3B] text-[13px]">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={login} className="space-y-[18px]">
            <div>
              <label htmlFor="email" className="block text-[12.5px] font-medium text-[#2B3A4F] mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="contacto@empresa.cl"
                className="w-full h-11 px-3.5 border border-[#E4E8EE] rounded-[10px] text-[14.5px] text-[#0E1A2B] placeholder-[#8E9BAE] focus:outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/12 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[12.5px] font-medium text-[#2B3A4F] mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-11 px-3.5 border border-[#E4E8EE] rounded-[10px] text-[14.5px] text-[#0E1A2B] placeholder-[#8E9BAE] focus:outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/12 transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[13px] text-[#2B3A4F] cursor-pointer">
                <input type="checkbox" className="accent-[#185FA5]" />
                Recordarme
              </label>
              <a href="#" className="text-[13px] text-[#185FA5] hover:text-[#134d85] hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#185FA5] hover:bg-[#134d85] active:translate-y-px text-white text-[14px] font-semibold rounded-[10px] transition-all mt-2"
            >
              Ingresar
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#6B7A8F]">
            ¿Aún no tienes cuenta?{" "}
            <a href="#" className="text-[#185FA5] hover:underline">Solicita acceso</a>
          </p>
        </div>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[12px] text-[#6B7A8F] gap-2">
          <span>© 2026 Cleco SpA · Santiago, Chile</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#185FA5]">Términos</a>
            <a href="#" className="hover:text-[#185FA5]">Privacidad</a>
            <a href="#" className="hover:text-[#185FA5]">Soporte</a>
          </div>
        </footer>
      </div>

      {/* ── Right pane (decorative) ── */}
      <aside className="hidden md:flex flex-col justify-between bg-[#0E1A2B] text-[#E6ECF4] px-14 py-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            backgroundPosition: "-1px -1px",
          }}
        />

        <p className="relative font-mono text-[11px] uppercase tracking-[0.1em] text-[#8DA3C2]">
          Cobranza B2B · Chile
        </p>

        <blockquote className="relative text-[26px] font-medium leading-[1.3] tracking-tight max-w-[460px]">
          Recuperamos tus facturas impagas con un proceso transparente, jurídico y respetuoso.{" "}
          <span className="text-[#6E89B0]">
            Tú haces tu negocio. Nosotros nos hacemos cargo de cobrar.
          </span>
        </blockquote>

        <div className="relative flex items-center justify-between text-[12px] font-mono text-[#8DA3C2]">
          <span>SII · DTE · Ley 21.131</span>
          <span className="border border-white/12 rounded-full px-2.5 py-1">v 4.2 · 2026</span>
        </div>
      </aside>
    </main>
  );
}
