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

## No Windows, com dois cliques

Com o Node.js instalado e o `.env.local` pronto, dê dois cliques em `Iniciar Imposto Fronteira.bat`. Na primeira vez (e depois de baixar uma versão nova) ele instala e prepara o app; depois só liga e abre o navegador em http://localhost:3000. Sem o pnpm instalado, ele usa o `npx` (vem com o Node.js). Fechar a janela preta desliga o app. Para ter um ícone na área de trabalho: botão direito no arquivo → **Enviar para** → **Área de trabalho (criar atalho)**.

## Banco de dados

1. Crie um banco de desenvolvimento, por exemplo:
   ```bash
   createuser -P imposto && createdb -O imposto imposto_fronteira
   ```
2. `cp .env.example .env.local` e preencha `DATABASE_URL=postgresql://imposto:SENHA@localhost:5432/imposto_fronteira` e `APP_PASSWORD` (a senha de acesso ao app). O `.env.local` é ignorado pelo Git.
3. `pnpm db:migrate` aplica o SQL de `drizzle/`.
4. Para mudar a tabela: edite `src/db/schema/index.ts`, rode `pnpm db:generate`, revise o SQL gerado e aplique com `pnpm db:migrate`.

Não use o banco de produção para testes.

## Publicação: Neon (banco) + Render (app)

Os dois têm plano gratuito. O app fica num link do tipo `https://imposto-fronteira.onrender.com`, protegido pela senha de `APP_PASSWORD`.

### 1. Banco no Neon

1. Crie uma conta em https://neon.com e um projeto na região **AWS US East (N. Virginia)**, a mesma do Render (`render.yaml`, `region: virginia`).
2. Em **Connect**, copie a string de conexão do banco `neondb` com **Connection pooling** ligado (o host tem `-pooler`). Ela vai em `DATABASE_URL`. Pode manter os parâmetros `sslmode` e `channel_binding` como vierem.
3. Crie as tabelas: rode `pnpm db:sql > migracoes.sql` (ou peça ao agente o arquivo), abra o **SQL Editor** do Neon, cole o conteúdo e clique em **Run**. Só em banco novo.
4. Migrações futuras: `DATABASE_URL_UNPOOLED=<string sem pooling> pnpm db:migrate`, ou aplique à mão só o SQL da migração nova.

No plano gratuito o banco hiberna sem uso; o primeiro acesso depois disso demora alguns segundos.

### 2. App no Render

1. Crie uma conta em https://render.com com **Sign in with GitHub** e autorize o repositório `imposto-fronteira`.
2. **New → Blueprint**, escolha o repositório. O Render lê o `render.yaml` (serviço web Node, plano gratuito, build com pnpm, `next start`, verificação em `/entrar`).
3. Ele pede os segredos marcados com `sync: false`: `APP_PASSWORD` (a senha de acesso) e `DATABASE_URL` (do Neon). Nunca coloque esses valores no repositório.
4. Clique em **Apply**. O primeiro build leva alguns minutos; depois, cada envio ao GitHub publica sozinho (`autoDeploy`).

No plano gratuito o serviço dorme após 15 minutos sem acesso; o primeiro acesso depois disso leva de 30 segundos a 1 minuto.

### 3. Celular

Abra o link no navegador do celular e entre com a senha. Android (Chrome): menu ⋮ → **Adicionar à tela inicial** (ou **Instalar app**). iPhone (Safari): botão **Compartilhar** → **Adicionar à Tela de Início**. O ícone abre o app em tela cheia; a sessão dura 30 dias.

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
