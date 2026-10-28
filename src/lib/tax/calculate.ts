// Cálculo do ICMS "de fronteira" devido à Paraíba numa compra interestadual feita por
// empresa do Simples Nacional (LC 123/2006, art. 13, § 1º, XIII, "a" e "g").
// Valores monetários em centavos (inteiros); alíquotas e MVA em percentual (ex.: 20 = 20%).

export type Regime = "st" | "antecipacao";

export interface Entrada {
  valorProdutos: number;
  aliquotaInterestadual: number;
  aliquotaInterna: number;
  /** Frete cobrado na nota; opcional. */
  frete?: number;
  /** Alíquota de IPI sobre os produtos; opcional. */
  aliquotaIpi?: number;
  /** MVA original do Anexo 05. Sem MVA, o cálculo é de antecipação parcial. */
  mva?: number;
  /** MVA ajustada publicada no Anexo 05 para a alíquota interestadual; sem ela, usa a fórmula. */
  mvaAjustada?: number;
  /** Adicional do FUNCEP em pontos percentuais, somado à alíquota interna no débito. */
  fcp?: number;
  /** Fornecedor optante do Simples: a ST usa a MVA original, sem ajuste (Conv. ICMS 142/2018, cl. 11, § 1º). */
  fornecedorSimples?: boolean;
}

export interface Resultado {
  regime: Regime;
  valorIpi: number;
  frete: number;
  /** MVA aplicada na ST em percentual: ajustada (2 casas) ou original, se o fornecedor é do Simples. */
  mvaAjustada?: number;
  baseCalculo: number;
  /** ICMS destacado pelo fornecedor, abatido como crédito. */
  icmsProprio: number;
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
  const valorIpi = Math.round(e.valorProdutos * pct(e.aliquotaIpi ?? 0));
  const baseIcmsProprio = e.valorProdutos + frete;
  const icmsProprio = Math.round(baseIcmsProprio * pct(e.aliquotaInterestadual));

  const aliquotaDebito = e.aliquotaInterna + (e.fcp ?? 0);
  if (e.mva === undefined) {
    // Antecipação parcial do Simples: diferença entre alíquotas, sem agregar MVA. O IPI entra na
    // base porque é custo da compra para quem não se credita dele.
    const baseCalculo = baseIcmsProprio + valorIpi;
    const debito = Math.round(baseCalculo * pct(aliquotaDebito));
    return resultado("antecipacao", e, { valorIpi, frete, baseCalculo, icmsProprio, debito });
  }

  const mvaAj = e.fornecedorSimples
    ? e.mva
    : (e.mvaAjustada ?? mvaAjustada(e.mva, e.aliquotaInterestadual, e.aliquotaInterna));
  const baseCalculo = Math.round((e.valorProdutos + frete + valorIpi) * (1 + pct(mvaAj)));
  const debito = Math.round(baseCalculo * pct(aliquotaDebito));
  return { ...resultado("st", e, { valorIpi, frete, baseCalculo, icmsProprio, debito }), mvaAjustada: mvaAj };
}

function resultado(
  regime: Regime,
  e: Entrada,
  p: { valorIpi: number; frete: number; baseCalculo: number; icmsProprio: number; debito: number },
): Resultado {
  const icmsDevido = Math.max(0, p.debito - p.icmsProprio);
  const percentualEfetivo = e.valorProdutos > 0 ? arred2((icmsDevido / e.valorProdutos) * 100) : 0;
  return {
    regime,
    valorIpi: p.valorIpi,
    frete: p.frete,
    baseCalculo: p.baseCalculo,
    icmsProprio: p.icmsProprio,
    icmsDevido,
    percentualEfetivo,
  };
}
