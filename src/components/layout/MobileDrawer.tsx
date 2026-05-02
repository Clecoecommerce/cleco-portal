"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Panel",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/deudores",
    label: "Deudores",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M5 21V7l8-4 8 4v14"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/pagos",
    label: "Pagos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/ayuda",
    label: "Ayuda",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
      </svg>
    ),
  },
];

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#0E1A2B]/45 z-[90] transition-opacity ${open ? "block animate-fadeIn" : "hidden"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[280px] max-w-[84vw] bg-white z-[91] flex flex-col py-5 shadow-lg transition-transform duration-[220ms] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-5 border-b border-[#EFF2F6]">
          <span className="text-[20px] font-bold tracking-tight text-[#0E1A2B]">
            Cleco<span className="text-[#185FA5]">.</span>
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#6B7A8F] hover:bg-[#EFF2F6] inline-flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 pt-3">
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-[14.5px] font-medium mb-0.5 transition-colors ${
                  isActive
                    ? "bg-[#EBF2FA] text-[#185FA5]"
                    : "text-[#2B3A4F] hover:bg-[#EFF2F6]"
                }`}
              >
                <span className={isActive ? "text-[#185FA5]" : "text-[#6B7A8F]"}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 pt-4 border-t border-[#EFF2F6] text-[11.5px] text-[#6B7A8F]">
          Cleco SpA · v 4.2 · 2026
        </div>
      </aside>
    </>
  );
}
