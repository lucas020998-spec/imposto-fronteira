import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, sessaoValida } from "@/lib/auth";

// Bloqueia todas as páginas sem sessão válida. As ações e páginas com dados repetem a
// verificação (`temSessao`), porque o proxy não é a única linha de defesa.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/entrar") return NextResponse.next();
  if (sessaoValida(req.cookies.get(COOKIE_SESSAO)?.value)) return NextResponse.next();

  const url = new URL("/entrar", req.nextUrl);
  if (pathname !== "/") url.searchParams.set("para", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Manifesto e ícones ficam públicos: o celular os lê antes do login para instalar o app.
  matcher: ["/((?!_next/static|_next/image|manifest\\.webmanifest|icons/|icon\\.png|apple-icon\\.png).*)"],
};
