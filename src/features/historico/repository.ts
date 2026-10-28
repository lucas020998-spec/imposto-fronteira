import "server-only";
import { desc, ilike, or } from "drizzle-orm";
import { getDb } from "@/db";
import { simulacoes, type NovaSimulacao } from "@/db/schema";

const LIMITE = 50;

export async function inserirSimulacao(dados: NovaSimulacao) {
  const db = getDb();
  const [linha] = await db.insert(simulacoes).values(dados).returning({ id: simulacoes.id });
  return linha.id;
}

/** Últimas simulações, opcionalmente filtradas por NCM, fornecedor, observação ou descrição. */
export async function listarSimulacoes(busca: string) {
  const db = getDb();
  // Escapa curingas do LIKE para buscar o texto literal.
  const termo = `%${busca.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const filtro = busca
    ? or(
        ilike(simulacoes.ncm, termo),
        ilike(simulacoes.fornecedor, termo),
        ilike(simulacoes.observacao, termo),
        ilike(simulacoes.descricaoAnexo, termo),
      )
    : undefined;
  return db.select().from(simulacoes).where(filtro).orderBy(desc(simulacoes.criadaEm)).limit(LIMITE);
}
