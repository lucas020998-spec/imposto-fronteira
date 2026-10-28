// Converte o texto extraído do PDF do Anexo 05 (RICMS-PB) ou um CSV em itens com CEST, NCM e MVA.
// Imports relativos com extensão: este módulo também roda em Node, pelo script de importação.
import type { ItemAnexo5 } from "./schema.ts";

const CEST = /\b\d{2}\.\d{3}\.\d{2}\b/g;
const NCM = /^\d{4}(?:\.\d{1,2}){0,3}$|^\d{2,8}$/;
const PERCENTUAL = /(\d{1,3}(?:[.,]\d{1,2})?)\s*%/;

export const normalizarNcm = (ncm: string) => ncm.replace(/\D/g, "");

const numero = (texto: string) => Number(texto.replace(",", "."));

/** Lê o texto do PDF usando cada CEST como início de linha da tabela. */
export function parseTextoAnexo5(texto: string): ItemAnexo5[] {
  const plano = texto.replace(/\s+/g, " ");
  const ancoras = [...plano.matchAll(CEST)];
  return ancoras.flatMap((ancora, i) => {
    const inicio = ancora.index + ancora[0].length;
    const fim = ancoras[i + 1]?.index ?? plano.length;
    // O número do próximo item vem logo antes do próximo CEST; não faz parte desta linha.
    const trecho = plano.slice(inicio, fim).replace(/\s\d{1,3}(?:\.\d{1,2})?\s*$/, "");
    const item = parseLinha(ancora[0], trecho);
    return item ? [item] : [];
  });
}

function parseLinha(cest: string, trecho: string): ItemAnexo5 | null {
  const tokens = trecho.trim().split(" ");
  const ncms: string[] = [];
  let i = 0;
  for (; i < tokens.length; i++) {
    const token = tokens[i].replace(/[,;]$/, "");
    if (NCM.test(token)) ncms.push(normalizarNcm(token));
    else if (token !== "e" || ncms.length === 0) break;
  }
  if (ncms.length === 0) return null;

  const resto = tokens.slice(i).join(" ");
  const percentual = PERCENTUAL.exec(resto);
  const descricao = (percentual ? resto.slice(0, percentual.index) : resto).trim();
  return { cest, ncms, descricao, mva: percentual ? numero(percentual[1]) : null };
}

/** CSV com cabeçalho cest;ncm;descricao;mva (NCMs separados por vírgula ou espaço). */
export function parseCsvAnexo5(csv: string): ItemAnexo5[] {
  const [cabecalho, ...linhas] = csv.trim().split(/\r?\n/);
  const sep = cabecalho.includes(";") ? ";" : ",";
  const colunas = cabecalho.toLowerCase().split(sep).map((c) => c.trim());
  const col = (nome: string) => {
    const idx = colunas.indexOf(nome);
    if (idx < 0) throw new Error(`Coluna "${nome}" ausente no CSV`);
    return idx;
  };
  const [cCest, cNcm, cDesc, cMva] = ["cest", "ncm", "descricao", "mva"].map(col);

  return linhas.filter((l) => l.trim()).flatMap((linha) => {
    const v = linha.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const ncms = v[cNcm].split(/[\s,]+/).map(normalizarNcm).filter(Boolean);
    if (ncms.length === 0) return [];
    const mva = v[cMva] ? numero(v[cMva].replace("%", "")) : null;
    return [{ cest: v[cCest], ncms, descricao: v[cDesc], mva: Number.isNaN(mva) ? null : mva }];
  });
}
