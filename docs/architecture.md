# Código e arquitetura

## Stack

Next.js 16.4.3 (App Router, Turbopack), React 19.3, TypeScript 5.9 estrito, Tailwind CSS 4.3, Zod 4.6, Vitest 5.0, `unpdf` 1.9 (só no importador), Node 22, pnpm 10.28. Versões exatas no `pnpm-lock.yaml`.

Sem banco de dados, Drizzle, Pino nem variáveis de ambiente: o app não guarda dados de usuários e roda inteiro como páginas estáticas. Motivo e condição de revisão em `PRODUCT.md`.

## Mapa do código

```text
src/
├── app/
│   ├── layout.tsx               # cabeçalho, navegação e rodapé
│   ├── page.tsx                 # página do simulador
│   └── como-calcular/page.tsx   # explicação com exemplos calculados pelo motor
├── components/
│   ├── simulador.tsx            # formulário (Client Component) e escolha do item do anexo
│   └── resultado.tsx            # percentual, valor a recolher e memória de cálculo
├── data/anexo5.json             # base do Anexo 05 gerada pelo importador
└── lib/
    ├── tax/rates.ts             # UFs, alíquota interestadual por origem, interna da PB
    ├── tax/calculate.ts         # ST com MVA ajustada e antecipação parcial
    ├── anexo5/schema.ts         # formato validado da base (Zod)
    ├── anexo5/parse.ts          # texto do PDF ou CSV → itens
    ├── anexo5/lookup.ts         # busca de NCM por prefixo
    ├── anexo5/dados.ts          # carrega e valida o JSON
    ├── format.ts                # leitura e formatação pt-BR
    └── utils.ts                 # cn() do toolkit
scripts/
├── import-anexo5.mts            # PDF/CSV → src/data/anexo5.json
└── verify-quality-rules.mjs     # autoteste das regras de lint
eslint-rules/                    # regras do toolkit (perfil leve)
```

## Fluxo

1. `pnpm anexo5:import` extrai o texto do PDF com `unpdf`, usa cada CEST (`NN.NNN.NN`) como início de linha, lê os NCMs seguintes e o primeiro percentual como MVA, valida com Zod e grava o JSON.
2. `dados.ts` importa o JSON no build e valida com o mesmo schema.
3. `simulador.tsx` busca o NCM digitado por prefixo (`lookup.ts`), monta a `Entrada` e chama `calcular()` a cada mudança. Tudo roda no navegador.
4. `como-calcular/page.tsx` chama `calcular()` no build com exemplos fixos, então a explicação nunca diverge do motor.

## Dados

`src/data/anexo5.json`: `{ fonte, importadoEm, itens: [{ cest, ncms[], descricao, mva | null }] }`. NCMs sem pontos, de 2 a 8 dígitos (prefixos). `mva: null` indica item sem MVA no anexo. Hoje o arquivo está vazio: o PDF oficial ainda não foi importado.

## Decisões

| Decisão | Motivo | Revisitar quando |
|---|---|---|
| Sem banco; base como JSON versionado | Dado público, atualizado poucas vezes por ano; deploy estático; diff revisável no Git | Houver histórico, contas ou edição da base pela interface |
| Cálculo no cliente | Resposta imediata e sem servidor | Regras precisarem ficar privadas |
| Centavos inteiros e arredondamento por valor | Evita erro de ponto flutuante | A SEFAZ-PB definir outra regra de arredondamento |
| MVA ajustada com 2 casas | Prática usual nos exemplos de ST | Divergência com cálculo oficial |
| Sem fonte do Google (`next/font/google`) | O build não depende de rede; fontes do sistema | Houver identidade visual definida |
| `"type": "module"` e imports `.ts` no parser | O importador roda o mesmo parser em Node 22 sem build | Mudança de runtime |

## Manutenção

Atualize este mapa quando diretórios, dependências relevantes ou fluxos mudarem.
