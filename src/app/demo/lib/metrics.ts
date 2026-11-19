// Métricas derivadas del estado de la demo.
import type { DemoState, Invoice } from "./types";
import { daysBetween, today } from "./format";

export const pending = (i: Invoice) => i.amount - i.paid;
export const overdueDays = (i: Invoice) => Math.max(0, daysBetween(i.dueDate, today()));
export const isOpen = (i: Invoice) => i.status !== "pagada";

export const TRAMOS = [
  { id: "por_vencer", label: "Por vencer", color: "#2563EB", test: (d: number) => d <= 0 },
  { id: "1-30", label: "1 a 30 días", color: "#93C5FD", test: (d: number) => d >= 1 && d <= 30 },
  { id: "31-60", label: "31 a 60 días", color: "#FBBF24", test: (d: number) => d >= 31 && d <= 60 },
  { id: "61-90", label: "61 a 90 días", color: "#F97316", test: (d: number) => d >= 61 && d <= 90 },
  { id: "90+", label: "Más de 90 días", color: "#DC2626", test: (d: number) => d > 90 },
] as const;

export function metrics(s: DemoState) {
  const open = s.invoices.filter(isOpen);
  const total = open.reduce((a, i) => a + pending(i), 0);
  const overdue = open.filter((i) => overdueDays(i) > 0);
  const overdueAmt = overdue.reduce((a, i) => a + pending(i), 0);
  const tramos = TRAMOS.map((t) => {
    const list = open.filter((i) => t.test(overdueDays(i)));
    return { ...t, count: list.length, amount: list.reduce((a, i) => a + pending(i), 0) };
  });
  const paid = s.invoices.filter((i) => i.status === "pagada");
  const recovered = s.invoices.reduce((a, i) => a + i.paid, 0);
  const debtorsOpen = new Set(open.map((i) => i.debtorId)).size;
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const allEvents = s.invoices.flatMap((i) => i.events.map((e) => ({ ...e, invoice: i })));
  const weekEvents = allEvents.filter((e) => e.at >= weekAgo && e.at <= new Date(Date.now() + 86_400_000).toISOString());
  const count = (k: string[]) => weekEvents.filter((e) => k.includes(e.kind)).length;
  const unread = s.invoices.reduce((a, i) => a + i.messages.filter((m) => m.dir === "in" && !m.read).length, 0);
  const fb = s.invoices.filter((i) => i.feedback);
  const avgStars = fb.length ? fb.reduce((a, i) => a + i.feedback!.stars, 0) / fb.length : 0;
  return {
    open, total, overdue, overdueAmt, morosidad: total ? (overdueAmt / total) * 100 : 0, tramos, paid, recovered, debtorsOpen,
    allEvents: allEvents.sort((a, b) => b.at.localeCompare(a.at)), week: { correos: count(["correo", "sms"]), llamados: count(["llamado"]), acuerdos: count(["compromiso", "aprobacion"]), pagos: count(["pago"]) },
    unread, pendingApprovals: s.approvals.filter((a) => a.status === "pendiente").length, avgStars, fbCount: fb.length,
  };
}

// Series históricas de la cartera (ilustrativas; la última semana se ancla a los datos actuales)
export const MOROSIDAD_SERIE = [19.7, 19.4, 19.9, 19.1, 18.6, 18.8, 18.1, 17.5, 17.9, 17.0, 16.4, 16.8, 15.9, 15.2, 15.6, 14.7, 14.1, 13.8, 13.2, 12.9, 12.4, 12.0, 11.6, 11.3];
export const RECUPERADO_MES = [
  { label: "ene", v: 41.2, v2: 12.1 }, { label: "feb", v: 38.6, v2: 10.4 }, { label: "mar", v: 52.3, v2: 14.8 }, { label: "abr", v: 47.9, v2: 13.2 },
  { label: "may", v: 58.1, v2: 15.9 }, { label: "jun", v: 55.4, v2: 12.7 }, { label: "jul", v: 61.8, v2: 16.3 }, { label: "ago", v: 66.2, v2: 18.1 },
  { label: "sep", v: 63.5, v2: 17.4 }, { label: "oct", v: 70.9, v2: 19.8 },
];
