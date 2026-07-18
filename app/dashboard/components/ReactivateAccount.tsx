"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = { professionalId: string };

export function ReactivateAccount({ professionalId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReactivate() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("professionals")
      .update({ is_active: true, deactivated_at: null })
      .eq("id", professionalId);
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-edge bg-surface p-8 text-center">
      <h1 className="text-lg font-semibold text-ink">Tu cuenta está desactivada</h1>
      <p className="mt-2 text-sm text-muted">
        Tu link de reservas no está disponible para tus clientes. Podés reactivarla cuando quieras.
      </p>
      <button
        onClick={handleReactivate}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-50"
      >
        {loading ? "Reactivando…" : "Reactivar mi cuenta"}
      </button>
      <button
        onClick={handleSignOut}
        className="mt-3 w-full rounded-lg border border-edge py-2.5 text-sm font-medium text-muted hover:bg-white/5 hover:text-ink"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
