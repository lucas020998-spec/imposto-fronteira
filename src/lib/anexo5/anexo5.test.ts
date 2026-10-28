import { describe, expect, it } from "vitest";
import { buscarPorNcm, itemEscolhido } from "./lookup";
import { lerAliquota, lerMva, montarItens, parseCsvAnexo5 } from "./parse";
import type { ItemAnexo5 } from "./schema";
import { blocosDaPagina, type Bloco, type Celulas, type Retangulo, type Texto } from "./tabela";

// Textos de MVA no formato do Anexo 05 vigente (09/07/2025); valores de itens reais.
const MVA_SIMPLES = "Operação Interna (Original) = 33% Op. Interestadual c/ 4% = 59,60% Op. Interestadual c/ 7% =54,61 % Op. Interestadual c/ 12% = 46,30%";

describe("lerMva", () => {
  it("lê a original e as ajustadas por alíquota interestadual", () => {
    expect(lerMva(MVA_SIMPLES)).toEqual([
      { variante: null, mva: 33, mvaAjustada: { 4: 59.6, 7: 54.61, 12: 46.3 }, mvaTexto: null },
    ]);
  });

  it("separa variantes (contrato de fidelidade, listas de medicamentos)", () => {
    const r = lerMva("Com contrato de fidelidade Operação Interna (Original) = 36,56% Op. Interestadual c/ 4% = 63,87% Sem contrato de fidelidade Operação Interna (Original) = 71,78% Op. Interestadual c/ 12% = 88,96");
    expect(r.map((m) => [m.variante, m.mva, m.mvaAjustada])).toEqual([
      ["Com contrato de fidelidade", 36.56, { 4: 63.87 }],
      ["Sem contrato de fidelidade", 71.78, { 12: 88.96 }],
    ]);
  });

  it("usa a MVA por procedência como valor final", () => {
    const r = lerMva("Proveniente de UF signatária = 20% Proveniente do Exterior ou UF não signatária = 35% Op. Interna (Original) = 10%");
    expect(r).toEqual([
      { variante: "Exterior ou UF não signatária", mva: 35, mvaAjustada: { 4: 35, 7: 35, 12: 35 }, mvaTexto: null },
      { variante: "UF signatária", mva: 20, mvaAjustada: { 4: 20, 7: 20, 12: 20 }, mvaTexto: null },
    ]);
  });

  it("aceita MVA única interestadual, percentual solto e valores sem percentual", () => {
    expect(lerMva("Operação Interna (Original) = 30% Op. Interestadual = 58,54%")[0].mvaAjustada).toEqual({ 4: 58.54, 7: 58.54, 12: 58.54 });
    expect(lerMva("140%")[0]).toMatchObject({ mva: 140, mvaAjustada: null });
    expect(lerMva("AD REM")).toEqual([{ variante: null, mva: null, mvaAjustada: null, mvaTexto: "AD REM" }]);
  });
});

describe("lerAliquota", () => {
  it("separa alíquota e FUNCEP e não adivinha alíquotas condicionais", () => {
    expect(lerAliquota("20%")).toMatchObject({ aliquota: 20, fcp: 0 });
    expect(lerAliquota("25%+2% (FUNCEP)")).toMatchObject({ aliquota: 25, fcp: 2 });
    expect(lerAliquota("Sem gás = 20% Com gás = 20% + 2% (FUNCEP para bebidas gaseificadas)")).toMatchObject({ aliquota: null, fcp: 0 });
    expect(lerAliquota("20% + 2% (FUNCEP) para banheiras de hidromassagem")).toMatchObject({ aliquota: null });
  });
});

const vazias: Celulas = { item: "", cest: "", ncm: "", descricao: "", legislacao: "", mva: "", aliquota: "" };
const linha = (c: Partial<Celulas>, ultimaDaPagina = false): Bloco => ({ tipo: "linha", celulas: { ...vazias, ...c }, ultimaDaPagina });
const fora = (texto: string): Bloco => ({ tipo: "fora", texto });

describe("montarItens", () => {
  it("junta linhas cortadas pela quebra de página nos dois sentidos", () => {
    const { itens } = montarItens([
      fora("MATERIAIS DE CONSTRUÇÃO E CONGÊNERES ITEM CEST NCM/SH DESCRIÇÃO"),
      linha({ item: "5.0", cest: "10.005.00", ncm: "3916", descricao: "Revestimentos de PVC e", mva: "Operação Interna (Original) = 44% Op. Interestadual c/", aliquota: "20%" }, true),
      linha({ descricao: "outros plásticos", mva: "4% = 72,80%" }),
      linha({ item: "13.0", ncm: "3925.10", descricao: "Reservatórios" }, true), // número do item numa página…
      linha({ cest: "10.013.00", mva: "Operação Interna (Original) = 39%", aliquota: "20%" }), // …CEST na outra
    ]);
    expect(itens.map((i) => [i.item, i.cest, i.ncms, i.descricao, i.mva, i.mvaAjustada])).toEqual([
      ["5.0", "10.005.00", ["3916"], "Revestimentos de PVC e outros plásticos", 44, { 4: 72.8 }],
      ["13.0", "10.013.00", ["392510"], "Reservatórios", 39, null],
    ]);
    expect(itens[0].segmento).toBe("MATERIAIS DE CONSTRUÇÃO E CONGÊNERES");
  });

  it("pula itens revogados e redações substituídas, mantendo os acrescidos", () => {
    const { itens } = montarItens([
      fora("COMBUSTÍVEIS E LUBRIFICANTES"),
      linha({ item: "4.0", cest: "06.004.00", ncm: "2710.19.19", mva: "Op. Interestadual = 58,54%" }),
      linha({ item: "Nova redação dada ao item 4.0 do segmento COMBUSTÍVEIS E LUBRIFICANTES pelo inciso I do art. 1º" }),
      linha({ item: "4.0", cest: "06.004.00", ncm: "2710.19.19", mva: MVA_SIMPLES }),
      linha({ item: "Revogado o item 7.0 do segmento COMBUSTÍVEIS E LUBRIFICANTES pelo art. 2º" }),
      linha({ item: "7.0", cest: "06.007.00", ncm: "2710.19.3", mva: "30%" }),
      linha({ item: "Acrescido o item 19.1 ao segmento COMBUSTÍVEIS E LUBRIFICANTES pelo art. 1º" }),
      linha({ item: "19.1", cest: "06.019.00", ncm: "2710.12.49", mva: "AD REM" }),
    ]);
    expect(itens.map((i) => [i.cest, i.mva])).toEqual([["06.004.00", 33], ["06.019.00", null]]);
    expect(itens[1].descricao).toBe("");
  });

  it("descarta redações anteriores de um segmento inteiro", () => {
    const { itens } = montarItens([
      fora("PRODUTOS ALIMENTÍCIOS"),
      linha({ item: "1.0", cest: "17.001.00", ncm: "1704.90.10", mva: "30%" }),
      fora("Nova redação dada ao segmento PRODUTOS ALIMENTÍCIOS pelo inciso III do art. 1º. OBS: … nova redação dada ao segmento PRODUTOS ALIMENTÍCIOS, no período"),
      fora("PRODUTOS ALIMENTÍCIOS"),
      linha({ item: "1.0", cest: "17.001.00", ncm: "1704.90.10", mva: "35%" }),
    ]);
    expect(itens.map((i) => i.mva)).toEqual([35]);
  });

  it("avisa sobre linhas sem NCM em vez de inventar", () => {
    const r = montarItens([linha({ item: "999.0", cest: "01.999.00", descricao: "Outras peças" })]);
    expect(r.itens).toEqual([]);
    expect(r.avisos).toEqual([{ item: "999.0", cest: "01.999.00", motivo: expect.stringContaining("sem NCM") }]);
  });
});

describe("blocosDaPagina", () => {
  // Grade de 7 colunas com bordas por célula, como no PDF da SEFAZ-PB.
  const xs = [86, 121, 165, 215, 299, 367, 428, 484];
  const borda = (y: number): Retangulo[] => xs.slice(0, -1).map((x, i) => ({ x0: x, y0: y, x1: xs[i + 1] - 0.5, y1: y + 0.5 }));
  const esquerda: Retangulo = { x0: 85.5, y0: 200, x1: 86, y1: 700 };
  const t = (x: number, y: number, str: string): Texto => ({ x, y, str });

  it("agrupa textos por linha e coluna e separa notas fora da tabela", () => {
    const blocos = blocosDaPagina({
      retangulos: [...borda(700), ...borda(600), ...borda(400), esquerda],
      textos: [
        t(250, 750, "TINTAS E VERNIZES"),
        t(97, 520, "1.0"), t(125, 520, "24.001.00"), t(170, 590, "3208"), t(170, 578, "3209"),
        t(218, 560, "Tintas,"), t(218, 548, "vernizes"), t(370, 580, "Operação Interna (Original) = 35%"), t(447, 520, "20%"),
        t(97, 300, "2.0"), t(125, 300, "24.002.00"), t(170, 300, "3212"),
      ],
    });
    expect(blocos[0]).toEqual({ tipo: "fora", texto: "TINTAS E VERNIZES" });
    expect(blocos[1]).toMatchObject({ tipo: "linha", celulas: { item: "1.0", cest: "24.001.00", ncm: "3208 3209", descricao: "Tintas, vernizes", aliquota: "20%" } });
    expect(blocos[2]).toMatchObject({ tipo: "linha", celulas: { item: "2.0", ncm: "3212" }, ultimaDaPagina: true });
  });
});

describe("parseCsvAnexo5", () => {
  it("lê CSV com ponto e vírgula e MVA com vírgula decimal", () => {
    const csv = "CEST;NCM;Descricao;MVA\n01.001.00;3815.12.10, 3815.12.90;Catalisadores;71,78%\n01.002.00;3917;Tubos;";
    expect(parseCsvAnexo5(csv).map((i) => [i.cest, i.ncms, i.mva])).toEqual([
      ["01.001.00", ["38151210", "38151290"], 71.78],
      ["01.002.00", ["3917"], null],
    ]);
  });

  it("acusa coluna ausente", () => {
    expect(() => parseCsvAnexo5("cest;ncm;mva\n1;2;3")).toThrow(/descricao/);
  });
});

describe("busca", () => {
  const item = (cest: string, ncms: string[], variante: string | null = null): ItemAnexo5 => ({
    segmento: "", item: "", cest, ncms, descricao: "", variante, mva: 30, mvaAjustada: null,
    mvaTexto: null, aliquota: 20, fcp: 0, aliquotaTexto: "20%",
  });
  const itens = [item("01.075.00", ["8708"], "Com contrato de fidelidade"), item("01.075.00", ["8708"], "Sem contrato de fidelidade"), item("99.999.99", ["38"]), item("01.001.00", ["38151210"])];

  it("casa pelo prefixo, ignora pontuação e ordena do mais específico", () => {
    expect(buscarPorNcm(itens, "8708.99.90")).toHaveLength(2);
    expect(buscarPorNcm(itens, "38151210").map((c) => c.prefixo)).toEqual(["38151210", "38"]);
    expect(buscarPorNcm(itens, "38")).toEqual([]);
    expect(buscarPorNcm(itens, "9999.99.99")).toEqual([]);
  });

  it("acha o item escolhido por CEST e variante, só se cobrir o NCM", () => {
    expect(itemEscolhido(itens, "87089990", "01.075.00", "Sem contrato de fidelidade")?.variante).toBe("Sem contrato de fidelidade");
    expect(itemEscolhido(itens, "39173300", "01.075.00", "Sem contrato de fidelidade")).toBeUndefined();
  });
});
