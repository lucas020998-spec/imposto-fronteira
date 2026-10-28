"use server";

import { revalidatePath } from "next/cache";
import { temSessao } from "@/features/acesso/sessao";
import { logger } from "@/lib/logger";
import { anexo5 } from "@/lib/anexo5/dados";
import { itemEscolhido } from "@/lib/anexo5/lookup";
import { montarEntrada } from "@/lib/simulacao";
import { calcular } from "@/lib/tax/calculate";
import { salvarSimulacaoSchema, type SalvarSimulacaoInput } from "./input";
import { inserirSimulacao } from "./repository";

export type ResultadoSalvar = { ok: true; id: number } | { ok: false; erro: string };

export async function salvarSimulacao(input: SalvarSimulacaoInput): Promise<ResultadoSalvar> {
  if (!(await temSessao())) return { ok: false, erro: "Sessão expirada. Entre de novo para salvar." };
  const parsed = salvarSimulacaoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const d = parsed.data;
  const item = d.cest ? itemEscolhido(anexo5.itens, d.ncm, d.cest, d.variante ?? null) : undefined;
  if (d.cest && !item) return { ok: false, erro: "Item do Anexo 05 não encontrado para este NCM." };
  const montada = montarEntrada(d, item);
  if (!montada.ok) return { ok: false, erro: montada.motivo };
  const e = montada.entrada;
  const r = calcular(e);

  try {
    const id = await inserirSimulacao({
      ncm: d.ncm,
      cest: item?.cest ?? null,
      variante: item?.variante ?? null,
      descricaoAnexo: item?.descricao ?? null,
      ufOrigem: d.ufOrigem,
      importado: d.importado,
      fornecedorSimples: d.fornecedorSimples,
      valorProdutos: d.valorProdutos,
      frete: d.frete ?? null,
      aliquotaIpi: d.aliquotaIpi ?? null,
      aliquotaInterestadual: e.aliquotaInterestadual,
      aliquotaInterna: e.aliquotaInterna,
      fcp: e.fcp ?? null,
      mva: e.mva ?? null,
      mvaAplicada: r.mvaAjustada ?? null,
      regime: r.regime,
      icmsDevido: r.icmsDevido,
      percentualEfetivo: r.percentualEfetivo,
      fornecedor: d.fornecedor ?? null,
      observacao: d.observacao ?? null,
    });
    revalidatePath("/historico");
    return { ok: true, id };
  } catch (error) {
    logger.error({ code: (error as NodeJS.ErrnoException).code }, "Falha ao salvar simulação");
    return { ok: false, erro: "Não foi possível salvar agora. Tente de novo em instantes." };
  }
}
