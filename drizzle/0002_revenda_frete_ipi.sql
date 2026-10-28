ALTER TABLE "simulacoes" ADD COLUMN "revenda" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "simulacoes" ADD COLUMN "frete_na_nota" boolean;--> statement-breakpoint
ALTER TABLE "simulacoes" ADD COLUMN "valor_ipi" bigint;