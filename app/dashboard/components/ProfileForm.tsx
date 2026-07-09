"use client";

import { createProfessionalProfile } from "@/lib/actions/professional";
import { useState } from "react";
import { useRouter } from "next/navigation";

const G = { green: "#1a6b4a", lightGreen: "#e8f2ed" };

type Props = { userEmail: string; userId: string };

export function ProfileForm({ userEmail, userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createProfessionalProfile({ name }, userEmail, userId);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "Error al guardar"); return; }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: G.green }}>Tornu</p>
        <h2 className="text-xl font-semibold text-zinc-900">Creá tu cuenta</h2>
        <p className="mt-1 text-sm text-zinc-500">Después, ya en tu panel, configurás tu primer servicio.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">Tu nombre</label>
          <input id="name" type="text" required placeholder=""
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-400" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: G.green }}>
          {loading ? "Guardando..." : "Crear mi cuenta →"}
        </button>
      </form>
    </div>
  );
}
