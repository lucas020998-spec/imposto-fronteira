// Regressão com notas reais: o DAR "ICMS-Simples Nacional-Fronteira" de 08/2026 da empresa
// (R$ 4.021,49) e o extrato da SEFAZ-PB com base e ICMS de cada nota. Valores em centavos.
import { describe, expect, it } from "vitest";
import { calcular, type Entrada } from "./calculate";

interface Nota { nf: string; entrada: Omit<Entrada, "aliquotaInterna">; base?: number; icms: number }

const notas: Nota[] = [
  { nf: "20672", entrada: { valorProdutos: 9_990, aliquotaInterestadual: 7, fornecedorSimples: true }, base: 12_488, icms: 1_623 },
  { nf: "333", entrada: { valorProdutos: 2_799, aliquotaInterestadual: 7, fornecedorSimples: true }, base: 3_499, icms: 455 },
  { nf: "24352", entrada: { valorProdutos: 259_680, valorIpi: 25_318, aliquotaInterestadual: 4 }, base: 343_264, icms: 54_922 },
  { nf: "49700", entrada: { valorProdutos: 289_544, valorIpi: 9_410, frete: 28_000, aliquotaFrete: 12, aliquotaInterestadual: 12 }, base: 361_061, icms: 28_885 },
  { nf: "370076", entrada: { valorProdutos: 19_260, aliquotaInterestadual: 12 }, base: 21_186, icms: 1_695 },
  { nf: "645", entrada: { valorProdutos: 786_000, frete: 28_684, aliquotaFrete: 7, aliquotaInterestadual: 7, fornecedorSimples: true }, base: 1_015_845, icms: 132_060 },
  // Nota com itens a 4% (importados) e a 7%: uma simulação por alíquota, frete rateado pelo valor.
  { nf: "2303954 (4%)", entrada: { valorProdutos: 116_808, valorIpi: 7_593, frete: 7_911, aliquotaFrete: 7, aliquotaInterestadual: 4 }, icms: 25_417 },
  { nf: "2303954 (7%)", entrada: { valorProdutos: 183_511, valorIpi: 9_479, frete: 12_430, aliquotaFrete: 7, aliquotaInterestadual: 7 }, icms: 31_152 },
  { nf: "158248", entrada: { valorProdutos: 851_025, aliquotaInterestadual: 12 }, base: 936_128, icms: 74_890 },
  { nf: "3420", entrada: { valorProdutos: 41_990, aliquotaInterestadual: 7, fornecedorSimples: true }, base: 52_488, icms: 6_823 },
  { nf: "116748", entrada: { valorProdutos: 22_111, frete: 7_499, freteNaNota: true, aliquotaInterestadual: 4 }, icms: 5_685 },
  { nf: "24998", entrada: { valorProdutos: 182_232, valorIpi: 17_767, aliquotaInterestadual: 4 }, base: 240_888, icms: 38_542 },
];

describe("antecipação conferida com o DAR de 08/2026", () => {
  it.each(notas)("NF $nf", ({ entrada, base, icms }) => {
    const r = calcular({ ...entrada, aliquotaInterna: 20 });
    expect(r.regime).toBe("antecipacao");
    expect(r.icmsDevido).toBe(icms);
    if (base !== undefined) expect(r.baseCalculo).toBe(base);
  });

  it("soma exatamente o total do DAR", () => {
    const total = notas.reduce((s, n) => s + calcular({ ...n.entrada, aliquotaInterna: 20 }).icmsDevido, 0);
    expect(total).toBe(402_149);
  });
});
