# Imposto Fronteira PB

## Problema e objetivo

A Marconi Pinto Metalúrgica (João Pessoa/PB, optante do Simples Nacional) compra mercadorias de outros estados e paga ICMS na entrada, o "imposto de fronteira". O valor depende do NCM do produto, do estado do fornecedor e de estar ou não na substituição tributária do Anexo 05 do RICMS-PB. Hoje o gerente de compras descobre esse custo consultando o PDF do anexo e fazendo a conta à mão ou perguntando à contabilidade.

Objetivo: antes de fechar a compra, saber em segundos o percentual de ICMS que a Paraíba vai cobrar sobre os produtos, guardar a simulação e consultá-la depois.

## Público

Gerente de compras da empresa. Uso interno, protegido por uma senha única de acesso, em desktop e celular, em português.

## Fluxos

0. **Entrar:** qualquer página pede a senha de acesso; a sessão dura 30 dias ou até clicar em "Sair".
1. **Simular uma compra:** informa NCM, estado do fornecedor, valor dos produtos, se é revenda e, se quiser, frete (na nota ou em CT-e), IPI (em R$ ou %) e se o fornecedor é do Simples. Recebe o percentual sobre os produtos, o valor a recolher e a memória de cálculo.
2. **Consultar o Anexo 05:** ao digitar o NCM, vê os itens do anexo que o cobrem (CEST, descrição, variante, MVA original e ajustada para a origem, alíquota) e escolhe o correto quando há mais de um.
3. **Salvar no histórico:** com a simulação na tela, informa fornecedor e observação (ambos opcionais) e salva.
4. **Consultar o histórico:** vê as 50 simulações mais recentes e busca por NCM, fornecedor, observação ou descrição do anexo.
5. **Entender o cálculo:** a página "Como é calculado" explica as regras do Simples com exemplos numéricos.
6. **Atualizar a base:** quem mantém o app importa uma nova versão do PDF do Anexo 05 (ou um CSV) com `pnpm anexo5:import`.

## Fora do escopo

Usuários individuais e permissões, edição ou exclusão de simulações, cálculo por nota fiscal com vários itens, regime normal (débito e crédito), benefícios fiscais, FCP, produtos com preço de pauta/PMC, e emissão de guia (DAR).

## Regras de cálculo (Simples Nacional)

- Alíquota interestadual pelo estado de origem: 7% para SP, RJ, MG, PR, SC e RS; 12% para os demais; 4% para importados.
- Alíquota interna geral da PB: 20% (Lei 12.788/2023), editável na tela.
- O ICMS de fronteira é pago fora do DAS (LC 123/2006, art. 13, § 1º, XIII, "a" e "g").
- **Substituição tributária (revenda de item do Anexo 05):** usa a MVA ajustada publicada no anexo para a alíquota interestadual da origem (4%, 7% ou 12%). Sem valor publicado, ou com MVA digitada, calcula: [(1 + MVA) × (1 − interestadual) ÷ (1 − interna)] − 1, com 2 casas decimais. Se o fornecedor é do Simples, usa a MVA original sem ajuste (Conv. ICMS 142/2018, cl. 11, § 1º). Base = (produtos + frete + IPI) × (1 + MVA). ICMS = base × (interna + FUNCEP) − (produtos + frete) × interestadual. **Ainda não conferida com um DAR de ST.**
- Alíquota interna e FUNCEP vêm do item do anexo (ex.: bebidas 25% + 2%); quando o anexo traz condições ("com gás", "quando…"), usa 20% e mostra o texto original. O usuário pode digitar outra alíquota.
- Itens sem MVA percentual (AD REM, PMPF, pauta) não são calculados: o app pede a MVA manual.
- **Antecipação (industrialização, uso, ou NCM fora do anexo):** como a SEFAZ-PB cobra no DAR "ICMS-Simples Nacional-Fronteira" (receita 1124). Valor líquido = produtos + IPI + frete − ICMS da nota − ICMS do CT-e. Base = valor líquido ÷ (1 − interna). ICMS = base × (interna − interestadual). O ICMS da nota é (produtos + frete na nota) × interestadual, ou zero se o fornecedor é do Simples; o do CT-e é frete × 7% ou 12% pela UF de origem (mesmo com mercadoria importada a 4%). Base e ICMS arredondados em centavos.
- **Evidência:** a fórmula reproduz as 11 notas do DAR de 08/2026 (R$ 4.021,49), centavo por centavo; o teste `notas-reais.test.ts` guarda esses casos. Nesse DAR, a SEFAZ cobrou antecipação inclusive de NCMs do Anexo 05 (perfis 7308.90.10, autopeças 8512, parafusos 7318), compradas para industrialização ou uso.
- Valores em centavos inteiros, arredondamento em cada valor monetário.

## Requisitos

- O histórico guarda a entrada e o resultado do momento em que foi salvo; o servidor recalcula o resultado antes de gravar.
- Fornecedor até 120 caracteres e observação até 1.000, ambos opcionais.
- Interface acessível em pt-BR, funcional a partir de 360px de largura.
- Acesso: senha única definida em `APP_PASSWORD` no servidor (nunca no código). Sem a variável, todas as páginas ficam bloqueadas. Trocar a senha encerra todas as sessões.

## Restrições e decisões técnicas

- Next.js 16.4 (App Router), TypeScript estrito, Tailwind 4, pnpm 10, Node 22.
- PostgreSQL com Drizzle ORM e driver `pg` para o histórico, padrão do toolkit.
- O Anexo 05 continua como arquivo versionado (`src/data/anexo5.json`): é público, muda poucas vezes por ano e o diff fica revisável no Git.
- O cálculo roda no navegador; o servidor recalcula ao salvar.

## Premissas e pendências

| Item | Tipo | Impacto | Próximo passo |
|---|---|---|---|
| Base do Anexo 05 | Premissa verificada por amostra | Importada do PDF atualizado em 09/07/2025 (Decreto 46.791/25): 657 entradas, 491 CEST. 16 itens de 11 segmentos conferidos contra o PDF; revogados e redações substituídas foram descartados | Reimportar a cada atualização da SEFAZ-PB e conferir uma amostra |
| Item 999.0 de autopeças (CEST 01.999.00) | Limite conhecido | "Outras peças… não relacionadas" não tem NCM no anexo, então não aparece na busca | Usar MVA manual quando a contabilidade enquadrar a peça nesse item |
| **Banco de dados de produção** | Decisão externa | O histórico só funciona com um PostgreSQL acessível pelo app publicado | Escolher o provedor (ex.: Neon ou Supabase) e configurar `DATABASE_URL` |
| **Força da senha** | Risco aceito | A senha pedida tem 4 dígitos (10 mil combinações). Há 1 s de espera por erro, mas várias tentativas em paralelo ainda podem descobri-la | Usar uma senha mais longa em `APP_PASSWORD` ou adicionar bloqueio por tentativas |
| Antecipação do Simples | Verificada | Reproduz as 11 notas do DAR de 08/2026 (ver Evidência acima) | Repetir a conferência quando a SEFAZ mudar alíquotas ou o cálculo |
| ST na revenda | Premissa | A fórmula da ST e o uso da MVA na fronteira para revenda vêm do Anexo 05, do Conv. 142/2018 e de fontes secundárias; nenhum DAR de ST foi conferido | Conferir com uma nota de revenda paga como ST |
| Revenda × industrialização | Decisão do usuário por compra | O simulador começa em "não é revenda" (antecipação), como nas notas reais; marcar revenda muda o cálculo de itens do Anexo 05 para ST | Confirmar com a contabilidade quando a revenda paga ST na fronteira |
| Cartão CNPJ de 2015 | Premissa | Enquadramento atual no Simples informado pelo usuário | Nenhum |

## Critérios de aceite

- Com NCM coberto pelo anexo e "Compra para revenda" marcada, o resultado indica substituição tributária e usa a MVA ajustada publicada para a origem; com fornecedor do Simples marcado, usa a MVA original. Sem revenda, é antecipação.
- NCM 7610.10.00, R$ 1.000 de SP, revenda: CEST 10.071.00, MVA ajustada 53,45%, 23,69% (R$ 236,90).
- Antecipação: NF 49700 (PE, R$ 2.895,44, IPI R$ 94,10, frete CT-e R$ 280) dá R$ 288,85, igual ao DAR; NF 645 (SP, fornecedor do Simples, R$ 7.860, frete R$ 286,84) dá R$ 1.320,60.
- Frete e IPI só entram no cálculo quando marcados.
- R$ 1.000 de PE, frete R$ 50, IPI 10%, sem MVA: 10,4% e R$ 104,00.
- Uma simulação salva aparece no topo do histórico com fornecedor e observação, e a busca por um trecho da observação a encontra.
- Sem a senha, qualquer página redireciona para "Entrar"; com a senha certa, volta à página pedida.
- A tela não tem rolagem horizontal em 390px.

## Próxima entrega

Publicar o app com o banco no Neon e as variáveis `DATABASE_URL` e `APP_PASSWORD` na hospedagem (ver `docs/onboarding.md`).

## Manutenção

Atualize este documento quando o objetivo, o escopo, as regras fiscais ou os critérios de aceite mudarem. Decisões técnicas e evidências ficam em `docs/architecture.md` e `docs/setup.md`.
