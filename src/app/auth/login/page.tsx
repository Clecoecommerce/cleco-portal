import { login, signInWithGoogle } from "./actions";
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
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#6B7280] mb-5">
            Portal de clientes
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0F172A] mb-2 leading-tight">
            Ingresa a tu cuenta
          </h1>
          <p className="text-[14.5px] text-[#6B7280] mb-9">
            Gestiona tus facturas en cobranza y revisa el estado de tus recuperos.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-[10px] bg-[#FBE9E9] border border-[#B23B3B]/20 text-[#B23B3B] text-[13px]">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={login} className="space-y-[18px]">
            <div>
              <label htmlFor="email" className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="contacto@empresa.cl"
                className="w-full h-11 px-3.5 border border-[#E2E8F0] rounded-[10px] text-[14.5px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[12.5px] font-medium text-[#1E293B] mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-11 px-3.5 border border-[#E2E8F0] rounded-[10px] text-[14.5px] text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[13px] text-[#1E293B] cursor-pointer">
                <input type="checkbox" className="accent-[#2563EB]" />
                Recordarme
              </label>
              <a href="#" className="text-[13px] text-[#2563EB] hover:text-[#1d4ed8] hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#2563EB] hover:bg-[#1d4ed8] active:translate-y-px text-white text-[14px] font-semibold rounded-[10px] transition-all mt-2"
            >
              Ingresar
            </button>
          </form>

          {/* Google OAuth */}
          <div className="mt-6 relative flex items-center">
            <div className="flex-grow border-t border-[#E2E8F0]" />
            <span className="mx-3 text-[11px] uppercase tracking-widest text-[#9CA3AF]">o continúa con</span>
            <div className="flex-grow border-t border-[#E2E8F0]" />
          </div>

          <form action={signInWithGoogle} className="mt-4">
            <button
              type="submit"
              className="w-full h-11 border border-[#E2E8F0] rounded-[10px] text-[14px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] flex items-center justify-center gap-2.5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[#6B7280]">
            ¿Aún no tienes cuenta?{" "}
            <a href="#" className="text-[#2563EB] hover:underline">Solicita acceso</a>
          </p>
        </div>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[12px] text-[#6B7280] gap-2">
          <span>© 2026 Cleco SpA · Santiago, Chile</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#2563EB]">Términos</a>
            <a href="#" className="hover:text-[#2563EB]">Privacidad</a>
            <a href="#" className="hover:text-[#2563EB]">Soporte</a>
          </div>
        </footer>
      </div>

      {/* ── Right pane (decorative) ── */}
      <aside className="hidden md:flex flex-col justify-between bg-[#0F172A] text-[#E6ECF4] px-14 py-12 relative overflow-hidden">
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
