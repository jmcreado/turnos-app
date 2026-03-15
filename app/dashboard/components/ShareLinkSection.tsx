"use client";

import type { Professional } from "@/types/database";
import { useState } from "react";

type Props = {
  professional: Professional;
  baseUrl: string;
};

export function ShareLinkSection({ professional, baseUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const slug = professional.slug || professional.id;
  const link = `${baseUrl}/book/${slug}`;

  async function copyToClipboard() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Mi link</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Compartí este enlace con tus clientes para que reserven turno
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          readOnly
          value={link}
          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-700"
        />
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 sm:shrink-0"
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
