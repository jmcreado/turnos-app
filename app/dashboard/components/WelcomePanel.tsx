import type { Professional } from "@/types/database";

type Props = { professional: Professional };

export function WelcomePanel({ professional }: Props) {
  return (
    <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: "#1a6b4a" }}>
      <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Tornu · Dashboard</p>
      <h1 className="text-2xl font-semibold">{professional.name}</h1>
      <p className="mt-0.5 text-sm opacity-75">{professional.email}</p>
    </div>
  );
}
