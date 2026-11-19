// Modelo de datos de la maqueta (todo ficticio, vive en el navegador).

export type Channel = "correo" | "sms" | "llamado" | "portal" | "sistema";
export type Sentiment = "positivo" | "neutral" | "molesto";

export type InvoiceStatus =
  | "por_vencer"
  | "vencida"
  | "comprometida"
  | "plan_pago"
  | "aviso_dicom"
  | "pagada"
  | "pausada";

export type Scenario = "paga_a_tiempo" | "pide_documento" | "plan_pago";

export interface Debtor {
  id: string;
  name: string;
  rut: string;
  contact: string;
  role: string;
  email: string;
  phone: string;
}

export interface LogEvent {
  id: string;
  at: string; // ISO
  kind: "correo" | "sms" | "llamado" | "respuesta" | "pago" | "aprobacion" | "carga" | "sistema" | "compromiso" | "feedback";
  by: string;
  text: string;
}

export interface Message {
  id: string;
  at: string;
  dir: "out" | "in" | "note";
  channel: Channel;
  from: string;
  subject?: string;
  body: string;
  sentiment?: Sentiment;
  read?: boolean;
}

export interface PlanStep {
  id: string;
  day: number; // días relativos al vencimiento (negativo = antes)
  channel: Channel;
  title: string;
  detail: string;
  needsApproval?: boolean;
  state: "hecho" | "actual" | "pendiente" | "omitido";
}

export interface Feedback {
  stars: number;
  comment: string;
  at: string;
}

export interface Invoice {
  id: string;
  folio: string;
  debtorId: string;
  amount: number;
  paid: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;
  status: InvoiceStatus;
  type: "directa" | "factoring";
  line: string;
  nextReview?: string;
  promiseDate?: string;
  events: LogEvent[];
  messages: Message[];
  plan: PlanStep[];
  feedback?: Feedback;
  isNew?: boolean;
  createdAt?: string;
}

export interface Approval {
  id: string;
  invoiceId: string;
  kind: "plan_pago" | "aviso_dicom" | "nueva_fecha" | "judicial";
  title: string;
  body: string;
  proposedBy: string;
  at: string;
  status: "pendiente" | "aprobada" | "rechazada";
}

export interface Notification {
  id: string;
  at: string;
  text: string;
  invoiceId?: string;
  read: boolean;
}

export interface Simulation {
  invoiceId: string;
  scenario: Scenario;
  step: number;
  playing: boolean;
  waiting?: string; // id de aprobación que bloquea
  day: number; // día simulado relativo al vencimiento
  rejected?: boolean;
  done?: boolean;
}

export interface Rules {
  tone: "cordial" | "directo";
  channels: { correo: boolean; sms: boolean; llamado: boolean };
  preventiveDays: number;
  followEveryDays: number;
  callAfterEmails: number;
  dicomAfterDays: number;
  sendHours: string;
  dicomNeedsApproval: true;
}

export interface Toast {
  id: string;
  text: string;
  sub?: string;
  kind: "ok" | "info" | "warn";
}

export interface DemoState {
  version: number;
  invoices: Invoice[];
  debtors: Debtor[];
  approvals: Approval[];
  notifications: Notification[];
  sims: Simulation[];
  speed: 1 | 2 | 4;
  rules: Rules;
}
