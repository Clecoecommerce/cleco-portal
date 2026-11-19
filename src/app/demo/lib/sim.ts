// Motor de simulación: guiones de cómo responde un deudor, paso a paso.
import type { Approval, Debtor, DemoState, Invoice, Message, Scenario, Simulation, Toast } from "./types";
import { addDays, clp, fechaCorta, iso, uid } from "./format";
import { AUTO, CLIENT, EXEC, stepEvent, stepMessage } from "./seed";

export const SCENARIOS: Record<Scenario, { label: string; desc: string }> = {
  paga_a_tiempo: { label: "Paga a tiempo", desc: "Responde al recordatorio, compromete fecha y paga antes de vencer." },
  pide_documento: { label: "Pide un documento", desc: "Pide la orden de compra, se la enviamos y paga a los pocos días." },
  plan_pago: { label: "Se atrasa y negocia", desc: "No responde, lo llamamos y propone cuotas. Tú apruebas el plan." },
};

interface Ctx {
  inv: Invoice;
  debtor: Debtor;
  state: DemoState;
  sim: Simulation;
  at: (h?: number, m?: number) => string;
}
interface StepOut { toast?: Omit<Toast, "id">; notify?: string; approval?: Omit<Approval, "id" | "at" | "status" | "invoiceId">; }
interface Step { day: number; run: (c: Ctx) => StepOut | void; }

const planStep = (id: string) => (c: Ctx): StepOut => {
  const p = c.inv.plan.find((x) => x.id === id);
  if (!p) return {};
  const when = c.at(9, 30);
  c.inv.messages.push(stepMessage(p, c.inv, c.debtor, when, c.state.rules.tone));
  c.inv.events.unshift(stepEvent(p, when, c.debtor));
  return {};
};

const reply = (body: string, sentiment: Message["sentiment"], h = 15): Step["run"] => (c) => {
  const when = c.at(h, 12);
  c.inv.messages.push({ id: uid(), at: when, dir: "in", channel: "correo", from: c.debtor.contact, body, sentiment, read: false });
  c.inv.events.unshift({ id: uid(), at: when, kind: "respuesta", by: c.debtor.contact, text: body.length > 70 ? body.slice(0, 68) + "…" : body });
  return { notify: `${c.debtor.name} respondió sobre la factura N° ${c.inv.folio}.`, toast: { kind: "info", text: "Nueva respuesta del cliente", sub: c.debtor.name } };
};

const out = (from: string, subject: string, body: string, h = 10): Step["run"] => (c) => {
  const when = c.at(h, 5);
  c.inv.messages.push({ id: uid(), at: when, dir: "out", channel: "correo", from, subject, body });
  c.inv.events.unshift({ id: uid(), at: when, kind: "correo", by: from, text: subject + "." });
  return {};
};

const note = (body: string): Step["run"] => (c) => {
  c.inv.messages.push({ id: uid(), at: c.at(18, 0), dir: "note", channel: "sistema", from: "Cleco", body });
};

const promise = (dayRel: number): Step["run"] => (c) => {
  const d = iso(addDays(c.inv.dueDate, dayRel));
  c.inv.status = "comprometida";
  c.inv.promiseDate = d;
  c.inv.nextReview = iso(addDays(d, 1));
  c.inv.events.unshift({ id: uid(), at: c.at(15, 20), kind: "compromiso", by: c.debtor.contact, text: `Fecha de pago comprometida: ${fechaCorta(d)}.` });
  c.inv.messages.push({ id: uid(), at: c.at(15, 21), dir: "note", channel: "sistema", from: "Cleco", body: `Fecha comprometida para el ${fechaCorta(d)}. Pausamos los recordatorios hasta ese día: no insistimos antes de tiempo.` });
  return { toast: { kind: "ok", text: "Fecha de pago comprometida", sub: `${c.debtor.name} · ${fechaCorta(d)}` } };
};

const pay = (part = 1, label = "Pago recibido"): Step["run"] => (c) => {
  const amt = Math.round(c.inv.amount * part);
  c.inv.paid = Math.min(c.inv.amount, c.inv.paid + amt);
  const when = c.at(16, 40);
  if (c.inv.paid >= c.inv.amount) { c.inv.status = "pagada"; c.inv.nextReview = undefined; }
  c.inv.events.unshift({ id: uid(), at: when, kind: "pago", by: AUTO, text: `${label}: ${clp(amt)} (conciliado con la cartola).` });
  c.inv.messages.push({ id: uid(), at: when, dir: "note", channel: "sistema", from: "Cleco", body: `${label} por ${clp(amt)}. ${c.inv.paid >= c.inv.amount ? "Factura cerrada." : `Saldo pendiente: ${clp(c.inv.amount - c.inv.paid)}.`}` });
  return { toast: { kind: "ok", text: label, sub: `${clp(amt)} · ${c.debtor.name}` }, notify: `${label}: ${clp(amt)} de ${c.debtor.name}.` };
};

const feedback = (stars: number, comment: string): Step["run"] => (c) => {
  const when = c.at(11, 0);
  c.inv.feedback = { stars, comment, at: when };
  c.inv.events.unshift({ id: uid(), at: when, kind: "feedback", by: c.debtor.contact, text: `Evaluó la gestión con ${stars} de 5: "${comment}"` });
  c.inv.messages.push({ id: uid(), at: when, dir: "in", channel: "portal", from: c.debtor.contact, body: `★ ${stars}/5 · ${comment}`, sentiment: "positivo", read: false });
  return { toast: { kind: "ok", text: `Tu cliente evaluó la gestión: ${"★".repeat(stars)}`, sub: comment } };
};

const SCRIPTS: Record<Scenario, Step[]> = {
  paga_a_tiempo: [
    { day: -7, run: planStep("preventivo") },
    { day: -6, run: (c) => reply(`Hola, gracias por el aviso. La factura N° ${c.inv.folio} quedó en la nómina del ${fechaCorta(iso(addDays(c.inv.dueDate, -1)))}.`, "positivo")(c) },
    { day: -6, run: promise(-1) },
    { day: -1, run: pay() },
    { day: 0, run: feedback(5, "Muy claros los recordatorios, y sin presión.") },
  ],
  pide_documento: [
    { day: -7, run: planStep("preventivo") },
    { day: -1, run: planStep("sms") },
    { day: 0, run: planStep("vence") },
    { day: 1, run: reply("Hola. No podemos ingresar la factura porque no tenemos la orden de compra asociada. ¿Nos la pueden reenviar?", "neutral", 11) },
    { day: 1, run: (c) => out(EXEC, `OC y factura N° ${c.inv.folio}`, `Hola ${c.debtor.contact.split(" ")[0]}, te adjuntamos la orden de compra N° 4500-${c.inv.folio.slice(-4)} y la factura en PDF. ¿Nos confirmas cuándo queda pagada?`, 12)(c) },
    { day: 2, run: reply("Recibido, gracias. Con eso la ingresamos y queda para el pago del viernes.", "positivo", 10) },
    { day: 2, run: promise(6) },
    { day: 6, run: pay() },
    { day: 7, run: feedback(4, "Rápidos en mandar la OC cuando la pedimos.") },
  ],
  plan_pago: [
    { day: -7, run: planStep("preventivo") },
    { day: -1, run: planStep("sms") },
    { day: 0, run: planStep("vence") },
    { day: 7, run: planStep("seg1") },
    { day: 14, run: planStep("seg2") },
    { day: 21, run: (c) => {
      c.inv.status = "vencida";
      const when = c.at(11, 45);
      c.inv.messages.push({ id: uid(), at: when, dir: "note", channel: "llamado", from: EXEC, body: `Llamado a ${c.debtor.contact} (${c.debtor.role}). Reconoce la deuda: tienen problemas de caja este mes y enviará una propuesta.` });
      c.inv.events.unshift({ id: uid(), at: when, kind: "llamado", by: EXEC, text: `Llamado a ${c.debtor.contact}. Enviará una propuesta de pago.` });
    } },
    { day: 22, run: reply("Como conversamos por teléfono, proponemos pagar la factura en 3 cuotas mensuales, la primera a fin de mes.", "neutral", 10) },
    { day: 22, run: (c) => ({
      approval: { kind: "plan_pago", title: "Plan de pago en 3 cuotas", body: `${c.debtor.name} propone pagar la factura N° ${c.inv.folio} en 3 cuotas de ${clp(c.inv.amount / 3)}. Reconoció la deuda y respondió a tiempo. Recomendamos aceptar.`, proposedBy: EXEC },
      notify: `Nueva decisión pendiente: plan de pago de ${c.debtor.name}.`,
      toast: { kind: "warn", text: "Cleco necesita tu aprobación", sub: "Plan de pago en 3 cuotas" },
    }) },
    // tras aprobar
    { day: 23, run: (c) => {
      if (c.sim.rejected) {
        return out(EXEC, `Respuesta a tu propuesta · factura N° ${c.inv.folio}`, `Hola ${c.debtor.contact.split(" ")[0]}, ${CLIENT.name} no puede aceptar 3 cuotas. Te propone pagar en 2 partes: la mitad este mes y el saldo el próximo. ¿Te acomoda?`)(c);
      }
      c.inv.status = "plan_pago";
      return out(EXEC, `Plan de pago aprobado · factura N° ${c.inv.folio}`, `Hola ${c.debtor.contact.split(" ")[0]}, ${CLIENT.name} aprobó tu propuesta. Cuotas de ${clp(c.inv.amount / 3)} el último día hábil de cada mes. Te recordaremos cada una unos días antes.`)(c);
    } },
    { day: 24, run: (c) => (c.sim.rejected ? (reply("Está bien, pagamos en 2 partes.", "neutral")(c), (c.inv.status = "plan_pago"), {}) : undefined) },
    { day: 30, run: (c) => pay(c.sim.rejected ? 0.5 : 1 / 3, c.sim.rejected ? "Primer pago recibido" : "Cuota 1 de 3 recibida")(c) },
    { day: 31, run: feedback(4, "Agradecemos la flexibilidad para ordenar el pago.") },
  ],
};

export const scriptLength = (s: Scenario) => SCRIPTS[s].length;
export const nextDay = (sim: Simulation) => SCRIPTS[sim.scenario][sim.step]?.day;

// Avanza una simulación un paso. Devuelve el nuevo estado y efectos visibles.
export function advance(state: DemoState, invoiceId: string): { state: DemoState; toasts: Omit<Toast, "id">[] } {
  const sim = state.sims.find((x) => x.invoiceId === invoiceId);
  if (!sim || sim.done || sim.waiting) return { state, toasts: [] };
  const script = SCRIPTS[sim.scenario];
  const step = script[sim.step];
  if (!step) return { state: { ...state, sims: state.sims.map((x) => (x === sim ? { ...x, done: true, playing: false } : x)) }, toasts: [] };
  const inv: Invoice = structuredClone(state.invoices.find((x) => x.id === invoiceId)!);
  const debtor = state.debtors.find((d) => d.id === inv.debtorId)!;
  const day = iso(addDays(inv.dueDate, step.day));
  const ctx: Ctx = { inv, debtor, state, sim, at: (h = 10, m = 0) => { const d = addDays(day, 0); d.setHours(h, m, 0, 0); return d.toISOString(); } };
  if (inv.status === "por_vencer" && step.day >= 1 && !["comprometida", "pagada", "plan_pago"].includes(inv.status)) inv.status = "vencida";
  const res = step.run(ctx) || {};
  inv.isNew = false;
  let approvals = state.approvals;
  let nextSim: Simulation = { ...sim, step: sim.step + 1, day: step.day };
  if (res.approval) {
    const ap: Approval = { ...res.approval, id: "ap" + uid(), invoiceId, at: ctx.at(17, 0), status: "pendiente" };
    approvals = [ap, ...approvals];
    nextSim = { ...nextSim, waiting: ap.id, playing: false };
  }
  if (nextSim.step >= script.length) nextSim = { ...nextSim, done: true, playing: false };
  // próxima revisión = fecha del siguiente evento del guion
  const upcoming = script[nextSim.step];
  if (inv.status !== "pagada") inv.nextReview = upcoming ? iso(addDays(inv.dueDate, Math.max(upcoming.day, step.day))) : undefined;
  const notifications = res.notify ? [{ id: uid(), at: new Date().toISOString(), text: res.notify, invoiceId, read: false }, ...state.notifications] : state.notifications;
  return {
    state: { ...state, invoices: state.invoices.map((x) => (x.id === invoiceId ? inv : x)), approvals, notifications, sims: state.sims.map((x) => (x.invoiceId === invoiceId ? nextSim : x)) },
    toasts: res.toast ? [res.toast] : [],
  };
}
