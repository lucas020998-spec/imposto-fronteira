"use client";

import { useId, useState } from "react";
import { Resultado } from "@/components/resultado";
import { anexo5 } from "@/lib/anexo5/dados";
import { buscarPorNcm } from "@/lib/anexo5/lookup";
import { formatarPct, lerCentavos, lerNumero } from "@/lib/format";
import { calcular, type Entrada } from "@/lib/tax/calculate";
import { aliquotaInterestadual, ALIQUOTA_INTERNA_PB, UFS, type UfOrigem } from "@/lib/tax/rates";

const campo = "mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 tabular-nums";

export function Simulador() {
  const id = useId();
  const [ncm, setNcm] = useState("");
  const [uf, setUf] = useState<UfOrigem>("SP");
  const [importado, setImportado] = useState(false);
  const [valor, setValor] = useState("");
  const [usarFrete, setUsarFrete] = useState(false);
  const [frete, setFrete] = useState("");
  const [usarIpi, setUsarIpi] = useState(false);
  const [ipi, setIpi] = useState("");
  const [interna, setInterna] = useState(String(ALIQUOTA_INTERNA_PB));
  const [escolha, setEscolha] = useState(0);
  const [mvaManual, setMvaManual] = useState("");

  const baseVazia = anexo5.itens.length === 0;
  const correspondencias = buscarPorNcm(anexo5.itens, ncm);
  const selecionado = correspondencias[Math.min(escolha, correspondencias.length - 1)]?.item;
  const mva = lerNumero(mvaManual) ?? selecionado?.mva ?? undefined;
  const inter = aliquotaInterestadual(uf, importado);
  const valorProdutos = lerCentavos(valor);
  const aliquotaInterna = lerNumero(interna) ?? ALIQUOTA_INTERNA_PB;

  const entrada: Entrada | undefined = valorProdutos
    ? {
        valorProdutos,
        aliquotaInterestadual: inter,
        aliquotaInterna,
        frete: usarFrete ? lerCentavos(frete) : undefined,
        aliquotaIpi: usarIpi ? lerNumero(ipi) : undefined,
        mva,
      }
    : undefined;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,22rem)]">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="space-y-4 rounded-xl border border-line p-5">
          <legend className="px-1 text-sm font-medium">Produto</legend>
          <label className="block text-sm">
            NCM
            <input className={campo} inputMode="numeric" placeholder="Ex.: 8708.99.90" value={ncm}
              onChange={(e) => { setNcm(e.target.value); setEscolha(0); }} aria-describedby={`${id}-ncm`} />
          </label>
          <StatusNcm id={`${id}-ncm`} baseVazia={baseVazia} ncm={ncm} quantidade={correspondencias.length} />
          {correspondencias.length > 0 && (
            <ul className="space-y-2" aria-label="Itens do Anexo 05 para este NCM">
              {correspondencias.map(({ item, prefixo }, i) => (
                <li key={`${item.cest}-${prefixo}`}>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 text-sm has-[:checked]:border-accent">
                    <input type="radio" name="item" checked={i === escolha} onChange={() => setEscolha(i)} className="mt-1 accent-accent" />
                    <span>
                      <span className="font-medium">CEST {item.cest}</span> · NCM {prefixo} ·{" "}
                      {item.mva === null ? "sem MVA no anexo" : `MVA ${formatarPct(item.mva)}`}
                      <span className="block text-muted">{item.descricao}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <label className="block text-sm">
            MVA original manual (%)
            <input className={campo} inputMode="decimal" placeholder={selecionado?.mva != null ? `Do anexo: ${formatarPct(selecionado.mva)}` : "Deixe vazio para antecipação parcial"}
              value={mvaManual} onChange={(e) => setMvaManual(e.target.value)} />
            <span className="mt-1 block text-xs text-muted">Preencha só para substituir a MVA do anexo ou simular ST com uma MVA conhecida.</span>
          </label>
        </fieldset>

        <fieldset className="grid gap-4 rounded-xl border border-line p-5 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">Compra</legend>
          <label className="block text-sm">
            Estado do fornecedor
            <select className={campo} value={uf} onChange={(e) => setUf(e.target.value as UfOrigem)}>
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            Valor dos produtos (R$)
            <input className={campo} inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} required />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={importado} onChange={(e) => setImportado(e.target.checked)} className="accent-accent" />
            Mercadoria importada (alíquota interestadual de 4%)
          </label>
          <p className="text-sm text-muted sm:col-span-2">
            Alíquota interestadual: <strong className="text-foreground">{formatarPct(inter)}</strong>
          </p>
        </fieldset>

        <fieldset className="grid gap-4 rounded-xl border border-line p-5 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">Opcionais</legend>
          <Opcional rotulo="Informar frete (R$)" ativo={usarFrete} onAtivo={setUsarFrete} valor={frete} onValor={setFrete} placeholder="0,00" />
          <Opcional rotulo="Informar IPI (%)" ativo={usarIpi} onAtivo={setUsarIpi} valor={ipi} onValor={setIpi} placeholder="Ex.: 10" />
          <label className="block text-sm sm:col-span-2">
            Alíquota interna da PB (%)
            <input className={campo} inputMode="decimal" value={interna} onChange={(e) => setInterna(e.target.value)} />
            <span className="mt-1 block text-xs text-muted">20% é a alíquota geral; alguns produtos têm alíquota própria.</span>
          </label>
        </fieldset>
      </form>

      <div className="md:sticky md:top-6 md:self-start">
        {entrada ? (
          <Resultado entrada={entrada} resultado={calcular(entrada)} />
        ) : (
          <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">Informe o valor dos produtos para ver o imposto.</p>
        )}
      </div>
    </div>
  );
}

function StatusNcm({ id, baseVazia, ncm, quantidade }: { id: string; baseVazia: boolean; ncm: string; quantidade: number }) {
  let texto = "Digite ao menos 4 dígitos.";
  if (baseVazia) texto = "A base do Anexo 05 ainda não foi importada. Informe a MVA manualmente ou calcule a antecipação parcial.";
  else if (ncm.replace(/\D/g, "").length >= 4)
    texto = quantidade ? "NCM encontrado no Anexo 05: o cálculo usa substituição tributária." : "NCM fora do Anexo 05: o cálculo usa antecipação parcial.";
  return <p id={id} className="text-sm text-muted">{texto}</p>;
}

interface OpcionalProps {
  rotulo: string;
  ativo: boolean;
  onAtivo: (v: boolean) => void;
  valor: string;
  onValor: (v: string) => void;
  placeholder: string;
}

function Opcional({ rotulo, ativo, onAtivo, valor, onValor, placeholder }: OpcionalProps) {
  return (
    <div className="text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={ativo} onChange={(e) => onAtivo(e.target.checked)} className="accent-accent" />
        {rotulo}
      </label>
      {ativo && (
        <input aria-label={rotulo} className={campo} inputMode="decimal" placeholder={placeholder} value={valor} onChange={(e) => onValor(e.target.value)} />
      )}
    </div>
  );
}
