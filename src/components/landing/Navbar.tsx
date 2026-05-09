"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Soluciones", href: "#soluciones" },
  { label: "Nosotros",   href: "/nosotros" },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav
        className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between"
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded" aria-label="Cleco — inicio">
          <div className="relative h-9 w-[108px] overflow-hidden">
            <Image src="/logo.png" alt="cleCo" fill className="object-contain" style={{ transform: "scale(3.5)", transformOrigin: "50% 52%" }} priority />
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8" role="list">
          {navLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              role="listitem"
              className="text-sm font-medium text-ink/70 hover:text-ink transition-colors duration-150"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-navy text-white hover:bg-navy-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            Ingresar
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-ink/70 hover:text-ink hover:bg-gray-100 transition-colors"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 pb-5 pt-3 space-y-1 animate-fadeIn">
          {navLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-ink/80 hover:text-ink transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="pt-3">
            <Link
              href="/auth/login"
              className="block w-full text-center px-4 py-2.5 rounded-md text-sm font-semibold bg-navy text-white hover:bg-navy-700 transition-colors"
            >
              Ingresar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
