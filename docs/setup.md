# Setup e evidências

## Origem e contexto

- Data: 28/10/2026.
- Toolkit: Vibe Coding Toolkit, revisão `790a895304e0c08b70a5b215c9d334f1c86b816c` (fork `lucas020998-spec/vibe-coding-toolkit`, idêntica ao `main` de `soumatheusgomes/vibe-coding-toolkit` na data). Prompt executado: `docs/prompts/11-next-project-bootstrap.md`.
- Cliente: Claude Code em sessão na nuvem (Linux), Node 22.22.0, pnpm 10.28.0. Modelo e autenticação da sessão preservados; subagentes usam o modelo da sessão.
- A rede da sessão bloqueia `sefaz.pb.gov.br`; o PDF oficial do Anexo 05 chegou pelo GitHub (commit do usuário) e está em `fontes/`.

## Decisões e fontes

| Decisão | Motivo e fonte |
|---|---|
| Next.js 16.4.3 estável via `create-next-app@16.4.3` | Canal `latest` do registro npm em 28/10/2026; flags conferidas em `--help` |
| 1ª etapa sem banco; 2ª etapa com Drizzle/PostgreSQL, Pino e `env.ts` | O usuário pediu histórico de simulações; adotado o núcleo padrão do toolkit e o perfil de lint completo |
| Regras do Simples Nacional | LC 123/2006 art. 13 § 1º XIII; Conv. ICMS 142/2018 cl. 11 § 1º (MVA sem ajuste para remetente do Simples), via fórum e blogs contábeis. RICMS-PB não consultado (site bloqueado) |
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
| Zod, server-only, clsx, tailwind-merge, Vitest, typescript-eslint | Núcleo padrão | Projeto | Validado: `pnpm check` passa |
| Drizzle ORM 0.45, `pg` 8, Pino 10, drizzle-kit, `@next/env` 16.4.3 | Adicionados na 2ª etapa, com o histórico | Projeto | Validado: SQL gerado, migração aplicada no PostgreSQL 16 local, teste de integração passa |
| `templates/next/` | Todos os arquivos copiados (env, logger, db, testes, `drizzle.config.ts`, `.env.example`) | Projeto | Validado |
| ESLint do toolkit | Perfil completo (logger, fronteira de dados, guardas do Drizzle) + `eslint-rules/` + perfil tipado + autoteste | Projeto | Validado: lint, lint tipado (~5 s) e `lint:rules` passam |
| Skills Vercel (`vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `writing-guidelines`, `vercel-react-view-transitions`, `vercel-optimize`, `deploy-to-vercel`, `vercel-cli-with-tokens`) | Catálogo atual conferido com `--list`; instaladas só para Claude Code | Projeto (`.claude/skills/`, cópia) | Instaladas; `skills list` confirma. Descoberta em nova sessão: pendente |
| `vercel-react-native-skills` | Não se aplica (app web) | — | Não instalada |
| `find-skills` (vercel-labs/skills) | Catálogo | Projeto | Instalada |
| `next-dev-loop`, `next-bundle-optimizer` (vercel/next.js@canary) | Next 16.4 com Turbopack é compatível | Projeto | Instaladas. `agent-browser` ausente na máquina: `next-dev-loop` bloqueado até a preparação da máquina |
| `supabase-postgres-best-practices` (supabase/agent-skills) | Projeto passou a usar PostgreSQL | Projeto (`.claude/skills/`) | Instalada; descoberta em nova sessão pendente |
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
| Auditoria | Validado | `--prod` limpo; 1 moderada só de desenvolvimento (esbuild via drizzle-kit), detalhe em `quality.md` |
| Importador com PDF sintético | Validado | 3 itens extraídos corretamente (CEST, 2 NCMs, MVA 71,78%, item sem MVA) |
| Importador com PDF oficial (4ª etapa) | Validado | PDF de 194 páginas, atualizado em 09/07/2025: 657 entradas, 491 CEST. Comparação com todos os CEST do texto do PDF: faltam só os 11 revogados, o 01.999.00 (sem NCM, com aviso) e 6 citados em descrições. 16 itens de 11 segmentos conferidos contra o texto (NCMs, MVA original, ajustadas 4/7/12%, variantes e alíquota/FUNCEP) |
| Simulador com o anexo real | Validado | Playwright: 7610.10.00 de SP → CEST 10.071.00, MVA ajustada 53,45%, 23,69% (R$ 236,90); de PE → 17,04%; fornecedor do Simples → MVA 32%; 3917.33.00 → 3 opções; nafta (06.019.00) → pede MVA manual; simulação salva e listada no histórico com MVA aplicada 45,2%; sem erros de console |
| `pnpm db:sql` | Validado | SQL gerado aplicado num banco novo com `psql`; depois `drizzle-kit migrate` não reaplicou nada e os hashes ficaram iguais aos de um banco migrado pelo Drizzle |
| Histórico (2ª etapa) | Validado | PostgreSQL 16 local: `db:generate` → SQL revisado → `db:migrate`. Playwright: simulação de R$ 1.000 de PE com frete e IPI (antecipação 10,4%, R$ 104,00) salva com fornecedor e observação, campos limpos, item no topo de `/historico`, busca "esquadrias" acha 1, busca inexistente mostra estado vazio, 390px sem rolagem, sem erros de console. Linha conferida no banco. Banco local apenas; produção pendente |
| Senha de acesso (3ª etapa) | Validado | `next start` + curl: `/` e `/historico?q=a` sem cookie → 307 para `/entrar` (com `para`). Playwright: senha errada mostra "Senha incorreta."; senha certa volta a `/historico`; cookie `sessao` httpOnly, SameSite=Lax, sem a senha no valor; simulação salva com sessão (linha conferida no banco); "Sair" volta a `/entrar` e `/historico` fica bloqueado; sem erros de console. POST de Server Action sem cookie → 307 |
| Envio ao GitHub | Validado | `git push -u origin main` para `lucas020998-spec/imposto-fronteira` |
| Teste de integração do repositório | Validado | `TEST_DATABASE_URL=… pnpm vitest run src/features`: 5 testes passam |
| Simulador no navegador (1ª etapa) | Validado | `next start` na porta 3123 + Playwright: R$ 1.000, PE, frete R$ 50, IPI 10%, MVA 33% → 21,05% / R$ 210,49; sem MVA → antecipação 8,4%; busca do NCM 3917.33.00 na base sintética → ST com MVA 71,78% (32,94%); NCM fora → antecipação parcial; 390px sem rolagem horizontal; sem erros de console. Servidor encerrado e base restaurada ao final |
| Banco de produção | Pendente | Provedor e `DATABASE_URL` a definir pelo usuário |

## Memória e harness

- Memória: documentos versionados. `CLAUDE.md` importa `AGENTS.md`, carregado automaticamente pelo Claude Code; o resto é lido sob demanda. Fonte da verdade: o código e estes documentos. Invalidação: mudança de regra fiscal, comando ou estrutura atualiza o documento responsável na mesma mudança.
- Teste inicial de descoberta (método nativo, 28/10/2026): subagente com contexto novo, mesmo modelo da sessão, somente leitura, partindo de `CLAUDE.md`. Respondeu corretamente às 5 perguntas, citando os arquivos: comando único de verificação, como importar o Anexo 05 e a proibição de editar o JSON à mão, quais arquivos mudam juntos numa alteração de fórmula, por que não há banco e que deploy exige autorização. Resultado: **passou**. Limite: subagente novo não equivale a reiniciar o cliente; nenhuma falha observada, então nenhuma comparação de candidato foi feita.

## Pendências e próxima entrega

1. **Publicar**: criar o banco no Neon, aplicar as migrações e definir `DATABASE_URL` e `APP_PASSWORD` na hospedagem (próxima entrega).
2. Reimportar o Anexo 05 a cada nova versão da SEFAZ-PB.
3. Validar com a contabilidade as regras do Simples (IPI na base, MVA sem ajuste para fornecedor do Simples, cálculo "por dentro") e de arredondamento.
4. Preparar a máquina (prompt 10 do toolkit): Ponytail, Caveman, Superpowers, RTK, Context7, Graphify e agent-browser.
5. Definir `APP_PASSWORD` e `DATABASE_URL` na hospedagem ao publicar. Considerar uma senha mais longa.
