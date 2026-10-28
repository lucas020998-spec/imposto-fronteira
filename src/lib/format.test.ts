import { describe, expect, it } from "vitest";
import { formatarMoeda, formatarPct, lerCentavos, lerNumero } from "./format";

describe("lerNumero", () => {
  it("aceita formato brasileiro, ponto decimal e símbolos", () => {
    expect(lerNumero("1.234,56")).toBe(1234.56);
    expect(lerNumero("1234.56")).toBe(1234.56);
    expect(lerNumero("R$ 10,5")).toBe(10.5);
    expect(lerNumero("35%")).toBe(35);
  });

  it("devolve undefined para vazio ou inválido", () => {
    expect(lerNumero("")).toBeUndefined();
    expect(lerNumero("abc")).toBeUndefined();
    expect(lerNumero("1,2,3")).toBeUndefined();
  });
});

describe("formatação", () => {
  it("converte centavos e percentuais para pt-BR", () => {
    expect(lerCentavos("1.000,10")).toBe(100_010);
    expect(formatarMoeda(100_010).replace(/\s/g, " ")).toBe("R$ 1.000,10");
    expect(formatarPct(46.3)).toBe("46,3%");
  });
});
