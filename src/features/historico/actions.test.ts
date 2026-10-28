import { beforeEach, describe, expect, it, vi } from "vitest";
import { salvarSimulacao } from "./actions";
import { inserirSimulacao } from "./repository";
import { temSessao } from "@/features/acesso/sessao";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("./repository", () => ({ inserirSimulacao: vi.fn() }));
vi.mock("@/features/acesso/sessao", () => ({ temSessao: vi.fn() }));

const base = {
  ncm: "87089990", ufOrigem: "PE" as const, importado: false, fornecedorSimples: false,
  valorProdutos: 100_000, frete: 5_000, aliquotaIpi: 10, aliquotaInterna: 20, mvaManual: 33,
};

beforeEach(() => {
  vi.mocked(inserirSimulacao).mockResolvedValue(7);
  vi.mocked(temSessao).mockResolvedValue(true);
});

describe("salvarSimulacao", () => {
  it("recalcula no servidor e grava entrada, resultado e textos opcionais", async () => {
    const r = await salvarSimulacao({ ...base, fornecedor: "  Aço Forte  ", observacao: "" });
    expect(r).toEqual({ ok: true, id: 7 });
    expect(inserirSimulacao).toHaveBeenCalledWith(expect.objectContaining({
      ncm: "87089990", aliquotaInterestadual: 12, regime: "st",
      icmsDevido: 21_049, percentualEfetivo: 21.05, fornecedor: "Aço Forte", observacao: null,
    }));
  });

  it("busca MVA e alíquota no Anexo 05 pelo CEST, sem confiar no cliente", async () => {
    // Tubos de plástico para construção (CEST 10.006.00): MVA 33%, ajustada 54,61% para 7%.
    const r = await salvarSimulacao({
      ncm: "39173300", cest: "10.006.00", variante: null, ufOrigem: "SP", importado: false,
      fornecedorSimples: false, valorProdutos: 100_000, mva: 99, revenda: true,
    } as never);
    expect(r.ok).toBe(true);
    expect(inserirSimulacao).toHaveBeenCalledWith(expect.objectContaining({
      cest: "10.006.00", mva: 33, mvaAplicada: 54.61, aliquotaInterna: 20, icmsDevido: 23_922,
    }));
  });

  it("recusa CEST que não cobre o NCM informado", async () => {
    const r = await salvarSimulacao({ ...base, mvaManual: undefined, ncm: "87089990", cest: "10.006.00", variante: null });
    expect(r).toEqual({ ok: false, erro: expect.stringContaining("não encontrado") });
    expect(inserirSimulacao).not.toHaveBeenCalled();
  });

  it("ignora valores de resultado enviados pelo cliente", async () => {
    await salvarSimulacao({ ...base, icmsDevido: 1 } as never);
    expect(vi.mocked(inserirSimulacao).mock.calls[0][0].icmsDevido).toBe(21_049);
  });

  it("recusa gravar sem sessão válida", async () => {
    vi.mocked(temSessao).mockResolvedValue(false);
    const r = await salvarSimulacao(base);
    expect(r.ok).toBe(false);
    expect(inserirSimulacao).not.toHaveBeenCalled();
  });

  it("rejeita entrada inválida sem gravar", async () => {
    const r = await salvarSimulacao({ ...base, ncm: "12" });
    expect(r).toEqual({ ok: false, erro: "Informe o NCM com 4 a 8 dígitos" });
    expect(inserirSimulacao).not.toHaveBeenCalled();
  });

  it("devolve mensagem genérica quando o banco falha", async () => {
    vi.mocked(inserirSimulacao).mockImplementationOnce(async () => {
      throw Object.assign(new Error("senha=secreta"), { code: "ECONNREFUSED" });
    });
    const r = await salvarSimulacao(base);
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).not.toContain("secreta");
  });
});
