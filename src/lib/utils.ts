import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function calcularEstado(estado: string, fechaVencimiento: string): string {
  if (estado === "en_gestion" && new Date(fechaVencimiento) < new Date()) return "vencida";
  return estado;
}

export function validarRUT(rut: string): boolean {
  const limpio = rut.replace(/\./g, "").toUpperCase();
  const partes = limpio.split("-");
  if (partes.length !== 2) return false;
  const [numeros, dv] = partes;
  if (!numeros || !dv || numeros.length < 7 || numeros.length > 8) return false;
  if (!/^\d+$/.test(numeros)) return false;

  const pesos = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  for (let i = 0; i < numeros.length; i++) {
    suma += parseInt(numeros[numeros.length - 1 - i]) * pesos[i % 6];
  }
  const dvCalc = 11 - (suma % 11);
  const dvEsperado = dvCalc === 11 ? "0" : dvCalc === 10 ? "K" : String(dvCalc);
  return dv === dvEsperado;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatRUT(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}-${dv}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
