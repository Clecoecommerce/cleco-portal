"use client";
import React, { useMemo, useState } from "react";
import { Download, Search, Upload, ChevronRight, FileText } from "lucide-react";
import { useDemo } from "../lib/store";
import { TRAMOS, overdueDays, pending } from "../lib/metrics";
import { planStates } from "../lib/seed";
import { clp, fechaCorta, fecha } from "../lib/format";
import { Badge, Button, Card, CHANNEL, Empty, PageHeader, STATUS, StatusBadge, cx } from "../components/ui";
import type { InvoiceStatus } from "../lib/types";

export function Facturas() {
  const { state, route, go, toast } = useDemo();
  const init = route.f ?? "";
  const [tramo, setTramo] = useState<string>(init.startsWith("t:") ? init.slice(2) : "todas");
  const [q, setQ] = useState(init.startsWith("q:") ? decodeURIComponent(init.slice(2)) : "");
  const [status, setStatus] = useState<InvoiceStatus | "todas" | "abiertas">("abiertas");
  const debtor = (id: string) => state.debtors.find((d) => d.id === id)!;

  React.useEffect(() => {
    if (init.startsWith("q:")) { setQ(decodeURIComponent(init.slice(2))); setStatus("todas"); setTramo("todas"); }
    if (init.startsWith("t:")) setTramo(init.slice(2));
  }, [init]);

  const rows = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.\-\s]/g, "");
    const nq = norm(q);
    return state.invoices
      .filter((i) => (status === "todas" ? true : status === "abiertas" ? i.status !== "pagada" : i.status === status))
      .filter((i) => tramo === "todas" || (i.status !== "pagada" && TRAMOS.find((t) => t.id === tramo)!.test(overdueDays(i))))
      .filter((i) => { if (!nq) return true; const d = debtor(i.debtorId); return norm(d.name + d.rut + i.folio).includes(nq); })
      .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || overdueDays(b) - overdueDays(a));
  }, [state.invoices, tramo, q, status]);

  const total = rows.reduce((a, i) => a + pending(i), 0);

  const exportCsv = () => {
    const head = "Folio;Cliente;RUT;Emision;Vencimiento;Dias mora;Monto;Saldo;Estado\n";
    const body = rows.map((i) => { const d = debtor(i.debtorId); return [i.folio, d.name, d.rut, i.issueDate, i.dueDate, overdueDays(i), i.amount, pending(i), STATUS[i.status].label].join(";"); }).join("\n");
    const blob = new Blob(["﻿" + head + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "cleco_facturas_demo.csv"; a.click();
    toast({ kind: "ok", text: "Exportaste " + rows.length + " facturas", sub: "cleco_facturas_demo.csv" });
  };

  return (
    <div className="fade-up">
      <PageHeader kicker="Cartera" title="Facturas" sub={`${rows.length} facturas · ${clp(total)} por cobrar en esta vista`}
        right={<><Button variant="ghost" onClick={exportCsv}><Download className="h-4 w-4" /> Exportar</Button><Button onClick={() => go({ v: "subir" })}><Upload className="h-4 w-4" /> Subir facturas</Button></>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente, RUT o N° de factura" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[14px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
          </div>
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
            {[{ id: "todas", label: "Todos los tramos" }, ...TRAMOS].map((t) => (
              <button key={t.id} onClick={() => setTramo(t.id)} className={cx("h-9 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition", tramo === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{t.label}</button>
            ))}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[14px] outline-none focus:border-blue-400">
            <option value="abiertas">Abiertas</option>
            <option value="todas">Todas, incluidas pagadas</option>
            {(Object.keys(STATUS) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </select>
        </div>
        {rows.length === 0 ? <Empty icon={<FileText className="h-5 w-5" />} title="No hay facturas con estos filtros" sub="Prueba con otro tramo o limpia la búsqueda." /> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[11.5px] font-bold uppercase tracking-[.06em] text-slate-500">
                    <th className="px-5 py-3">Cliente y factura</th><th className="px-3 py-3">Vencimiento</th><th className="px-3 py-3 text-right">Saldo</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3">Próximo paso</th><th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => {
                    const d = debtor(i.debtorId), od = overdueDays(i);
                    const next = planStates(i).find((p) => p.state === "actual");
                    const unread = i.messages.some((m) => m.dir === "in" && !m.read);
                    return (
                      <tr key={i.id} onClick={() => go({ v: "factura", id: i.id })} className={cx("cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/40", i.isNew && "bg-blue-50/60")}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">{d.name}{i.isNew && <Badge tone="blue" dot={false}>Nueva</Badge>}{unread && <span className="h-2 w-2 rounded-full bg-blue-600" title="Respuesta sin leer" />}</div>
                          <div className="text-[12.5px] text-slate-500">N° {i.folio} · {i.type === "factoring" ? "Con factoring" : "Directa"}</div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div>{fechaCorta(i.dueDate)}</div>
                          <div className={cx("text-[12.5px]", i.status === "pagada" ? "text-slate-400" : od > 60 ? "font-semibold text-red-600" : od > 0 ? "text-amber-700" : "text-slate-500")}>{i.status === "pagada" ? "Pagada" : od > 0 ? `${od} días vencida` : od === 0 ? "Vence hoy" : `En ${-od} días`}</div>
                        </td>
                        <td className="px-3 py-3.5 text-right font-bold tabular-nums">{clp(pending(i))}{i.paid > 0 && i.status !== "pagada" && <div className="text-[12px] font-normal text-slate-500">de {clp(i.amount)}</div>}</td>
                        <td className="px-3 py-3.5"><StatusBadge s={i.status} /></td>
                        <td className="px-3 py-3.5 text-[13px] text-slate-600">
                          {i.status === "pagada" ? <span className="text-slate-400">—</span> : i.status === "comprometida" && i.promiseDate ? <>Esperamos pago el {fechaCorta(i.promiseDate)}</> : next ? <span className="flex items-center gap-1.5">{React.createElement(CHANNEL[next.channel].Icon, { className: "h-3.5 w-3.5 text-slate-400" })}{next.title}</span> : "Revisión " + (i.nextReview ? fecha(i.nextReview) : "")}
                        </td>
                        <td className="pr-4"><ChevronRight className="h-4 w-4 text-slate-300" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid divide-y divide-slate-100 md:hidden">
              {rows.map((i) => {
                const d = debtor(i.debtorId), od = overdueDays(i);
                return (
                  <button key={i.id} onClick={() => go({ v: "factura", id: i.id })} className={cx("grid gap-1.5 px-4 py-3.5 text-left", i.isNew && "bg-blue-50/60")}>
                    <div className="flex items-start justify-between gap-3"><b className="text-[14.5px]">{d.name}</b><b className="tabular-nums">{clp(pending(i))}</b></div>
                    <div className="flex items-center justify-between gap-2 text-[12.5px] text-slate-500"><span>N° {i.folio} · {i.status === "pagada" ? "Pagada" : od > 0 ? `${od} días vencida` : `vence ${fechaCorta(i.dueDate)}`}</span><StatusBadge s={i.status} /></div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
