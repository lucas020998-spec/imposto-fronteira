import { normalizarNcm } from "./parse";
import type { ItemAnexo5 } from "./schema";

export interface Correspondencia {
  item: ItemAnexo5;
  /** Prefixo do anexo que casou com o NCM consultado. */
  prefixo: string;
}

/**
 * Itens do anexo cujo NCM é prefixo do NCM consultado (ex.: "8708" cobre "8708.99.90").
 * Ordena do prefixo mais específico para o mais genérico.
 */
export function buscarPorNcm(itens: ItemAnexo5[], ncm: string): Correspondencia[] {
  const alvo = normalizarNcm(ncm);
  if (alvo.length < 4) return [];
  return itens
    .flatMap((item) => {
      const prefixo = item.ncms.filter((p) => alvo.startsWith(p)).sort((a, b) => b.length - a.length)[0];
      return prefixo ? [{ item, prefixo }] : [];
    })
    .sort((a, b) => b.prefixo.length - a.prefixo.length);
}
