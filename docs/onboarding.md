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

Não use o banco de produção para testes. Em produção, provedores que separam conexão com pool e direta podem usar `DATABASE_URL_UNPOOLED` para migrações.

## Base do Anexo 05

O repositório traz `src/data/anexo5.json` vazio até a primeira importação. Para preencher:

1. Baixe o PDF vigente do Anexo 05 do RICMS-PB no portal da SEFAZ-PB.
2. Rode `pnpm anexo5:import caminho/ANEXO_05.pdf "Anexo 05 RICMS-PB, versão de DD/MM/AAAA"`.
3. Confira alguns itens no JSON contra o PDF (CEST, NCM e MVA).
4. Faça commit do JSON atualizado.

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
