import { describe, it, expect } from "vitest";
import { validarRUT } from "../utils";

describe("validarRUT", () => {
  it("acepta RUT válido con DV numérico (76.543.210-3)", () => {
    expect(validarRUT("76.543.210-3")).toBe(true);
  });

  it("acepta RUT válido 11.111.111-1", () => {
    expect(validarRUT("11.111.111-1")).toBe(true);
  });

  it("acepta RUT válido con DV K (1.000.005-K)", () => {
    expect(validarRUT("1.000.005-K")).toBe(true);
  });

  it("acepta RUT válido sin puntos (76543210-3)", () => {
    expect(validarRUT("76543210-3")).toBe(true);
  });

  it("acepta DV k minúscula cuando el DV correcto es K", () => {
    expect(validarRUT("1.000.005-k")).toBe(true);
  });

  it("rechaza RUT con DV incorrecto (76.543.210-K)", () => {
    expect(validarRUT("76.543.210-K")).toBe(false);
  });

  it("rechaza RUT con DV letra arbitraria (76.543.210-A)", () => {
    expect(validarRUT("76.543.210-A")).toBe(false);
  });

  it("rechaza formato roto sin guión (123-456)", () => {
    expect(validarRUT("123-456")).toBe(false);
  });

  it("rechaza string vacío", () => {
    expect(validarRUT("")).toBe(false);
  });

  it("rechaza RUT con letras en la parte numérica", () => {
    expect(validarRUT("AB.123.456-3")).toBe(false);
  });
});
