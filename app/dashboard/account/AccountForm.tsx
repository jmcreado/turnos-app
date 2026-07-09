"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hardDeleteAccount } from "@/lib/actions/professional";
import type { Professional } from "@/types/database";

const G = { green: "#1a6b4a" };

type Props = { professional: Professional };

export function AccountForm({ professional }: Props) {
  const router = useRouter();

  const [name, setName] = useState(professional.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signingOut, setSigningOut] = useState(false);

  const [confirmText, setConfirmText] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const DELETE_PHRASE = "ELIMINAR";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("professionals")
      .update({ name: name.trim() })
      .eq("id", professional.id);
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    setSaved(true);
    router.refresh();
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDeactivate() {
    if (confirmText.trim().toLowerCase() !== professional.email.toLowerCase()) return;
    setDeactivating(true);
    const supabase = createClient();
    await supabase
      .from("professionals")
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq("id", professional.id);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleHardDelete() {
    if (deleteConfirmText.trim() !== DELETE_PHRASE) return;
    setDeleteError(null);
    setDeleting(true);
    const result = await hardDeleteAccount(professional.id);
    if (!result.ok) {
      setDeleting(false);
      setDeleteError(result.error ?? "Error al borrar la cuenta");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Datos de la cuenta */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Configuración de cuenta</h1>
        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false); }}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              value={professional.email}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-400">El email no se puede cambiar porque es tu identificador de acceso (magic link).</p>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm" style={{ color: G.green }}>Guardado ✓</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: G.green }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>

      {/* Sesión */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Sesión</h2>
        <p className="mt-1 text-sm text-zinc-500">Cerrá sesión en este dispositivo.</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-4 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
        <h2 className="text-sm font-semibold text-red-700">Desactivar cuenta</h2>
        <p className="mt-1 text-sm text-red-600/80">
          Tu link de reservas deja de estar disponible para tus clientes y perdés acceso al dashboard.
          Tu historial de turnos se conserva — podés reactivarla iniciando sesión de nuevo.
        </p>

        {!showDeactivate ? (
          <button
            onClick={() => setShowDeactivate(true)}
            className="mt-4 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Desactivar cuenta
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-red-700">
              Escribí tu email (<strong>{professional.email}</strong>) para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-2.5 text-zinc-900 focus:outline-none"
              placeholder={professional.email}
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeactivate}
                disabled={deactivating || confirmText.trim().toLowerCase() !== professional.email.toLowerCase()}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deactivating ? "Desactivando…" : "Confirmar desactivación"}
              </button>
              <button
                onClick={() => { setShowDeactivate(false); setConfirmText(""); }}
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hard delete */}
      <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
        <h2 className="text-sm font-semibold text-red-800">Borrar cuenta permanentemente</h2>
        <p className="mt-1 text-sm text-red-700/90">
          Esto elimina definitivamente tu perfil, servicios, disponibilidad, turnos, lista de espera y tu acceso de login.
          <strong> No se puede deshacer.</strong> Si tenés dudas, usá &quot;Desactivar cuenta&quot; en su lugar.
        </p>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="mt-4 rounded-lg border border-red-400 px-4 py-2.5 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            Borrar cuenta permanentemente
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-red-800">
              Escribí <strong>{DELETE_PHRASE}</strong> para confirmar que entendés que esta acción es irreversible:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-lg border border-red-400 bg-white px-4 py-2.5 text-zinc-900 focus:outline-none"
              placeholder={DELETE_PHRASE}
            />
            {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleHardDelete}
                disabled={deleting || deleteConfirmText.trim() !== DELETE_PHRASE}
                className="rounded-lg bg-red-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-40"
              >
                {deleting ? "Borrando…" : "Borrar definitivamente"}
              </button>
              <button
                onClick={() => { setShowDelete(false); setDeleteConfirmText(""); setDeleteError(null); }}
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
