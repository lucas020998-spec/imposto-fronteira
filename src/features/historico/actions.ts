"use server";

import { revalidatePath } from "next/cache";
import { temSessao } from "@/features/acesso/sessao";
import { logger } from "@/lib/logger";
import { calcular } from "@/lib/tax/calculate";
import { aliquotaInterestadual } from "@/lib/tax/rates";
import { salvarSimulacaoSchema, type SalvarSimulacaoInput } from "./input";
import { inserirSimulacao } from "./repository";

export type ResultadoSalvar = { ok: true; id: number } | { ok: false; erro: string };

export async function salvarSimulacao(input: SalvarSimulacaoInput): Promise<ResultadoSalvar> {
  if (!(await temSessao())) return { ok: false, erro: "Sessão expirada. Entre de novo para salvar." };
  const parsed = salvarSimulacaoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const d = parsed.data;
  const inter = aliquotaInterestadual(d.ufOrigem, d.importado);
  const r = calcular({ ...d, aliquotaInterestadual: inter });

  try {
    const id = await inserirSimulacao({
      ...d,
      cest: d.cest ?? null,
      descricaoAnexo: d.descricaoAnexo ?? null,
      frete: d.frete ?? null,
      aliquotaIpi: d.aliquotaIpi ?? null,
      mva: d.mva ?? null,
      fornecedor: d.fornecedor ?? null,
      observacao: d.observacao ?? null,
      aliquotaInterestadual: inter,
      regime: r.regime,
      icmsDevido: r.icmsDevido,
      percentualEfetivo: r.percentualEfetivo,
    });
    revalidatePath("/historico");
    return { ok: true, id };
  } catch (error) {
    logger.error({ code: (error as NodeJS.ErrnoException).code }, "Falha ao salvar simulação");
    return { ok: false, erro: "Não foi possível salvar agora. Tente de novo em instantes." };
  }
}
