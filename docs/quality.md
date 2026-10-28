# Qualidade

## Comandos

| Comando | O que prova |
|---|---|
| `pnpm lint` | Presets oficiais Next.js/TypeScript e limite de 350 linhas por arquivo (`eslint-rules/`) |
| `pnpm lint:typed` | `no-floating-promises` e `no-misused-promises` como erro em `src/`; cerca de 5 s neste ambiente |
| `pnpm typecheck` | Gera os tipos de rota (`next typegen`) e roda `tsc --noEmit` em modo estrito |
| `pnpm lint:rules` | Autoteste das regras locais de lint |
| `pnpm test` | Testes Vitest em Node |
| `pnpm build` | Build de produção; `/` e `/como-calcular` estáticas, `/historico` dinâmica |
| `pnpm db:generate` | Gera o SQL da migração sem conectar; revise antes de aplicar |
| `pnpm check` | Todos os acima, nessa ordem. Rode antes de concluir qualquer mudança |

O build não roda lint; use `pnpm lint` ou `pnpm check`.

## Regras de base

- TypeScript estrito e presets oficiais.
- Limite de 350 linhas e organização proporcional ao comportamento.
- Perfil completo do toolkit (`eslint.config.mjs`): sem `console` direto (use o logger), páginas e componentes `.tsx` não importam `@/db`, e `update`/`delete` do Drizzle exigem `where`.
- Entradas externas validadas com Zod: formulário salvo, busca do histórico, `DATABASE_URL` e o JSON do anexo.

## Estratégia de testes

- `src/lib/tax/calculate.test.ts`: alíquotas por origem, MVA ajustada, ST com frete e IPI, antecipação parcial, campos opcionais e casos-limite. Os valores esperados foram conferidos à mão.
- `src/lib/anexo5/anexo5.test.ts`: leitura de texto e CSV, linha sem MVA, número do próximo item fora da descrição, busca por prefixo e ordenação.
- `src/lib/format.test.ts`: leitura de números em pt-BR e formatação.
- `src/features/historico/actions.test.ts`: recálculo no servidor, resultado do cliente ignorado, textos opcionais, entrada inválida e falha de banco sem vazar detalhes.
- `src/features/historico/repository.test.ts`: integração com PostgreSQL real (gravação, busca, curingas do LIKE). Só roda com `TEST_DATABASE_URL`; fica como "skipped" no `pnpm check`.
- `src/lib/env.test.ts`, `logger.test.ts`, `src/db/index.test.ts`: templates do toolkit (validação sem vazar segredos, redação de log, ciclo do pool).
- O importador foi testado de ponta a ponta com um PDF sintético. **Ainda não foi testado com o PDF oficial do Anexo 05.**
- Não há testes de DOM nem E2E versionados. O fluxo do simulador foi verificado com Playwright durante o setup (registro em `setup.md`). Adicione testes de interface quando o fluxo crescer.

## Revisão depois de implementar ou corrigir

Escolha o escopo pelo risco e pelo diff real. Mudanças em `src/lib/tax/` são as de maior risco: confira os valores esperados à mão ou com a contabilidade. Use revisão independente em mudanças não triviais quando disponível. Registre alvo, achados e riscos que sobraram.

## Revisão de segurança

Prompt reutilizável: bloco "Prompt" de `docs/prompts/13-security-review.md` do Vibe Coding Toolkit, revisão `790a895` (fork `lucas020998-spec/vibe-coding-toolkit`). Para atualizar, troque a revisão pela mais recente do fork.

```text
Leia https://raw.githubusercontent.com/lucas020998-spec/vibe-coding-toolkit/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/13-security-review.md e execute o bloco "Prompt" neste repositório (ou no diff indicado).
```

A revisão é somente leitura. Relatórios ficam fora do repositório e privados. Superfície atual: Server Action `salvarSimulacao` e página `/historico` (validadas com Zod, consultas parametrizadas pelo Drizzle), `DATABASE_URL` como único segredo e o arquivo importado pelo script. **Não há autenticação**: publicado sem proteção, qualquer pessoa com o endereço lê e grava o histórico (ver `PRODUCT.md`).

## Melhoria do harness

Método nativo inspirado no Harness2, sem instalar o CLI. Prompt reutilizável: `docs/prompts/15-harness-improvement.md` do toolkit, mesma revisão acima. Use quando um agente falhar repetidamente em seguir estas instruções. Defina o caso, compare a instrução atual com uma única alteração mínima e adote só o que melhorar o resultado. Resultados ficam em `setup.md`.

## Dependências e entrega

28/10/2026: `pnpm audit --prod` sem vulnerabilidades. `pnpm audit` aponta 1 moderada (GHSA-67mh-4wv8-2f99) no `esbuild` antigo usado por `drizzle-kit` → `@esbuild-kit`. É só de desenvolvimento e afeta o servidor do `esbuild`, que o projeto não usa. Sem correção no `drizzle-kit` estável; reavaliar ao atualizá-lo. Rode de novo ao atualizar dependências.

Sem hooks de Git nem bloqueios de branch. Atualize este documento junto com scripts e regras.
