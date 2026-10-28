<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Imposto Fronteira PB

## Produto e stack

- Escopo, regras fiscais e pendências: `PRODUCT.md`.
- Empresa do Simples Nacional: todas as regras de cálculo seguem o Simples (ver `PRODUCT.md`).
- Next.js 16.4 (App Router), React 19.3, TypeScript 5.9 estrito, Tailwind 4, Zod 4, Drizzle + PostgreSQL (`pg`), Pino, Vitest 5, Node 22, pnpm 10.
- Setup e evidências: `docs/setup.md`.

## Comandos

- Instalar: `pnpm install`
- Desenvolver: `pnpm dev`
- Lint: `pnpm lint` · lint tipado: `pnpm lint:typed`
- Tipos: `pnpm typecheck`
- Regras locais de lint: `pnpm lint:rules`
- Testes: `pnpm test`
- Build: `pnpm build`
- Tudo: `pnpm check`
- Importar o Anexo 05: `pnpm anexo5:import <arquivo.pdf|csv> ["fonte"]`
- Banco: `pnpm db:generate` (gera SQL, sem conectar) e `pnpm db:migrate` (aplica no `DATABASE_URL`)
- Integração com banco: `TEST_DATABASE_URL=... pnpm vitest run src/features`

## Regras do projeto

- O cálculo fiscal vive só em `src/lib/tax/`. Toda mudança de regra vem com teste em `calculate.test.ts` e atualização de `PRODUCT.md` e da página `src/app/como-calcular`.
- Dinheiro em centavos inteiros; alíquotas e MVA em percentual. Não use ponto flutuante para somar valores em reais.
- `src/data/anexo5.json` é gerado pelo importador. Não edite à mão nem invente NCM/MVA: dados fiscais vêm do PDF oficial da SEFAZ-PB.
- `src/lib/anexo5/parse.ts` e `schema.ts` também rodam em Node pelo script de importação; mantenha imports relativos com extensão `.ts` neles.
- Histórico: o servidor sempre recalcula o resultado antes de gravar; nunca confie em valores calculados no cliente. Acesso ao banco só em `src/features/*/repository.ts`.
- Migrações: gere com `db:generate`, revise o SQL e aplique só no banco certo. Nunca migre em build, import ou requisição; não use `db:push`.
- Logs com o `logger` (Pino), sem dados de formulário, senha nem `DATABASE_URL`.
- Acesso: senha única em `APP_PASSWORD` (nunca no código ou nos docs). `src/proxy.ts` protege as rotas; toda Server Action ou página que lê/grava dados também chama `temSessao()`.
- Textos da interface e da documentação em português do Brasil.

## Acordos de trabalho

- Leia o código e as instruções relevantes antes de editar. Explicite premissas que mudam comportamento ou escopo.
- Faça a menor mudança suficiente; reutilize padrões e dependências existentes. Não crie abstrações, opções ou features não pedidas.
- Preserve validação, tratamento de erros, acessibilidade e requisitos explícitos.
- Rode as verificações adequadas. Não transforme premissas em fatos nem pendências em resultados simulados.
- Publicar, enviar mensagens a terceiros, gerar custos ou fazer ações destrutivas exige autorização.
- Um bloqueio para só as tarefas dependentes; continue o trabalho independente e autorizado.
- Ao retomar trabalho, confira arquivos, Git e verificações reais antes de seguir.

## Padrões e documentação

- Valide entradas externas (formulários, arquivos importados) com Zod.
- Consulte fontes oficiais e canais estáveis antes de mudar stack ou APIs; registre fonte e motivo em `docs/setup.md`.
- `PRODUCT.md` é dono do escopo; `docs/architecture.md`, da estrutura; `docs/design.md`, da interface; `docs/onboarding.md`, da preparação; `docs/quality.md`, das verificações. Atualize o documento responsável na mesma mudança.
- Memória do projeto: estes documentos versionados são a fonte. `AGENTS.md` é o índice carregado automaticamente (via `CLAUDE.md`); detalhes são lidos sob demanda.

## Ferramentas

- **Ponytail (full):** a menor solução completa.
- **Caveman:** conversa concisa no idioma do usuário; código, docs e commits em redação normal.
- **Superpowers:** processo proporcional ao escopo.
- **Context7:** documentação atual de APIs, sem segredos nas consultas. Se indisponível, use `node_modules/next/dist/docs/` e fontes oficiais.
- **RTK e Graphify:** não instalados nesta máquina (ver `docs/setup.md`); não presuma que existem.
- Preserve o cliente, o modelo e a autenticação da sessão. Não troque de provedor nem ative APIs pagas.

## Skills (em `.claude/skills/`)

- `vercel-react-best-practices`: ao escrever ou revisar React/Next.js.
- `vercel-composition-patterns`: decisões concretas de API de componentes.
- `web-design-guidelines`: revisão de interface e acessibilidade antes de concluir mudanças de UI.
- `writing-guidelines`: revisão de documentação.
- `vercel-react-view-transitions`: só quando transições forem pedidas.
- `vercel-optimize`: com projeto e métricas na Vercel.
- `deploy-to-vercel` / `vercel-cli-with-tokens`: só para publicação autorizada.
- `find-skills`: quando faltar uma capacidade concreta.
- `next-dev-loop`: feedback de runtime após mudanças, se `agent-browser` estiver disponível (hoje não está).
- `next-bundle-optimizer`: auditoria de bundle baseada em evidência.
- `supabase-postgres-best-practices`: antes de mexer em schema, SQL, migrações ou desempenho do PostgreSQL (vale para qualquer provedor).

Instalar uma skill não executa suas ações nem autoriza deploy, animações ou mudanças de arquitetura.

## Revisão de segurança

Use o prompt versionado indicado em `docs/quality.md`. Revisões são somente leitura e os relatórios ficam privados.

## Git

Sem hooks de pre-commit/pre-push, bloqueios de push ou exigência de branch. Verificações são comandos explícitos.
