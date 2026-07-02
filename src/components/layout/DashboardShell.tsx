"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SmartUploadModal } from "@/components/ui/SmartUploadModal";
import type { Profile } from "@/types/database";

interface Props {
  profile: Profile;
  urgentCount: number;
  children: React.ReactNode;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const PanelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
);
const BandejaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const CargaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const DeudoresIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>
    <path d="M16 5.2a3.2 3.2 0 0 1 0 6M18 20a5.5 5.5 0 0 0-3-4.9"/>
  </svg>
);
const ReportesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><polyline points="7 14 11 10 15 13 21 7"/>
  </svg>
);

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "Panel",
  "/dashboard/bandeja":    "Bandeja de cobranza",
  "/dashboard/carga":      "Carga inteligente",
  "/dashboard/deudores":   "Deudores",
  "/dashboard/reportes":   "Reportes",
};

export function DashboardShell({ profile, urgentCount, children }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [searchVal,  setSearchVal]    = useState("");

  const initials = profile.razon_social
    .replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ ]/g, "")
    .trim().split(/\s+/)
    .map((w: string) => w[0] ?? "")
    .join("").slice(0, 2).toUpperCase();

  const title = PAGE_TITLES[pathname] ?? "Panel";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const navItems = [
    { href: "/dashboard",          label: "Panel",               icon: <PanelIcon />,    exact: true },
    { href: "/dashboard/bandeja",  label: "Bandeja de cobranza", icon: <BandejaIcon />,  badge: urgentCount > 0 ? urgentCount : undefined },
    { href: "/dashboard/carga",    label: "Carga inteligente",   icon: <CargaIcon /> },
    { href: "/dashboard/deudores", label: "Deudores",            icon: <DeudoresIcon /> },
    { href: "/dashboard/reportes", label: "Reportes",            icon: <ReportesIcon /> },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/dashboard/bandeja?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
  };

  // Sidebar inner shared between desktop + mobile
  const sidebarContent = (
    <>
      {/* Logo + mobile close */}
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo: HTML text + SVG arrows (matches brand) */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-hanken),'Hanken Grotesk',system-ui,sans-serif", fontWeight: 700, fontSize: 22, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1 }}>
            cleCo
          </span>
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none" style={{ marginTop: 0, flexShrink: 0 }}>
            {/* back bracket */}
            <path d="M1 12 L1 4 L9 4" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            {/* front bracket */}
            <path d="M5 16 L5 8 L13 8" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <button className="lg:hidden" onClick={() => setDrawerOpen(false)}
          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,.07)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: "10px 12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ href, label, icon, badge, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} onClick={() => setDrawerOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: active ? "#1E293B" : "transparent", color: active ? "#FFFFFF" : "#9CA3AF", textDecoration: "none", lineHeight: 1.2, transition: "background .14s, color .14s" }}>
              <span style={{ flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {badge !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 700, background: active ? "#1d4ed8" : "#1E293B", color: active ? "#DBEAFE" : "#9CA3AF", padding: "1px 8px", borderRadius: 20, minWidth: 22, textAlign: "center" }}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Motor IA */}
      <div style={{ margin: "18px 12px", padding: "13px 14px", borderRadius: 12, background: "#1E293B", border: "1px solid #334155" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#93C5FD" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="3.5"/>
          </svg>
          MOTOR IA
        </div>
        <p style={{ fontSize: 12.5, color: "#CBD5E1", margin: "7px 0 0", lineHeight: 1.5 }}>
          {urgentCount > 0
            ? <><strong style={{ color: "#DBEAFE" }}>{urgentCount} facturas</strong> necesitan contacto hoy.</>
            : "Sin urgencias para hoy según el score."}
        </p>
        <Link href="/dashboard/bandeja" onClick={() => setDrawerOpen(false)} style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "#DBEAFE", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          Ver bandeja priorizada →
        </Link>
      </div>

      {/* User */}
      <div style={{ marginTop: "auto", padding: "14px 18px", borderTop: "1px solid #1E293B", display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#334155", color: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ lineHeight: 1.3, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#EFF6FF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.razon_social}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>Cobranza · Tesorería</div>
        </div>
        <button
          onClick={async () => { const sb = createClient(); await sb.auth.signOut(); router.push("/auth/login"); }}
          style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: "4px 6px", fontFamily: "inherit", borderRadius: 5, flexShrink: 0 }}
          title="Cerrar sesión">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </>
  );

  return (
    <>
      {uploadOpen && (
        <SmartUploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          profileId={profile.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onCreated={(() => { setUploadOpen(false); router.refresh(); }) as any}
        />
      )}

      <div className="flex min-h-screen lg:h-screen lg:overflow-hidden"
        style={{ fontFamily: "'Hanken Grotesk',system-ui,sans-serif", color: "#0F172A", background: "#EFF6FF", WebkitFontSmoothing: "antialiased" }}>

        {/* Mobile overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setDrawerOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[248px] overflow-y-auto transition-transform duration-200 ${drawerOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen lg:flex-shrink-0 lg:z-auto`}
          style={{ background: "#0F172A", borderRight: "1px solid rgba(0,0,0,.45)" }}>
          {sidebarContent}
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">

          {/* Header */}
          <header className="flex-shrink-0 sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-5"
            style={{ height: 60, background: "rgba(248,250,252,.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #E2E8F0" }}>

            {/* Hamburger */}
            <button className="lg:hidden flex items-center justify-center flex-shrink-0"
              style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer" }}
              onClick={() => setDrawerOpen(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Page title (mobile) */}
            <span className="lg:hidden text-[14px] font-bold text-[#0F172A]">{title}</span>

            {/* Search bar (desktop) */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-[440px] mx-auto relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Buscar deudor, RUT o N° factura..."
                style={{ width: "100%", height: 38, paddingLeft: 36, paddingRight: 14, border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#F8FAFC", outline: "none", fontFamily: "inherit", color: "#0F172A" }}
                onFocus={e => (e.target.style.borderColor = "#2563EB")}
                onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
              />
            </form>

            {/* Right actions */}
            <div className="ml-auto lg:ml-0 flex items-center gap-2">
              {/* Bell */}
              <Link href="/dashboard/bandeja" title="Alertas urgentes"
                style={{ position: "relative", width: 36, height: 36, borderRadius: 9, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
                </svg>
                {urgentCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, minWidth: 17, height: 17, padding: "0 3px", borderRadius: 9, background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #EFF6FF" }}>
                    {urgentCount}
                  </span>
                )}
              </Link>

              {/* Subir factura */}
              <button onClick={() => setUploadOpen(true)}
                className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-[9px] font-bold text-white text-[13px] cursor-pointer border-0"
                style={{ background: "#2563EB", fontFamily: "inherit", boxShadow: "0 2px 8px -2px rgba(37,99,235,.5)", whiteSpace: "nowrap" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Subir factura
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 lg:overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 pb-20">
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
