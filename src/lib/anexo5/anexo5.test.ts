import { describe, expect, it } from "vitest";
import { buscarPorNcm } from "./lookup";
import { parseCsvAnexo5, parseTextoAnexo5 } from "./parse";

// Trecho sintético no formato ITEM | CEST | NCM/SH | DESCRIÇÃO | MVA; não são dados oficiais.
const TEXTO = `
1. AUTOPEÇAS
ITEM CEST NCM/SH DESCRIÇÃO MVA
1.0 01.001.00 3815.12.10 3815.12.90 Catalisadores em colmeia cerâmica 71,78%
2.0 01.002.00 3917 Tubos e seus acessórios, de plásticos 71,78 %
3.0 01.003.00 4009.31.00 Mangueiras e tubos de borracha vulcanizada
4.0 01.004.00 8708 e 8714.10 Partes e acessórios 50%
`;

describe("parseTextoAnexo5", () => {
  const itens = parseTextoAnexo5(TEXTO);

  it("extrai CEST, NCMs, descrição e MVA de cada linha", () => {
    expect(itens).toHaveLength(4);
    expect(itens[0]).toEqual({
      cest: "01.001.00", ncms: ["38151210", "38151290"],
      descricao: "Catalisadores em colmeia cerâmica", mva: 71.78,
    });
    expect(itens[1]).toMatchObject({ ncms: ["3917"], mva: 71.78 });
    expect(itens[3]).toMatchObject({ ncms: ["8708", "871410"], mva: 50 });
  });

  it("não mistura o número do próximo item na descrição e aceita linha sem MVA", () => {
    expect(itens[2]).toEqual({
      cest: "01.003.00", ncms: ["40093100"],
      descricao: "Mangueiras e tubos de borracha vulcanizada", mva: null,
    });
  });
});

describe("parseCsvAnexo5", () => {
  it("lê CSV com ponto e vírgula e MVA com vírgula decimal", () => {
    const csv = "CEST;NCM;Descricao;MVA\n01.001.00;3815.12.10, 3815.12.90;Catalisadores;71,78%\n01.002.00;3917;Tubos;";
    expect(parseCsvAnexo5(csv)).toEqual([
      { cest: "01.001.00", ncms: ["38151210", "38151290"], descricao: "Catalisadores", mva: 71.78 },
      { cest: "01.002.00", ncms: ["3917"], descricao: "Tubos", mva: null },
    ]);
  });

  it("acusa coluna ausente", () => {
    expect(() => parseCsvAnexo5("cest;ncm;mva\n1;2;3")).toThrow(/descricao/);
  });
});

describe("buscarPorNcm", () => {
  const itens = parseTextoAnexo5(TEXTO);

  it("casa pelo prefixo e ignora pontuação", () => {
    expect(buscarPorNcm(itens, "8708.99.90").map((c) => c.item.cest)).toEqual(["01.004.00"]);
    expect(buscarPorNcm(itens, "39173300")[0].prefixo).toBe("3917");
  });

  it("ordena do prefixo mais específico ao mais genérico", () => {
    const comGenerico = [...itens, { cest: "99.999.99", ncms: ["38"], descricao: "x", mva: 10 }];
    expect(buscarPorNcm(comGenerico, "38151210").map((c) => c.prefixo)).toEqual(["38151210", "38"]);
  });

  it("não busca com menos de 4 dígitos nem devolve falsos positivos", () => {
    expect(buscarPorNcm(itens, "38")).toEqual([]);
    expect(buscarPorNcm(itens, "9999.99.99")).toEqual([]);
  });
});
