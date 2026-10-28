import type { Metadata } from "next";
import { formatarMoeda as R, formatarPct as P } from "@/lib/format";
import { calcular } from "@/lib/tax/calculate";

export const metadata: Metadata = { title: "Como é calculado · Imposto Fronteira PB" };

// Exemplos fixos, calculados pelo mesmo código do simulador. O de antecipação é uma nota real do
// DAR de 08/2026 (compra de Pernambuco com IPI e frete em CT-e); a SEFAZ cobrou o mesmo valor.
const ap = { valorProdutos: 289_544, valorIpi: 9_410, frete: 28_000, aliquotaFrete: 12, aliquotaInterestadual: 12, aliquotaInterna: 20 };
const rAp = calcular(ap);
const st = { valorProdutos: 100_000, frete: 5_000, aliquotaIpi: 10, aliquotaInterestadual: 12, aliquotaInterna: 20, mva: 33 };
const rSt = calcular(st);
const somaSt = st.valorProdutos + st.frete + rSt.valorIpi;

export default function ComoCalcular() {
  return (
    <article className="max-w-2xl space-y-8 leading-relaxed">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Como o imposto de fronteira é calculado</h1>
        <p className="mt-2 text-muted">
          Quando você compra de outro estado, o fornecedor cobra o ICMS com a alíquota interestadual. A Paraíba cobra a
          diferença até a sua alíquota interna. Essa diferença é o imposto de fronteira.
        </p>
        <p className="mt-2 text-muted">
          Este simulador segue as regras para empresas do <strong className="text-foreground">Simples Nacional</strong>: o
          ICMS de fronteira é pago à parte, fora do DAS, no DAR “ICMS-Simples Nacional-Fronteira” (receita 1124).
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. As alíquotas</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Interna da PB:</strong> 20% na regra geral.</li>
          <li><strong>Interestadual:</strong> 7% se o fornecedor está em SP, RJ, MG, PR, SC ou RS; 12% nos demais estados.</li>
          <li><strong>Importados:</strong> 4%, qualquer que seja o estado. O frete em CT-e continua com 7% ou 12%.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Qual cálculo vale</h2>
        <p>
          Para <strong>industrialização ou uso</strong>, a SEFAZ cobra a <strong>antecipação</strong> (exemplo A), mesmo
          quando o NCM está no Anexo 05. Foi assim em todas as notas do DAR de 08/2026. Só na <strong>revenda</strong> de
          item do Anexo 05 vale a <strong>substituição tributária</strong>, com MVA (exemplo B).
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Exemplo A: antecipação (nota real de 08/2026)</h2>
        <p className="text-sm text-muted">
          Compra de {R(ap.valorProdutos)} de Pernambuco (12%), com IPI de {R(ap.valorIpi)} e frete de {R(ap.frete)} em CT-e.
        </p>
        <ol className="list-decimal space-y-2 pl-5 tabular-nums">
          <li>
            <strong>Some</strong> produtos + IPI + frete = {R(ap.valorProdutos + ap.valorIpi + ap.frete)}
          </li>
          <li>
            <strong>Desconte o ICMS já pago</strong>: da nota ({R(rAp.creditoNota ?? 0)}, 12%) e do CT-e ({R(rAp.creditoFrete ?? 0)}, 12%)
            = <strong>{R(rAp.valorLiquido ?? 0)}</strong>
            <br />
            <span className="text-sm text-muted">Fornecedor do Simples não destaca ICMS na nota: não há o que descontar.</span>
          </li>
          <li>
            <strong>Base “por dentro”</strong> = valor líquido ÷ (1 − 20%) = {R(rAp.valorLiquido ?? 0)} ÷ 0,8 ={" "}
            <strong>{R(rAp.baseCalculo)}</strong>
          </li>
          <li>
            <strong>Diferença de alíquotas</strong> = 20% − 12% = {P(rAp.diferencaAliquotas ?? 0)} da base
          </li>
          <li>
            <strong>A recolher:</strong> {R(rAp.icmsDevido)}, ou seja, <strong>{P(rAp.percentualEfetivo)}</strong> do valor dos produtos.
            É o mesmo valor que a SEFAZ cobrou por essa nota.
          </li>
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Exemplo B: revenda de item do Anexo 05 (substituição tributária)</h2>
        <p className="text-sm text-muted">
          Compra de {R(st.valorProdutos)} de Pernambuco (12%), com frete de {R(st.frete)}, IPI de {P(st.aliquotaIpi)} e MVA
          original de {P(st.mva)}.
        </p>
        <ol className="list-decimal space-y-2 pl-5 tabular-nums">
          <li>
            <strong>Ajuste a MVA</strong> para compensar a diferença de alíquotas:<br />
            (1 + {P(st.mva)}) × (1 − 12%) ÷ (1 − 20%) − 1 = <strong>{P(rSt.mvaAjustada ?? 0)}</strong>
            <br />
            <span className="text-sm text-muted">
              Na maioria dos itens, o Anexo 05 já publica a MVA ajustada para 4%, 7% e 12%, e o simulador usa esse valor.
            </span>
          </li>
          <li>
            <strong>Base da ST</strong> = (produtos + frete + IPI) × (1 + MVA ajustada)<br />
            {R(somaSt)} × {(1 + (rSt.mvaAjustada ?? 0) / 100).toLocaleString("pt-BR")} = <strong>{R(rSt.baseCalculo)}</strong>
          </li>
          <li>
            <strong>Imposto da PB</strong> = base × 20% = {R(rSt.icmsDevido + rSt.icmsProprio)}
            <br />
            <span className="text-sm text-muted">
              Alguns itens têm alíquota própria no anexo (ex.: bebidas, 25% + 2% de FUNCEP); o simulador soma as duas.
            </span>
          </li>
          <li>
            <strong>Desconte o ICMS do fornecedor</strong> = (produtos + frete) × 12% = {R(rSt.icmsProprio)}
          </li>
          <li>
            <strong>A recolher:</strong> {R(rSt.icmsDevido)}, ou seja, <strong>{P(rSt.percentualEfetivo)}</strong> do valor dos produtos.
          </li>
        </ol>
        <p className="text-sm text-muted">
          Se o fornecedor é do Simples, usa-se a MVA original, sem o ajuste do passo 1.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Frete e IPI</h2>
        <p>
          Informe os valores como estão na nota. O frete pode vir na própria nota ou em CT-e separado: marque a opção certa,
          porque o ICMS de cada um é descontado de um jeito. Se você não informar, o simulador considera zero, e o resultado
          fica menor do que o cobrado.
        </p>
      </section>

      <section className="space-y-2 text-sm text-muted">
        <h2 className="text-base font-semibold text-foreground">Limites da simulação</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Não trata benefícios fiscais nem regimes especiais. Itens com pauta, PMPF ou valor AD REM pedem a MVA manual.</li>
          <li>Nota com itens de alíquotas diferentes (ex.: 4% e 7%): simule cada grupo à parte, com o frete rateado pelo valor.</li>
          <li>O ICMS da nota é recalculado pelo total; a nota pode diferir alguns centavos por arredondar item a item.</li>
          <li>A fórmula da ST (revenda) ainda não foi conferida com um DAR de substituição tributária.</li>
        </ul>
      </section>
    </article>
  );
}
