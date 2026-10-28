import "server-only";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, sessaoValida } from "@/lib/auth";

/** Verificação perto dos dados: ações e páginas com histórico chamam antes de ler ou gravar. */
export async function temSessao(): Promise<boolean> {
  return sessaoValida((await cookies()).get(COOKIE_SESSAO)?.value);
}
