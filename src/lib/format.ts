const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const formatarMoeda = (centavos: number) => moeda.format(centavos / 100);
export const formatarPct = (valor: number) => `${numero.format(valor)}%`;

/** Lê números digitados no formato brasileiro ("1.234,56") ou com ponto decimal ("1234.56"). */
export function lerNumero(texto: string): number | undefined {
  const limpo = texto.replace(/[^\d.,-]/g, "");
  if (!limpo) return undefined;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : undefined;
}

export function lerCentavos(texto: string): number | undefined {
  const n = lerNumero(texto);
  return n === undefined ? undefined : Math.round(n * 100);
}
