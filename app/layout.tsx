import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Tornu · Tu agenda, sin el caos",
  description: "Compartí un link, tus clientes eligen horario. Gestión de turnos simple para profesionales independientes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
