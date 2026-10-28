import { Simulador } from "@/components/simulador";
import { anexo5 } from "@/lib/anexo5/dados";

export default function Home() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Quanto vou pagar de ICMS na fronteira?</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Informe o NCM, o estado do fornecedor e o valor da compra. O simulador consulta o Anexo 05 do RICMS-PB e mostra o
        percentual de imposto sobre os produtos.
      </p>
      <p className="mt-1 text-xs text-muted">
        {anexo5.importadoEm
          ? `Base do Anexo 05: ${anexo5.fonte} · ${anexo5.itens.length} itens · importada em ${anexo5.importadoEm}`
          : "Base do Anexo 05 ainda não importada."}
      </p>
      <div className="mt-8">
        <Simulador />
      </div>
    </>
  );
}
