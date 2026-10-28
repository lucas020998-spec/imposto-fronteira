import { z } from "zod";

export const itemAnexo5Schema = z.object({
  cest: z.string(),
  /** Códigos NCM/SH como aparecem no anexo (prefixos de 2 a 8 dígitos, sem pontos). */
  ncms: z.array(z.string().regex(/^\d{2,8}$/)).min(1),
  descricao: z.string(),
  /** MVA original em percentual; null quando o item não traz MVA (ex.: usa preço de pauta). */
  mva: z.number().nonnegative().nullable(),
});

export const anexo5Schema = z.object({
  fonte: z.string().nullable(),
  importadoEm: z.string().nullable(),
  itens: z.array(itemAnexo5Schema),
});

export type ItemAnexo5 = z.infer<typeof itemAnexo5Schema>;
export type Anexo5 = z.infer<typeof anexo5Schema>;
