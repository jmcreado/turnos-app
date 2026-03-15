import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Ruta que recibe el redirect del magic link de Supabase.
 * Intercambia el código por sesión, guarda las cookies y redirige al dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si falla el intercambio, redirigir al login con error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
