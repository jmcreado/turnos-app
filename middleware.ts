import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEV_COOKIE = "tornu_dev_access";

// Rutas accesibles sin cookie de dev-access.
// /auth debe pasar siempre: los magic links llegan a /auth/callback con un
// código one-time; si el gate los redirige, la sesión nunca se crea.
const PUBLIC_PATHS = ["/coming-soon", "/dev-access", "/auth"];

/**
 * Middleware con dos responsabilidades:
 *
 * 1. Gate de lanzamiento: mientras el producto no está abierto al público,
 *    todo visitante sin la cookie de dev-access ve la landing coming-soon.
 *    Con la cookie (seteada vía /dev-access?key=SECRET) se ve la app real
 *    en producción — mismo deploy, misma Supabase, e2e idéntico.
 *
 *    Para abrir al público: eliminar el bloque del gate (o setear
 *    LAUNCH_MODE=open y condicionar) y listo.
 *
 * 2. Sesión Supabase: refresca sesión y protege /dashboard (igual que antes).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Gate de lanzamiento ─────────────────────────────────────────────
  const secret = process.env.DEV_ACCESS_SECRET;
  const hasDevAccess =
    !!secret && request.cookies.get(DEV_COOKIE)?.value === secret;

  if (!hasDevAccess) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Usuario ya autenticado en Supabase → pasa el gate aunque no tenga la
    // cookie de dev-access (ej: sesión creada vía magic link en otro browser).
    // Seguro: nadie puede registrarse sin la cookie porque /login está gateado.
    const hasSbCookies = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    if (hasSbCookies) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const supabase = createServerClient(url, key, {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              /* solo lectura para el chequeo del gate */
            },
          },
        });
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (pathname === "/") {
            return NextResponse.rewrite(new URL("/coming-soon", request.url));
          }
          return NextResponse.redirect(new URL("/", request.url));
        }
        // Autenticado: sigue al bloque 2 (sesión + protección de rutas)
      }
    } else {
      if (pathname === "/") {
        // La URL queda tornu.app pero se sirve la coming-soon
        return NextResponse.rewrite(new URL("/coming-soon", request.url));
      }
      // Cualquier otra ruta (login, dashboard, book, manage…) → home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Con acceso dev, /coming-soon no tiene sentido: a la app real
  if (pathname.startsWith("/coming-soon")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── 2. Sesión Supabase (solo donde hace falta) ─────────────────────────
  const needsAuthCheck =
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname.startsWith("/auth/");

  if (!needsAuthCheck) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login";

  if (isDashboard && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Todo excepto assets estáticos, archivos con extensión y /api
  // (los crons de /api/cron siguen funcionando sin gate)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)"],
};
