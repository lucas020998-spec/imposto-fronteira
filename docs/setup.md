# Setup e evidências

## Origem e contexto

- Data: 28/10/2026.
- Toolkit: Vibe Coding Toolkit, revisão `790a895304e0c08b70a5b215c9d334f1c86b816c` (fork `lucas020998-spec/vibe-coding-toolkit`, idêntica ao `main` de `soumatheusgomes/vibe-coding-toolkit` na data). Prompt executado: `docs/prompts/11-next-project-bootstrap.md`.
- Cliente: Claude Code em sessão na nuvem (Linux), Node 22.22.0, pnpm 10.28.0. Modelo e autenticação da sessão preservados; subagentes usam o modelo da sessão.
- A rede da sessão bloqueia `sefaz.pb.gov.br`, por isso o PDF oficial do Anexo 05 não pôde ser baixado.

## Decisões e fontes

| Decisão | Motivo e fonte |
|---|---|
| Next.js 16.4.3 estável via `create-next-app@16.4.3` | Canal `latest` do registro npm em 28/10/2026; flags conferidas em `--help` |
| Sem Drizzle/PostgreSQL, Pino e `env.ts` | Produto sem persistência nem segredos (ver `PRODUCT.md`); perfil de lint leve |
| `@types/node@22` | Alinhado ao runtime Node 22 (o toolkit valida com Node 24) |
| `unpdf` para ler o PDF | Extração de texto em Node sem dependências nativas; só em desenvolvimento |
| Sem `next/font/google` | Build sem depender de rede |
| Alíquota interna 20% | Lei PB 12.788/2023, confirmada em fontes secundárias; texto legal não consultado (site bloqueado) |
| Fórmula da MVA ajustada e base da ST com frete e IPI | Decretos PB publicados na LegisWeb e exemplos de terceiros; conferir com a contabilidade |
| Context7 | Não disponível na sessão; consultada a documentação local em `node_modules/next/dist/docs/` |

## Componentes

| Componente | Ação e motivo | Escopo | Estado e evidência |
|---|---|---|---|
| Base Next.js (App Router, TS, Tailwind, ESLint, `src/`, `@/*`) | `create-next-app` com pnpm | Projeto | Validado: build gera 3 rotas estáticas |
| Zod, server-only, clsx, tailwind-merge, Vitest, typescript-eslint | Núcleo padrão sem banco | Projeto | Validado: `pnpm check` passa |
| `templates/next/` | Copiados `vitest.config.mts` e `src/lib/utils.ts`; env, logger e db omitidos (sem uso) | Projeto | Validado |
| ESLint do toolkit | Perfil leve + `eslint-rules/` completo + perfil tipado + autoteste | Projeto | Validado: lint, lint tipado (~5 s) e `lint:rules` passam |
| Skills Vercel (`vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `writing-guidelines`, `vercel-react-view-transitions`, `vercel-optimize`, `deploy-to-vercel`, `vercel-cli-with-tokens`) | Catálogo atual conferido com `--list`; instaladas só para Claude Code | Projeto (`.claude/skills/`, cópia) | Instaladas; `skills list` confirma. Descoberta em nova sessão: pendente |
| `vercel-react-native-skills` | Não se aplica (app web) | — | Não instalada |
| `find-skills` (vercel-labs/skills) | Catálogo | Projeto | Instalada |
| `next-dev-loop`, `next-bundle-optimizer` (vercel/next.js@canary) | Next 16.4 com Turbopack é compatível | Projeto | Instaladas. `agent-browser` ausente na máquina: `next-dev-loop` bloqueado até a preparação da máquina |
| `supabase-postgres-best-practices` | Sem PostgreSQL | — | Não se aplica |
| `gh-fix-ci` | Sem GitHub Actions e cliente não é Codex | — | Não se aplica por enquanto |
| `differential-review` | Projeto sem área sensível (sem auth, dados ou segredos) | — | Não selecionada; usar o prompt de segurança do toolkit |
| shadcn | Nenhum sistema de UI adotado | — | Não se aplica |
| Sentry MCP | Nenhum serviço escolhido | — | Não se aplica |
| Harness2 (método nativo) | Padrão do bootstrap | Projeto (docs) | Configurado; teste inicial abaixo |
| Ponytail, Caveman, Superpowers, RTK | Plugins não encontrados nesta sessão | — | Pendente: preparar a máquina (prompt 10 do toolkit). Acordos registrados em `AGENTS.md` |
| Context7 | MCP não configurado; sessão sem acesso para configurar | — | Pendente |
| Graphify | CLI não instalado | `.graphifyignore` copiado | Pendente: grafo não gerado |

## Documentação criada

`PRODUCT.md`, `README.md`, `AGENTS.md` (bloco do Next.js preservado), `CLAUDE.md` (`@AGENTS.md`), `docs/architecture.md`, `docs/design.md`, `docs/onboarding.md`, `docs/quality.md` e este arquivo, todos com conteúdo do projeto.

## Verificações

| Item | Estado | Evidência |
|---|---|---|
| `pnpm check` | Validado | Lint, tipos, lint tipado, regras, 17 testes e build sem erros |
| Auditoria | Validado | `pnpm audit --prod` e `pnpm audit`: sem vulnerabilidades conhecidas |
| Importador com PDF sintético | Validado | 3 itens extraídos corretamente (CEST, 2 NCMs, MVA 71,78%, item sem MVA) |
| Importador com PDF oficial | Pendente | Site da SEFAZ-PB bloqueado na sessão |
| Simulador no navegador | Validado | `next start` na porta 3123 + Playwright: R$ 1.000, PE, frete R$ 50, IPI 10%, MVA 33% → 21,05% / R$ 210,49; sem MVA → antecipação 8,4%; busca do NCM 3917.33.00 na base sintética → ST com MVA 71,78% (32,94%); NCM fora → antecipação parcial; 390px sem rolagem horizontal; sem erros de console. Servidor encerrado e base restaurada ao final |
| SQL/migrações | Não se aplica | Sem banco |

## Memória e harness

- Memória: documentos versionados. `CLAUDE.md` importa `AGENTS.md`, carregado automaticamente pelo Claude Code; o resto é lido sob demanda. Fonte da verdade: o código e estes documentos. Invalidação: mudança de regra fiscal, comando ou estrutura atualiza o documento responsável na mesma mudança.
- Teste inicial de descoberta (método nativo, 28/10/2026): subagente com contexto novo, mesmo modelo da sessão, somente leitura, partindo de `CLAUDE.md`. Respondeu corretamente às 5 perguntas, citando os arquivos: comando único de verificação, como importar o Anexo 05 e a proibição de editar o JSON à mão, quais arquivos mudam juntos numa alteração de fórmula, por que não há banco e que deploy exige autorização. Resultado: **passou**. Limite: subagente novo não equivale a reiniciar o cliente; nenhuma falha observada, então nenhuma comparação de candidato foi feita.

## Pendências e próxima entrega

1. **Importar o PDF oficial do Anexo 05** e conferir 10 itens de segmentos diferentes (próxima entrega).
2. Validar com a contabilidade as premissas de frete e IPI na antecipação parcial e de arredondamento.
3. Preparar a máquina (prompt 10 do toolkit): Ponytail, Caveman, Superpowers, RTK, Context7, Graphify e agent-browser.
4. Criar um repositório no GitHub e publicar o código; a sessão na nuvem é temporária.
