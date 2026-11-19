"use client";
import React, { useEffect, useRef, useState } from "react";
import { BarChart3, Bell, CheckCircle2, FileText, Inbox, LayoutDashboard, LogOut, Menu, RotateCcw, Search, SlidersHorizontal, Upload, Users, X, CircleCheck, Info, AlertTriangle } from "lucide-react";
import { useDemo, type View } from "../lib/store";
import { CLIENT } from "../lib/seed";
import { metrics } from "../lib/metrics";
import { fechaHora } from "../lib/format";
import { cx } from "./ui";

const NAV: { v: View; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { v: "resumen", label: "Resumen", Icon: LayoutDashboard },
  { v: "facturas", label: "Facturas", Icon: FileText },
  { v: "deudores", label: "Clientes deudores", Icon: Users },
  { v: "conversaciones", label: "Conversaciones", Icon: Inbox },
  { v: "aprobaciones", label: "Aprobaciones", Icon: CheckCircle2 },
  { v: "reportes", label: "Reportes", Icon: BarChart3 },
  { v: "reglas", label: "Reglas de cobranza", Icon: SlidersHorizontal },
];

export function Shell({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const { state, route, go, toasts, readNotifications, reset } = useDemo();
  const m = metrics(state);
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [q, setQ] = useState("");
  const bellRef = useRef<HTMLDivElement>(null);
  const unreadN = state.notifications.filter((n) => !n.read).length;
  const active = route.v === "factura" ? "facturas" : route.v;

  useEffect(() => {
    const on = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false); };
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);

  const badge = (v: View) => (v === "aprobaciones" ? m.pendingApprovals : v === "conversaciones" ? m.unread : 0);

  const side = (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-slate-950 px-4 py-6 text-slate-300 [&>*]:shrink-0">
      <div className="flex items-center justify-between px-2">
        <img src="/landing/logo-white.png" alt="Cleco" className="h-8 w-auto" />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
      </div>
      <div className="rounded-xl bg-white/5 px-3.5 py-3 ring-1 ring-white/10">
        <div className="text-[14px] font-semibold text-white">{CLIENT.name}</div>
        <div className="text-[12px] text-slate-400">Cliente desde {CLIENT.since} · Cleco 360</div>
      </div>
      <button onClick={() => { go({ v: "subir" }); setOpen(false); }} className="flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 text-[14px] font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500">
        <Upload className="h-4 w-4" /> Subir facturas
      </button>
      <nav className="grid gap-1">
        {NAV.map(({ v, label, Icon }) => (
          <button key={v} onClick={() => { go({ v }); setOpen(false); }}
            className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] font-medium transition", active === v ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white")}>
            <Icon className={cx("h-[18px] w-[18px]", active === v ? "text-blue-400" : "text-slate-500")} />
            {label}
            {badge(v) > 0 && <span className={cx("ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold", v === "aprobaciones" ? "bg-amber-400 text-slate-900" : "bg-blue-500 text-white")}>{badge(v)}</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto grid gap-3">
        <div className="rounded-xl bg-white/5 p-3 text-[12.5px] leading-snug text-slate-400 ring-1 ring-white/10">
          <div className="mb-1 font-semibold text-slate-200">Tu ejecutivo: Clemente Icarán</div>
          Responde en menos de 24 horas hábiles. <span className="text-slate-300">contacto@cleco.cl</span>
        </div>
        <div className="flex items-center gap-3 px-1">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-[13px] font-bold text-white">PR</span>
          <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold text-white">{CLIENT.user}</div><div className="text-[12px] text-slate-500">{CLIENT.role}</div></div>
          <button onClick={onLogout} className="rounded-lg p-2 hover:bg-white/10" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-inter-tight)] text-slate-900 antialiased">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">{side}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-2xl">{side}</div>
        </div>
      )}
      <div className="lg:pl-[264px]">
        <div className="flex items-center justify-center gap-3 bg-amber-300 px-4 py-1.5 text-center text-[12.5px] font-semibold text-slate-900">
          Maqueta interactiva con datos ficticios · nada de esto se envía a clientes reales
          <button onClick={reset} className="inline-flex items-center gap-1 rounded-full bg-slate-900/10 px-2 py-0.5 hover:bg-slate-900/20"><RotateCcw className="h-3 w-3" /> Reiniciar</button>
        </div>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur md:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
          <form className="relative max-w-md flex-1" onSubmit={(e) => { e.preventDefault(); go({ v: "facturas", f: q ? "q:" + encodeURIComponent(q) : undefined }); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por cliente, RUT o N° de factura" className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-[14px] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative" ref={bellRef}>
              <button onClick={() => { setBell((b) => !b); if (!bell) setTimeout(readNotifications, 1500); }} className="relative rounded-full p-2.5 hover:bg-slate-100" aria-label="Notificaciones">
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadN > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadN}</span>}
              </button>
              {bell && (
                <div className="absolute right-0 top-12 w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 px-4 py-3 text-[14px] font-bold">Notificaciones</div>
                  <div className="max-h-[360px] overflow-auto">
                    {state.notifications.slice(0, 12).map((n) => (
                      <button key={n.id} onClick={() => { setBell(false); if (n.invoiceId) go({ v: "factura", id: n.invoiceId }); else go({ v: "aprobaciones" }); }} className={cx("flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50", !n.read && "bg-blue-50/50")}>
                        <span className={cx("mt-1.5 h-2 w-2 flex-none rounded-full", n.read ? "bg-slate-200" : "bg-blue-600")} />
                        <span><span className="block text-[13.5px] text-slate-800">{n.text}</span><span className="text-[12px] text-slate-400">{fechaHora(n.at)}</span></span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-[13px] font-semibold md:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">PR</span>{CLIENT.user}
            </span>
          </div>
        </header>
        <main id="demo-main" className="mx-auto max-w-[1280px] px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-12">{children}</main>
      </div>
      {/* navegación inferior en móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {(["resumen", "facturas", "subir", "conversaciones", "aprobaciones"] as View[]).map((v) => {
          const n = v === "subir" ? { label: "Subir", Icon: Upload } : NAV.find((x) => x.v === v)!;
          return (
            <button key={v} onClick={() => go({ v })} className={cx("relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold", active === v ? "text-blue-600" : "text-slate-500")}>
              <n.Icon className="h-5 w-5" />{n.label.split(" ")[0]}
              {badge(v) > 0 && <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-red-500" />}
            </button>
          );
        })}
      </nav>
      {/* toasts */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] grid w-[min(380px,calc(100vw-32px))] gap-2 lg:bottom-6">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex animate-[toastIn_.35s_cubic-bezier(.2,1.2,.4,1)] items-start gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-white shadow-2xl">
            <span className={cx("mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full", t.kind === "ok" ? "bg-emerald-500" : t.kind === "warn" ? "bg-amber-400 text-slate-900" : "bg-blue-500")}>
              {t.kind === "ok" ? <CircleCheck className="h-4 w-4" /> : t.kind === "warn" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </span>
            <span className="min-w-0"><span className="block text-[14px] font-semibold">{t.text}</span>{t.sub && <span className="block truncate text-[12.5px] text-slate-400">{t.sub}</span>}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .4s cubic-bezier(.2,.8,.2,1) both}`}</style>
    </div>
  );
}
