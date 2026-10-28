import { z } from "zod";

const percentual = z.number().nonnegative();

export const itemAnexo5Schema = z.object({
  segmento: z.string(),
  /** Número do item no segmento (ex.: "6.0"). */
  item: z.string(),
  cest: z.string(),
  /** Códigos NCM/SH como aparecem no anexo (prefixos de 2 a 8 dígitos, sem pontos). */
  ncms: z.array(z.string().regex(/^\d{2,8}$/)).min(1),
  descricao: z.string(),
  /** Quando o item tem mais de uma MVA (ex.: "Sem contrato de fidelidade", "Lista Positiva"). */
  variante: z.string().nullable(),
  /** MVA original em percentual; null quando o anexo usa pauta, PMPF ou valor AD REM. */
  mva: percentual.nullable(),
  /** MVA já ajustada pelo anexo para cada alíquota interestadual, quando publicada. */
  mvaAjustada: z.object({ 4: percentual.optional(), 7: percentual.optional(), 12: percentual.optional() }).nullable(),
  /** Texto da coluna MVA quando não há percentual (ex.: "AD REM", "ATO COTEPE – PMPF"). */
  mvaTexto: z.string().nullable(),
  /** Alíquota interna do item, sem FUNCEP; null se o anexo não traz um valor único. */
  aliquota: percentual.nullable(),
  /** Adicional do FUNCEP (Fundo de Combate à Pobreza da PB), em pontos percentuais. */
  fcp: percentual,
  /** Coluna ALÍQUOTA como está no anexo, para mostrar condições ("Com gás = …"). */
  aliquotaTexto: z.string(),
});

export const anexo5Schema = z.object({
  fonte: z.string().nullable(),
  importadoEm: z.string().nullable(),
  itens: z.array(itemAnexo5Schema),
});

export type ItemAnexo5 = z.infer<typeof itemAnexo5Schema>;
export type Anexo5 = z.infer<typeof anexo5Schema>;
