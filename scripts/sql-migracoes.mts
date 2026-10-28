// Gera um único SQL com todas as migrações de drizzle/, para colar no editor SQL do provedor
// (ex.: Neon) quando não há como rodar `pnpm db:migrate`. Registra cada migração na mesma tabela
// do Drizzle, então um `db:migrate` posterior aplica só as novas.
// Uso: pnpm db:sql > migracoes.sql   (só em banco novo, sem a tabela simulacoes)
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const pasta = new URL("../drizzle/", import.meta.url);
const journal = JSON.parse(await readFile(new URL("meta/_journal.json", pasta), "utf8")) as {
  entries: { tag: string; when: number }[];
};

const partes = [
  "-- Gerado por `pnpm db:sql`. Rode uma vez, em banco novo.",
  "BEGIN;",
  'CREATE SCHEMA IF NOT EXISTS "drizzle";',
  'CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint);',
];
for (const { tag, when } of journal.entries) {
  const sql = await readFile(new URL(`${tag}.sql`, pasta), "utf8");
  // Mesmo hash que o migrador do Drizzle calcula para o arquivo.
  const hash = createHash("sha256").update(sql).digest("hex");
  partes.push(`\n-- ${tag}`, ...sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean).map((s) => (s.endsWith(";") ? s : `${s};`)));
  partes.push(`INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ('${hash}', ${when});`);
}
partes.push("COMMIT;");
process.stdout.write(`${partes.join("\n")}\n`);
