import { normalizarNcm } from "./parse";
import type { ItemAnexo5 } from "./schema";

export interface Correspondencia {
  item: ItemAnexo5;
  /** Prefixo do anexo que casou com o NCM consultado. */
  prefixo: string;
}

/** Item exato escolhido no simulador (CEST + variante), desde que cubra o NCM informado. */
export function itemEscolhido(itens: ItemAnexo5[], ncm: string, cest: string, variante: string | null) {
  return buscarPorNcm(itens, ncm).find((c) => c.item.cest === cest && c.item.variante === variante)?.item;
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
