// Datos de ejemplo deterministas, relativos a la fecha de hoy.
import type { Approval, DemoState, Debtor, Invoice, InvoiceStatus, LogEvent, Message, Notification, PlanStep, Rules } from "./types";
import { addDays, daysBetween, iso, today, toDate } from "./format";

export const CLIENT = { name: "Medios Puerto Claro S.A.", since: "enero de 2025", user: "Paula Rojas", role: "Tesorería", email: "paula.rojas@puertoclaro.cl" };
export const EXEC = "Clemente I.";
export const AUTO = "Cleco automático";

export const DEFAULT_RULES: Rules = {
  tone: "cordial",
  channels: { correo: true, sms: true, llamado: true },
  preventiveDays: 7,
  followEveryDays: 7,
  callAfterEmails: 3,
  dicomAfterDays: 90,
  sendHours: "09:00 a 18:00",
  dicomNeedsApproval: true,
};

let s = 20261119;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

const DEBTORS: [string, string, string, string][] = [
  ["Viña Llanquihue S.A.", "76.957.002-0", "Felipe Martínez", "Finanzas"],
  ["Agencia Huelén SpA", "77.409.915-8", "Diego Vargas", "Gerencia"],
  ["Comercial Pehuén SpA", "77.439.423-0", "Ignacio Fuentes", "Finanzas"],
  ["Alimentos Llanquihue EIRL", "77.071.509-1", "Rodrigo Araya", "Administración"],
  ["Productora Pehuén S.A.", "76.106.611-3", "Gonzalo Soto", "Gerencia"],
  ["Automotora Los Maitenes EIRL", "77.224.185-2", "Fernanda Cáceres", "Pago a proveedores"],
  ["Servicios Nahuel Ltda.", "76.534.700-9", "Camila Gutiérrez", "Tesorería"],
  ["Transportes Ventisquero SpA", "77.913.177-7", "Daniela Reyes", "Contabilidad"],
  ["Laboratorio Lomas del Sol S.A.", "77.053.590-5", "Rodrigo Silva", "Finanzas"],
  ["Constructora Lago Ranco SpA", "76.880.214-6", "Andrés Molina", "Administración"],
  ["Importadora Tierra Austral SpA", "76.174.075-K", "Catalina Castillo", "Contabilidad"],
  ["Centro Médico Maño SpA", "76.554.281-4", "Valentina Rojas", "Pago a proveedores"],
  ["Colegio Nahuel Ltda.", "76.381.902-1", "Patricio León", "Administración"],
  ["Turismo Peumo Ltda.", "77.612.044-3", "Sofía Herrera", "Finanzas"],
  ["Consultora Maño SpA", "77.802.553-8", "Matías Pizarro", "Gerencia"],
  ["Muebles Los Maitenes S.A.", "76.290.117-5", "Javiera Núñez", "Tesorería"],
];

const LINES = ["Venta de ejemplares", "Publicidad impresa", "Publicidad digital", "Suscripciones corporativas"];

const slug = (n: string) => n.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "").slice(0, 14);

export function buildPlan(issueDate: string, dueDate: string, rules: Rules): PlanStep[] {
  const f = rules.followEveryDays;
  const issueRel = -daysBetween(issueDate, dueDate);
  const steps: Omit<PlanStep, "state">[] = [
    { id: "envio", day: issueRel, channel: "correo", title: "Factura enviada con datos de pago", detail: "PDF de la factura, datos de transferencia y contacto directo." },
    { id: "preventivo", day: -rules.preventiveDays, channel: "correo", title: "Recordatorio preventivo", detail: `${rules.preventiveDays} días antes del vencimiento, en tono ${rules.tone}.` },
  ];
  if (rules.channels.sms) steps.push({ id: "sms", day: -1, channel: "sms", title: "SMS: vence mañana", detail: "Mensaje corto al contacto de pagos." });
  steps.push({ id: "vence", day: 0, channel: "correo", title: "Aviso de vencimiento", detail: "Recordamos el monto y pedimos fecha de pago." });
  for (let k = 1; k <= rules.callAfterEmails - 1; k++)
    steps.push({ id: "seg" + k, day: f * k, channel: "correo", title: `Seguimiento ${k}`, detail: "Uno por semana. Si da fecha de pago, no insistimos antes." });
  if (rules.channels.llamado)
    steps.push({ id: "llamado", day: f * rules.callAfterEmails, channel: "llamado", title: "Llamado a pagos", detail: `Tras ${rules.callAfterEmails} correos sin respuesta. Sumamos a tu ejecutivo de ventas.` });
  steps.push({ id: "formal", day: 60, channel: "correo", title: "Aviso formal", detail: "Informamos que la deuda podría publicarse." });
  steps.push({ id: "dicom", day: rules.dicomAfterDays, channel: "sistema", title: "Publicación en DICOM", detail: "Solo si tú la autorizas.", needsApproval: true });
  return steps.sort((a, b) => a.day - b.day).map((p) => ({ ...p, state: "pendiente" as const }));
}

// Marca estados del plan según la fecha de referencia y el estado de la factura
export function planStates(inv: Invoice, ref = today()): PlanStep[] {
  const rel = daysBetween(inv.dueDate, ref);
  const closed = inv.status === "pagada";
  const paused = inv.status === "comprometida" || inv.status === "plan_pago";
  let currentSet = false;
  return inv.plan.map((p) => {
    if (p.day <= rel) return { ...p, state: "hecho" as const };
    if (closed) return { ...p, state: "omitido" as const };
    if (!currentSet) { currentSet = true; return { ...p, state: paused ? "pendiente" as const : "actual" as const }; }
    return { ...p, state: "pendiente" as const };
  });
}

const at = (date: string | Date, h = 10, m = 0) => {
  const d = typeof date === "string" ? toDate(date) : new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export function stepMessage(step: PlanStep, inv: Invoice, debtor: Debtor, when: string, tone: Rules["tone"]): Message {
  const amount = "$" + inv.amount.toLocaleString("es-CL");
  const first = debtor.contact.split(" ")[0];
  const hi = tone === "cordial" ? `Hola ${first}, ¿cómo estás?` : `Estimado/a ${first}:`;
  const bodies: Record<string, [string, string]> = {
    envio: [`Factura N° ${inv.folio} de ${CLIENT.name}`, `${hi}\n\nTe enviamos la factura N° ${inv.folio} por ${amount}, con vencimiento el ${inv.dueDate.split("-").reverse().join("-")}. Adjuntamos el PDF y los datos de transferencia.\n\nCualquier duda, respondes este mismo correo.`],
    preventivo: [`Recordatorio: factura N° ${inv.folio} vence pronto`, `${hi}\n\nTe recordamos que la factura N° ${inv.folio} por ${amount} vence en unos días. Si ya está en la nómina de pagos, no necesitas hacer nada.\n\n¿Nos confirmas la fecha de pago?`],
    sms: ["", `${CLIENT.name}: la factura N° ${inv.folio} por ${amount} vence mañana. Datos de pago en tu correo. Cleco`],
    vence: [`Factura N° ${inv.folio} vence hoy`, `${hi}\n\nHoy vence la factura N° ${inv.folio} por ${amount}. ¿Nos puedes indicar la fecha en que quedará pagada?`],
    formal: [`Aviso formal: factura N° ${inv.folio}`, `${hi}\n\nLa factura N° ${inv.folio} por ${amount} lleva más de 60 días vencida. Te informamos que, de no regularizarse, ${CLIENT.name} podría autorizar su publicación en DICOM. Queremos evitarlo: respóndenos y buscamos una solución.`],
  };
  if (step.channel === "llamado")
    return { id: "m" + step.id + inv.id, at: when, dir: "note", channel: "llamado", from: EXEC, body: `Llamado a ${debtor.contact} (${debtor.role}). ${pick(["No contesta; se deja mensaje de voz.", "Dice que la factura entra en la próxima nómina.", "Pide reenviar la factura a su correo."])}` };
  const [subject, body] = bodies[step.id] ?? [`Seguimiento factura N° ${inv.folio}`, `${hi}\n\nSeguimos atentos a la factura N° ${inv.folio} por ${amount}. ¿Tienes una fecha estimada de pago?`];
  return { id: "m" + step.id + inv.id, at: when, dir: "out", channel: step.channel === "sms" ? "sms" : "correo", from: step.id === "envio" || step.channel === "sms" || step.id === "preventivo" ? AUTO : EXEC, subject: subject || undefined, body };
}

export function stepEvent(step: PlanStep, when: string, debtor: Debtor): LogEvent {
  const kind = step.channel === "sms" ? "sms" : step.channel === "llamado" ? "llamado" : "correo";
  return { id: "e" + step.id + Math.round(rnd() * 1e6), at: when, kind, by: step.channel === "llamado" || step.id.startsWith("seg") ? EXEC : AUTO, text: `${step.title} a ${debtor.contact}.` };
}

const REPLIES_OK = ["Gracias, la factura está programada para el pago del viernes.", "Recibido. Queda en la nómina de la próxima semana.", "Perfecto, la pagamos el día del vencimiento."];
const REPLIES_DOC = ["¿Nos pueden reenviar la orden de compra asociada? Sin eso no la podemos ingresar.", "No encontramos la factura en nuestro sistema, ¿la pueden reenviar en PDF?"];

export function seed(): DemoState {
  s = 20261119;
  const t = today();
  const debtors: Debtor[] = DEBTORS.map(([name, rut, contact, role]) => ({
    id: slug(name), name, rut, contact, role,
    email: contact.split(" ")[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g, "") + "@" + slug(name).slice(0, 10) + ".cl",
    phone: "+56 9 " + Math.floor(5000 + rnd() * 4999) + " " + Math.floor(1000 + rnd() * 8999),
  }));
  const rules = DEFAULT_RULES;
  const invoices: Invoice[] = [];
  // perfiles: [días desde vencimiento (+ = vencida), estado]
  const profiles: [number, InvoiceStatus][] = [
    [-24, "por_vencer"], [-18, "por_vencer"], [-12, "por_vencer"], [-9, "por_vencer"], [-6, "por_vencer"], [-4, "por_vencer"], [-2, "por_vencer"], [-1, "por_vencer"],
    [-20, "por_vencer"], [-15, "por_vencer"], [-27, "por_vencer"], [-11, "por_vencer"], [-3, "comprometida"], [-5, "comprometida"],
    [3, "vencida"], [6, "comprometida"], [9, "vencida"], [12, "vencida"], [16, "comprometida"], [21, "vencida"], [25, "vencida"], [28, "plan_pago"],
    [34, "vencida"], [41, "plan_pago"], [47, "vencida"], [54, "comprometida"], [63, "vencida"], [71, "vencida"], [88, "plan_pago"], [96, "aviso_dicom"],
    [118, "aviso_dicom"], [136, "plan_pago"], [152, "vencida"],
    [-30, "pagada"], [-8, "pagada"], [-2, "pagada"], [4, "pagada"], [10, "pagada"], [15, "pagada"], [22, "pagada"], [33, "pagada"],
  ];
  profiles.forEach(([rel, status], i) => {
    const d = debtors[i % debtors.length];
    const dueDate = iso(addDays(t, -rel));
    const issueDate = iso(addDays(dueDate, -30));
    // las facturas al día pesan más en la cartera, como en una cartera sana (~11% vencido)
    const scale = rel <= 0 ? 14 : rel > 60 ? 0.5 : 1;
    const amount = Math.round(((150_000 + rnd() * rnd() * 6_800_000) * scale) / 10) * 10;
    const inv: Invoice = {
      id: "f" + (1051800 + i * 137), folio: String(1051800 + i * 137), debtorId: d.id, amount, paid: 0, issueDate, dueDate, status,
      type: rnd() < 0.25 ? "factoring" : "directa", line: pick(LINES), events: [], messages: [], plan: buildPlan(issueDate, dueDate, rules),
    };
    // historial: pasos del plan ya ejecutados
    const lastDay = status === "pagada" ? Math.min(rel, i % 4) : rel;
    inv.plan.filter((p) => p.day <= lastDay && p.day <= daysBetween(dueDate, t)).forEach((p, k) => {
      const when = at(addDays(dueDate, p.day), 9 + (k % 3), 10 + k * 7);
      inv.messages.push(stepMessage(p, inv, d, when, rules.tone));
      inv.events.push(stepEvent(p, when, d));
    });
    if (status === "comprometida" || status === "plan_pago") {
      const when = at(addDays(t, -1 - (i % 3)), 15, 22);
      const promise = iso(addDays(t, 2 + (i % 9)));
      inv.promiseDate = promise;
      inv.messages.push({ id: "r" + i, at: when, dir: "in", channel: "correo", from: d.contact, body: status === "plan_pago" ? "Estamos con problemas de caja. ¿Podemos pagar en 3 cuotas mensuales?" : pick(REPLIES_OK), sentiment: status === "plan_pago" ? "neutral" : "positivo", read: true });
      inv.events.push({ id: "c" + i, at: when, kind: status === "plan_pago" ? "aprobacion" : "compromiso", by: d.contact, text: status === "plan_pago" ? `${CLIENT.name} aprobó el plan de pago en 3 cuotas.` : `Fecha de pago comprometida para el ${promise.split("-").reverse().slice(0, 2).join("/")}.` });
      if (status === "plan_pago") inv.paid = Math.round(inv.amount / 3);
    }
    if (status === "aviso_dicom") inv.events.push({ id: "d" + i, at: at(addDays(t, -6), 11), kind: "aprobacion", by: CLIENT.user, text: "Autorizó el aviso formal de publicación en DICOM." });
    if (status === "vencida" && rel > 20 && i % 2) {
      const when = at(addDays(t, -2), 12, 40);
      inv.messages.push({ id: "q" + i, at: when, dir: "in", channel: "correo", from: d.contact, body: pick(REPLIES_DOC), sentiment: "neutral", read: i % 4 === 1 });
      inv.events.push({ id: "q" + i, at: when, kind: "respuesta", by: d.contact, text: "Pidió reenviar documentos." });
    }
    if (status === "pagada") {
      inv.paid = amount;
      const when = at(addDays(dueDate, Math.max(-3, Math.min(rel, 0) + (i % 4))), 16, 5);
      inv.events.push({ id: "p" + i, at: when, kind: "pago", by: AUTO, text: `Pago recibido por $${amount.toLocaleString("es-CL")}.` });
      if (i % 2) inv.feedback = { stars: 4 + (i % 3 === 0 ? 1 : 0), comment: pick(["Muy claros los recordatorios, gracias.", "Atención rápida cuando pedimos la OC.", "Buena disposición para coordinar el pago."]), at: when };
    }
    inv.nextReview = status === "pagada" ? undefined : iso(addDays(t, 1 + (i % 6)));
    inv.events.sort((a, b) => b.at.localeCompare(a.at));
    inv.messages.sort((a, b) => a.at.localeCompare(b.at));
    invoices.push(inv);
  });

  const byStatus = (st: InvoiceStatus, n = 0) => invoices.filter((x) => x.status === st)[n];
  const dn = (inv: Invoice) => debtors.find((d) => d.id === inv.debtorId)!.name;
  const a1 = byStatus("vencida", 6), a2 = byStatus("vencida", 9), a3 = byStatus("vencida", 3);
  const approvals: Approval[] = [
    { id: "ap1", invoiceId: a1.id, kind: "plan_pago", title: "Plan de pago en 3 cuotas", body: `${dn(a1)} propone pagar la factura N° ${a1.folio} en 3 cuotas mensuales de $${Math.round(a1.amount / 3).toLocaleString("es-CL")}. Hasta hoy respondió todos los correos.`, proposedBy: EXEC, at: at(addDays(t, -1), 17), status: "pendiente" },
    { id: "ap2", invoiceId: a2.id, kind: "aviso_dicom", title: "Aviso de publicación en DICOM", body: `${dn(a2)} no responde hace 3 semanas (4 correos y 2 llamados). Proponemos enviar el aviso formal antes de publicar.`, proposedBy: EXEC, at: at(addDays(t, -2), 11), status: "pendiente" },
    { id: "ap3", invoiceId: a3.id, kind: "nueva_fecha", title: "Nueva fecha de pago", body: `${dn(a3)} pide mover el pago de la factura N° ${a3.folio} al ${addDays(t, 9).getDate()} de este mes por cierre contable.`, proposedBy: EXEC, at: at(addDays(t, -1), 9, 30), status: "pendiente" },
  ];
  const notifications: Notification[] = [
    { id: "n1", at: at(t, 9, 5), text: "Cleco cargó el Excel de esta semana: 6 facturas nuevas.", read: false },
    { id: "n2", at: approvals[0].at, text: "Tienes 3 decisiones pendientes.", read: false },
  ];
  return { version: 4, invoices, debtors, approvals, notifications, sims: [], speed: 1, rules };
}
