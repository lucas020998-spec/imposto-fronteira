import { z } from "zod";
import { UFS } from "@/lib/tax/rates";

const percentual = z.number().min(0).max(1000);
const textoOpcional = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null).nullable().optional();

/** Dados enviados pelo formulário. O resultado é recalculado no servidor, nunca aceito do cliente. */
export const salvarSimulacaoSchema = z.object({
  ncm: z.string().regex(/^\d{4,8}$/, "Informe o NCM com 4 a 8 dígitos"),
  /** Item do Anexo 05 escolhido; o servidor busca MVA, alíquota e FUNCEP no próprio anexo. */
  cest: z.string().max(9).nullable().optional(),
  variante: z.string().max(80).nullable().optional(),
  ufOrigem: z.enum(UFS),
  importado: z.boolean(),
  fornecedorSimples: z.boolean(),
  valorProdutos: z.number().int().positive().max(1e13),
  frete: z.number().int().min(0).max(1e13).optional(),
  freteNaNota: z.boolean().optional(),
  aliquotaIpi: percentual.optional(),
  valorIpi: z.number().int().min(0).max(1e13).optional(),
  revenda: z.boolean().default(false),
  aliquotaInterna: percentual.optional(),
  mvaManual: percentual.optional(),
  fornecedor: textoOpcional(120),
  observacao: textoOpcional(1000),
});

export type SalvarSimulacaoInput = z.input<typeof salvarSimulacaoSchema>;

export const buscaSchema = z.string().trim().max(100).catch("");
