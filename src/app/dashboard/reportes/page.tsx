import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportesClient } from "./ReportesClient";

export const metadata = { title: "Reportes · Cleco" };

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Las pagadas se incluyen a propósito: sin ellas no existe tasa de
  // recuperación, que es el número que un jefe de cobranza reporta hacia arriba.
  const [{ data: rawFacturas }, { data: rawPagos }] = await Promise.all([
    supabase
      .from("facturas")
      .select("*, deudores(rut, razon_social, email_contacto, telefono_contacto, tipo, confiabilidad, giro, comuna, cargo, nombre_contacto, direccion)")
      .eq("profile_id", user.id),
    supabase
      .from("pagos")
      .select("factura_id, fecha, monto_bruto")
      .eq("profile_id", user.id),
  ]);

  return <ReportesClient facturas={(rawFacturas ?? []) as any[]} pagos={(rawPagos ?? []) as any[]} />;
}
