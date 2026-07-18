"use client";

import { createProfessionalProfile } from "@/lib/actions/professional";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="mx-auto max-w-xl rounded-2xl border border-edge bg-surface p-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-accent">Tornu</p>
        <h2 className="text-xl font-semibold text-ink">Creá tu cuenta</h2>
        <p className="mt-1 text-sm text-muted">Después, ya en tu panel, configurás tu primer servicio.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">Tu nombre</label>
          <input id="name" type="text" required placeholder=""
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-edge bg-white/5 px-4 py-2.5 text-ink focus:border-accent/40 focus:outline-none" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-50">
          {loading ? "Guardando..." : "Crear mi cuenta →"}
        </button>
      </form>
    </div>
  );
}
