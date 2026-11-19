"use client";
import React, { useMemo, useState } from "react";
import { Check, ChevronRight, Inbox, Search, X, CheckCircle2, AlertTriangle, CalendarClock, Scale, Handshake, Mail, Smartphone, Phone } from "lucide-react";
import { useDemo } from "../lib/store";
import { overdueDays, pending, metrics, MOROSIDAD_SERIE, RECUPERADO_MES } from "../lib/metrics";
import { clp, fechaHora, millones, pct } from "../lib/format";
import { Badge, Button, Card, CardHead, Empty, PageHeader, SENTIMENT, StatusBadge, Stars, cx } from "../components/ui";
import { Bars, Donut, LineChart } from "../components/charts";
import type { Approval, Rules } from "../lib/types";

/* ---------- Clientes deudores ---------- */
export function Deudores() {
  const { state, go } = useDemo();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const rows = useMemo(() => state.debtors.map((d) => {
    const inv = state.invoices.filter((i) => i.debtorId === d.id);
    const open = inv.filter((i) => i.status !== "pagada");
    const fb = inv.filter((i) => i.feedback);
    const replies = inv.flatMap((i) => i.messages.filter((m) => m.dir === "in"));
    const last = inv.flatMap((i) => i.events).sort((a, b) => b.at.localeCompare(a.at))[0];
    return { d, inv, open, saldo: open.reduce((a, i) => a + pending(i), 0), maxOd: Math.max(0, ...open.map(overdueDays)), stars: fb.length ? fb.reduce((a, i) => a + i.feedback!.stars, 0) / fb.length : 0, replies: replies.length, last };
  }).filter((r) => r.inv.length && (r.d.name + r.d.rut).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.saldo - a.saldo), [state, q]);
  const s = rows.find((r) => r.d.id === sel);

  return (
    <div className="fade-up">
      <PageHeader kicker="Cartera" title="Clientes deudores" sub={`${rows.filter((r) => r.open.length).length} empresas con saldo pendiente`} />
      <Card>
        <div className="border-b border-slate-100 p-4"><div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o RUT" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[14px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[14px]">
            <thead><tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[11.5px] font-bold uppercase tracking-[.06em] text-slate-500"><th className="px-5 py-3">Cliente</th><th className="px-3">Facturas</th><th className="px-3 text-right">Saldo</th><th className="px-3">Mayor atraso</th><th className="px-3">Relación</th><th className="px-3">Última gestión</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.d.id} onClick={() => setSel(r.d.id)} className="cursor-pointer border-b border-slate-100 hover:bg-blue-50/40">
                  <td className="px-5 py-3.5"><div className="font-semibold">{r.d.name}</div><div className="text-[12.5px] text-slate-500">{r.d.rut} · {r.d.contact}</div></td>
                  <td className="px-3">{r.open.length} <span className="text-slate-400">/ {r.inv.length}</span></td>
                  <td className="px-3 text-right font-bold tabular-nums">{clp(r.saldo)}</td>
                  <td className={cx("px-3", r.maxOd > 60 ? "font-semibold text-red-600" : r.maxOd > 0 ? "text-amber-700" : "text-slate-500")}>{r.maxOd ? r.maxOd + " días" : "Al día"}</td>
                  <td className="px-3">{r.stars ? <Stars n={Math.round(r.stars)} /> : <span className="text-[12.5px] text-slate-400">{r.replies ? r.replies + " respuestas" : "Sin respuesta aún"}</span>}</td>
                  <td className="px-3 text-[12.5px] text-slate-500">{r.last ? fechaHora(r.last.at) : "—"}</td>
                  <td className="pr-4"><ChevronRight className="h-4 w-4 text-slate-300" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {s && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setSel(null)} />
          <div className="fade-up absolute inset-y-0 right-0 w-full max-w-[520px] overflow-y-auto bg-white p-6 shadow-2xl">
            <button onClick={() => setSel(null)} className="absolute right-4 top-4 rounded-full p-2 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            <div className="text-[12px] font-bold uppercase tracking-[.09em] text-blue-600">{s.d.rut}</div>
            <h2 className="mt-1 pr-10 text-[26px] font-extrabold tracking-tight">{s.d.name}</h2>
            <div className="mt-1 text-[14px] text-slate-500">{s.d.contact} · {s.d.role} · {s.d.email}</div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[["Saldo", clp(s.saldo)], ["Facturas abiertas", String(s.open.length)], ["Mayor atraso", s.maxOd ? s.maxOd + " días" : "Al día"]].map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 p-3"><div className="text-[12px] text-slate-500">{l}</div><div className="text-[17px] font-bold">{v}</div></div>)}
            </div>
            <h3 className="mt-6 text-[15px] font-bold">Facturas</h3>
            <div className="mt-2 grid gap-2">
              {s.inv.map((i) => (
                <button key={i.id} onClick={() => go({ v: "factura", id: i.id })} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left ring-1 ring-slate-200 hover:bg-slate-50">
                  <span><b className="text-[14px]">N° {i.folio}</b><span className="block text-[12.5px] text-slate-500">{clp(i.amount)} · {overdueDays(i) > 0 && i.status !== "pagada" ? overdueDays(i) + " días vencida" : "vence " + i.dueDate.split("-").reverse().join("/")}</span></span>
                  <StatusBadge s={i.status} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Conversaciones ---------- */
export function Conversaciones() {
  const { state, go } = useDemo();
  const [only, setOnly] = useState(false);
  const threads = state.invoices.map((i) => {
    const ins = i.messages.filter((m) => m.dir === "in");
    const last = ins[ins.length - 1];
    return { i, last, unread: ins.filter((m) => !m.read).length };
  }).filter((t) => t.last && (!only || t.unread)).sort((a, b) => b.unread - a.unread || b.last!.at.localeCompare(a.last!.at));
  return (
    <div className="fade-up">
      <PageHeader kicker="Bandeja" title="Conversaciones" sub="Lo que responden tus clientes a Cleco, ordenado por lo más reciente." right={
        <div className="inline-flex rounded-full bg-slate-100 p-1">{[[false, "Todas"], [true, "Sin leer"]].map(([v, l]) => <button key={String(v)} onClick={() => setOnly(v as boolean)} className={cx("h-8 rounded-full px-3.5 text-[13px] font-semibold", only === v ? "bg-white shadow-sm" : "text-slate-500")}>{l as string}</button>)}</div>
      } />
      <Card>
        {threads.length === 0 ? <Empty icon={<Inbox className="h-5 w-5" />} title="No hay respuestas sin leer" sub="Cuando un cliente responda un correo o SMS, aparecerá aquí." /> : (
          <div className="divide-y divide-slate-100">
            {threads.map(({ i, last, unread }) => {
              const d = state.debtors.find((x) => x.id === i.debtorId)!;
              return (
                <button key={i.id} onClick={() => go({ v: "factura", id: i.id })} className={cx("grid w-full grid-cols-[40px_1fr_auto] items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50", unread > 0 && "bg-blue-50/40")}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-[13px] font-bold text-slate-600">{d.contact.split(" ").map((w) => w[0]).join("")}</span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2"><b className="text-[14.5px]">{d.contact}</b><span className="text-[13px] text-slate-500">{d.name} · N° {i.folio}</span>{last!.sentiment && <Badge tone={SENTIMENT[last!.sentiment].tone}>{SENTIMENT[last!.sentiment].label}</Badge>}</span>
                    <span className={cx("mt-0.5 line-clamp-2 block text-[13.5px]", unread ? "font-medium text-slate-900" : "text-slate-500")}>{last!.body}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1.5"><span className="whitespace-nowrap text-[12px] text-slate-400">{fechaHora(last!.at)}</span>{unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">{unread}</span>}</span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Aprobaciones ---------- */
const AP_ICON: Record<Approval["kind"], [React.ComponentType<{ className?: string }>, string]> = {
  plan_pago: [Handshake, "bg-blue-50 text-blue-600"], nueva_fecha: [CalendarClock, "bg-blue-50 text-blue-600"], aviso_dicom: [AlertTriangle, "bg-red-50 text-red-600"], judicial: [Scale, "bg-red-50 text-red-600"],
};
export function Aprobaciones() {
  const { state, decide, go } = useDemo();
  const pend = state.approvals.filter((a) => a.status === "pendiente");
  const done = state.approvals.filter((a) => a.status !== "pendiente");
  const item = (a: Approval) => {
    const inv = state.invoices.find((i) => i.id === a.invoiceId)!;
    const d = state.debtors.find((x) => x.id === inv.debtorId)!;
    const [Icon, cls] = AP_ICON[a.kind];
    return (
      <Card key={a.id} className={cx("fade-up grid gap-4 p-5 md:grid-cols-[48px_1fr_auto] md:items-center", a.status === "aprobada" && "border-emerald-200 bg-emerald-50/40")}>
        <span className={cx("grid h-12 w-12 place-items-center rounded-2xl", cls)}><Icon className="h-5 w-5" /></span>
        <div>
          <div className="flex flex-wrap items-center gap-2"><b className="text-[16px]">{a.title}</b><span className="text-[13.5px] font-semibold text-slate-500">{clp(pending(inv))}</span></div>
          <p className="mt-1 max-w-3xl text-[14px] text-slate-600">{a.body}</p>
          <div className="mt-1.5 text-[12.5px] text-slate-400">Propuesta de {a.proposedBy} · {fechaHora(a.at)} · <button onClick={() => go({ v: "factura", id: inv.id })} className="font-semibold text-blue-600">Ver factura de {d.name}</button></div>
        </div>
        {a.status === "pendiente" ? (
          <div className="flex gap-2"><Button variant="ghost" onClick={() => decide(a.id, false)}>Rechazar</Button><Button onClick={() => decide(a.id, true)}><Check className="h-4 w-4" /> Aprobar</Button></div>
        ) : <Badge tone={a.status === "aprobada" ? "green" : "gray"}>{a.status === "aprobada" ? "Aprobada" : "Rechazada"}</Badge>}
      </Card>
    );
  };
  return (
    <div className="fade-up">
      <PageHeader kicker="Tú decides" title="Aprobaciones" sub="Cleco no avanza con estas facturas sin tu aprobación. Así cuidamos la relación con tus clientes." />
      <div className="grid gap-3">
        {pend.length === 0 && <Card><Empty icon={<CheckCircle2 className="h-5 w-5" />} title="No tienes decisiones pendientes" sub="Te avisaremos cuando Cleco necesite tu aprobación." /></Card>}
        {pend.map(item)}
      </div>
      {done.length > 0 && <><h2 className="mb-3 mt-8 text-[15px] font-bold text-slate-500">Decididas</h2><div className="grid gap-3">{done.map(item)}</div></>}
    </div>
  );
}

/* ---------- Reportes ---------- */
export function Reportes() {
  const { state } = useDemo();
  const m = metrics(state);
  const chan = [{ l: "Correo", v: 58, c: "#2563EB", I: Mail }, { l: "Llamado", v: 27, c: "#6366F1", I: Phone }, { l: "SMS", v: 15, c: "#93C5FD", I: Smartphone }];
  return (
    <div className="fade-up grid gap-6">
      <PageHeader kicker="Datos de ejemplo" title="Reportes" sub="Cómo evoluciona tu cartera desde que trabaja con Cleco." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[["Morosidad", "11,3%", "desde 19,7% en enero"], ["Días promedio de pago", "34", "−9 días vs. 2025"], ["Pagado a tiempo", "71,7%", "del monto facturado"], ["Relación", m.avgStars ? m.avgStars.toFixed(1).replace(".", ",") + " / 5" : "—", `${m.fbCount} evaluaciones de clientes`]].map(([l, v, s]) => (
          <Card key={l} className="p-5"><div className="text-[13px] text-slate-500">{l}</div><div className="mt-1 text-[28px] font-extrabold tracking-tight">{v}</div><div className="text-[12.5px] text-slate-500">{s}</div></Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHead title="Morosidad semanal" sub="Monto vencido sobre la cartera total" /><div className="p-3"><LineChart data={MOROSIDAD_SERIE.map((v, i) => ({ label: "S" + (i + 1), v }))} /></div></Card>
        <Card><CardHead title="Recuperado por mes" sub="Millones de pesos · azul: gestión de vencidas · celeste: pagos a tiempo" /><div className="p-3"><Bars data={RECUPERADO_MES} format={(v) => "$" + v.toFixed(1).replace(".", ",") + " M"} /></div></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <h3 className="text-[16px] font-bold">Qué canal logra el pago</h3>
          <div className="mt-4 flex items-center gap-6">
            <Donut parts={chan.map((c) => ({ v: c.v, color: c.c }))} label="100%" sub="pagos con gestión" />
            <ul className="grid gap-3">{chan.map((c) => <li key={c.l} className="flex items-center gap-3 text-[14px]"><span className="h-3 w-3 rounded" style={{ background: c.c }} /><c.I className="h-4 w-4 text-slate-400" />{c.l}<b className="ml-2">{c.v}%</b></li>)}</ul>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-[16px] font-bold">Dónde se resuelven las facturas</h3>
          <p className="mt-1 text-[13px] text-slate-500">La mayoría se paga en los primeros pasos. Muy pocas llegan a DICOM.</p>
          <div className="mt-4 grid gap-2.5">
            {[["Antes de vencer (recordatorio)", 52], ["Correos de seguimiento", 24], ["Llamado", 13], ["Plan de pago", 8], ["Aviso formal o DICOM", 3]].map(([l, v]) => (
              <div key={l as string} className="grid grid-cols-[1fr_auto] gap-2 text-[13.5px]"><span>{l}</span><b>{pct(v as number, 0)}</b><div className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: (v as number) + "%" }} /></div></div>
            ))}
          </div>
        </Card>
      </div>
      <p className="text-[12.5px] text-slate-400">Cartera en gestión hoy: {millones(m.total)} en {m.open.length} facturas. Gráficos con datos de ejemplo.</p>
    </div>
  );
}

/* ---------- Reglas de cobranza ---------- */
export function Reglas() {
  const { state, setRules } = useDemo();
  const [r, setR] = useState<Rules>(state.rules);
  const num = (k: keyof Rules, label: string, sub: string, min: number, max: number) => (
    <div className="flex items-center justify-between gap-4 py-4">
      <div><div className="text-[14.5px] font-semibold">{label}</div><div className="text-[13px] text-slate-500">{sub}</div></div>
      <div className="flex items-center gap-2">
        <button className="h-9 w-9 rounded-full ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => setR({ ...r, [k]: Math.max(min, (r[k] as number) - 1) })} aria-label="Menos">−</button>
        <span className="w-10 text-center text-[17px] font-bold tabular-nums">{r[k] as number}</span>
        <button className="h-9 w-9 rounded-full ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => setR({ ...r, [k]: Math.min(max, (r[k] as number) + 1) })} aria-label="Más">+</button>
      </div>
    </div>
  );
  return (
    <div className="fade-up mx-auto max-w-[860px]">
      <PageHeader kicker="Configuración" title="Reglas de cobranza" sub="Cómo y cuándo Cleco le escribe a tus clientes. Se aplican a cada factura nueva." right={<Button onClick={() => setRules(r)}>Guardar cambios</Button>} />
      <div className="grid gap-6">
        <Card className="p-5">
          <h3 className="text-[16px] font-bold">Tono de los mensajes</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([["cordial", "Cordial", "“Hola Catalina, ¿cómo estás? Te recordamos…”"], ["directo", "Directo", "“Estimada Catalina: la factura N° … vence…”"]] as const).map(([k, l, ex]) => (
              <button key={k} onClick={() => setR({ ...r, tone: k })} className={cx("rounded-xl p-4 text-left ring-1", r.tone === k ? "bg-blue-50 ring-2 ring-blue-600" : "ring-slate-200 hover:bg-slate-50")}><b className="text-[14.5px]">{l}</b><span className="mt-1 block text-[13px] italic text-slate-500">{ex}</span></button>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-[16px] font-bold">Canales</h3>
          <div className="mt-2 divide-y divide-slate-100">
            {([["correo", "Correo", "Canal principal. Siempre activo.", true], ["sms", "SMS", "Recordatorio corto el día antes del vencimiento.", false], ["llamado", "Llamado", "Lo hace una persona del equipo Cleco.", false]] as const).map(([k, l, s, locked]) => (
              <label key={k} className="flex cursor-pointer items-center justify-between gap-4 py-3.5">
                <span><span className="block text-[14.5px] font-semibold">{l}</span><span className="text-[13px] text-slate-500">{s}</span></span>
                <button type="button" disabled={locked} onClick={() => setR({ ...r, channels: { ...r.channels, [k]: !r.channels[k] } })} className={cx("relative h-7 w-12 rounded-full transition disabled:opacity-60", r.channels[k] ? "bg-blue-600" : "bg-slate-200")} aria-pressed={r.channels[k]} aria-label={l}>
                  <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", r.channels[k] ? "left-6" : "left-1")} />
                </button>
              </label>
            ))}
          </div>
          <p className="mt-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-500">No usamos WhatsApp para cobrar a empresas: correo, SMS, teléfono y portal.</p>
        </Card>
        <Card className="px-5 py-1">
          <div className="divide-y divide-slate-100">
            {num("preventiveDays", "Recordatorio preventivo", "Días antes del vencimiento", 1, 15)}
            {num("followEveryDays", "Frecuencia de seguimiento", "Días entre correos después de vencer", 3, 14)}
            {num("callAfterEmails", "Llamar después de", "Correos sin respuesta", 2, 6)}
          </div>
        </Card>
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/60 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-600" />
          <div className="text-[14px] text-amber-950"><b>DICOM y cobranza judicial siempre requieren tu aprobación.</b> Cleco te lo propone con el historial completo de la factura y tú decides. La cobranza judicial la lleva tu área legal.</div>
        </Card>
      </div>
    </div>
  );
}
