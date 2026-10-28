import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAppPassword } from "./env";

// Sessão por senha única: o cookie guarda um HMAC derivado da senha. Trocar APP_PASSWORD
// invalida todas as sessões.
export const COOKIE_SESSAO = "sessao";
export const DURACAO_SESSAO_S = 60 * 60 * 24 * 30;

// Chave aleatória por processo para comparar a senha digitada por HMAC (mesmo tamanho dos dois lados).
const CHAVE_COMPARACAO = randomBytes(32);

const hmac = (valor: string, chave: string | Buffer) => createHmac("sha256", chave).update(valor).digest();

function senhaConfigurada() {
  try {
    return getAppPassword();
  } catch {
    return null;
  }
}

/** Valor do cookie de sessão, ou null se a senha não estiver configurada. */
export function tokenSessao(): string | null {
  const senha = senhaConfigurada();
  return senha && hmac("imposto-fronteira/sessao/v1", senha).toString("base64url");
}

/** Compara em tempo constante; sem senha configurada, nunca confere. */
export function senhaConfere(tentativa: string): boolean {
  const senha = senhaConfigurada();
  if (!senha) return false;
  return timingSafeEqual(hmac(tentativa, CHAVE_COMPARACAO), hmac(senha, CHAVE_COMPARACAO));
}

export function sessaoValida(cookie: string | undefined): boolean {
  const esperado = tokenSessao();
  if (!cookie || !esperado || cookie.length !== esperado.length) return false;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(esperado));
}

/** Destino seguro após o login: só caminhos internos. */
export function destinoSeguro(para: unknown): string {
  return typeof para === "string" && para.startsWith("/") && !para.startsWith("//") && !para.startsWith("/\\") ? para : "/";
}
