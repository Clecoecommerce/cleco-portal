import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PanoramaClient } from "./PanoramaClient";
import type { FacturaWithDeudor } from "@/types/database";

export default async function PanoramaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: rawProfile }, { data: rawFacturas }, { data: rawPagos }] = await Promise.all([
    supabase.from("profiles").select("razon_social, rut, ejecutivo_nombre, ejecutivo_email").eq("id", user.id).single(),
    supabase.from("facturas").select("*, deudores(rut, razon_social)").eq("profile_id", user.id).order("fecha_vencimiento", { ascending: true }),
    supabase.from("pagos").select("monto_bruto, honorarios_pct, fecha").eq("profile_id", user.id),
  ]);

  const facturas = (rawFacturas ?? []) as FacturaWithDeudor[];
  const pagos    = rawPagos ?? [];
  const profile  = rawProfile as { razon_social: string; rut: string; ejecutivo_nombre: string | null; ejecutivo_email: string | null } | null;

  return <PanoramaClient facturas={facturas} pagos={pagos} profile={profile} />;
}
