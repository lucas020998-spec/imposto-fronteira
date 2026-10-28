# Qualidade

## Comandos

| Comando | O que prova |
|---|---|
| `pnpm lint` | Presets oficiais Next.js/TypeScript e limite de 350 linhas por arquivo (`eslint-rules/`) |
| `pnpm lint:typed` | `no-floating-promises` e `no-misused-promises` como erro em `src/`; cerca de 5 s neste ambiente |
| `pnpm typecheck` | Gera os tipos de rota (`next typegen`) e roda `tsc --noEmit` em modo estrito |
| `pnpm lint:rules` | Autoteste das regras locais de lint |
| `pnpm test` | Testes Vitest em Node |
| `pnpm build` | Build de produção; as três rotas são estáticas |
| `pnpm check` | Todos os acima, nessa ordem. Rode antes de concluir qualquer mudança |

O build não roda lint; use `pnpm lint` ou `pnpm check`.

## Regras de base

- TypeScript estrito e presets oficiais.
- Limite de 350 linhas e organização proporcional ao comportamento.
- Perfil leve do toolkit (`eslint.config.mjs` → `eslint-rules/next-base.mjs`): sem banco nem logger, então as regras de acesso a dados e de logger não se aplicam.
- Entradas externas validadas com Zod; o JSON do anexo é validado no build e na importação.

## Estratégia de testes

- `src/lib/tax/calculate.test.ts`: alíquotas por origem, MVA ajustada, ST com frete e IPI, antecipação parcial, campos opcionais e casos-limite. Os valores esperados foram conferidos à mão.
- `src/lib/anexo5/anexo5.test.ts`: leitura de texto e CSV, linha sem MVA, número do próximo item fora da descrição, busca por prefixo e ordenação.
- `src/lib/format.test.ts`: leitura de números em pt-BR e formatação.
- O importador foi testado de ponta a ponta com um PDF sintético. **Ainda não foi testado com o PDF oficial do Anexo 05.**
- Não há testes de DOM nem E2E versionados. O fluxo do simulador foi verificado com Playwright durante o setup (registro em `setup.md`). Adicione testes de interface quando o fluxo crescer.

## Revisão depois de implementar ou corrigir

Escolha o escopo pelo risco e pelo diff real. Mudanças em `src/lib/tax/` são as de maior risco: confira os valores esperados à mão ou com a contabilidade. Use revisão independente em mudanças não triviais quando disponível. Registre alvo, achados e riscos que sobraram.

## Revisão de segurança

Prompt reutilizável: bloco "Prompt" de `docs/prompts/13-security-review.md` do Vibe Coding Toolkit, revisão `790a895` (fork `lucas020998-spec/vibe-coding-toolkit`). Para atualizar, troque a revisão pela mais recente do fork.

```text
Leia https://raw.githubusercontent.com/lucas020998-spec/vibe-coding-toolkit/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/13-security-review.md e execute o bloco "Prompt" neste repositório (ou no diff indicado).
```

A revisão é somente leitura. Relatórios ficam fora do repositório e privados. Superfície atual: sem autenticação, sem servidor com dados e sem segredos. O ponto de entrada externo é o arquivo importado pelo script, validado com Zod.

## Melhoria do harness

Método nativo inspirado no Harness2, sem instalar o CLI. Prompt reutilizável: `docs/prompts/15-harness-improvement.md` do toolkit, mesma revisão acima. Use quando um agente falhar repetidamente em seguir estas instruções. Defina o caso, compare a instrução atual com uma única alteração mínima e adote só o que melhorar o resultado. Resultados ficam em `setup.md`.

## Dependências e entrega

`pnpm audit --prod` e `pnpm audit`: sem vulnerabilidades conhecidas em 28/10/2026. Rode de novo ao atualizar dependências.

Sem hooks de Git nem bloqueios de branch. Atualize este documento junto com scripts e regras.
