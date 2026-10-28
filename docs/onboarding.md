# Preparação local

## Pré-requisitos

- Node.js 22 ou mais novo (`node -v`).
- pnpm 10 (`corepack enable` ativa a versão do `packageManager`).
- PostgreSQL 14+ local ou um banco de desenvolvimento (só para o histórico).

## Primeira execução

```bash
pnpm install
pnpm dev
```

Abra http://localhost:3000. Todas as páginas pedem a senha de `APP_PASSWORD` (veja o passo 2 abaixo); sem ela configurada, nada abre. O simulador funciona sem banco; o histórico precisa do banco.

## Banco de dados

1. Crie um banco de desenvolvimento, por exemplo:
   ```bash
   createuser -P imposto && createdb -O imposto imposto_fronteira
   ```
2. `cp .env.example .env.local` e preencha `DATABASE_URL=postgresql://imposto:SENHA@localhost:5432/imposto_fronteira` e `APP_PASSWORD` (a senha de acesso ao app). O `.env.local` é ignorado pelo Git.
3. `pnpm db:migrate` aplica o SQL de `drizzle/`.
4. Para mudar a tabela: edite `src/db/schema/index.ts`, rode `pnpm db:generate`, revise o SQL gerado e aplique com `pnpm db:migrate`.

Não use o banco de produção para testes.

## Banco de produção (Neon)

1. Crie uma conta em https://neon.com e um projeto na região **AWS São Paulo (sa-east-1)**.
2. No painel do projeto, em **Connect**, copie duas strings de conexão do banco `neondb`:
   - com **Connection pooling** ligado (o host tem `-pooler`): vai em `DATABASE_URL`;
   - com pooling desligado: vai em `DATABASE_URL_UNPOOLED` (usada só por migrações).
3. Crie as tabelas, de um destes jeitos:
   - **Sem computador de desenvolvimento:** rode `pnpm db:sql > migracoes.sql` (ou peça ao agente o arquivo), abra o **SQL Editor** do Neon, cole o conteúdo e execute. Só em banco novo.
   - **Com o projeto local:** `DATABASE_URL_UNPOOLED=… pnpm db:migrate`.
4. Na hospedagem do app, cadastre `DATABASE_URL`, `APP_PASSWORD` e, se quiser, `LOG_LEVEL`. Nunca use `NEXT_PUBLIC_` nesses nomes.
5. Novas migrações depois disso: `pnpm db:migrate` com `DATABASE_URL_UNPOOLED`, ou um novo `pnpm db:sql` aplicado à mão só com o trecho da migração nova.

No plano gratuito o banco hiberna sem uso; o primeiro acesso depois disso demora alguns segundos.

## Base do Anexo 05

`src/data/anexo5.json` vem do PDF em `fontes/` (atualizado em 09/07/2025). Para atualizar:

1. Baixe o PDF vigente do Anexo 05 do RICMS-PB no portal da SEFAZ-PB e salve em `fontes/`.
2. Rode `pnpm anexo5:import fontes/ARQUIVO.pdf "Anexo 05 RICMS-PB, atualizado em DD/MM/AAAA"`.
3. Leia os avisos do comando e confira alguns itens no JSON contra o PDF (CEST, NCM, MVAs e alíquota), de segmentos diferentes.
4. Faça commit do PDF e do JSON juntos.

Se o PDF não for lido corretamente, exporte a tabela para CSV com as colunas `cest;ncm;descricao;mva` e importe o CSV.

## Verificar

`pnpm check` roda lint, tipos, lint tipado, autoteste das regras, testes e build. Nada depende de rede, credenciais ou banco.

Teste de integração do histórico, contra um banco descartável já migrado:

```bash
TEST_DATABASE_URL=postgresql://... pnpm vitest run src/features
```

## Agentes

Leia [AGENTS.md](../AGENTS.md). [CLAUDE.md](../CLAUDE.md) importa as mesmas instruções. As skills locais e suas fontes estão em [setup.md](setup.md).

## Problemas conhecidos

- Aviso `MODULE_TYPELESS_PACKAGE_JSON` ao importar: resolvido com `"type": "module"` no `package.json`.
