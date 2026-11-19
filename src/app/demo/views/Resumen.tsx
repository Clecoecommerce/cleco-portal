"use client";
import React from "react";
import { AlertTriangle, ArrowRight, Download, Mail, Phone, Smartphone, Handshake, Banknote, Star, Upload, CheckCircle2, Info, MessageSquareText, FileUp, Play } from "lucide-react";
import { useDemo } from "../lib/store";
import { metrics, MOROSIDAD_SERIE, pending } from "../lib/metrics";
import { CLIENT } from "../lib/seed";
import { clp, fecha, fechaHora, millones, toDate } from "../lib/format";
import { Badge, Button, Card, CardHead, cx, Stars } from "../components/ui";
import { LineChart } from "../components/charts";
import { SCENARIOS, scriptLength } from "../lib/sim";

export const EVENT_ICON: Record<string, [React.ComponentType<{ className?: string }>, string]> = {
  correo: [Mail, "bg-blue-50 text-blue-600"], sms: [Smartphone, "bg-blue-50 text-blue-600"], llamado: [Phone, "bg-indigo-50 text-indigo-600"],
  respuesta: [MessageSquareText, "bg-amber-50 text-amber-700"], pago: [Banknote, "bg-emerald-50 text-emerald-600"], aprobacion: [CheckCircle2, "bg-emerald-50 text-emerald-600"],
  compromiso: [Handshake, "bg-emerald-50 text-emerald-600"], carga: [FileUp, "bg-slate-100 text-slate-600"], sistema: [Info, "bg-slate-100 text-slate-600"], feedback: [Star, "bg-amber-50 text-amber-600"],
};

export function Resumen() {
  const { state, go, toast } = useDemo();
  const m = metrics(state);
  const name = (id: string) => state.debtors.find((d) => d.id === id)?.name ?? "";
  const now = new Date();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const recMonth = m.allEvents.filter((e) => e.kind === "pago" && e.at >= monthAgo && e.at <= now.toISOString()).reduce((a, e) => a + (e.invoice.status === "pagada" ? e.invoice.amount : e.invoice.paid), 0);
  const managed = new Set(m.allEvents.filter((e) => e.at >= new Date(Date.now() - 7 * 86_400_000).toISOString()).map((e) => e.invoice.id));
  const managedDebtors = new Set(Array.from(managed).map((id) => state.invoices.find((i) => i.id === id)!.debtorId)).size;
  const attention = [
    ...state.approvals.filter((a) => a.status === "pendiente").map((a) => ({ key: a.id, tone: "amber" as const, title: a.title, sub: name(state.invoices.find((i) => i.id === a.invoiceId)!.debtorId), go: () => go({ v: "aprobaciones" }), cta: "Decidir" })),
    ...state.invoices.filter((i) => i.messages.some((x) => x.dir === "in" && !x.read)).slice(0, 4).map((i) => ({ key: i.id, tone: "blue" as const, title: "Respuesta nueva", sub: `${name(i.debtorId)} · N° ${i.folio}`, go: () => go({ v: "factura", id: i.id, f: "conversacion" }), cta: "Leer" })),
  ];
  const sims = state.sims.filter((s) => !s.done);
  const weekLabels = MOROSIDAD_SERIE.map((_, i) => { const d = new Date(now); d.setDate(d.getDate() - (MOROSIDAD_SERIE.length - 1 - i) * 7); return `${d.getDate()}/${d.getMonth() + 1}`; });

  return (
    <div className="fade-up grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[.09em] text-blue-600">{CLIENT.name}</div>
          <h1 className="mt-1 text-[30px] font-extrabold tracking-[-0.03em] md:text-[36px]">Hola, {CLIENT.user.split(" ")[0]}</h1>
          <p className="mt-1 text-[15px] text-slate-500">Así está tu cobranza hoy, {fecha(now.toISOString())}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => toast({ kind: "ok", text: "Reporte semanal descargado", sub: "Cleco_reporte_semana.pdf (demo)" })}><Download className="h-4 w-4" /> Reporte</Button>
          <Button onClick={() => go({ v: "subir" })}><Upload className="h-4 w-4" /> Subir facturas</Button>
        </div>
      </div>

      {m.pendingApprovals > 0 && (
        <button onClick={() => go({ v: "aprobaciones" })} className="flex items-center gap-3 rounded-2xl bg-amber-50 px-5 py-3.5 text-left ring-1 ring-amber-200 transition hover:bg-amber-100/70">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-amber-400 text-slate-900"><AlertTriangle className="h-4 w-4" /></span>
          <span className="text-[14.5px] text-amber-950"><b>Tienes {m.pendingApprovals} {m.pendingApprovals === 1 ? "decisión pendiente" : "decisiones pendientes"}.</b> Cleco necesita tu aprobación para seguir con esas facturas.</span>
          <span className="ml-auto hidden items-center gap-1 text-[14px] font-semibold text-amber-900 sm:flex">Revisar <ArrowRight className="h-4 w-4" /></span>
        </button>
      )}

      {sims.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.08em] text-blue-700"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" /><span className="relative h-2.5 w-2.5 rounded-full bg-blue-600" /></span>Cobranza en curso · simulación</div>
          <div className="mt-3 grid gap-3">
            {sims.map((s) => {
              const inv = state.invoices.find((i) => i.id === s.invoiceId)!;
              const p = Math.round((s.step / scriptLength(s.scenario)) * 100);
              return (
                <button key={s.invoiceId} onClick={() => go({ v: "factura", id: s.invoiceId })} className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 text-left ring-1 ring-slate-200 hover:ring-blue-300">
                  <span className="font-semibold">N° {inv.folio} · {name(inv.debtorId)}</span>
                  <Badge tone={s.waiting ? "amber" : "blue"}>{s.waiting ? "Espera tu aprobación" : s.playing ? "Avanzando" : "En pausa"}</Badge>
                  <span className="text-[13px] text-slate-500">Escenario: {SCENARIOS[s.scenario].label}</span>
                  <span className="ml-auto flex w-40 items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-blue-600 transition-all" style={{ width: p + "%" }} /></span><span className="text-[12px] text-slate-500">{p}%</span></span>
                  <Play className="h-4 w-4 text-blue-600" />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-[90px]" />
        <div className="relative text-[12px] font-bold uppercase tracking-[.1em] text-blue-300">Últimos 7 días</div>
        <p className="relative mt-2 max-w-3xl text-[24px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]">
          Cleco gestionó <span className="text-blue-400">{managed.size} facturas</span> de {managedDebtors} clientes: {m.week.correos} mensajes, {m.week.llamados} llamados y {m.week.acuerdos} acuerdos de pago.
        </p>
        <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Morosidad", "19,7% → 11,3%", "cartera total, oct 2026", true],
            ["En cobranza", millones(m.total), `${m.open.length} facturas abiertas`],
            ["Vencido hoy", millones(m.overdueAmt), `${m.overdue.length} facturas`],
            ["Recuperado (30 días)", millones(recMonth), `${m.paid.length} facturas pagadas`],
            ["Relación con tus clientes", m.avgStars ? m.avgStars.toFixed(1).replace(".", ",") + " / 5" : "—", `${m.fbCount} evaluaciones`],
          ].map(([l, v, s, hi], i) => (
            <div key={i} className={cx("rounded-2xl p-4", hi ? "bg-blue-600" : "bg-white/[.06] ring-1 ring-white/10", i === 0 && "col-span-2 md:col-span-1")}>
              <div className={cx("text-[12.5px]", hi ? "text-blue-100" : "text-slate-400")}>{l}</div>
              <div className="mt-1 text-[22px] font-extrabold tracking-tight">{v}</div>
              <div className={cx("text-[12px]", hi ? "text-blue-100" : "text-slate-500")}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-6">
          <Card>
            <CardHead title="Cartera por vencimiento" sub="Haz clic en un tramo para ver sus facturas." right={<span className="text-[13px] font-semibold text-slate-500">{clp(m.total)}</span>} />
            <div className="px-5 pb-5">
              <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-100">
                {m.tramos.map((t) => <button key={t.id} title={t.label} onClick={() => go({ v: "facturas", f: "t:" + t.id })} style={{ width: (t.amount / (m.total || 1)) * 100 + "%", background: t.color }} className="h-full transition hover:opacity-80" />)}
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {m.tramos.map((t) => (
                  <button key={t.id} onClick={() => go({ v: "facturas", f: "t:" + t.id })} className="grid w-full grid-cols-[14px_1fr_auto_auto] items-center gap-3 py-2.5 text-left text-[14.5px] hover:bg-slate-50">
                    <span className="h-3 w-3 rounded" style={{ background: t.color }} />
                    <span className="font-medium">{t.label}</span>
                    <span className="text-[13px] text-slate-500">{t.count} facturas</span>
                    <span className="w-28 text-right font-bold tabular-nums">{millones(t.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <CardHead title="Evolución de la morosidad" sub="Monto vencido sobre el total de la cartera, por semana." right={<Badge tone="green">−8,4 pts desde que llegó Cleco</Badge>} />
            <div className="px-3 pb-3 pt-2"><LineChart data={MOROSIDAD_SERIE.map((v, i) => ({ label: weekLabels[i], v }))} /></div>
          </Card>
        </div>
        <div className="grid content-start gap-6">
          <Card>
            <CardHead title="Necesitan tu atención" sub="Decisiones y respuestas de tus clientes." />
            <div className="grid gap-2 p-4">
              {attention.length === 0 && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">Todo al día. Cleco sigue gestionando.</div>}
              {attention.slice(0, 6).map((a) => (
                <button key={a.key} onClick={a.go} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 ring-slate-200 transition hover:bg-slate-50">
                  <span className={cx("h-2.5 w-2.5 flex-none rounded-full", a.tone === "amber" ? "bg-amber-400" : "bg-blue-600")} />
                  <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{a.title}</span><span className="block truncate text-[12.5px] text-slate-500">{a.sub}</span></span>
                  <span className="text-[13px] font-semibold text-blue-600">{a.cta}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <CardHead title="Bitácora en vivo" sub="Lo último que hizo Cleco con tu cartera." right={<span className="relative mt-1 flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>} />
            <div className="grid gap-1 p-3">
              {m.allEvents.filter((e) => toDate(e.at) <= new Date(Date.now() + 40 * 86_400_000)).slice(0, 9).map((e) => {
                const [Icon, cls] = EVENT_ICON[e.kind] ?? EVENT_ICON.sistema;
                return (
                  <button key={e.id + e.invoice.id} onClick={() => go({ v: "factura", id: e.invoice.id })} className="fade-up grid grid-cols-[32px_1fr] gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50">
                    <span className={cx("grid h-8 w-8 place-items-center rounded-full", cls)}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0">
                      <span className="flex items-baseline justify-between gap-2"><b className="truncate text-[13.5px]">{name(e.invoice.debtorId)}</b><span className="flex-none text-[11.5px] text-slate-400">{fechaHora(e.at)}</span></span>
                      <span className="line-clamp-2 block text-[13px] text-slate-500">{e.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
          {m.fbCount > 0 && (
            <Card className="p-5">
              <div className="text-[15px] font-bold">Lo que dicen tus clientes</div>
              {state.invoices.filter((i) => i.feedback).sort((a, b) => b.feedback!.at.localeCompare(a.feedback!.at)).slice(0, 2).map((i) => (
                <div key={i.id} className="mt-3 rounded-xl bg-slate-50 p-3.5">
                  <Stars n={i.feedback!.stars} />
                  <p className="mt-1 text-[14px] text-slate-700">“{i.feedback!.comment}”</p>
                  <p className="mt-1 text-[12px] text-slate-400">{name(i.debtorId)} · pagó {clp(pending({ ...i, paid: 0 }))}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
