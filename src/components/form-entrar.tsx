"use client";

import { useActionState } from "react";
import { entrar } from "@/features/acesso/actions";

export function FormEntrar({ para }: { para: string }) {
  const [estado, acao, enviando] = useActionState(entrar, {});
  return (
    <form action={acao} className="mt-6 space-y-4">
      <input type="hidden" name="para" value={para} />
      <label className="block text-sm">
        Senha
        <input
          name="senha"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={Boolean(estado.erro)}
          aria-describedby="erro-senha"
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
        />
      </label>
      <p id="erro-senha" role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">{estado.erro}</p>
      <button disabled={enviando} className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-background disabled:opacity-50">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
