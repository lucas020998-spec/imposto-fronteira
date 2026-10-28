CREATE TABLE "simulacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ncm" varchar(8) NOT NULL,
	"cest" varchar(9),
	"descricao_anexo" text,
	"uf_origem" varchar(2) NOT NULL,
	"importado" boolean NOT NULL,
	"fornecedor_simples" boolean NOT NULL,
	"valor_produtos" bigint NOT NULL,
	"frete" bigint,
	"aliquota_ipi" numeric(5, 2),
	"aliquota_interestadual" numeric(5, 2) NOT NULL,
	"aliquota_interna" numeric(5, 2) NOT NULL,
	"mva" numeric(7, 2),
	"regime" varchar(12) NOT NULL,
	"icms_devido" bigint NOT NULL,
	"percentual_efetivo" numeric(7, 2) NOT NULL,
	"fornecedor" varchar(120),
	"observacao" text
);
--> statement-breakpoint
CREATE INDEX "simulacoes_criada_em_idx" ON "simulacoes" USING btree ("criada_em" DESC NULLS LAST);