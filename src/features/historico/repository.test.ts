// Teste de integração: roda só com TEST_DATABASE_URL apontando para um banco descartável já migrado.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("repositório de simulações (PostgreSQL)", () => {
  beforeAll(() => vi.stubEnv("DATABASE_URL", url));
  afterAll(async () => {
    const { closeDatabase } = await import("@/db");
    await closeDatabase();
  });

  it("grava e encontra por fornecedor, tratando curingas como texto", async () => {
    const { inserirSimulacao, listarSimulacoes } = await import("./repository");
    const marca = `teste-${Date.now()}`;
    const id = await inserirSimulacao({
      ncm: "3917", ufOrigem: "SP", importado: false, fornecedorSimples: false, valorProdutos: 100_000,
      aliquotaInterestadual: 7, aliquotaInterna: 20, regime: "antecipacao", icmsDevido: 13_000,
      percentualEfetivo: 13, fornecedor: `Fornecedor ${marca}`, observacao: "100% conferido",
    });

    const [achada] = await listarSimulacoes(marca);
    expect(achada).toMatchObject({ id, valorProdutos: 100_000, percentualEfetivo: 13, aliquotaIpi: null });
    expect((await listarSimulacoes("100%")).some((s) => s.id === id)).toBe(true);
    expect(await listarSimulacoes(`${marca}_x`)).toEqual([]);
  });
});
