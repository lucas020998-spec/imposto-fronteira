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

  it("calcula a antecipação parcial sem MVA", () => {
    const r = calcular({ valorProdutos: 100_000, aliquotaInterestadual: 7, aliquotaInterna: 20 });
    expect(r).toMatchObject({ regime: "antecipacao", baseCalculo: 100_000, icmsProprio: 7_000, icmsDevido: 13_000 });
    expect(r.percentualEfetivo).toBe(13);
    expect(r.mvaAjustada).toBeUndefined();
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
