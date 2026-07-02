import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CargaClient } from "./CargaClient";

export const metadata = { title: "Carga inteligente · Cleco" };

export default async function CargaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return <CargaClient profileId={user.id} />;
}
