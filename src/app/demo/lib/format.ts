const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export const millones = (n: number) => {
  const m = n / 1_000_000;
  return "$" + (m >= 100 ? Math.round(m).toLocaleString("es-CL") : m.toFixed(1).replace(".", ",")) + " M";
};

export const pct = (n: number, d = 1) => n.toFixed(d).replace(".", ",") + "%";

export const toDate = (s: string) => (s.length === 10 ? new Date(s + "T12:00:00") : new Date(s));

export const iso = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export const addDays = (s: string | Date, n: number) => {
  const d = typeof s === "string" ? toDate(s) : new Date(s);
  d.setDate(d.getDate() + n);
  return d;
};

export const today = () => iso(new Date());

export const fecha = (s: string) => {
  const d = toDate(s);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fechaCorta = (s: string) => {
  const d = toDate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fechaHora = (s: string) => {
  const d = toDate(s);
  return `${fecha(s)}, ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const daysBetween = (a: string, b: string) =>
  Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);

export const uid = () => Math.random().toString(36).slice(2, 10);

export const rutFmt = (rut: string) => {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return rut;
  const body = clean.slice(0, -1), dv = clean.slice(-1).toUpperCase();
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
};
