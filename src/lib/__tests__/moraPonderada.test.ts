import { describe, it, expect } from "vitest";
import { moraPonderada } from "../utils";

describe("moraPonderada", () => {
  it("devuelve 0 cuando no hay filas", () => {
    expect(moraPonderada([])).toBe(0);
  });

  it("no divide por cero si todos los montos son 0", () => {
    expect(moraPonderada([{ monto: 0, moraDias: 120 }])).toBe(0);
  });

  it("con montos iguales coincide con la media simple", () => {
    expect(moraPonderada([
      { monto: 1_000_000, moraDias: 10 },
      { monto: 1_000_000, moraDias: 30 },
    ])).toBe(20);
  });

  it("la factura grande manda: el caso que la media simple reportaba mal", () => {
    const rows = [
      { monto: 50_000,    moraDias: 300 }, // chica y antiquísima
      { monto: 5_000_000, moraDias: 30  }, // grande y reciente
    ];
    // Media simple: (300 + 30) / 2 = 165 días → alarmista y falso.
    // Ponderada: (50.000*300 + 5.000.000*30) / 5.050.000 ≈ 33 días.
    expect(moraPonderada(rows)).toBe(33);
  });

  it("una sola factura devuelve su propia mora", () => {
    expect(moraPonderada([{ monto: 2_500_000, moraDias: 47 }])).toBe(47);
  });
});
