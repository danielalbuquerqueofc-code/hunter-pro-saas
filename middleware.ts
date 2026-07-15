import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const privatePrefixes = [
  "/dashboard",
  "/agenda",
  "/leads",
  "/pipeline",
  "/clientes",
  "/conversas",
  "/orcamentos",
  "/vendas",
  "/financeiro",
  "/relatorios",
  "/vitrine",
  "/avaliacoes",
  "/ia",
  "/ia-sdr",
  "/atendimento",
  "/tarefas",
  "/automacoes",
  "/usuarios",
  "/servicos",
  "/configuracoes",
  "/crm",
  "/admin"
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isPrivateRoute = privatePrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (!isPrivateRoute) {
    return response;
  }

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof response.cookies.set>[2];
  };
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
