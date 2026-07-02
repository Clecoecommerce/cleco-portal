import type { Factura, TipoDeudor } from "@/types/database";

export type ActionTier =
  | "contactar_hoy"
  | "recontactar"
  | "escalar"
  | "monitorear"
  | "ceder";

export interface ScoreFactors {
  antiguedad:  { score: number; detail: string; weight: number };
  monto:       { score: number; detail: string; weight: number };
  historial:   { score: number; detail: string; weight: number };
  contactos:   { score: number; detail: string; weight: number };
  tipoDeudor:  { score: number; detail: string; weight: number };
}

export interface ScoredFactura extends Factura {
  deudores: {
    rut: string;
    razon_social: string;
    email_contacto?: string | null;
    telefono_contacto?: string | null;
    tipo?: TipoDeudor | null;
    confiabilidad?: number | null;
    giro?: string | null;
    comuna?: string | null;
    cargo?: string | null;
    nombre_contacto?: string | null;
    direccion?: string | null;
  } | null;
  score: number;
  moraDias: number;
  action: ActionTier;
  factors: ScoreFactors;
}

// Categoría real del deudor — de Claude Designer (Portal CLECO v2.0 - Standalone.html)
export const TIPO_LABELS: Record<TipoDeudor, string> = {
  persona_natural:   "Persona natural",
  pyme:               "PyME",
  inmobiliaria:        "Inmobiliaria",
  construccion:        "Construcción",
  institucion:         "Institución",
  gran_empresa:        "Gran empresa",
  organismo_publico:   "Organismo público",
};

const TIPO_SCORE: Record<TipoDeudor, number> = {
  persona_natural:  70,
  pyme:             55,
  inmobiliaria:     50,
  construccion:     58,
  institucion:      40,
  gran_empresa:     28,
  organismo_publico: 25,
};

export const ACTION_LABELS: Record<ActionTier, string> = {
  contactar_hoy: "Contactar hoy",
  recontactar:   "Recontactar",
  escalar:       "Escalar / Negociar",
  monitorear:    "Monitorear",
  ceder:         "Ceder / Condonar",
};

export const ACTION_DESCRIPTIONS: Record<ActionTier, string> = {
  contactar_hoy: "Alta probabilidad y urgencia. Llamar y enviar recordatorio formal hoy mismo.",
  recontactar:   "Seguimiento activo. Reiterar contacto y confirmar compromiso de pago.",
  escalar:       "Requiere conversación estructurada: acuerdo de pago, convenio o escalamiento.",
  monitorear:    "Bajo riesgo. Mantener en observación; aún sin acción manual requerida.",
  ceder:         "Monto marginal o riesgo nulo: el costo de cobranza supera el valor. Candidata a condonación o cierre.",
};

export const ACTION_RANGES: Record<ActionTier, string> = {
  contactar_hoy: "85–100",
  recontactar:   "65–84",
  escalar:       "40–64",
  monitorear:    "20–39",
  ceder:         "< 20",
};

// color: acento fuerte (dígito de score, punto indicador) · text: color del texto/label
// (en la mayoría de los tiers son el mismo tono; difieren levemente en "contactar_hoy" y "escalar",
// tal como está en el diseño original)
export const ACTION_COLORS: Record<ActionTier, { bg: string; color: string; text: string; border: string }> = {
  contactar_hoy: { bg: "#FBE9E9", color: "#DC2626", text: "#B23B3B", border: "#DC2626" },
  recontactar:   { bg: "#FBF3E1", color: "#B7791F", text: "#B7791F", border: "#B7791F" },
  escalar:       { bg: "#FBE9E9", color: "#991B1B", text: "#911A1A", border: "#991B1B" },
  monitorear:    { bg: "#E5F4EC", color: "#1F7A4D", text: "#1F7A4D", border: "#1F7A4D" },
  ceder:         { bg: "#F1F5F9", color: "#7F1D1D", text: "#7F1D1D", border: "#CBD5E1" },
};

// Color de cada barra del desglose según su propio valor (no el tier de la acción global)
export function factorBarColor(v: number): string {
  if (v >= 85) return "#DC2626";
  if (v >= 65) return "#B7791F";
  if (v >= 40) return "#991B1B";
  if (v >= 20) return "#1F7A4D";
  return "#7F1D1D";
}

function antiguedadScore(d: number): number {
  if (d < 0) {
    const dd = -d;
    if (dd > 20) return 8;
    if (dd > 7) return 18;
    return 30;
  }
  if (d === 0) return 45;
  if (d <= 15) return 50 + (d / 15) * 15;
  if (d <= 30) return 65 + ((d - 15) / 15) * 13;
  if (d <= 60) return 78 + ((d - 30) / 30) * 10;
  if (d <= 90) return 88 + ((d - 60) / 30) * 7;
  return Math.min(100, 95 + (d - 90) / 10);
}

function montoScore(t: number): number {
  return Math.min(100, Math.sqrt(t / 12_000_000) * 100);
}

function contactosScore(n: number): number {
  const tabla = [25, 45, 60, 72, 82, 90, 96];
  return tabla[Math.min(Math.max(n, 0), 6)];
}

export function getAction(score: number): ActionTier {
  if (score >= 85) return "contactar_hoy";
  if (score >= 65) return "recontactar";
  if (score >= 40) return "escalar";
  if (score >= 20) return "monitorear";
  return "ceder";
}

export function scoreFacturas(
  facturas: Array<Factura & { deudores: ScoredFactura["deudores"] }>
): ScoredFactura[] {
  const hoy = new Date();
  const activas = facturas.filter(f => f.estado !== "pagada");

  return activas.map(f => {
    const venc     = new Date(f.fecha_vencimiento);
    const moraDias = Math.floor((hoy.getTime() - venc.getTime()) / 86_400_000);

    const tipo          = f.deudores?.tipo ?? "pyme";
    const confiabilidad = f.deudores?.confiabilidad ?? 50;

    const antiguedadScoreV = antiguedadScore(moraDias);
    const montoScoreV      = montoScore(f.monto);
    const historialScoreV  = 100 - confiabilidad;
    const contactosScoreV  = contactosScore(f.contactos_intentados ?? 0);
    const tipoScoreV       = TIPO_SCORE[tipo];

    const score = Math.max(1, Math.min(100, Math.round(
      antiguedadScoreV * 0.30 +
      montoScoreV      * 0.25 +
      historialScoreV  * 0.20 +
      contactosScoreV  * 0.15 +
      tipoScoreV       * 0.10
    )));

    const montoFmt = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(f.monto);
    const cont = f.contactos_intentados ?? 0;

    const factors: ScoreFactors = {
      antiguedad: {
        score: Math.round(antiguedadScoreV), weight: 30,
        detail: moraDias > 0 ? `${moraDias} días vencida` : moraDias === 0 ? "Vence hoy" : `Vence en ${-moraDias} días`,
      },
      monto: { score: Math.round(montoScoreV), weight: 25, detail: montoFmt },
      historial: { score: Math.round(historialScoreV), weight: 20, detail: `${confiabilidad}/100 confiabilidad` },
      contactos: { score: Math.round(contactosScoreV), weight: 15, detail: `${cont} intento${cont === 1 ? "" : "s"}` },
      tipoDeudor: { score: Math.round(tipoScoreV), weight: 10, detail: TIPO_LABELS[tipo] },
    };

    return { ...f, score, moraDias, action: getAction(score), factors };
  }).sort((a, b) => b.score - a.score);
}
