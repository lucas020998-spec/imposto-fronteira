import { describe, expect, it } from "vitest";
import type { ItemAnexo5 } from "@/lib/anexo5/schema";
import { montarEntrada, type DadosSimulacao } from "./simulacao";

const item: ItemAnexo5 = {
  segmento: "MATERIAIS DE CONSTRUÇÃO E CONGÊNERES", item: "6.0", cest: "10.006.00", ncms: ["3917"],
  descricao: "Tubos", variante: null, mva: 33, mvaAjustada: { 4: 59.6, 7: 54.61, 12: 46.3 },
  mvaTexto: null, aliquota: 20, fcp: 0, aliquotaTexto: "20%",
};
const dados: DadosSimulacao = { ufOrigem: "SP", importado: false, fornecedorSimples: false, valorProdutos: 100_000 };

describe("montarEntrada", () => {
  it("usa a MVA ajustada publicada para a alíquota interestadual da origem", () => {
    expect(montarEntrada(dados, item)).toMatchObject({ ok: true, entrada: { aliquotaInterestadual: 7, mva: 33, mvaAjustada: 54.61, aliquotaInterna: 20 } });
    expect(montarEntrada({ ...dados, ufOrigem: "PE" }, item)).toMatchObject({ entrada: { mvaAjustada: 46.3 } });
    expect(montarEntrada({ ...dados, importado: true }, item)).toMatchObject({ entrada: { mvaAjustada: 59.6 } });
  });

  it("aplica alíquota e FUNCEP do item, mas respeita a alíquota digitada", () => {
    const bebida = { ...item, aliquota: 25, fcp: 2 };
    expect(montarEntrada(dados, bebida)).toMatchObject({ entrada: { aliquotaInterna: 25, fcp: 2 } });
    expect(montarEntrada({ ...dados, aliquotaInterna: 18 }, bebida)).toMatchObject({ entrada: { aliquotaInterna: 18, fcp: 2 } });
  });

  it("MVA manual substitui a do anexo e volta para a fórmula", () => {
    const r = montarEntrada({ ...dados, mvaManual: 40 }, item);
    expect(r).toMatchObject({ ok: true, entrada: { mva: 40 } });
    expect(r.ok && r.entrada.mvaAjustada).toBeUndefined();
  });

  it("sem item é antecipação parcial", () => {
    const r = montarEntrada(dados);
    expect(r.ok && r.entrada.mva).toBeUndefined();
  });

  it("recusa item sem MVA percentual, a menos que a MVA seja digitada", () => {
    const pauta = { ...item, mva: null, mvaAjustada: null, mvaTexto: "AD REM" };
    expect(montarEntrada(dados, pauta)).toEqual({ ok: false, motivo: expect.stringContaining("AD REM") });
    expect(montarEntrada({ ...dados, mvaManual: 30 }, pauta).ok).toBe(true);
  });
});
