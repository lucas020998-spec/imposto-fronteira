# Código e arquitetura

## Stack

Next.js 16.4.3 (App Router, Turbopack), React 19.3, TypeScript 5.9 estrito, Tailwind CSS 4.3, Zod 4.6, Drizzle ORM 0.45 + `pg` 8 (PostgreSQL), Pino 10, Vitest 5.0, `unpdf` 1.9 (só no importador), Node 22, pnpm 10.28. Versões exatas no `pnpm-lock.yaml`.

`/` e `/como-calcular` são estáticas; `/historico` e `/entrar` são renderizadas no servidor a cada acesso. `src/proxy.ts` (antigo middleware) exige sessão em todas as rotas, exceto `/entrar` e arquivos estáticos.

## Mapa do código

```text
src/
├── proxy.ts                     # redireciona para /entrar sem sessão válida (manifesto e ícones ficam públicos)
├── app/
│   ├── layout.tsx               # cabeçalho, navegação e rodapé
│   ├── page.tsx                 # página do simulador
│   ├── entrar/page.tsx          # tela de senha
│   ├── manifest.ts              # app instalável (PWA): nome, cores e ícones de public/icons
│   ├── icon.png, apple-icon.png # ícones da aba e do iPhone
│   ├── historico/page.tsx       # últimas 50 simulações com busca (?q=)
│   └── como-calcular/page.tsx   # explicação com exemplos calculados pelo motor
├── components/
│   ├── simulador.tsx            # formulário (Client Component) e escolha do item do anexo
│   ├── resultado.tsx            # percentual, valor a recolher e memória de cálculo
│   ├── salvar-simulacao.tsx     # fornecedor, observação e botão de salvar
│   └── form-entrar.tsx          # formulário de senha (useActionState)
├── features/acesso/
│   ├── actions.ts               # Server Actions entrar (senha → cookie) e sair
│   └── sessao.ts                # temSessao(): checagem perto dos dados
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
    ├── tax/calculate.ts         # ST (revenda) e antecipação "por dentro" da SEFAZ-PB
    ├── tax/notas-reais.test.ts  # regressão com as 11 notas do DAR de 08/2026
    ├── anexo5/schema.ts         # formato validado da base (Zod)
    ├── anexo5/tabela.ts         # geometria do PDF (textos + bordas) → linhas e colunas
    ├── anexo5/parse.ts          # linhas → itens vigentes (MVAs, alíquota, notas de revogação) ou CSV
    ├── anexo5/lookup.ts         # busca de NCM por prefixo
    ├── anexo5/dados.ts          # carrega e valida o JSON
    ├── simulacao.ts             # formulário + item do anexo → entrada do cálculo (cliente e servidor)
    ├── format.ts                # leitura e formatação pt-BR
    ├── env.ts, env-schema.ts    # DATABASE_URL e LOG_LEVEL validados (templates do toolkit)
    ├── logger.ts                # Pino com redação de segredos
    ├── auth.ts                  # token de sessão (HMAC da senha), comparação em tempo constante, destino seguro
    └── utils.ts                 # cn() do toolkit
drizzle/                         # SQL versionado das migrações
scripts/
├── import-anexo5.mts            # PDF/CSV → src/data/anexo5.json (lê textos e bordas com unpdf/pdf.js)
├── sql-migracoes.mts            # `pnpm db:sql`: migrações num SQL só, para o editor do Neon
└── verify-quality-rules.mjs     # autoteste das regras de lint
eslint-rules/                    # regras do toolkit (perfil completo)
fontes/                          # PDF oficial do Anexo 05 usado na importação
render.yaml, .node-version       # publicação no Render (Blueprint, Node 22)
Iniciar Imposto Fronteira.bat    # liga o app no Windows com dois cliques
```

## Fluxo

1. `pnpm anexo5:import` lê cada página com pdf.js (via `unpdf`): textos com posição e os retângulos desenhados. `tabela.ts` acha as colunas pelas bordas divididas em 7 células e separa as linhas pelas bordas que atravessam a coluna ITEM; textos fora da tabela viram títulos ou notas. `parse.ts` junta linhas cortadas por quebra de página (o CEST identifica a linha), descarta itens com nota "Revogado o item…" e redações anteriores a "Nova redação dada ao item/segmento…", separa variantes de MVA (contrato de fidelidade, listas de medicamentos, procedência) e lê alíquota e FUNCEP. O resultado é validado com Zod e gravado.
2. `dados.ts` importa o JSON no build e valida com o mesmo schema.
3. `simulador.tsx` busca o NCM digitado por prefixo (`lookup.ts`), monta a entrada com `montarEntrada()` (MVA ajustada publicada para a origem, alíquota e FUNCEP do item) e chama `calcular()` a cada mudança, no navegador.
4. `como-calcular/page.tsx` chama `calcular()` no build com exemplos fixos, então a explicação nunca diverge do motor.
5. "Salvar simulação" chama a Server Action `salvarSimulacao` com NCM, CEST e variante. O servidor valida com Zod, busca o item no próprio anexo (`itemEscolhido`), monta a entrada com a mesma `montarEntrada()` e recalcula; MVA e resultado vindos do cliente são ignorados. Erros de banco viram mensagem genérica e log só com o código do erro.
6. Acesso: `entrar` compara a senha com `APP_PASSWORD` em tempo constante (espera 1 s se errar) e grava o cookie `sessao` (httpOnly, SameSite=Lax, Secure em produção, 30 dias) com um HMAC derivado da senha. O proxy valida o cookie em toda requisição; `salvarSimulacao` e `/historico` validam de novo com `temSessao()`. O redirecionamento pós-login só aceita caminhos internos.
7. `/historico` lê `?q=`, chama `listarSimulacoes` (ILIKE em NCM, fornecedor, observação e descrição, com curingas escapados, limite de 50) e mostra um aviso se o banco estiver inacessível.

## Dados

### Histórico (PostgreSQL)

Tabela `simulacoes` (`src/db/schema/index.ts`, SQL em `drizzle/0000_simulacoes.sql` e `0001_variante_fcp_mva_aplicada.sql`, `0002_revenda_frete_ipi.sql`): entrada (NCM, CEST, variante, descrição, UF, importado, fornecedor do Simples, valores em centavos `bigint`, alíquotas, FUNCEP, MVA original e MVA aplicada `numeric`), resultado (regime, ICMS devido, percentual), `fornecedor` e `observacao` opcionais e `criada_em` com índice decrescente. Não há chaves estrangeiras nem dados pessoais além do nome do fornecedor.

Ciclo: alterar o schema → `pnpm db:generate` → revisar o SQL → `pnpm db:migrate` no banco certo. Nunca migrar durante build ou requisição. Pool de até 5 conexões, criado no primeiro uso; o build e os testes não precisam de banco.

### Anexo 05

`src/data/anexo5.json`: `{ fonte, importadoEm, itens: [...] }`, uma entrada por item e variante: `segmento`, `item`, `cest`, `ncms[]` (prefixos sem pontos, 2 a 8 dígitos), `descricao`, `variante`, `mva` (original), `mvaAjustada` (`{4, 7, 12}` publicadas), `mvaTexto` (AD REM, PMPF…), `aliquota`, `fcp` e `aliquotaTexto`. Fonte atual: PDF atualizado em 09/07/2025, 657 entradas, 491 CEST, cerca de 23 KB comprimido no navegador.

## Decisões

| Decisão | Motivo | Revisitar quando |
|---|---|---|
| Histórico em PostgreSQL + Drizzle | Padrão do toolkit; consultas com busca e ordenação | — |
| Anexo 05 como JSON versionado, não no banco | Dado público, atualizado poucas vezes por ano; diff revisável no Git | Houver edição da base pela interface |
| Resultado recalculado no servidor ao salvar | O cliente não é confiável; o histórico fica coerente com o motor | — |
| Senha única em variável de ambiente, sem banco de usuários | Pedido do usuário; uma pessoa usa o app | Houver mais usuários ou necessidade de saber quem salvou |
| Cookie = HMAC da senha, sem sessão no banco | Sem estado extra; trocar a senha derruba todas as sessões | For preciso encerrar uma sessão específica |
| Cálculo no cliente | Resposta imediata e sem servidor | Regras precisarem ficar privadas |
| Centavos inteiros e arredondamento por valor | Evita erro de ponto flutuante | A SEFAZ-PB definir outra regra de arredondamento |
| MVA ajustada com 2 casas | Prática usual nos exemplos de ST | Divergência com cálculo oficial |
| Render (grátis) + Neon (grátis), região US East | Roda o app sem mudanças, com senha e histórico; Render não tem região no Brasil, então o banco fica na mesma região do app | O sono de 15 min do plano grátis incomodar, ou houver necessidade de dados no Brasil |
| App instalável (PWA) em vez de app de loja | Mesmo código, sem custo de loja e com atualização automática | Precisar de recurso que só app nativo oferece |
| Sem fonte do Google (`next/font/google`) | O build não depende de rede; fontes do sistema | Houver identidade visual definida |
| `"type": "module"` e imports `.ts` no parser | O importador roda o mesmo parser em Node 22 sem build | Mudança de runtime |

## Manutenção

Atualize este mapa quando diretórios, dependências relevantes ou fluxos mudarem.
