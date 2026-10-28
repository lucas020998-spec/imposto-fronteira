// Monta a entrada do cálculo a partir do formulário e do item escolhido no Anexo 05.
// Usada no navegador (simulador) e no servidor (ao salvar), para os dois chegarem ao mesmo resultado.
import type { ItemAnexo5 } from "@/lib/anexo5/schema";
import type { Entrada } from "@/lib/tax/calculate";
import { ALIQUOTA_INTERNA_PB, aliquotaInterestadual, type UfOrigem } from "@/lib/tax/rates";

export interface DadosSimulacao {
  ufOrigem: UfOrigem;
  importado: boolean;
  fornecedorSimples: boolean;
  valorProdutos: number;
  frete?: number;
  /** Frete cobrado na própria nota (CIF); sem isso, veio em CT-e separado. */
  freteNaNota?: boolean;
  aliquotaIpi?: number;
  /** IPI em centavos, como na nota; tem prioridade sobre a alíquota. */
  valorIpi?: number;
  /**
   * Compra para revenda: item do Anexo 05 entra na substituição tributária. Sem isso
   * (industrialização ou uso), a SEFAZ-PB cobra antecipação, como nas notas do DAR de 08/2026.
   */
  revenda?: boolean;
  /** Alíquota interna digitada; sem ela, vale a do item do anexo ou a geral de 20%. */
  aliquotaInterna?: number;
  /** MVA original digitada, que substitui a do anexo. */
  mvaManual?: number;
}

export type EntradaMontada = { ok: true; entrada: Entrada } | { ok: false; motivo: string };

export function aliquotaInternaPadrao(item?: ItemAnexo5): number {
  return item?.aliquota ?? ALIQUOTA_INTERNA_PB;
}

export function montarEntrada(d: DadosSimulacao, item?: ItemAnexo5): EntradaMontada {
  const inter = aliquotaInterestadual(d.ufOrigem, d.importado);
  const base: Entrada = {
    valorProdutos: d.valorProdutos,
    aliquotaInterestadual: inter,
    aliquotaInterna: d.aliquotaInterna ?? aliquotaInternaPadrao(item),
    fcp: item?.fcp || undefined,
    frete: d.frete,
    freteNaNota: d.freteNaNota,
    // CT-e: alíquota pela UF de origem, mesmo quando a mercadoria é importada (4%).
    aliquotaFrete: aliquotaInterestadual(d.ufOrigem, false),
    aliquotaIpi: d.aliquotaIpi,
    valorIpi: d.valorIpi,
    fornecedorSimples: d.fornecedorSimples,
  };
  if (d.mvaManual !== undefined) return { ok: true, entrada: { ...base, mva: d.mvaManual } };
  if (!item || !d.revenda) return { ok: true, entrada: base };

  const publicada = item.mvaAjustada?.[inter as 4 | 7 | 12];
  const mva = item.mva ?? publicada;
  if (mva === undefined || mva === null) {
    return {
      ok: false,
      motivo: `Este item do Anexo 05 não tem MVA percentual (${item.mvaTexto ?? "sem MVA"}). Informe a MVA manualmente.`,
    };
  }
  return { ok: true, entrada: { ...base, mva, mvaAjustada: publicada } };
}
