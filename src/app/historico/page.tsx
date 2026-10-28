import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { temSessao } from "@/features/acesso/sessao";
import { buscaSchema } from "@/features/historico/input";
import { listarSimulacoes } from "@/features/historico/repository";
import { formatarMoeda, formatarPct } from "@/lib/format";
import { logger } from "@/lib/logger";

export const metadata: Metadata = { title: "Histórico · Imposto Fronteira PB" };

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" });

async function carregar(busca: string) {
  try {
    return await listarSimulacoes(busca);
  } catch (error) {
    logger.error({ code: (error as NodeJS.ErrnoException).code }, "Falha ao listar simulações");
    return null;
  }
}

export default async function Historico({ searchParams }: PageProps<"/historico">) {
  if (!(await temSessao())) redirect("/entrar?para=/historico");
  const busca = buscaSchema.parse((await searchParams).q);
  const linhas = await carregar(busca);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Histórico de simulações</h1>
      <p className="mt-2 text-muted">As 50 simulações mais recentes. Busque por NCM, fornecedor, observação ou descrição.</p>

      <form role="search" className="mt-6 flex gap-2">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input id="q" name="q" defaultValue={busca} placeholder="Ex.: 8708, Gerdau, pedido 123"
          className="w-full rounded-lg border border-line bg-background px-3 py-2" />
        <button className="rounded-lg border border-line px-4 py-2 font-medium hover:border-accent">Buscar</button>
      </form>

      {linhas === null && (
        <p role="alert" className="mt-6 rounded-xl border border-line p-5 text-sm">
          Não foi possível acessar o banco de dados. Confira a configuração do <code>DATABASE_URL</code>.
        </p>
      )}
      {linhas?.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-line p-5 text-sm text-muted">
          {busca ? `Nenhuma simulação encontrada para “${busca}”.` : "Nenhuma simulação salva ainda."}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {linhas?.map((s) => (
          <li key={s.id} className="rounded-xl border border-line bg-card p-4 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                NCM {s.ncm} · {s.ufOrigem}{s.importado && " (importado)"}
                {s.fornecedor && <span className="text-muted"> · {s.fornecedor}</span>}
              </p>
              <time dateTime={s.criadaEm.toISOString()} className="text-xs text-muted">{data.format(s.criadaEm)}</time>
            </div>
            <p className="mt-2 tabular-nums">
              <strong className="text-lg">{formatarPct(s.percentualEfetivo)}</strong>{" "}
              <span className="text-muted">
                · {formatarMoeda(s.icmsDevido)} sobre {formatarMoeda(s.valorProdutos)} ·{" "}
                {s.regime === "st" ? `ST, MVA ${formatarPct(s.mva ?? 0)}` : "antecipação parcial"}
                {s.fornecedorSimples && " · fornecedor do Simples"}
              </span>
            </p>
            {s.descricaoAnexo && <p className="mt-1 text-xs text-muted">CEST {s.cest} · {s.descricaoAnexo}</p>}
            {s.observacao && <p className="mt-2 whitespace-pre-line border-l-2 border-accent pl-3">{s.observacao}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
