# Código e arquitetura

## Stack

Next.js 16.4.3 (App Router, Turbopack), React 19.3, TypeScript 5.9 estrito, Tailwind CSS 4.3, Zod 4.6, Drizzle ORM 0.45 + `pg` 8 (PostgreSQL), Pino 10, Vitest 5.0, `unpdf` 1.9 (só no importador), Node 22, pnpm 10.28. Versões exatas no `pnpm-lock.yaml`.

`/` e `/como-calcular` são estáticas; `/historico` é renderizada no servidor a cada acesso.

## Mapa do código

```text
src/
├── app/
│   ├── layout.tsx               # cabeçalho, navegação e rodapé
│   ├── page.tsx                 # página do simulador
│   ├── historico/page.tsx       # últimas 50 simulações com busca (?q=)
│   └── como-calcular/page.tsx   # explicação com exemplos calculados pelo motor
├── components/
│   ├── simulador.tsx            # formulário (Client Component) e escolha do item do anexo
│   ├── resultado.tsx            # percentual, valor a recolher e memória de cálculo
│   └── salvar-simulacao.tsx     # fornecedor, observação e botão de salvar
├── features/historico/
│   ├── input.ts                 # validação Zod do que o cliente envia
│   ├── actions.ts               # Server Action: valida, recalcula e grava
│   └── repository.ts            # consultas Drizzle (inserir, listar com busca)
├── db/
│   ├── index.ts                 # pool `pg` único, limitado e criado sob demanda
│   └── schema/index.ts          # tabela simulacoes
├── data/anexo5.json             # base do Anexo 05 gerada pelo importador
└── lib/
    ├── tax/rates.ts             # UFs, alíquota interestadual por origem, interna da PB
    ├── tax/calculate.ts         # ST com MVA ajustada e antecipação parcial
    ├── anexo5/schema.ts         # formato validado da base (Zod)
    ├── anexo5/parse.ts          # texto do PDF ou CSV → itens
    ├── anexo5/lookup.ts         # busca de NCM por prefixo
    ├── anexo5/dados.ts          # carrega e valida o JSON
    ├── format.ts                # leitura e formatação pt-BR
    ├── env.ts, env-schema.ts    # DATABASE_URL e LOG_LEVEL validados (templates do toolkit)
    ├── logger.ts                # Pino com redação de segredos
    └── utils.ts                 # cn() do toolkit
drizzle/                         # SQL versionado das migrações
scripts/
├── import-anexo5.mts            # PDF/CSV → src/data/anexo5.json
└── verify-quality-rules.mjs     # autoteste das regras de lint
eslint-rules/                    # regras do toolkit (perfil completo)
```

## Fluxo

1. `pnpm anexo5:import` extrai o texto do PDF com `unpdf`, usa cada CEST (`NN.NNN.NN`) como início de linha, lê os NCMs seguintes e o primeiro percentual como MVA, valida com Zod e grava o JSON.
2. `dados.ts` importa o JSON no build e valida com o mesmo schema.
3. `simulador.tsx` busca o NCM digitado por prefixo (`lookup.ts`), monta a `Entrada` e chama `calcular()` a cada mudança. Tudo roda no navegador.
4. `como-calcular/page.tsx` chama `calcular()` no build com exemplos fixos, então a explicação nunca diverge do motor.
5. "Salvar simulação" chama a Server Action `salvarSimulacao`, que valida com Zod, recalcula com `calcular()` (o resultado do cliente é ignorado) e grava via `repository.ts`. Erros de banco viram mensagem genérica e log só com o código do erro.
6. `/historico` lê `?q=`, chama `listarSimulacoes` (ILIKE em NCM, fornecedor, observação e descrição, com curingas escapados, limite de 50) e mostra um aviso se o banco estiver inacessível.

## Dados

### Histórico (PostgreSQL)

Tabela `simulacoes` (`src/db/schema/index.ts`, SQL em `drizzle/0000_simulacoes.sql`): entrada (NCM, CEST, descrição, UF, importado, fornecedor do Simples, valores em centavos `bigint`, alíquotas e MVA `numeric`), resultado (regime, ICMS devido, percentual), `fornecedor` e `observacao` opcionais e `criada_em` com índice decrescente. Não há chaves estrangeiras nem dados pessoais além do nome do fornecedor.

Ciclo: alterar o schema → `pnpm db:generate` → revisar o SQL → `pnpm db:migrate` no banco certo. Nunca migrar durante build ou requisição. Pool de até 5 conexões, criado no primeiro uso; o build e os testes não precisam de banco.

### Anexo 05

`src/data/anexo5.json`: `{ fonte, importadoEm, itens: [{ cest, ncms[], descricao, mva | null }] }`. NCMs sem pontos, de 2 a 8 dígitos (prefixos). `mva: null` indica item sem MVA no anexo. Hoje o arquivo está vazio: o PDF oficial ainda não foi importado.

## Decisões

| Decisão | Motivo | Revisitar quando |
|---|---|---|
| Histórico em PostgreSQL + Drizzle | Padrão do toolkit; consultas com busca e ordenação | — |
| Anexo 05 como JSON versionado, não no banco | Dado público, atualizado poucas vezes por ano; diff revisável no Git | Houver edição da base pela interface |
| Resultado recalculado no servidor ao salvar | O cliente não é confiável; o histórico fica coerente com o motor | — |
| Histórico sem login | Uso interno de uma pessoa, pedido sem autenticação | O app for publicado sem proteção de acesso ou houver mais usuários |
| Cálculo no cliente | Resposta imediata e sem servidor | Regras precisarem ficar privadas |
| Centavos inteiros e arredondamento por valor | Evita erro de ponto flutuante | A SEFAZ-PB definir outra regra de arredondamento |
| MVA ajustada com 2 casas | Prática usual nos exemplos de ST | Divergência com cálculo oficial |
| Sem fonte do Google (`next/font/google`) | O build não depende de rede; fontes do sistema | Houver identidade visual definida |
| `"type": "module"` e imports `.ts` no parser | O importador roda o mesmo parser em Node 22 sem build | Mudança de runtime |

## Manutenção

Atualize este mapa quando diretórios, dependências relevantes ou fluxos mudarem.
