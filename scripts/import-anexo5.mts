// Importa o Anexo 05 do RICMS-PB (PDF da SEFAZ-PB ou CSV) para src/data/anexo5.json.
// Uso: pnpm anexo5:import caminho/ANEXO_05.pdf ["descrição da fonte"]
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { parseCsvAnexo5, parseTextoAnexo5 } from "../src/lib/anexo5/parse.ts";
import { anexo5Schema } from "../src/lib/anexo5/schema.ts";

const [arquivo, fonte] = process.argv.slice(2);
if (!arquivo) {
  console.error("Informe o arquivo: pnpm anexo5:import ANEXO_05.pdf [\"fonte\"]");
  process.exit(1);
}

const conteudo = await readFile(arquivo);
const itens = arquivo.toLowerCase().endsWith(".csv")
  ? parseCsvAnexo5(conteudo.toString("utf8"))
  : parseTextoAnexo5((await extractText(await getDocumentProxy(new Uint8Array(conteudo)), { mergePages: true })).text);

const dados = anexo5Schema.parse({
  fonte: fonte ?? basename(arquivo),
  importadoEm: new Date().toISOString().slice(0, 10),
  itens,
});
await writeFile(new URL("../src/data/anexo5.json", import.meta.url), `${JSON.stringify(dados, null, 2)}\n`);

const semMva = itens.filter((i) => i.mva === null).length;
console.log(`${itens.length} itens importados (${semMva} sem MVA). Confira uma amostra com o PDF antes de usar.`);
