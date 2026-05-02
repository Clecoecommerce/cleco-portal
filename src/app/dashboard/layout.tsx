import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/TopNav";
import type { Profile } from "@/types/database";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as Profile | null;
  if (!profile) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <TopNav profile={profile} />
      <main className="max-w-[1240px] mx-auto px-4 sm:px-8 py-7 pb-12">
        {children}
      </main>
    </div>
  );
}
