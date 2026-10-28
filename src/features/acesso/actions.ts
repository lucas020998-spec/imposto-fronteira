"use server";

import { setTimeout as esperar } from "node:timers/promises";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO, destinoSeguro, DURACAO_SESSAO_S, senhaConfere, tokenSessao } from "@/lib/auth";
import { logger } from "@/lib/logger";

export type EstadoEntrar = { erro?: string };

export async function entrar(_: EstadoEntrar, form: FormData): Promise<EstadoEntrar> {
  const senha = form.get("senha");
  const token = tokenSessao();
  if (!token) return { erro: "Senha de acesso não configurada no servidor (APP_PASSWORD)." };

  if (typeof senha !== "string" || !senhaConfere(senha)) {
    logger.warn("Tentativa de acesso com senha incorreta");
    // Atraso fixo para encarecer tentativas em sequência.
    await esperar(1_000);
    return { erro: "Senha incorreta." };
  }

  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
  redirect(destinoSeguro(form.get("para")));
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/entrar");
}
