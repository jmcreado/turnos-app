"use client";

import { useState, useTransition } from "react";
import { joinLaunchWaitlist } from "@/lib/actions/launch-waitlist";

type Status = "idle" | "success" | "already" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    startTransition(async () => {
      const res = await joinLaunchWaitlist(email);
      if (res.ok) {
        setStatus(res.already ? "already" : "success");
      } else {
        setStatus("error");
        setErrorMsg(res.error);
      }
    });
  }

  if (status === "success" || status === "already") {
    return (
      <div className="wl-success" role="status">
        <span className="wl-check">✓</span>
        {status === "already"
          ? "Ya estabas en la lista. Te avisamos apenas abrimos."
          : "Listo. Te avisamos apenas abrimos."}
      </div>
    );
  }

  return (
    <form className="wl-form" onSubmit={handleSubmit}>
      <div className="wl-row">
        <input
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Tu email"
          disabled={pending}
        />
        <button type="submit" disabled={pending}>
          {pending ? "Anotando…" : "Avisame"}
        </button>
      </div>
      {status === "error" && <p className="wl-error">{errorMsg}</p>}
      <p className="wl-hint">Sin spam. Solo un email cuando esté listo.</p>
    </form>
  );
}
