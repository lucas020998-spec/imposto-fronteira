import { z } from "zod";
import { UFS } from "@/lib/tax/rates";

const percentual = z.number().min(0).max(1000);
const textoOpcional = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null).nullable().optional();

/** Dados enviados pelo formulário. O resultado é recalculado no servidor, nunca aceito do cliente. */
export const salvarSimulacaoSchema = z.object({
  ncm: z.string().regex(/^\d{4,8}$/, "Informe o NCM com 4 a 8 dígitos"),
  cest: z.string().max(9).nullable().optional(),
  descricaoAnexo: z.string().max(500).nullable().optional(),
  ufOrigem: z.enum(UFS),
  importado: z.boolean(),
  fornecedorSimples: z.boolean(),
  valorProdutos: z.number().int().positive().max(1e13),
  frete: z.number().int().min(0).max(1e13).optional(),
  aliquotaIpi: percentual.optional(),
  aliquotaInterna: percentual,
  mva: percentual.optional(),
  fornecedor: textoOpcional(120),
  observacao: textoOpcional(1000),
});

export type SalvarSimulacaoInput = z.input<typeof salvarSimulacaoSchema>;

export const buscaSchema = z.string().trim().max(100).catch("");
