"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Professional } from "@/types/database";

type Props = { professional: Professional };

export function WelcomePanel({ professional }: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative rounded-2xl p-6 text-white" style={{ backgroundColor: "#1a6b4a" }} ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Tornu · Dashboard</p>
          <h1 className="text-2xl font-semibold">{professional.name}</h1>
          <p className="mt-0.5 text-sm opacity-75">{professional.email}</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 opacity-80">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-lg sm:left-auto sm:w-64">
          <a
            href="/dashboard/account"
            className="block px-4 py-3 text-sm font-medium hover:bg-zinc-50"
          >
            Configuración de cuenta
          </a>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="block w-full border-t border-zinc-100 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
