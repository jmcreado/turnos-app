import { createClient } from "@/lib/supabase/server";
import { getProfessionalForUser } from "@/lib/professional";
import { redirect } from "next/navigation";
import { AccountForm } from "./AccountForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const professional = await getProfessionalForUser(supabase, user.id, user.email ?? "");
  if (!professional) redirect("/dashboard");

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-muted hover:text-ink">← Volver al dashboard</a>
        </div>
        <AccountForm professional={professional} />
      </div>
    </div>
  );
}
