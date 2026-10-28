// Reconstrói as linhas da tabela do Anexo 05 a partir da geometria do PDF: textos com posição
// e as bordas horizontais desenhadas de cada célula. Funções puras, sem dependência de PDF.

export interface Texto { x: number; y: number; str: string }
/** Retângulo fino desenhado na página (borda de célula). */
export interface Retangulo { x0: number; y0: number; x1: number; y1: number }
export interface Pagina { textos: Texto[]; retangulos: Retangulo[] }

export const COLUNAS = ["item", "cest", "ncm", "descricao", "legislacao", "mva", "aliquota"] as const;
export type Coluna = (typeof COLUNAS)[number];
export type Celulas = Record<Coluna, string>;

/** Linha da tabela ou texto fora dela (títulos de segmento e notas de alteração). */
export type Bloco =
  | { tipo: "linha"; celulas: Celulas; ultimaDaPagina: boolean }
  | { tipo: "fora"; texto: string };

const TOL = 2;
const horizontal = (r: Retangulo) => r.y1 - r.y0 < 2 && r.x1 - r.x0 > 20;
const vertical = (r: Retangulo) => r.x1 - r.x0 < 2 && r.y1 - r.y0 > 5;

/** Bordas divididas em 7 células: y → início de cada coluna naquela altura. */
function gradesDaPagina(bordas: Retangulo[]): Map<number, number[]> {
  const porY = new Map<number, Retangulo[]>();
  for (const b of bordas) {
    const y = Math.round(b.y0);
    porY.set(y, [...(porY.get(y) ?? []), b]);
  }
  const grades = new Map<number, number[]>();
  for (const [y, linha] of porY) {
    const xs = [...new Set(linha.map((b) => Math.round(b.x0)))].sort((a, b) => a - b);
    if (xs.length === COLUNAS.length) grades.set(y, xs);
  }
  return grades;
}

/** Colunas da grade mais próxima acima de y (ou, se não houver, abaixo). */
function colunasEm(grades: Map<number, number[]>, y: number): number[] {
  const ys = [...grades.keys()];
  const acima = ys.filter((g) => g >= y - TOL).sort((a, b) => a - b)[0];
  const abaixo = ys.filter((g) => g < y).sort((a, b) => b - a)[0];
  return grades.get(acima ?? abaixo)!;
}

function juntar(textos: Texto[]): string {
  return textos
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((t) => t.str.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

export function blocosDaPagina({ textos, retangulos }: Pagina): Bloco[] {
  const bordas = retangulos.filter(horizontal);
  const grades = gradesDaPagina(bordas);
  if (grades.size === 0) {
    const texto = juntar(textos.slice());
    return texto ? [{ tipo: "fora", texto }] : [];
  }
  // Uma página pode ter tabelas com larguras diferentes: cada uma tem sua borda esquerda.
  const inicios = [...new Set([...grades.values()].map((xs) => xs[0]))];
  const perto = (x: number) => inicios.some((i) => Math.abs(x - i) < 3);

  // Área da tabela: faixas verticais cobertas pela borda esquerda da coluna ITEM.
  const esquerda = retangulos.filter((r) => vertical(r) && perto(r.x0));
  const naTabela = (t: Texto) => esquerda.some((r) => t.y >= r.y0 - TOL && t.y <= r.y1 + TOL);

  // Linhas da tabela: separadas por bordas que começam na coluna ITEM.
  const ys = [...new Set(bordas.filter((b) => perto(b.x0)).map((b) => b.y0))].sort((a, b) => b - a);
  const limites = [Infinity, ...ys, -Infinity];

  const blocos: { topo: number; bloco: Bloco }[] = [];
  const fora = textos.filter((t) => t.str.trim() && !naTabela(t));
  // Textos fora da tabela viram blocos agrupados por proximidade vertical.
  for (const grupo of agruparPorProximidade(fora)) blocos.push({ topo: grupo[0].y, bloco: { tipo: "fora", texto: juntar(grupo) } });

  const dentro = textos.filter((t) => t.str.trim() && naTabela(t));
  for (let i = 0; i < limites.length - 1; i++) {
    const [topo, base] = [limites[i], limites[i + 1]];
    const faixa = dentro.filter((t) => t.y < topo && t.y > base);
    if (faixa.length === 0) continue;
    const colunas = colunasEm(grades, Math.min(topo, Math.max(...faixa.map((t) => t.y))));
    const celulas = Object.fromEntries(
      COLUNAS.map((c, idx) => {
        const ini = idx === 0 ? -Infinity : colunas[idx] - TOL * 2;
        const fim = idx === COLUNAS.length - 1 ? Infinity : colunas[idx + 1] - TOL * 2;
        return [c, juntar(faixa.filter((t) => t.x >= ini && t.x < fim))];
      }),
    ) as Celulas;
    blocos.push({ topo: Math.max(...faixa.map((t) => t.y)), bloco: { tipo: "linha", celulas, ultimaDaPagina: false } });
  }

  blocos.sort((a, b) => b.topo - a.topo);
  const linhas = blocos.filter((b) => b.bloco.tipo === "linha");
  const ultima = linhas.at(-1)?.bloco;
  if (ultima?.tipo === "linha") ultima.ultimaDaPagina = true;
  return blocos.map((b) => b.bloco);
}

function agruparPorProximidade(textos: Texto[]): Texto[][] {
  const ordenados = textos.slice().sort((a, b) => b.y - a.y || a.x - b.x);
  const grupos: Texto[][] = [];
  for (const t of ordenados) {
    const atual = grupos.at(-1);
    if (atual && atual.at(-1)!.y - t.y < 20) atual.push(t);
    else grupos.push([t]);
  }
  return grupos;
}
