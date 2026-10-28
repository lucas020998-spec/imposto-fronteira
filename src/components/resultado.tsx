import { formatarMoeda, formatarPct } from "@/lib/format";
import type { Entrada, Resultado as ResultadoCalculo } from "@/lib/tax/calculate";

interface Props {
  entrada: Entrada;
  resultado: ResultadoCalculo;
}

type Linha = [string, string];

function rotuloMva(e: Entrada) {
  if (e.fornecedorSimples) return "MVA aplicada (fornecedor do Simples)";
  return e.mvaAjustada !== undefined ? "MVA ajustada (Anexo 05)" : "MVA ajustada (calculada)";
}

const aliquotaPb = (e: Entrada) => `${formatarPct(e.aliquotaInterna)}${e.fcp ? ` + ${formatarPct(e.fcp)} FUNCEP` : ""}`;

function linhasSt(e: Entrada, r: ResultadoCalculo): Linha[] {
  return [
    ["MVA original", formatarPct(e.mva ?? 0)],
    [rotuloMva(e), formatarPct(r.mvaAjustada ?? 0)],
    ["Base de cálculo da ST", formatarMoeda(r.baseCalculo)],
    [`ICMS na PB (${aliquotaPb(e)} da base)`, formatarMoeda(r.icmsDevido + r.icmsProprio)],
    [`(−) ICMS do fornecedor (${formatarPct(e.aliquotaInterestadual)})`, formatarMoeda(r.icmsProprio)],
  ];
}

function linhasAntecipacao(e: Entrada, r: ResultadoCalculo): Linha[] {
  const interna = e.aliquotaInterna + (e.fcp ?? 0);
  return [
    [
      e.fornecedorSimples ? "(−) ICMS da nota (fornecedor do Simples)" : `(−) ICMS da nota (${formatarPct(e.aliquotaInterestadual)})`,
      formatarMoeda(r.creditoNota ?? 0),
    ],
    ...(r.creditoFrete ? [[`(−) ICMS do CT-e (${formatarPct(e.aliquotaFrete ?? e.aliquotaInterestadual)})`, formatarMoeda(r.creditoFrete)] as Linha] : []),
    ["Valor líquido", formatarMoeda(r.valorLiquido ?? 0)],
    [`Base de cálculo (÷ ${(1 - interna / 100).toLocaleString("pt-BR")})`, formatarMoeda(r.baseCalculo)],
    [`Diferença de alíquotas (${aliquotaPb(e)} − ${formatarPct(e.aliquotaInterestadual)})`, formatarPct(r.diferencaAliquotas ?? 0)],
  ];
}

export function Resultado({ entrada, resultado: r }: Props) {
  const st = r.regime === "st";
  const linhas: Linha[] = [
    ["Valor dos produtos", formatarMoeda(entrada.valorProdutos)],
    ...(r.frete ? [[entrada.freteNaNota ? "Frete (na nota)" : "Frete (CT-e)", formatarMoeda(r.frete)] as Linha] : []),
    ...(r.valorIpi ? [["IPI", formatarMoeda(r.valorIpi)] as Linha] : []),
    ...(st ? linhasSt(entrada, r) : linhasAntecipacao(entrada, r)),
  ];

  return (
    <section aria-labelledby="resultado-titulo" aria-live="polite" className="rounded-xl border border-line bg-card p-5">
      <h2 id="resultado-titulo" className="text-sm font-medium text-muted">
        {st ? "Substituição tributária (revenda, com MVA)" : "Antecipação (ICMS-Simples Nacional-Fronteira)"}
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
