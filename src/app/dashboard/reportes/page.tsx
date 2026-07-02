import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportesClient } from "./ReportesClient";

export const metadata = { title: "Reportes · Cleco" };

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawFacturas } = await supabase
    .from("facturas")
    .select("*, deudores(rut, razon_social, email_contacto, telefono_contacto, tipo, confiabilidad, giro, comuna, cargo, nombre_contacto, direccion)")
    .eq("profile_id", user.id)
    .neq("estado", "pagada");

  return <ReportesClient facturas={(rawFacturas ?? []) as any[]} />;
}
