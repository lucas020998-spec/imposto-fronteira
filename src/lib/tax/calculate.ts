// Cálculo do ICMS "de fronteira" devido à Paraíba numa compra interestadual feita por
// empresa do Simples Nacional (LC 123/2006, art. 13, § 1º, XIII, "a" e "g").
// Valores monetários em centavos (inteiros); alíquotas e MVA em percentual (ex.: 20 = 20%).

export type Regime = "st" | "antecipacao";

export interface Entrada {
  valorProdutos: number;
  aliquotaInterestadual: number;
  aliquotaInterna: number;
  /** Frete da compra; opcional. */
  frete?: number;
  /** Frete cobrado na própria nota (CIF). Sem isso, o frete veio em CT-e separado. */
  freteNaNota?: boolean;
  /** Alíquota do ICMS do CT-e (7% ou 12% pela UF de origem); padrão: a interestadual. */
  aliquotaFrete?: number;
  /** Alíquota de IPI sobre os produtos; opcional. */
  aliquotaIpi?: number;
  /** Valor do IPI em centavos, como na nota; tem prioridade sobre a alíquota. */
  valorIpi?: number;
  /** MVA original do Anexo 05. Sem MVA, o cálculo é de antecipação. */
  mva?: number;
  /** MVA ajustada publicada no Anexo 05 para a alíquota interestadual; sem ela, usa a fórmula. */
  mvaAjustada?: number;
  /** Adicional do FUNCEP em pontos percentuais, somado à alíquota interna no débito. */
  fcp?: number;
  /**
   * Fornecedor optante do Simples: não destaca ICMS na nota (sem crédito na antecipação) e, na ST,
   * usa a MVA original, sem ajuste (Conv. ICMS 142/2018, cl. 11, § 1º).
   */
  fornecedorSimples?: boolean;
}

export interface Resultado {
  regime: Regime;
  valorIpi: number;
  frete: number;
  /** MVA aplicada na ST em percentual: ajustada (2 casas) ou original, se o fornecedor é do Simples. */
  mvaAjustada?: number;
  baseCalculo: number;
  /** Créditos abatidos: ICMS da nota e, na antecipação, do CT-e. */
  icmsProprio: number;
  /** Antecipação: ICMS destacado na nota (zero se o fornecedor é do Simples). */
  creditoNota?: number;
  /** Antecipação: ICMS do CT-e de frete. */
  creditoFrete?: number;
  /** Antecipação: produtos + IPI + frete − créditos, antes de dividir por (1 − interna). */
  valorLiquido?: number;
  /** Antecipação: interna (com FUNCEP) − interestadual, em percentual. */
  diferencaAliquotas?: number;
  icmsDevido: number;
  /** ICMS devido sobre o valor dos produtos, em percentual. */
  percentualEfetivo: number;
}

const pct = (v: number) => v / 100;
const arred2 = (v: number) => Math.round(v * 100) / 100;

export function mvaAjustada(mva: number, inter: number, intra: number): number {
  // Só se ajusta quando a interestadual é menor que a interna (sempre o caso na PB).
  if (inter >= intra) return mva;
  const fator = ((1 + pct(mva)) * (1 - pct(inter))) / (1 - pct(intra));
  return arred2((fator - 1) * 100);
}

export function calcular(e: Entrada): Resultado {
  const frete = e.frete ?? 0;
  const valorIpi = e.valorIpi ?? Math.round(e.valorProdutos * pct(e.aliquotaIpi ?? 0));
  const inter = e.aliquotaInterestadual;
  const aliquotaDebito = e.aliquotaInterna + (e.fcp ?? 0);

  if (e.mva === undefined) return antecipacao(e, frete, valorIpi, aliquotaDebito);

  const icmsProprio = Math.round((e.valorProdutos + frete) * pct(inter));
  const mvaAj = e.fornecedorSimples ? e.mva : (e.mvaAjustada ?? mvaAjustada(e.mva, inter, e.aliquotaInterna));
  const baseCalculo = Math.round((e.valorProdutos + frete + valorIpi) * (1 + pct(mvaAj)));
  const icmsDevido = Math.max(0, Math.round(baseCalculo * pct(aliquotaDebito)) - icmsProprio);
  return { regime: "st", valorIpi, frete, mvaAjustada: mvaAj, baseCalculo, icmsProprio, icmsDevido, percentualEfetivo: efetivo(e, icmsDevido) };
}

/**
 * Antecipação do Simples (DAR receita 1124), como a SEFAZ-PB calcula: base "por dentro" sobre o
 * valor líquido dos créditos e diferença de alíquotas sobre a base. Conferida com as notas do
 * DAR de 08/2026 (ver `notas-reais.test.ts`).
 */
function antecipacao(e: Entrada, frete: number, valorIpi: number, aliquotaDebito: number): Resultado {
  const inter = e.aliquotaInterestadual;
  const naNota = e.freteNaNota ? frete : 0;
  const creditoNota = e.fornecedorSimples ? 0 : Math.round((e.valorProdutos + naNota) * pct(inter));
  const creditoFrete = e.freteNaNota ? 0 : Math.round(frete * pct(e.aliquotaFrete ?? inter));
  const valorLiquido = e.valorProdutos + valorIpi + frete - creditoNota - creditoFrete;
  const baseCalculo = Math.round((valorLiquido * 100) / (100 - aliquotaDebito));
  const diferencaAliquotas = arred2(aliquotaDebito - inter);
  const icmsDevido = Math.max(0, Math.round(baseCalculo * pct(diferencaAliquotas)));
  return {
    regime: "antecipacao", valorIpi, frete, baseCalculo,
    icmsProprio: creditoNota + creditoFrete, creditoNota, creditoFrete, valorLiquido, diferencaAliquotas,
    icmsDevido, percentualEfetivo: efetivo(e, icmsDevido),
  };
}

const efetivo = (e: Entrada, icmsDevido: number) =>
  e.valorProdutos > 0 ? arred2((icmsDevido / e.valorProdutos) * 100) : 0;
