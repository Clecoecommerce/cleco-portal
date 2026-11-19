"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Approval, DemoState, Invoice, Rules, Scenario, Toast } from "./types";
import { addDays, iso, today, uid } from "./format";
import { CLIENT, buildPlan, seed, stepEvent, stepMessage } from "./seed";
import { advance } from "./sim";

const KEY = "cleco-demo-state-v4";

export type View = "resumen" | "facturas" | "factura" | "deudores" | "conversaciones" | "aprobaciones" | "subir" | "reportes" | "reglas";
export interface Route { v: View; id?: string; f?: string }

export interface NewInvoiceInput {
  folio: string; amount: number; issueDate: string; dueDate: string; type: "directa" | "factoring"; line: string;
  debtor: { id?: string; name: string; rut: string; contact: string; email: string; phone: string };
  scenario: Scenario;
}

interface Store {
  state: DemoState;
  toasts: Toast[];
  route: Route;
  go: (r: Route) => void;
  addInvoice: (i: NewInvoiceInput) => string;
  toggleSim: (id: string) => void;
  stepSim: (id: string) => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  decide: (approvalId: string, ok: boolean) => void;
  sendMessage: (invoiceId: string, body: string) => void;
  markRead: (invoiceId: string) => void;
  readNotifications: () => void;
  setRules: (r: Rules) => void;
  markPaid: (invoiceId: string) => void;
  togglePause: (invoiceId: string) => void;
  toast: (t: Omit<Toast, "id">) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);
export const useDemo = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo fuera del proveedor");
  return c;
};

const parseHash = (): Route => {
  if (typeof window === "undefined") return { v: "resumen" };
  const [v, id, f] = window.location.hash.replace(/^#\/?/, "").split("/");
  const views: View[] = ["resumen", "facturas", "factura", "deudores", "conversaciones", "aprobaciones", "subir", "reportes", "reglas"];
  return views.includes(v as View) ? { v: v as View, id: id || undefined, f: f || undefined } : { v: "resumen" };
};

const load = (): DemoState => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const st = JSON.parse(raw) as DemoState;
      if (st.version === 4) return { ...st, sims: st.sims.map((s) => ({ ...s, playing: false })) };
    }
  } catch {}
  return seed();
};

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [route, setRoute] = useState<Route>(parseHash);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const go = useCallback((r: Route) => {
    const h = "#/" + [r.v, r.id, r.f].filter(Boolean).join("/");
    if (window.location.hash !== h) window.location.hash = h;
    setRoute(r);
    document.getElementById("demo-main")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid();
    setToasts((x) => [...x.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4800);
  }, []);

  const runStep = useCallback((id: string) => {
    const { state: next, toasts: ts } = advance(stateRef.current, id);
    stateRef.current = next;
    setState(next);
    ts.forEach(toast);
  }, [toast]);

  // reloj de la simulación
  const playing = state.sims.filter((s) => s.playing && !s.done && !s.waiting).map((s) => s.invoiceId).join(",");
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => playing.split(",").forEach(runStep), 3200 / state.speed);
    return () => clearInterval(t);
  }, [playing, state.speed, runStep]);

  const patch = (fn: (s: DemoState) => DemoState) => setState((s) => fn(s));
  const patchInvoice = (id: string, fn: (i: Invoice) => Invoice) => patch((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? fn(structuredClone(i)) : i)) }));

  const addInvoice = (input: NewInvoiceInput) => {
    const s = stateRef.current;
    let debtorId = input.debtor.id;
    let debtors = s.debtors;
    if (!debtorId) {
      debtorId = "d" + uid();
      debtors = [...debtors, { id: debtorId, name: input.debtor.name, rut: input.debtor.rut, contact: input.debtor.contact, role: "Pago a proveedores", email: input.debtor.email, phone: input.debtor.phone }];
    }
    const debtor = debtors.find((d) => d.id === debtorId)!;
    const id = "n" + uid();
    const now = new Date().toISOString();
    const inv: Invoice = {
      id, folio: input.folio, debtorId, amount: input.amount, paid: 0, issueDate: input.issueDate, dueDate: input.dueDate, status: "por_vencer",
      type: input.type, line: input.line, events: [], messages: [], plan: buildPlan(input.issueDate, input.dueDate, s.rules), isNew: true, createdAt: now,
      nextReview: iso(addDays(input.dueDate, -s.rules.preventiveDays)),
    };
    inv.events.push({ id: uid(), at: now, kind: "carga", by: CLIENT.user, text: `Factura cargada y validada. Plan de cobranza activado (${inv.plan.length} pasos).` });
    const envio = inv.plan.find((p) => p.id === "envio")!;
    inv.messages.push(stepMessage(envio, inv, debtor, now, s.rules.tone));
    inv.events.unshift(stepEvent(envio, now, debtor));
    const next: DemoState = {
      ...s, debtors, invoices: [inv, ...s.invoices],
      sims: [...s.sims.filter((x) => x.invoiceId !== id), { invoiceId: id, scenario: input.scenario, step: 0, playing: true, day: envio.day }],
      notifications: [{ id: uid(), at: now, text: `Factura N° ${inv.folio} cargada. Cleco ya envió la factura a ${debtor.name}.`, invoiceId: id, read: false }, ...s.notifications],
    };
    stateRef.current = next;
    setState(next);
    return id;
  };

  const toggleSim = (id: string) => patch((s) => ({ ...s, sims: s.sims.map((x) => (x.invoiceId === id ? { ...x, playing: !x.playing } : x)) }));

  const decide = (approvalId: string, ok: boolean) => {
    const s = stateRef.current;
    const ap = s.approvals.find((a) => a.id === approvalId);
    if (!ap || ap.status !== "pendiente") return;
    const now = new Date().toISOString();
    const effects: Record<Approval["kind"], (i: Invoice) => void> = {
      plan_pago: (i) => { i.status = "plan_pago"; },
      nueva_fecha: (i) => { i.status = "comprometida"; i.promiseDate = iso(addDays(today(), 9)); },
      aviso_dicom: (i) => { i.status = "aviso_dicom"; i.messages.push({ id: uid(), at: now, dir: "out", channel: "correo", from: "Clemente I.", subject: `Aviso formal: factura N° ${i.folio}`, body: `La factura N° ${i.folio} se encuentra impaga. De no regularizarse en 10 días, ${CLIENT.name} podría autorizar su publicación en DICOM. Respóndenos y buscamos una solución.` }); },
      judicial: (i) => { i.status = "pausada"; },
    };
    const sim = s.sims.find((x) => x.waiting === approvalId);
    const next: DemoState = {
      ...s,
      approvals: s.approvals.map((a) => (a.id === approvalId ? { ...a, status: ok ? "aprobada" : "rechazada" } : a)),
      invoices: s.invoices.map((i) => {
        if (i.id !== ap.invoiceId) return i;
        const c = structuredClone(i);
        if (ok && !sim) effects[ap.kind](c);
        c.events.unshift({ id: uid(), at: now, kind: "aprobacion", by: CLIENT.user, text: `${ok ? "Aprobó" : "Rechazó"}: ${ap.title.toLowerCase()}.` });
        c.messages.push({ id: uid(), at: now, dir: "note", channel: "sistema", from: CLIENT.user, body: `${ok ? "Aprobaste" : "Rechazaste"}: ${ap.title}. ${ok ? "Cleco se lo comunica hoy al cliente." : "Cleco le propondrá una alternativa."}` });
        return c;
      }),
      sims: s.sims.map((x) => (x.waiting === approvalId ? { ...x, waiting: undefined, playing: true, rejected: !ok } : x)),
    };
    stateRef.current = next;
    setState(next);
    toast({ kind: ok ? "ok" : "info", text: ok ? `${ap.title}: aprobado` : `${ap.title}: rechazado`, sub: ok ? "Cleco se lo comunica hoy al cliente." : "Cleco le propondrá una alternativa." });
  };

  const sendMessage = (invoiceId: string, body: string) => {
    patchInvoice(invoiceId, (i) => {
      const now = new Date().toISOString();
      i.messages.push({ id: uid(), at: now, dir: "note", channel: "portal", from: CLIENT.user, body: `Nota para el equipo Cleco: ${body}` });
      i.events.unshift({ id: uid(), at: now, kind: "sistema", by: CLIENT.user, text: "Dejó una nota para el equipo Cleco." });
      return i;
    });
    toast({ kind: "ok", text: "Nota enviada al equipo Cleco", sub: "Te responden en menos de 24 horas hábiles." });
  };

  const markRead = (invoiceId: string) => {
    const inv = stateRef.current.invoices.find((i) => i.id === invoiceId);
    if (!inv || !inv.messages.some((m) => m.dir === "in" && !m.read)) return;
    patchInvoice(invoiceId, (i) => { i.messages = i.messages.map((m) => ({ ...m, read: true })); return i; });
  };

  const value: Store = {
    state, toasts, route, go, addInvoice, toggleSim, stepSim: runStep, toast,
    setSpeed: (sp) => patch((s) => ({ ...s, speed: sp })),
    decide, sendMessage, markRead,
    readNotifications: () => patch((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    setRules: (r) => { patch((s) => ({ ...s, rules: r })); toast({ kind: "ok", text: "Reglas guardadas", sub: "Se aplican a las facturas nuevas." }); },
    markPaid: (id) => {
      patchInvoice(id, (i) => { const now = new Date().toISOString(); i.status = "pagada"; i.paid = i.amount; i.nextReview = undefined; i.events.unshift({ id: uid(), at: now, kind: "pago", by: CLIENT.user, text: "Marcó la factura como pagada. Cleco detiene la cobranza." }); return i; });
      patch((s) => ({ ...s, sims: s.sims.map((x) => (x.invoiceId === id ? { ...x, playing: false, done: true } : x)) }));
      toast({ kind: "ok", text: "Factura marcada como pagada", sub: "Cleco no enviará más mensajes." });
    },
    togglePause: (id) => {
      const inv = stateRef.current.invoices.find((i) => i.id === id)!;
      const paused = inv.status === "pausada";
      patchInvoice(id, (i) => { i.status = paused ? (i.dueDate < today() ? "vencida" : "por_vencer") : "pausada"; i.events.unshift({ id: uid(), at: new Date().toISOString(), kind: "sistema", by: CLIENT.user, text: paused ? "Reanudó la cobranza." : "Pausó la cobranza de esta factura." }); return i; });
      toast({ kind: "info", text: paused ? "Cobranza reanudada" : "Cobranza en pausa", sub: paused ? "Cleco retoma el plan desde el paso pendiente." : "No se enviarán mensajes hasta que la reanudes." });
    },
    reset: () => { const s = seed(); stateRef.current = s; setState(s); go({ v: "resumen" }); toast({ kind: "info", text: "Demo reiniciada", sub: "Volvieron los datos de ejemplo." }); },
  };
  return <Ctx.Provider value={useMemo(() => value, [state, toasts, route])}>{children}</Ctx.Provider>;
}
