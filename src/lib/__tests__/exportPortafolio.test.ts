import { describe, it, expect, afterAll, vi } from "vitest";
import { construirPortafolio } from "../exportPortafolio";
import { scoreFacturas } from "../scoring";
import type { ScoredFactura } from "../scoring";

// Fecha fija: si el test dependiera de "hoy" real, los tramos de mora cambiarían
// de día en día y el test empezaría a fallar solo. scoreFacturas calcula la mora
// con su propio new Date(), así que hay que congelar el reloj y no basta con
// pasarle la fecha a construirPortafolio.
const HOY = new Date(2026, 7, 31); // 2026-08-31
vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(HOY);
afterAll(() => vi.useRealTimers());

/** Fecha ISO a N días antes de HOY (negativo = futuro) */
function hace(dias: number): string {
  const d = new Date(HOY.getTime() - dias * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function deudor(rut: string, razon: string, tipo: string) {
  return {
    rut, razon_social: razon, tipo,
    confiabilidad: 50, comuna: "Las Condes",
    email_contacto: "contacto@empresa.cl", telefono_contacto: "+56911111111",
  };
}

// 4 facturas: dos del mismo deudor (100 y 20 días de mora), una a 3 días sin
// fecha de emisión, y una que aún no vence.
const CARTERA = [
  { id: "1", deudor_id: "d1", numero: "1001", monto: 10_000_000, fecha_emision: hace(130), fecha_vencimiento: hace(100), estado: "pendiente",  contactos_intentados: 2, notas: null, deudores: deudor("76.543.210-3", "Constructora Norte S.A.", "construccion") },
  { id: "2", deudor_id: "d1", numero: "1002", monto:  2_000_000, fecha_emision: hace(50),  fecha_vencimiento: hace(20),  estado: "en_gestion", contactos_intentados: 0, notas: null, deudores: deudor("76.543.210-3", "Constructora Norte S.A.", "construccion") },
  { id: "3", deudor_id: "d2", numero: "1003", monto:  1_000_000, fecha_emision: null,      fecha_vencimiento: hace(3),   estado: "pendiente",  contactos_intentados: 1, notas: "sin emisión", deudores: deudor("77.123.456-9", "El Volcán Ltda.", "pyme") },
  { id: "4", deudor_id: "d3", numero: "1004", monto:    500_000, fecha_emision: hace(10),  fecha_vencimiento: hace(-15), estado: "en_gestion", contactos_intentados: 0, notas: null, deudores: deudor("96.874.030-K", "Los Robles SpA", "inmobiliaria") },
];

function portafolio(filas = CARTERA) {
  const scored = scoreFacturas(filas as never) as ScoredFactura[];
  return construirPortafolio(
    scored,
    { nombreEmpresa: "Cleco SpA", filtrosAplicados: "Ninguno" },
    HOY
  );
}

/** Valor de la columna B de la fila cuyo label está en la columna A */
function kpi(resumen: (string | number | null)[][], label: string) {
  return resumen.find((r) => r[0] === label)?.[1];
}

describe("resumen ejecutivo", () => {
  const { resumen } = portafolio();

  it("cuenta facturas y deudores distintos", () => {
    expect(kpi(resumen, "Facturas")).toBe(4);
    // dos facturas comparten RUT
    expect(kpi(resumen, "Deudores distintos")).toBe(3);
  });

  it("suma la cartera y separa lo vencido de lo por vencer", () => {
    expect(kpi(resumen, "Monto total CLP")).toBe(13_500_000);
    expect(kpi(resumen, "Facturas vencidas")).toBe(3);
    expect(kpi(resumen, "Monto vencido CLP")).toBe(13_000_000);
    expect(kpi(resumen, "Monto por vencer CLP")).toBe(500_000);
    expect(kpi(resumen, "% de la cartera vencido")).toBe(96.3);
    expect(kpi(resumen, "Ticket promedio CLP")).toBe(3_375_000);
  });

  it("pondera la mora por monto, no por número de facturas", () => {
    // (100·10M + 20·2M + 3·1M + 0·0,5M) / 13,5M = 77,26
    expect(kpi(resumen, "Mora promedio ponderada por monto (días)")).toBe(77);
    // El promedio simple sería (100+20+3+0)/4 = 30,75 → confirma que sí pondera
    expect(kpi(resumen, "Mora promedio ponderada por monto (días)")).not.toBe(31);
  });

  it("identifica la factura más vencida", () => {
    expect(kpi(resumen, "Factura más vencida (días)")).toBe(100);
    expect(kpi(resumen, "Factura más vencida (deudor)")).toBe("Constructora Norte S.A.");
  });

  it("declara la cobertura del cálculo de antigüedad", () => {
    // Sólo 3 de 4 traen fecha de emisión: (130·10M + 50·2M + 10·0,5M) / 12,5M = 112,4
    expect(kpi(resumen, "Días promedio desde emisión (ponderado por monto)")).toBe(112);
    expect(kpi(resumen, "Facturas con fecha de emisión")).toBe(3);
    expect(kpi(resumen, "Cobertura del cálculo (%)")).toBe(75);
  });
});

describe("aging", () => {
  const { aging } = portafolio();
  const tramo = (t: string) => aging.find((r) => r[0] === t);

  it("clasifica cada factura en un solo tramo", () => {
    expect(tramo("Por vencer")?.slice(1, 3)).toEqual([1, 500_000]);
    expect(tramo("1–7 días")?.slice(1, 3)).toEqual([1, 1_000_000]);
    expect(tramo("8–30 días")?.slice(1, 3)).toEqual([1, 2_000_000]);
    expect(tramo("31–60 días")?.slice(1, 3)).toEqual([0, 0]);
    expect(tramo("61–90 días")?.slice(1, 3)).toEqual([0, 0]);
    expect(tramo("+90 días")?.slice(1, 3)).toEqual([1, 10_000_000]);
  });

  it("cierra con un total que cuadra con la cartera", () => {
    expect(tramo("TOTAL")?.slice(1, 3)).toEqual([4, 13_500_000]);
  });
});

describe("concentración por deudor", () => {
  const { deudores } = portafolio();

  it("consolida las facturas de un mismo RUT y ordena por monto", () => {
    const primero = deudores[1];
    expect(primero[1]).toBe("Constructora Norte S.A.");
    expect(primero[3]).toBe(2);              // facturas
    expect(primero[4]).toBe(12_000_000);     // monto consolidado
    expect(primero[5]).toBe(88.9);           // % de la cartera
    expect(primero[6]).toBe(100);            // mora máxima
    expect(deudores.length - 1).toBe(3);     // 3 deudores, no 4 filas
  });
});

describe("detalle", () => {
  const { detalle } = portafolio();

  it("trae una fila por factura bajo la cabecera", () => {
    expect(detalle.length).toBe(5);
    expect(detalle[0][11]).toBe("Monto CLP");
  });

  it("exporta montos como número para que Excel pueda sumarlos", () => {
    const fila = detalle.find((r) => r[0] === "1001")!;
    expect(typeof fila[11]).toBe("number");
  });

  it("exporta fechas como Date y deja null si la emisión falta", () => {
    const conEmision = detalle.find((r) => r[0] === "1001")!;
    expect(conEmision[7]).toBeInstanceOf(Date);
    expect(conEmision[8]).toBeInstanceOf(Date);

    const sinEmision = detalle.find((r) => r[0] === "1003")!;
    expect(sinEmision[7]).toBeNull();
    expect(sinEmision[8]).toBeInstanceOf(Date);
  });
});

describe("cartera vacía", () => {
  it("no divide por cero", () => {
    const { resumen, aging, deudores } = portafolio([]);
    expect(kpi(resumen, "Monto total CLP")).toBe(0);
    expect(kpi(resumen, "% de la cartera vencido")).toBe(0);
    expect(kpi(resumen, "Ticket promedio CLP")).toBe(0);
    expect(kpi(resumen, "Cobertura del cálculo (%)")).toBe(0);
    expect(aging.find((r) => r[0] === "TOTAL")?.slice(1, 3)).toEqual([0, 0]);
    expect(deudores.length).toBe(1); // sólo cabecera
  });
});
