import type { Professional } from "@/types/database";

type Props = {
  professional: Professional;
};

export function WelcomePanel({ professional }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Hola, {professional.name}
      </h1>
      <p className="mt-1 text-zinc-600">{professional.email}</p>
    </div>
  );
}
