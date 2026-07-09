"use client";

import { useState } from "react";

function getInitialTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("tornu-theme", next);
    } catch {
      // localStorage puede fallar en modo privado; no es crítico
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Activar modo día" : "Activar modo noche"}
      className="theme-toggle"
      suppressHydrationWarning
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
