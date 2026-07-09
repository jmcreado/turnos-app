import { createClient } from "@/lib/supabase/server";
import { getProfessionalForUser } from "@/lib/professional";
import { redirect } from "next/navigation";
import { AccountForm } from "./AccountForm";

const G = { cream: "#f7f5f0" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const professional = await getProfessionalForUser(supabase, user.id, user.email ?? "");
  if (!professional) redirect("/dashboard");

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: G.cream }}>
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-700">← Volver al dashboard</a>
        </div>
        <AccountForm professional={professional} />
      </div>
    </div>
  );
}
