import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/perfil", "/onboarding"];

export async function middleware(request: NextRequest) {
  // ponytail: sin env de Supabase (previo a aplicar Fase 2) no hay sesiones que refrescar.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresca la sesión (no borrar: sin esto los tokens expiran silenciosamente)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Link de invitación sin sesión: guardar el código para reclamarlo al registrarse
  const inviteMatch = path.match(/^\/invite\/([\w-]+)/);
  if (inviteMatch && !user) {
    response.cookies.set("jahuga_invite", inviteMatch[1], {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
