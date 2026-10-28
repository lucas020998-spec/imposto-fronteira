import { bigint, boolean, index, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Cada simulação guarda a entrada e o resultado do momento em que foi salva:
// mudanças futuras nas regras ou no Anexo 05 não alteram o histórico.
export const simulacoes = pgTable(
  "simulacoes",
  {
    id: serial("id").primaryKey(),
    criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
    ncm: varchar("ncm", { length: 8 }).notNull(),
    cest: varchar("cest", { length: 9 }),
    variante: varchar("variante", { length: 80 }),
    descricaoAnexo: text("descricao_anexo"),
    ufOrigem: varchar("uf_origem", { length: 2 }).notNull(),
    importado: boolean("importado").notNull(),
    fornecedorSimples: boolean("fornecedor_simples").notNull(),
    /** Compra para revenda (ST para item do Anexo 05); falso = industrialização ou uso (antecipação). */
    revenda: boolean("revenda").notNull().default(false),
    valorProdutos: bigint("valor_produtos", { mode: "number" }).notNull(),
    frete: bigint("frete", { mode: "number" }),
    freteNaNota: boolean("frete_na_nota"),
    aliquotaIpi: numeric("aliquota_ipi", { precision: 5, scale: 2, mode: "number" }),
    valorIpi: bigint("valor_ipi", { mode: "number" }),
    aliquotaInterestadual: numeric("aliquota_interestadual", { precision: 5, scale: 2, mode: "number" }).notNull(),
    aliquotaInterna: numeric("aliquota_interna", { precision: 5, scale: 2, mode: "number" }).notNull(),
    fcp: numeric("fcp", { precision: 5, scale: 2, mode: "number" }),
    /** MVA original (do anexo ou digitada). */
    mva: numeric("mva", { precision: 7, scale: 2, mode: "number" }),
    /** MVA usada no cálculo: ajustada (anexo ou fórmula) ou original, se o fornecedor é do Simples. */
    mvaAplicada: numeric("mva_aplicada", { precision: 7, scale: 2, mode: "number" }),
    regime: varchar("regime", { length: 12 }).notNull(),
    icmsDevido: bigint("icms_devido", { mode: "number" }).notNull(),
    percentualEfetivo: numeric("percentual_efetivo", { precision: 7, scale: 2, mode: "number" }).notNull(),
    fornecedor: varchar("fornecedor", { length: 120 }),
    observacao: text("observacao"),
  },
  (t) => [index("simulacoes_criada_em_idx").on(t.criadaEm.desc())],
);

export type Simulacao = typeof simulacoes.$inferSelect;
export type NovaSimulacao = typeof simulacoes.$inferInsert;
