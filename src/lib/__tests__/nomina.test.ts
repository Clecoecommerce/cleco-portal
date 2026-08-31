import { describe, it, expect } from "vitest";
import { validarRUT } from "../utils";
import {
  mapearCabeceras,
  normalizarEstado,
  normalizarFecha,
  normalizarMonto,
  normalizarRut,
  parsearNomina,
  plantillaNominaCsv,
} from "../nomina";

function archivoCsv(contenido: string, nombre = "nomina.csv"): File {
  return new File([contenido], nombre, { type: "text/csv" });
}

describe("normalizarFecha", () => {
  it("interpreta dd/mm/aaaa como día primero (formato chileno)", () => {
    expect(normalizarFecha("03/04/2026")).toBe("2026-04-03");
  });

  it("completa el año de dos dígitos", () => {
    expect(normalizarFecha("5-1-26")).toBe("2026-01-05");
  });

  it("acepta ISO con mes y día de un dígito", () => {
    expect(normalizarFecha("2026-6-7")).toBe("2026-06-07");
  });

  it("convierte seriales de Excel", () => {
    expect(normalizarFecha(45809)).toBe("2025-06-01");
  });

  it("descarta un mes fuera de rango en vez de inventar una fecha", () => {
    expect(normalizarFecha("03/13/2026")).toBe("");
  });

  it("devuelve vacío si no hay dato", () => {
    expect(normalizarFecha("")).toBe("");
    expect(normalizarFecha(null)).toBe("");
  });
});

describe("normalizarMonto", () => {
  it("limpia el formato chileno con signo peso", () => {
    expect(normalizarMonto("$ 4.200.000")).toBe("4200000");
  });

  it("trata la coma final como decimal y redondea", () => {
    expect(normalizarMonto("1234,50")).toBe("1235");
  });

  it("distingue miles de decimales en formato chileno", () => {
    expect(normalizarMonto("1.234.567,89")).toBe("1234568");
  });

  it("distingue miles de decimales en formato inglés", () => {
    expect(normalizarMonto("1,234,567.89")).toBe("1234568");
  });

  it("trata la coma como separador de miles cuando no deja decimales", () => {
    expect(normalizarMonto("1,234,567")).toBe("1234567");
  });

  it("devuelve vacío ante texto no numérico", () => {
    expect(normalizarMonto("N/A")).toBe("");
  });
});

describe("normalizarRut", () => {
  it("formatea un RUT sin puntos ni guión", () => {
    expect(normalizarRut("96874030K")).toBe("96.874.030-K");
  });

  it("respeta un RUT ya formateado", () => {
    expect(normalizarRut("77.123.456-9")).toBe("77.123.456-9");
  });
});

describe("normalizarEstado", () => {
  it("mapea sinónimos de pagada", () => {
    expect(normalizarEstado("PAGADA")).toBe("pagada");
    expect(normalizarEstado("Cancelado")).toBe("pagada");
  });

  it("mapea sinónimos de pendiente", () => {
    expect(normalizarEstado("Pendiente")).toBe("pendiente");
    expect(normalizarEstado("Por cobrar")).toBe("pendiente");
  });

  it("cae en en_gestion cuando la columna viene vacía", () => {
    expect(normalizarEstado("")).toBe("en_gestion");
  });
});

describe("mapearCabeceras", () => {
  it("reconoce los nombres que usan los ERP, con tildes y símbolos", () => {
    const { faltantes, noReconocidas } = mapearCabeceras([
      "RUT Cliente", "Razón Social", "Correo", "Fono",
      "N° Factura", "Fecha Emisión", "Fecha Vencimiento", "Monto Total", "Estado",
    ]);
    expect(faltantes).toEqual([]);
    expect(noReconocidas).toEqual([]);
  });

  it("reporta las columnas obligatorias que faltan", () => {
    const { faltantes } = mapearCabeceras([
      "Cliente", "Folio", "Emisión", "Vencimiento", "Total", "Email", "Teléfono",
    ]);
    expect(faltantes).toEqual(["rut_deudor"]);
  });

  it("no exige estado_pago", () => {
    const { faltantes } = mapearCabeceras([
      "Rut", "Razón Social", "Email", "Teléfono",
      "Folio", "Emisión", "Vencimiento", "Monto",
    ]);
    expect(faltantes).toEqual([]);
  });
});

describe("parsearNomina", () => {
  it("lee un CSV con punto y coma y normaliza cada campo", async () => {
    const csv = [
      "RUT Cliente;Razón Social;Correo;Fono;N° Factura;Fecha Emisión;Fecha Vencimiento;Monto Total;Estado",
      "76543210-3;Constructora Norte S.A.;pagos@cn.cl;+56912345678;15734399;01/06/2026;01/07/2026;$ 4.200.000;Pendiente",
    ].join("\n");

    const { filas, faltantes, totalFilas } = await parsearNomina(archivoCsv(csv));

    expect(faltantes).toEqual([]);
    expect(totalFilas).toBe(1);
    expect(filas[0]).toMatchObject({
      folio: "15734399",
      rutDeudor: "76.543.210-3",
      razonSocialDeudor: "Constructora Norte S.A.",
      monto: "4200000",
      fechaEmision: "2026-06-01",
      fechaVencimiento: "2026-07-01",
      estadoPago: "pendiente",
      fila: 1,
    });
  });

  it("omite las filas vacías que Excel deja al final", async () => {
    const csv = [
      "rut_deudor,razon_social,email_contacto,telefono_contacto,numero_factura,fecha_emision,fecha_vencimiento,monto_total",
      "76.543.210-3,Norte S.A.,a@b.cl,+56911111111,1,2026-06-01,2026-07-01,1000",
      ",,,,,,,",
      ",,,,,,,",
    ].join("\n");

    const { totalFilas } = await parsearNomina(archivoCsv(csv));
    expect(totalFilas).toBe(1);
  });

  it("no devuelve filas si falta una columna obligatoria", async () => {
    const csv = "razon_social,monto_total\nNorte S.A.,1000";
    const { filas, faltantes } = await parsearNomina(archivoCsv(csv));
    expect(filas).toEqual([]);
    expect(faltantes).toContain("rut_deudor");
  });
});

// Regresión: la plantilla se subió una vez con RUT de dígito verificador
// inválido. El cliente la descarga y la sube tal cual para probar, así que
// tiene que pasar la misma validación que cualquier factura real.
describe("plantillaNominaCsv", () => {
  it("se parsea sin columnas faltantes", async () => {
    const { filas, faltantes } = await parsearNomina(
      archivoCsv(plantillaNominaCsv(), "plantilla.csv")
    );
    expect(faltantes).toEqual([]);
    expect(filas.length).toBeGreaterThan(0);
  });

  it("trae RUT de ejemplo que pasan validarRUT", async () => {
    const { filas } = await parsearNomina(archivoCsv(plantillaNominaCsv(), "plantilla.csv"));
    for (const fila of filas) {
      expect(validarRUT(fila.rutDeudor), `RUT de ejemplo inválido: ${fila.rutDeudor}`).toBe(true);
    }
  });

  it("trae ejemplos completos: email, teléfono, montos y fechas coherentes", async () => {
    const { filas } = await parsearNomina(archivoCsv(plantillaNominaCsv(), "plantilla.csv"));
    for (const fila of filas) {
      expect(fila.folio).not.toBe("");
      expect(fila.emailContacto).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(fila.telefonoContacto).not.toBe("");
      expect(Number(fila.monto)).toBeGreaterThan(0);
      expect(fila.fechaEmision).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(fila.fechaVencimiento >= fila.fechaEmision).toBe(true);
    }
  });
});
