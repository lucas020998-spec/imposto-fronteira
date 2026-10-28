import type { Metadata } from "next";
import { formatarMoeda as R, formatarPct as P } from "@/lib/format";
import { calcular } from "@/lib/tax/calculate";

export const metadata: Metadata = { title: "Como é calculado · Imposto Fronteira PB" };

// Exemplos fixos, calculados pelo mesmo código do simulador.
const st = { valorProdutos: 100_000, frete: 5_000, aliquotaIpi: 10, aliquotaInterestadual: 12, aliquotaInterna: 20, mva: 33 };
const rSt = calcular(st);
const ap = { valorProdutos: 100_000, aliquotaIpi: 5, aliquotaInterestadual: 7, aliquotaInterna: 20 };
const rAp = calcular(ap);
const somaSt = st.valorProdutos + st.frete + rSt.valorIpi;

export default function ComoCalcular() {
  return (
    <article className="max-w-2xl space-y-8 leading-relaxed">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Como o imposto de fronteira é calculado</h1>
        <p className="mt-2 text-muted">
          Quando você compra de outro estado para revender na Paraíba, o fornecedor cobra o ICMS com a alíquota
          interestadual. A Paraíba cobra a diferença até a sua alíquota interna. Essa diferença é o imposto de fronteira.
        </p>
        <p className="mt-2 text-muted">
          Este simulador segue as regras para empresas do <strong className="text-foreground">Simples Nacional</strong>: o
          ICMS de fronteira é pago à parte, fora do DAS (LC 123/2006, art. 13, § 1º, XIII).
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. As alíquotas</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Interna da PB:</strong> 20% na regra geral.</li>
          <li><strong>Interestadual:</strong> 7% se o fornecedor está em SP, RJ, MG, PR, SC ou RS; 12% nos demais estados.</li>
          <li><strong>Importados:</strong> 4%, qualquer que seja o estado.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. O NCM decide o tipo de cálculo</h2>
        <p>
          Se o NCM do produto está no <strong>Anexo 05</strong> do RICMS-PB, a mercadoria está na <strong>substituição
          tributária</strong> e o cálculo usa a MVA (margem de valor agregado). Se não está, aplica-se a
          <strong> antecipação parcial</strong>, sem MVA.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Exemplo A: produto do Anexo 05 (substituição tributária)</h2>
        <p className="text-sm text-muted">
          Compra de {R(st.valorProdutos)} de um fornecedor de Pernambuco (12%), com frete de {R(st.frete)}, IPI de{" "}
          {P(st.aliquotaIpi)} e MVA original de {P(st.mva)}.
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
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">Exemplo B: produto fora do Anexo 05 (antecipação parcial)</h2>
        <p className="text-sm text-muted">
          Compra de {R(ap.valorProdutos)} de um fornecedor de São Paulo (7%), com IPI de {P(ap.aliquotaIpi)}. No Simples não
          se soma MVA: cobra-se só a diferença de alíquotas.
        </p>
        <ol className="list-decimal space-y-2 pl-5 tabular-nums">
          <li>Base = produtos + IPI = {R(rAp.baseCalculo)}</li>
          <li>Imposto da PB = {R(rAp.baseCalculo)} × 20% = {R(rAp.icmsDevido + rAp.icmsProprio)}</li>
          <li>ICMS do fornecedor = {R(ap.valorProdutos)} × 7% = {R(rAp.icmsProprio)} (o IPI não tem ICMS destacado)</li>
          <li>
            <strong>A recolher:</strong> {R(rAp.icmsDevido)}, ou seja, <strong>{P(rAp.percentualEfetivo)}</strong> do valor dos produtos.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Frete e IPI são opcionais</h2>
        <p>
          O frete da nota entra em todas as bases. O IPI entra na base do imposto da PB, mas não no ICMS do fornecedor.
          Se você não informar, o simulador considera zero, e o resultado tende a ficar um pouco menor do que o real.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">E se o fornecedor também for do Simples?</h2>
        <p>
          Na substituição tributária, quando o fornecedor é optante do Simples, usa-se a MVA original do Anexo 05, sem o
          ajuste do passo 1 do exemplo A. Marque a opção no simulador. Na antecipação parcial nada muda.
        </p>
      </section>

      <section className="space-y-2 text-sm text-muted">
        <h2 className="text-base font-semibold text-foreground">Limites da simulação</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Não trata benefícios fiscais nem regimes especiais. Itens com pauta, PMPF ou valor AD REM pedem a MVA manual.</li>
          <li>Frete pago à parte (FOB, com CT-e próprio) não entra na base.</li>
          <li>Não trata compras de matéria-prima para industrialização nem de uso e consumo, que podem ter regras próprias.</li>
          <li>A MVA ajustada é arredondada em duas casas decimais.</li>
        </ul>
      </section>
    </article>
  );
}
