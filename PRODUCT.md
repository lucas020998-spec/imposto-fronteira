# Imposto Fronteira PB

## Problema e objetivo

Quem compra mercadoria de outro estado para revender na Paraíba paga ICMS na entrada (o "imposto de fronteira"). O valor depende do NCM do produto, do estado do fornecedor e de estar ou não na substituição tributária do Anexo 05 do RICMS-PB. Hoje o gerente de compras descobre esse custo consultando o PDF do anexo e fazendo a conta à mão ou perguntando à contabilidade.

Objetivo: antes de fechar a compra, saber em segundos o percentual de ICMS que a Paraíba vai cobrar sobre os produtos, para comparar fornecedores e formar preço.

## Público

Gerente de compras de empresa varejista ou atacadista paraibana. Uso individual, sem login, em desktop e celular, em português.

## Fluxos da primeira versão

1. **Simular uma compra:** informa NCM, estado do fornecedor e valor dos produtos e, se quiser, frete e IPI. Recebe o percentual sobre os produtos, o valor a recolher e a memória de cálculo.
2. **Consultar o Anexo 05:** ao digitar o NCM, vê os itens do anexo que o cobrem (CEST, descrição, MVA) e escolhe o correto quando há mais de um.
3. **Entender o cálculo:** a página "Como é calculado" explica as alíquotas, a MVA ajustada e a diferença entre ST e antecipação parcial, com exemplos numéricos.
4. **Atualizar a base:** quem mantém o app importa uma nova versão do PDF do Anexo 05 (ou um CSV) com `pnpm anexo5:import`.

## MVP

1. Motor de cálculo de ST (MVA ajustada) e antecipação parcial, com testes.
2. Busca de NCM por prefixo na base importada do Anexo 05.
3. Frete, IPI e MVA manual opcionais; alíquota interna editável (padrão 20%).
4. Página explicativa com exemplos gerados pelo mesmo motor.
5. Importador do PDF/CSV do Anexo 05.

## Fora do escopo

Login, histórico de simulações, cálculo por nota fiscal com vários itens, Simples Nacional, benefícios fiscais, regimes especiais, produtos com preço de pauta/PMC, FCP e emissão de guia (DAR).

## Requisitos

- Alíquota interestadual pelo estado de origem: 7% para SP, RJ, MG, PR, SC e RS; 12% para os demais; 4% para importados.
- Alíquota interna geral da PB: 20% (Lei 12.788/2023), editável na tela.
- ST: MVA ajustada = [(1 + MVA) × (1 − interestadual) ÷ (1 − interna)] − 1, com 2 casas decimais. Base = (produtos + frete + IPI) × (1 + MVA ajustada). ICMS = base × interna − (produtos + frete) × interestadual.
- Antecipação parcial: (produtos + frete) × (interna − interestadual).
- Valores em centavos inteiros, arredondamento em cada valor monetário.
- Interface acessível em pt-BR, funcional a partir de 360px de largura.

## Restrições e decisões técnicas

- Next.js 16.4 (App Router), TypeScript estrito, Tailwind 4, pnpm 10, Node 22.
- **Sem banco de dados.** O app não guarda dados de usuários; a única base é o Anexo 05, um arquivo público, versionado e atualizado poucas vezes por ano. Ele fica em `src/data/anexo5.json`, gerado pelo importador e revisado no Git. Revisar essa decisão se surgirem histórico, contas de usuário ou edição da base pela interface.
- Cálculo roda no navegador; as páginas são estáticas.

## Premissas e pendências

| Item | Tipo | Impacto | Próximo passo |
|---|---|---|---|
| **PDF oficial do Anexo 05 não importado** | Pendência essencial | Sem ele, a busca por NCM não encontra nada e o app só calcula com MVA manual ou antecipação parcial | Baixar o PDF vigente da SEFAZ-PB e rodar `pnpm anexo5:import`; conferir uma amostra |
| Layout do PDF real | Premissa | O importador foi testado com texto e PDF sintéticos no formato ITEM / CEST / NCM / DESCRIÇÃO / MVA | Validar com o arquivo oficial e ajustar `src/lib/anexo5/parse.ts` se preciso |
| Frete e IPI na antecipação parcial | Premissa reversível | Frete na nota entra na base; IPI não entra | Confirmar com a contabilidade |
| Alíquota interna 20% para todos os itens | Premissa reversível | Produtos com alíquota própria exigem ajuste manual | Campo editável na tela |
| FCP e MVA específicas por alíquota interestadual | Fora da v1 | Alguns itens do anexo podem ter MVA diferente por origem | Avaliar após importar o PDF real |

## Critérios de aceite

- Com NCM coberto pelo anexo, o resultado indica substituição tributária e usa a MVA do item escolhido.
- Com NCM fora do anexo, o resultado indica antecipação parcial.
- Frete e IPI só entram no cálculo quando marcados.
- O exemplo da página explicativa (R$ 1.000, PE, frete R$ 50, IPI 10%, MVA 33%) resulta em 21,05% e R$ 210,49.
- A tela não tem rolagem horizontal em 390px.

## Próxima entrega

Importar o PDF oficial vigente do Anexo 05 e conferir 10 itens de segmentos diferentes contra o documento.

## Manutenção

Atualize este documento quando o objetivo, o escopo, as regras fiscais ou os critérios de aceite mudarem. Decisões técnicas e evidências ficam em `docs/architecture.md` e `docs/setup.md`.
