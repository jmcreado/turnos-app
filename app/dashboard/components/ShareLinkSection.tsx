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
    <div className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">Mi link</h2>
      <p className="mt-1 text-sm text-muted">
        Compartí este enlace con tus clientes para que reserven turno
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          readOnly
          value={link}
          className="flex-1 rounded-lg border border-edge bg-white/5 px-4 py-2.5 text-sm text-muted"
        />
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent sm:shrink-0"
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
