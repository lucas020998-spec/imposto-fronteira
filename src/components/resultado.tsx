import { formatarMoeda, formatarPct } from "@/lib/format";
import type { Entrada, Resultado as ResultadoCalculo } from "@/lib/tax/calculate";

interface Props {
  entrada: Entrada;
  resultado: ResultadoCalculo;
}

export function Resultado({ entrada, resultado: r }: Props) {
  const st = r.regime === "st";
  const linhas: [string, string][] = [
    ["Valor dos produtos", formatarMoeda(entrada.valorProdutos)],
    ...(r.frete ? [["Frete", formatarMoeda(r.frete)] as [string, string]] : []),
    ...(r.valorIpi ? [[`IPI (${formatarPct(entrada.aliquotaIpi ?? 0)})`, formatarMoeda(r.valorIpi)] as [string, string]] : []),
    ...(st
      ? [
          ["MVA original", formatarPct(entrada.mva ?? 0)],
          ["MVA ajustada", formatarPct(r.mvaAjustada ?? 0)],
        ] as [string, string][]
      : []),
    [st ? "Base de cálculo da ST" : "Base de cálculo", formatarMoeda(r.baseCalculo)],
    [`ICMS na PB (${formatarPct(entrada.aliquotaInterna)} da base)`, formatarMoeda(r.icmsDevido + r.icmsProprio)],
    [`(−) ICMS do fornecedor (${formatarPct(entrada.aliquotaInterestadual)})`, formatarMoeda(r.icmsProprio)],
  ];

  return (
    <section aria-labelledby="resultado-titulo" aria-live="polite" className="rounded-xl border border-line bg-card p-5">
      <h2 id="resultado-titulo" className="text-sm font-medium text-muted">
        {st ? "Substituição tributária (com MVA)" : "Antecipação parcial"}
      </h2>
      <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">{formatarPct(r.percentualEfetivo)}</p>
      <p className="mt-1 text-sm text-muted">
        do valor dos produtos · <strong className="text-foreground">{formatarMoeda(r.icmsDevido)}</strong> a recolher
      </p>
      <dl className="mt-5 divide-y divide-line text-sm">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4 py-2">
            <dt className="text-muted">{rotulo}</dt>
            <dd className="tabular-nums">{valor}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-2 font-semibold">
          <dt>ICMS a recolher</dt>
          <dd className="tabular-nums">{formatarMoeda(r.icmsDevido)}</dd>
        </div>
      </dl>
    </section>
  );
}
