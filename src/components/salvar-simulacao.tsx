"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { salvarSimulacao, type ResultadoSalvar } from "@/features/historico/actions";
import type { SalvarSimulacaoInput } from "@/features/historico/input";

type Dados = Omit<SalvarSimulacaoInput, "fornecedor" | "observacao">;

const campo = "mt-1 w-full rounded-lg border border-line bg-background px-3 py-2";

/** Salva a simulação atual no histórico, com fornecedor e observação opcionais. */
export function SalvarSimulacao({ dados }: { dados: Dados | undefined }) {
  const [fornecedor, setFornecedor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<ResultadoSalvar>();
  const [salvando, iniciar] = useTransition();
  const faltaNcm = !dados || dados.ncm.length < 4;

  function salvar() {
    if (!dados || faltaNcm) return;
    iniciar(async () => {
      const r = await salvarSimulacao({ ...dados, fornecedor, observacao });
      setStatus(r);
      if (r.ok) {
        setFornecedor("");
        setObservacao("");
      }
    });
  }

  return (
    <section aria-labelledby="salvar-titulo" className="mt-4 space-y-3 rounded-xl border border-line p-5 text-sm">
      <h2 id="salvar-titulo" className="font-medium">Salvar no histórico</h2>
      <label className="block">
        Fornecedor (opcional)
        <input className={campo} maxLength={120} value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
      </label>
      <label className="block">
        Observação (opcional)
        <textarea className={campo} rows={3} maxLength={1000} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </label>
      <button
        type="button"
        onClick={salvar}
        disabled={faltaNcm || salvando}
        className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {salvando ? "Salvando…" : "Salvar simulação"}
      </button>
      <p role="status" className="text-muted">
        {faltaNcm && "Informe o NCM e o valor para salvar."}
        {!faltaNcm && status?.ok && (
          <>Simulação salva. <Link href="/historico" className="text-accent underline">Ver histórico</Link></>
        )}
        {!faltaNcm && status && !status.ok && <span className="text-red-600 dark:text-red-400">{status.erro}</span>}
      </p>
    </section>
  );
}
