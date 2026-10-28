import { describe, expect, it } from "vitest";
import { calcular, mvaAjustada } from "./calculate";
import { aliquotaInterestadual } from "./rates";

describe("aliquotaInterestadual", () => {
  it("usa 7% para Sul/Sudeste exceto ES, 12% para os demais e 4% para importados", () => {
    expect(aliquotaInterestadual("SP", false)).toBe(7);
    expect(aliquotaInterestadual("ES", false)).toBe(12);
    expect(aliquotaInterestadual("PE", false)).toBe(12);
    expect(aliquotaInterestadual("SP", true)).toBe(4);
  });
});

describe("mvaAjustada", () => {
  it("ajusta a MVA original pela diferença de alíquotas", () => {
    // (1,33 × 0,88 / 0,80) − 1 = 0,463
    expect(mvaAjustada(33, 12, 20)).toBe(46.3);
    // (1,40 × 0,93 / 0,80) − 1 = 0,6275
    expect(mvaAjustada(40, 7, 20)).toBe(62.75);
  });

  it("mantém a MVA quando a interestadual não é menor que a interna", () => {
    expect(mvaAjustada(30, 20, 20)).toBe(30);
  });
});

describe("calcular", () => {
  it("calcula a substituição tributária com frete e IPI", () => {
    const r = calcular({
      valorProdutos: 100_000, frete: 5_000, aliquotaIpi: 10,
      aliquotaInterestadual: 12, aliquotaInterna: 20, mva: 33,
    });
    // Base = (1.000 + 50 + 100) × 1,463 = 1.682,45
    expect(r).toMatchObject({
      regime: "st", valorIpi: 10_000, mvaAjustada: 46.3,
      baseCalculo: 168_245, icmsProprio: 12_600, icmsDevido: 33_649 - 12_600,
    });
    expect(r.percentualEfetivo).toBe(21.05);
  });

  it("calcula a antecipação com base por dentro e diferença de alíquotas", () => {
    const r = calcular({ valorProdutos: 100_000, aliquotaInterestadual: 7, aliquotaInterna: 20 });
    // (1.000 − 70) ÷ 0,80 = 1.162,50; × 13% = 151,13
    expect(r).toMatchObject({
      regime: "antecipacao", creditoNota: 7_000, creditoFrete: 0, valorLiquido: 93_000,
      baseCalculo: 116_250, diferencaAliquotas: 13, icmsDevido: 15_113,
    });
    expect(r.mvaAjustada).toBeUndefined();
  });

  it("na antecipação, soma IPI e frete e abate o ICMS da nota e do CT-e", () => {
    const r = calcular({
      valorProdutos: 100_000, valorIpi: 5_000, frete: 10_000, aliquotaFrete: 12,
      aliquotaInterestadual: 12, aliquotaInterna: 20,
    });
    // (1.000 + 50 + 100 − 120 − 12) ÷ 0,80 = 1.272,50; × 8% = 101,80
    expect(r).toMatchObject({ creditoNota: 12_000, creditoFrete: 1_200, baseCalculo: 127_250, icmsDevido: 10_180 });
  });

  it("frete na própria nota entra no ICMS destacado, pela alíquota da nota", () => {
    const r = calcular({ valorProdutos: 100_000, frete: 10_000, freteNaNota: true, aliquotaFrete: 7, aliquotaInterestadual: 4, aliquotaInterna: 20 });
    expect(r).toMatchObject({ creditoNota: 4_400, creditoFrete: 0 });
  });

  it("fornecedor do Simples não destaca ICMS: sem crédito da nota, mas o CT-e continua creditando", () => {
    const r = calcular({ valorProdutos: 100_000, frete: 10_000, aliquotaFrete: 7, fornecedorSimples: true, aliquotaInterestadual: 7, aliquotaInterna: 20 });
    // (1.000 + 100 − 7) ÷ 0,80 = 1.366,25; × 13% = 177,61
    expect(r).toMatchObject({ creditoNota: 0, creditoFrete: 700, baseCalculo: 136_625, icmsDevido: 17_761 });
  });

  it("valor do IPI informado tem prioridade sobre a alíquota", () => {
    expect(calcular({ valorProdutos: 100_000, valorIpi: 1_234, aliquotaIpi: 10, aliquotaInterestadual: 7, aliquotaInterna: 20 }).valorIpi).toBe(1_234);
  });

  it("usa a MVA original quando o fornecedor é do Simples", () => {
    const r = calcular({ valorProdutos: 100_000, aliquotaInterestadual: 12, aliquotaInterna: 20, mva: 33, fornecedorSimples: true });
    // 1.000 × 1,33 × 20% − 1.000 × 12% = 266 − 120 = 146
    expect(r).toMatchObject({ mvaAjustada: 33, baseCalculo: 133_000, icmsDevido: 14_600 });
  });

  it("prefere a MVA ajustada publicada no anexo à fórmula", () => {
    const r = calcular({ valorProdutos: 100_000, aliquotaInterestadual: 7, aliquotaInterna: 20, mva: 33, mvaAjustada: 54.61 });
    // 1.000 × 1,5461 × 20% − 1.000 × 7% = 309,22 − 70 = 239,22
    expect(r).toMatchObject({ mvaAjustada: 54.61, baseCalculo: 154_610, icmsDevido: 23_922 });
  });

  it("ignora a MVA ajustada publicada quando o fornecedor é do Simples", () => {
    const r = calcular({ valorProdutos: 100_000, aliquotaInterestadual: 7, aliquotaInterna: 20, mva: 33, mvaAjustada: 54.61, fornecedorSimples: true });
    expect(r.mvaAjustada).toBe(33);
  });

  it("soma o FUNCEP à alíquota interna no débito, sem mudar o ajuste da MVA", () => {
    const r = calcular({ valorProdutos: 100_000, aliquotaInterestadual: 12, aliquotaInterna: 25, fcp: 2, mva: 40 });
    // MVA ajustada = 1,40 × 0,88 ÷ 0,75 − 1 = 64,27%; 1.642,70 × 27% − 120 = 323,53
    expect(r).toMatchObject({ mvaAjustada: 64.27, baseCalculo: 164_270, icmsDevido: 32_353 });
  });

  it("trata frete e IPI como opcionais", () => {
    const comZero = calcular({ valorProdutos: 50_000, frete: 0, aliquotaIpi: 0, aliquotaInterestadual: 12, aliquotaInterna: 20, mva: 40 });
    const semCampos = calcular({ valorProdutos: 50_000, aliquotaInterestadual: 12, aliquotaInterna: 20, mva: 40 });
    expect(semCampos).toEqual(comZero);
  });

  it("não devolve imposto negativo nem divide por zero", () => {
    const r = calcular({ valorProdutos: 0, aliquotaInterestadual: 12, aliquotaInterna: 20 });
    expect(r.icmsDevido).toBe(0);
    expect(r.percentualEfetivo).toBe(0);
  });
});
