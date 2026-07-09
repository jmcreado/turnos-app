"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const G = { green: "#1a6b4a" };

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
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-zinc-900">Tu cuenta está desactivada</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Tu link de reservas no está disponible para tus clientes. Podés reactivarla cuando quieras.
      </p>
      <button
        onClick={handleReactivate}
        disabled={loading}
        className="mt-6 w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: G.green }}
      >
        {loading ? "Reactivando…" : "Reactivar mi cuenta"}
      </button>
      <button
        onClick={handleSignOut}
        className="mt-3 w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
