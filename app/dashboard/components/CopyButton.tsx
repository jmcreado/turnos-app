"use client";

type Props = { text: string };

export function CopyButton({ text }: Props) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="text-xs font-medium text-muted hover:text-accent"
    >
      Copiar
    </button>
  );
}