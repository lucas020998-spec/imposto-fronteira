// Importa o Anexo 05 do RICMS-PB (PDF da SEFAZ-PB ou CSV) para src/data/anexo5.json.
// Uso: pnpm anexo5:import caminho/ANEXO_05.pdf ["descrição da fonte"]
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import { montarItens, parseCsvAnexo5 } from "../src/lib/anexo5/parse.ts";
import { anexo5Schema } from "../src/lib/anexo5/schema.ts";
import { blocosDaPagina, type Bloco, type Retangulo, type Texto } from "../src/lib/anexo5/tabela.ts";

const [arquivo, fonte] = process.argv.slice(2);
if (!arquivo) {
  console.error('Informe o arquivo: pnpm anexo5:import ANEXO_05.pdf ["fonte"]');
  process.exit(1);
}

async function blocosDoPdf(conteudo: Buffer): Promise<Bloco[]> {
  const { OPS } = await getResolvedPDFJS();
  const pdf = await getDocumentProxy(new Uint8Array(conteudo));
  const blocos: Bloco[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pagina = await pdf.getPage(n);
    const textos: Texto[] = (await pagina.getTextContent()).items
      .filter((i) => "str" in i)
      .map((i) => ({ x: i.transform[4], y: i.transform[5], str: i.str }));
    const ops = await pagina.getOperatorList();
    // Cada constructPath traz [operação, caminho, limites]; os limites bastam para achar as bordas.
    const retangulos: Retangulo[] = ops.fnArray.flatMap((f, i) => {
      if (f !== OPS.constructPath) return [];
      const [x0, y0, x1, y1] = Array.from(ops.argsArray[i][2] as ArrayLike<number>);
      return [{ x0, y0, x1, y1 }];
    });
    blocos.push(...blocosDaPagina({ textos, retangulos }));
  }
  return blocos;
}

const conteudo = await readFile(arquivo);
const { itens, avisos } = arquivo.toLowerCase().endsWith(".csv")
  ? { itens: parseCsvAnexo5(conteudo.toString("utf8")), avisos: [] }
  : montarItens(await blocosDoPdf(conteudo));

const dados = anexo5Schema.parse({
  fonte: fonte ?? basename(arquivo),
  importadoEm: new Date().toISOString().slice(0, 10),
  itens,
});
await writeFile(new URL("../src/data/anexo5.json", import.meta.url), `${JSON.stringify(dados, null, 1)}\n`);

const semMva = itens.filter((i) => i.mva === null && !i.mvaAjustada).length;
console.log(`${itens.length} itens importados (${new Set(itens.map((i) => i.cest)).size} CEST, ${semMva} sem MVA percentual).`);
for (const a of avisos) console.warn(`Aviso: item ${a.item} (CEST ${a.cest}) ignorado, ${a.motivo}`);
console.log("Confira uma amostra com o PDF antes de usar.");
