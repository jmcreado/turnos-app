import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "tornu_dev_access";

/**
 * GET /dev-access?key=SECRET  → setea cookie de acceso dev y redirige a /
 * GET /dev-access?logout=1    → borra la cookie (volvés a ver la coming soon)
 *
 * El secret vive en DEV_ACCESS_SECRET (env). Sin match exacto, no hay acceso.
 */
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  if (searchParams.get("logout")) {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  const key = searchParams.get("key");
  const secret = process.env.DEV_ACCESS_SECRET;

  if (!secret || !key || key !== secret) {
    // Clave inválida o no configurada: a la coming soon, sin pistas.
    return NextResponse.redirect(new URL("/", request.url));
  }

  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 días
  });
  return res;
}
