"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MobileDrawer } from "./MobileDrawer";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/database";

const navItems = [
  { href: "/dashboard",           label: "Panel" },
  { href: "/dashboard/deudores",  label: "Deudores" },
  { href: "/dashboard/pagos",     label: "Pagos" },
  { href: "/dashboard/ayuda",     label: "Ayuda" },
];

export function TopNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
        {/* Left */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Hamburger (mobile) */}
          <button
            className="sm:hidden w-9 h-9 rounded-lg text-[#1E293B] hover:bg-[#F1F5F9] inline-flex items-center justify-center"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <Link href="/" className="hover:opacity-80 transition-opacity">
            <div className="relative h-9 w-[108px] overflow-hidden">
              <Image src="/logo.png" alt="cleCo" fill className="object-contain" style={{ transform: "scale(3.5)", transformOrigin: "50% 52%" }} priority />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-1">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-[6px] text-[13.5px] font-medium transition-colors ${
                    isActive ? "text-[#0F172A] bg-[#F1F5F9]" : "text-[#6B7280] hover:text-[#0F172A]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right — user chip */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 px-1.5 py-1.5 sm:pr-2.5 rounded-full border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#2563EB] text-white inline-flex items-center justify-center text-[12px] font-semibold tracking-wide">
              {getInitials(profile.razon_social)}
            </span>
            <span className="hidden sm:block text-[13.5px] font-medium text-[#0F172A]">
              {profile.razon_social}
            </span>
            <span className="hidden sm:block text-[10px] text-[#9CA3AF]">▾</span>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-[52px] w-[220px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-md p-1.5 z-20">
                <div className="px-2.5 py-2.5 mb-1 border-b border-[#F1F5F9]">
                  <p className="text-[13px] font-semibold text-[#0F172A]">{profile.razon_social}</p>
                  <p className="text-[12px] text-[#6B7280]">{profile.email}</p>
                </div>
                <button
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-[6px] text-[13px] text-[#1E293B] hover:bg-[#F1F5F9]"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>
                  Mi perfil
                </button>
                <button
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-[6px] text-[13px] text-[#B23B3B] hover:bg-[#F1F5F9]"
                  onClick={handleLogout}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}
