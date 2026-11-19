"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Download, Pause, Play, PauseCircle, Send, SkipForward, Mail, Phone, Building2, CalendarClock, ShieldCheck, Lock } from "lucide-react";
import { useDemo } from "../lib/store";
import { overdueDays, pending } from "../lib/metrics";
import { planStates } from "../lib/seed";
import { SCENARIOS, nextDay, scriptLength } from "../lib/sim";
import { addDays, clp, fecha, fechaCorta, fechaHora, iso, toDate } from "../lib/format";
import { Badge, Button, Card, CHANNEL, Empty, SENTIMENT, StatusBadge, Stars, cx } from "../components/ui";
import { EVENT_ICON } from "./Resumen";

export function FacturaDetalle({ id }: { id: string }) {
  const { state, go, toggleSim, stepSim, setSpeed, decide, sendMessage, markRead, markPaid, togglePause, toast } = useDemo();
  const inv = state.invoices.find((i) => i.id === id);
  const sim = state.sims.find((s) => s.invoiceId === id);
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"plan" | "conv" | "datos">("conv");
  const threadRef = useRef<HTMLDivElement>(null);
  const msgCount = inv?.messages.length ?? 0;

  useEffect(() => { if (inv) markRead(inv.id); }, [msgCount]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const el = threadRef.current; if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })); }, [msgCount]);

  if (!inv) return <Empty title="No encontramos esta factura" sub="Puede que hayas reiniciado la demo." />;
  const d = state.debtors.find((x) => x.id === inv.debtorId)!;
  const ref = sim ? iso(addDays(inv.dueDate, sim.day)) : undefined;
  const plan = planStates(inv, ref);
  const od = ref ? Math.max(0, Math.round((toDate(ref).getTime() - toDate(inv.dueDate).getTime()) / 86_400_000)) : overdueDays(inv);
  const waitingAp = sim?.waiting ? state.approvals.find((a) => a.id === sim.waiting) : undefined;
  const progress = sim ? Math.round((sim.step / scriptLength(sim.scenario)) * 100) : 0;
  const nd = sim ? nextDay(sim) : undefined;

  const planCol = (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Plan de cobranza</h3>
        <Badge tone="blue" dot={false}>{plan.filter((p) => p.state === "hecho").length}/{plan.length} pasos</Badge>
      </div>
      <p className="mt-1 text-[13px] text-slate-500">Se arma solo con tus reglas. Si el cliente compromete una fecha, no insistimos antes.</p>
      <ol className="relative mt-5 grid gap-0">
        {plan.map((p, k) => {
          const C = CHANNEL[p.channel];
          const date = addDays(inv.dueDate, p.day).toISOString();
          return (
            <li key={p.id} className="relative grid grid-cols-[30px_1fr] gap-3 pb-5 last:pb-0">
              {k < plan.length - 1 && <span className={cx("absolute left-[14px] top-8 h-[calc(100%-28px)] w-0.5", p.state === "hecho" ? "bg-blue-600" : "bg-slate-200")} />}
              <span className={cx("relative z-10 grid h-[30px] w-[30px] place-items-center rounded-full ring-4 ring-white transition-colors",
                p.state === "hecho" ? "bg-blue-600 text-white" : p.state === "actual" ? "bg-white text-blue-600 ring-blue-100 outline outline-2 outline-blue-600" : p.state === "omitido" ? "bg-slate-100 text-slate-300" : "bg-slate-100 text-slate-400")}>
                {p.state === "hecho" ? <Check className="h-4 w-4" /> : p.needsApproval ? <Lock className="h-3.5 w-3.5" /> : <C.Icon className="h-3.5 w-3.5" />}
              </span>
              <div className={cx(p.state === "omitido" && "opacity-45")}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cx("text-[14px] font-semibold", p.state === "omitido" && "line-through")}>{p.title}</span>
                  {p.state === "actual" && <Badge tone="blue">Siguiente</Badge>}
                  {p.needsApproval && <Badge tone="amber" dot={false}>Tú decides</Badge>}
                </div>
                <div className="text-[12.5px] text-slate-500">{C.label} · {fecha(date)} · {p.day === 0 ? "día del vencimiento" : p.day === -1 ? "1 día antes" : p.day === 1 ? "1 día después" : p.day < 0 ? `${-p.day} días antes` : `${p.day} días después`}</div>
                <div className="mt-0.5 text-[12.5px] text-slate-400">{p.detail}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );

  const convCol = (
    <Card className="flex min-h-[560px] flex-col overflow-hidden xl:h-[calc(100vh-260px)] xl:min-h-[620px]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-[16px] font-bold">Conversación con {d.contact.split(" ")[0]}</h3>
          <p className="text-[12.5px] text-slate-500">Correos, SMS y llamados con {d.name}, en orden.</p>
        </div>
        <Badge tone="gray" dot={false}>{inv.messages.filter((m) => m.dir !== "note" || m.channel === "llamado").length} contactos</Badge>
      </div>
      <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-4 py-5">
        {inv.messages.map((m) => {
          const C = CHANNEL[m.channel];
          if (m.dir === "note") return (
            <div key={m.id} className={cx("fade-up mx-auto flex max-w-[92%] items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px]", m.channel === "llamado" ? "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-100" : "bg-white text-slate-600 ring-1 ring-slate-200")}>
              <C.Icon className="mt-0.5 h-4 w-4 flex-none opacity-70" />
              <span><b className="font-semibold">{m.channel === "llamado" ? "Llamado · " : ""}{m.from}</b> · <span className="opacity-70">{fechaHora(m.at)}</span><br />{m.body}</span>
            </div>
          );
          const outM = m.dir === "out";
          return (
            <div key={m.id} className={cx("fade-up flex", outM ? "justify-end" : "justify-start")}>
              <div className={cx("max-w-[86%] rounded-2xl px-4 py-3 shadow-sm", outM ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200")}>
                <div className={cx("mb-1 flex flex-wrap items-center gap-2 text-[11.5px]", outM ? "text-blue-100" : "text-slate-500")}>
                  <C.Icon className="h-3.5 w-3.5" /><b className="font-semibold">{m.from}</b><span>·</span><span>{fechaHora(m.at)}</span>
                  {m.sentiment && <Badge tone={SENTIMENT[m.sentiment].tone} className="!py-0 !text-[11px]">{SENTIMENT[m.sentiment].label}</Badge>}
                </div>
                {m.subject && <div className="mb-1 text-[13.5px] font-bold">{m.subject}</div>}
                <div className="whitespace-pre-line text-[13.5px] leading-relaxed">{m.body}</div>
              </div>
            </div>
          );
        })}
        {sim?.playing && !sim.done && (
          <div className="flex items-center gap-2 pl-1 text-[12.5px] text-slate-400"><span className="flex gap-1">{[0, 1, 2].map((k) => <span key={k} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: k * 120 + "ms" }} />)}</span>Cleco está gestionando…</div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; sendMessage(inv.id, note.trim()); setNote(""); }} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escríbele una nota al equipo Cleco sobre esta factura…" className="h-11 flex-1 rounded-full border border-slate-200 px-4 text-[14px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
        <Button type="submit" className="h-11 w-11 !px-0" aria-label="Enviar nota"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );

  const datosCol = (
    <div className="grid content-start gap-6">
      <Card className="p-5">
        <h3 className="text-[16px] font-bold">Datos de la factura</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
          {[["Emisión", fecha(inv.issueDate)], ["Vencimiento", fecha(inv.dueDate)], ["Monto", clp(inv.amount)], ["Saldo", clp(pending(inv))], ["Tipo", inv.type === "factoring" ? "Con factoring" : "Directa"], ["Línea", inv.line], ["Próxima revisión", inv.nextReview ? fecha(inv.nextReview) : "—"], ["Fecha comprometida", inv.promiseDate ? fecha(inv.promiseDate) : "—"]].map(([k, v]) => (
            <div key={k}><dt className="text-[12px] text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
      </Card>
      <Card className="p-5">
        <h3 className="text-[16px] font-bold">Contacto de pagos</h3>
        <div className="mt-3 grid gap-2.5 text-[13.5px]">
          <div className="flex items-center gap-2.5"><Building2 className="h-4 w-4 text-slate-400" /><span><b>{d.name}</b><span className="text-slate-500"> · {d.rut}</span></span></div>
          <div className="flex items-center gap-2.5"><span className="grid h-4 w-4 place-items-center text-[10px] font-bold text-slate-400">●</span>{d.contact}, {d.role}</div>
          <div className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-slate-400" />{d.email}</div>
          <div className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-slate-400" />{d.phone}</div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-[16px] font-bold">Relación con el cliente</h3>
        {inv.feedback ? (
          <div className="fade-up mt-3 rounded-xl bg-amber-50/70 p-3.5 ring-1 ring-amber-100">
            <Stars n={inv.feedback.stars} size={18} />
            <p className="mt-1.5 text-[14px] text-slate-800">“{inv.feedback.comment}”</p>
            <p className="mt-1 text-[12px] text-slate-500">Encuesta enviada al cerrar la gestión · {fechaCorta(inv.feedback.at)}</p>
          </div>
        ) : (
          <p className="mt-2 text-[13.5px] text-slate-500">Al cerrar la gestión le pedimos a tu cliente que evalúe cómo lo tratamos. Así cuidamos la relación.</p>
        )}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[12.5px] text-slate-600"><ShieldCheck className="h-4 w-4 flex-none text-emerald-600" />DICOM y cobranza judicial solo con tu autorización.</div>
      </Card>
      <Card className="p-5">
        <h3 className="text-[16px] font-bold">Bitácora</h3>
        <div className="mt-3 grid gap-3">
          {inv.events.slice(0, 10).map((e) => {
            const [Icon, cls] = EVENT_ICON[e.kind] ?? EVENT_ICON.sistema;
            return (
              <div key={e.id} className="fade-up grid grid-cols-[28px_1fr] gap-2.5">
                <span className={cx("grid h-7 w-7 place-items-center rounded-full", cls)}><Icon className="h-3.5 w-3.5" /></span>
                <div><div className="text-[13px] text-slate-800">{e.text}</div><div className="text-[11.5px] text-slate-400">{e.by} · {fechaHora(e.at)}</div></div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="fade-up grid gap-5">
      <button onClick={() => go({ v: "facturas" })} className="inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Facturas</button>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[.09em] text-blue-600">Factura N° {inv.folio}</div>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.03em] md:text-[34px]">{d.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[28px] font-extrabold tracking-tight tabular-nums">{clp(pending(inv))}</span>
            <StatusBadge s={inv.status} />
            {inv.status !== "pagada" && <Badge tone={od > 60 ? "red" : od > 0 ? "amber" : "blue"}>{od > 0 ? `${od} días vencida` : "Al día"}</Badge>}
            <Badge tone="gray">{inv.type === "factoring" ? "Con factoring" : "Directa"}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => toast({ kind: "info", text: "PDF de la factura", sub: `Factura_${inv.folio}.pdf (demo)` })}><Download className="h-4 w-4" /> PDF</Button>
          {inv.status !== "pagada" && <Button variant="ghost" onClick={() => togglePause(inv.id)}><PauseCircle className="h-4 w-4" /> {inv.status === "pausada" ? "Reanudar" : "Pausar cobranza"}</Button>}
          {inv.status !== "pagada" && <Button variant="dark" onClick={() => markPaid(inv.id)}><Check className="h-4 w-4" /> Marcar pagada</Button>}
        </div>
      </div>

      {sim && (
        <div className="overflow-hidden rounded-2xl bg-slate-950 text-white">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:p-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">{sim.playing && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-70" />}<span className={cx("relative h-3 w-3 rounded-full", sim.done ? "bg-emerald-400" : sim.waiting ? "bg-amber-400" : "bg-blue-500")} /></span>
              <div>
                <div className="text-[14.5px] font-semibold">{sim.done ? "Simulación terminada" : sim.waiting ? "Esperando tu decisión" : sim.playing ? "Simulación en vivo" : "Simulación en pausa"} · {SCENARIOS[sim.scenario].label}</div>
                <div className="text-[12.5px] text-slate-400"><CalendarClock className="mr-1 inline h-3.5 w-3.5" />Día simulado: {ref ? fecha(ref) : "—"}{nd !== undefined && !sim.done ? ` · siguiente evento el ${fechaCorta(addDays(inv.dueDate, nd).toISOString())}` : ""} · 1 paso cada {Math.round(3.2 / state.speed * 10) / 10} s</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:ml-auto">
              {waitingAp ? (
                <>
                  <span className="mr-1 text-[13.5px] text-amber-200">{waitingAp.title}</span>
                  <Button size="sm" variant="ghost" className="!bg-transparent !text-white !ring-white/25" onClick={() => decide(waitingAp.id, false)}>Rechazar</Button>
                  <Button size="sm" onClick={() => decide(waitingAp.id, true)}>Aprobar</Button>
                </>
              ) : !sim.done && (
                <>
                  <Button size="sm" variant="ghost" className="!bg-white/10 !text-white !ring-0 hover:!bg-white/20" onClick={() => toggleSim(inv.id)}>{sim.playing ? <><Pause className="h-3.5 w-3.5" /> Pausar</> : <><Play className="h-3.5 w-3.5" /> Continuar</>}</Button>
                  <Button size="sm" variant="ghost" className="!bg-white/10 !text-white !ring-0 hover:!bg-white/20" onClick={() => stepSim(inv.id)}><SkipForward className="h-3.5 w-3.5" /> Siguiente paso</Button>
                </>
              )}
              <div className="flex rounded-full bg-white/10 p-0.5">
                {([1, 2, 4] as const).map((s) => <button key={s} onClick={() => setSpeed(s)} className={cx("h-7 rounded-full px-2.5 text-[12px] font-bold", state.speed === s ? "bg-white text-slate-900" : "text-slate-300")}>{s}x</button>)}
              </div>
            </div>
          </div>
          <div className="h-1 bg-white/10"><div className="h-full bg-blue-500 transition-all duration-700" style={{ width: progress + "%" }} /></div>
        </div>
      )}

      <div className="flex rounded-full bg-slate-100 p-1 xl:hidden">
        {([["conv", "Conversación"], ["plan", "Plan"], ["datos", "Datos y bitácora"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx("h-9 flex-1 rounded-full text-[13.5px] font-semibold", tab === k ? "bg-white shadow-sm" : "text-slate-500")}>{l}</button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(300px,.9fr)_1.5fr_minmax(300px,.95fr)]">
        <div className={cx(tab !== "plan" && "hidden xl:block")}>{planCol}</div>
        <div className={cx(tab !== "conv" && "hidden xl:block")}>{convCol}</div>
        <div className={cx(tab !== "datos" && "hidden xl:block")}>{datosCol}</div>
      </div>
    </div>
  );
}
