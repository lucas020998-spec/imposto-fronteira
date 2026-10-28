import type { Metadata } from "next";
import { FormEntrar } from "@/components/form-entrar";
import { destinoSeguro } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar · Imposto Fronteira PB" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const para = destinoSeguro((await searchParams).para);
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      <p className="mt-2 text-muted">Informe a senha de acesso para usar o simulador.</p>
      <FormEntrar para={para} />
    </div>
  );
}
