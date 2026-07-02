import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BandejaClient } from "./BandejaClient";

export default async function BandejaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: rawFacturas }, { data: profile }] = await Promise.all([
    supabase
      .from("facturas")
      .select("*, deudores(rut, razon_social, email_contacto, telefono_contacto, tipo, confiabilidad, giro, comuna, cargo, nombre_contacto, direccion)")
      .eq("profile_id", user.id)
      .neq("estado", "pagada")
      .order("fecha_vencimiento", { ascending: true }),
    supabase.from("profiles").select("razon_social").eq("id", user.id).single(),
  ]);

  return (
    <BandejaClient
      facturas={(rawFacturas ?? []) as any[]}
      profileName={profile?.razon_social ?? "Equipo de Cobranza"}
    />
  );
}
