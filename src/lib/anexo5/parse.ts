// Converte as linhas da tabela do Anexo 05 (RICMS-PB) ou um CSV em itens com CEST, NCM e MVA.
// Imports relativos com extensão: este módulo também roda em Node, pelo script de importação.
import type { ItemAnexo5 } from "./schema.ts";
import type { Bloco, Celulas } from "./tabela.ts";

const NCM = /^\d{4}(?:\.\d{1,2}){0,3}$|^\d{2,8}$/;
const ITEM = /^\d+(?:\.\d+)+$/;
const CEST = /^\d{2}\.\d{3}\.\d{2}$/;
const NUM = String.raw`(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)`;

export const normalizarNcm = (ncm: string) => ncm.replace(/\D/g, "");
const numero = (texto: string) => Number(texto.replace(/\./g, "").replace(",", "."));

/**
 * Identifica a linha pelo CEST, separando "item" e "cest" mesmo quando o PDF junta as duas
 * células ("21.5 03.021.05"). O número do item pode faltar se ficou na página anterior.
 */
function ancora(c: Celulas): { item: string; cest: string } | null {
  const tokens = `${c.item} ${c.cest}`.trim().split(/\s+/);
  const cest = tokens.find((t) => CEST.test(t));
  return cest ? { item: tokens.find((t) => ITEM.test(t) && !CEST.test(t)) ?? "", cest } : null;
}

const ROTULOS = /(Com contrato de fidelidade|Sem contrato de fidelidade|Lista Positiva|Lista Neutra|Lista Negativa|Lubrificantes Não derivados de petróleo|Não derivados de petróleo|Derivados de petróleo)/;

type Mva = Pick<ItemAnexo5, "variante" | "mva" | "mvaAjustada" | "mvaTexto">;

/** Lê a coluna MVA, que pode trazer várias variantes, cada uma com a original e as ajustadas. */
export function lerMva(texto: string): Mva[] {
  const limpo = texto.replace(/\s+/g, " ").replace(/\s*%/g, "%").replace(/Op\s*\.\s*/g, "Op. ").trim();
  const partes = limpo.split(ROTULOS);
  const trechos: [string | null, string][] = [];
  if (partes[0].trim()) trechos.push([null, partes[0]]);
  for (let i = 1; i < partes.length; i += 2) trechos.push([partes[i], partes[i + 1] ?? ""]);

  const mvas = trechos.flatMap(([rotulo, t]) => lerTrecho(rotulo, t));
  return mvas.length ? mvas : [{ variante: null, mva: null, mvaAjustada: null, mvaTexto: limpo || null }];
}

function lerTrecho(variante: string | null, t: string): Mva[] {
  // MVA por procedência (bebidas): cada valor já é o aplicável na entrada.
  const signataria = new RegExp(String.raw`Proveniente de UF signatária\s*=\s*${NUM}%`).exec(t);
  const naoSignataria = new RegExp(String.raw`UF não signatária\s*=\s*${NUM}%`).exec(t);
  if (signataria || naoSignataria) {
    return [
      ...(naoSignataria ? [fixa(juntarRotulo(variante, "Exterior ou UF não signatária"), numero(naoSignataria[1]))] : []),
      ...(signataria ? [fixa(juntarRotulo(variante, "UF signatária"), numero(signataria[1]))] : []),
    ];
  }

  const original = new RegExp(String.raw`Original\)?\s*=\s*${NUM}%?`).exec(t);
  const ajustadas: NonNullable<Mva["mvaAjustada"]> = {};
  for (const m of t.matchAll(new RegExp(String.raw`c/\s*(4|7|12)%\s*=\s*${NUM}`, "g"))) {
    ajustadas[Number(m[1]) as 4 | 7 | 12] = numero(m[2]);
  }
  const unica = new RegExp(String.raw`Interestadual\s*=\s*${NUM}%`).exec(t);
  if (unica) for (const a of [4, 7, 12] as const) ajustadas[a] ??= numero(unica[1]);

  const temAjustada = Object.keys(ajustadas).length > 0;
  if (original || temAjustada) {
    return [{ variante, mva: original ? numero(original[1]) : null, mvaAjustada: temAjustada ? ajustadas : null, mvaTexto: null }];
  }
  const solta = new RegExp(String.raw`^${NUM}%$`).exec(t.trim());
  if (solta) return [{ variante, mva: numero(solta[1]), mvaAjustada: null, mvaTexto: null }];
  return t.trim() ? [{ variante, mva: null, mvaAjustada: null, mvaTexto: t.trim() }] : [];
}

const fixa = (variante: string, v: number): Mva => ({ variante, mva: v, mvaAjustada: { 4: v, 7: v, 12: v }, mvaTexto: null });
const juntarRotulo = (a: string | null, b: string) => (a ? `${a} · ${b}` : b);

/** Alíquota interna e FUNCEP. Condições ("Com gás = …", "quando…") ficam só no texto. */
export function lerAliquota(texto: string): Pick<ItemAnexo5, "aliquota" | "fcp" | "aliquotaTexto"> {
  const aliquotaTexto = texto.replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();
  const condicional = /gás|quando|para /i.test(aliquotaTexto);
  const m = new RegExp(String.raw`^${NUM}%(?:\s*\+\s*${NUM}%)?`).exec(aliquotaTexto);
  if (!m || condicional) return { aliquota: m && !condicional ? numero(m[1]) : null, fcp: 0, aliquotaTexto };
  return { aliquota: numero(m[1]), fcp: m[2] ? numero(m[2]) : 0, aliquotaTexto };
}

const NOTA = /^(Revogad|Nova redação|Efeitos|OBS|Acrescid|Acrescentad)/i;
const REVOGADO = /Revogad[oa]s? (?:o |os )?ite(?:m|ns) ([\d.]+(?:(?:,| e) [\d.]+)*)/gi;
// "Nova" com maiúscula: a OBS seguinte repete "nova redação dada ao item…" e não deve contar de novo.
const NOVO_ITEM = /Nova redação dada ao item ([\d.]+) do segmento (.+?) pel[oa] /g;
const NOVO_SEGMENTO = /Nova redação dada ao segmento (.+?) pel[oa] /g;
const mesmoSegmento = (a: string, b: string) => {
  const n = (x: string) => x.toLocaleUpperCase("pt-BR").replace(/^DE /, "").trim();
  return n(a).startsWith(n(b)) || n(b).startsWith(n(a));
};
const TITULO = (s: string) => s.length > 3 && s === s.toUpperCase() && !/\d|%/.test(s);

export interface Aviso { item: string; cest: string; motivo: string }

/** Monta os itens vigentes a partir dos blocos das páginas, pulando os revogados. */
export function montarItens(blocos: Bloco[]): { itens: ItemAnexo5[]; avisos: Aviso[] } {
  // Revogadas e redações substituídas continuam impressas no PDF; ficam marcadas para sair.
  const linhas: { segmento: string; item: string; cest: string; celulas: Celulas; revogado: boolean }[] = [];
  const revogados = new Set<string>();
  let segmento = "";
  let pendente: Celulas | null = null;

  const registrarNota = (texto: string) => {
    for (const m of texto.matchAll(REVOGADO)) for (const n of m[1].split(/,| e /)) revogados.add(n.trim());
    // A redação antiga vem antes da nota; a nova, depois.
    for (const [, item, seg] of texto.matchAll(NOVO_ITEM)) {
      const antiga = linhas.findLast((l) => l.item === item && mesmoSegmento(l.segmento, seg));
      if (antiga) antiga.revogado = true;
    }
    for (const [, seg] of texto.matchAll(NOVO_SEGMENTO)) {
      for (const l of linhas) if (mesmoSegmento(l.segmento, seg)) l.revogado = true;
    }
  };
  const anexar = (alvo: Celulas, extra: Celulas, antes = false) => {
    for (const k of Object.keys(alvo) as (keyof Celulas)[]) {
      alvo[k] = (antes ? [extra[k], alvo[k]] : [alvo[k], extra[k]]).filter(Boolean).join(" ");
    }
  };

  for (const bloco of blocos) {
    if (bloco.tipo === "fora") {
      registrarNota(bloco.texto);
      const titulo = bloco.texto.split(/ ITEM CEST/)[0].trim();
      if (TITULO(titulo)) segmento = titulo;
      continue;
    }
    const c = bloco.celulas;
    const texto = Object.values(c).filter(Boolean).join(" ");
    if (/^ITEM\b/.test(c.item) && /CEST/.test(c.cest)) continue;
    if (NOTA.test(c.item) || NOTA.test(texto)) {
      registrarNota(texto);
      continue;
    }
    if (TITULO(texto)) {
      segmento = texto;
      continue;
    }
    // Linha cortada pela quebra de página: o fim da página sem CEST é o começo da linha seguinte.
    const celulas = { ...c };
    if (pendente) anexar(celulas, pendente, true);
    pendente = null;
    const a = ancora(celulas);
    if (a) linhas.push({ segmento, ...a, celulas, revogado: revogados.delete(a.item) });
    else if (bloco.ultimaDaPagina) pendente = celulas;
    else {
      const anterior = linhas.at(-1);
      if (anterior) anexar(anterior.celulas, celulas);
    }
  }

  const itens: ItemAnexo5[] = [];
  const avisos: Aviso[] = [];
  for (const l of linhas.filter((x) => !x.revogado)) {
    const ncms = l.celulas.ncm.split(/[\s,;]+/).filter((t) => NCM.test(t)).map(normalizarNcm);
    if (ncms.length === 0) {
      avisos.push({ item: l.item, cest: l.cest, motivo: `sem NCM reconhecível: "${l.celulas.ncm}"` });
      continue;
    }
    const aliquota = lerAliquota(l.celulas.aliquota);
    for (const mva of lerMva(l.celulas.mva)) {
      itens.push({ segmento: l.segmento, item: l.item, cest: l.cest, ncms, descricao: l.celulas.descricao, ...mva, ...aliquota });
    }
  }
  return { itens, avisos };
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
    return [{
      segmento: "", item: "", cest: v[cCest], ncms, descricao: v[cDesc], variante: null,
      mva: Number.isNaN(mva) ? null : mva, mvaAjustada: null, mvaTexto: null,
      aliquota: null, fcp: 0, aliquotaTexto: "",
    }];
  });
}
