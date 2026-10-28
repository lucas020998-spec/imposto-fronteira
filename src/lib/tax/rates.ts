// Alíquotas usadas nas compras interestaduais com destino à Paraíba.

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export type UfOrigem = (typeof UFS)[number];

// Res. Senado 22/1989: Sul e Sudeste (exceto ES) vendendo para N, NE, CO e ES usam 7%.
const ORIGENS_7 = new Set<UfOrigem>(["MG", "PR", "RJ", "RS", "SC", "SP"]);

// Lei 12.788/2023: alíquota interna geral da PB passou a 20% em 2024.
export const ALIQUOTA_INTERNA_PB = 20;

// Res. Senado 13/2012: mercadoria importada (ou com conteúdo importado acima de 40%).
export const ALIQUOTA_IMPORTADO = 4;

export function aliquotaInterestadual(uf: UfOrigem, importado: boolean): number {
  if (importado) return ALIQUOTA_IMPORTADO;
  return ORIGENS_7.has(uf) ? 7 : 12;
}
