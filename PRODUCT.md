# Imposto Fronteira PB

## Problema e objetivo

A Marconi Pinto Metalúrgica (João Pessoa/PB, optante do Simples Nacional) compra mercadorias de outros estados e paga ICMS na entrada, o "imposto de fronteira". O valor depende do NCM do produto, do estado do fornecedor e de estar ou não na substituição tributária do Anexo 05 do RICMS-PB. Hoje o gerente de compras descobre esse custo consultando o PDF do anexo e fazendo a conta à mão ou perguntando à contabilidade.

Objetivo: antes de fechar a compra, saber em segundos o percentual de ICMS que a Paraíba vai cobrar sobre os produtos, guardar a simulação e consultá-la depois.

## Público

Gerente de compras da empresa. Uso interno, protegido por uma senha única de acesso, em desktop e celular, em português.

## Fluxos

0. **Entrar:** qualquer página pede a senha de acesso; a sessão dura 30 dias ou até clicar em "Sair".
1. **Simular uma compra:** informa NCM, estado do fornecedor e valor dos produtos e, se quiser, frete, IPI e se o fornecedor é do Simples. Recebe o percentual sobre os produtos, o valor a recolher e a memória de cálculo.
2. **Consultar o Anexo 05:** ao digitar o NCM, vê os itens do anexo que o cobrem (CEST, descrição, MVA) e escolhe o correto quando há mais de um.
3. **Salvar no histórico:** com a simulação na tela, informa fornecedor e observação (ambos opcionais) e salva.
4. **Consultar o histórico:** vê as 50 simulações mais recentes e busca por NCM, fornecedor, observação ou descrição do anexo.
5. **Entender o cálculo:** a página "Como é calculado" explica as regras do Simples com exemplos numéricos.
6. **Atualizar a base:** quem mantém o app importa uma nova versão do PDF do Anexo 05 (ou um CSV) com `pnpm anexo5:import`.

## Fora do escopo

Usuários individuais e permissões, edição ou exclusão de simulações, cálculo por nota fiscal com vários itens, regime normal (débito e crédito), benefícios fiscais, FCP, produtos com preço de pauta/PMC, compras de matéria-prima para industrialização ou de uso e consumo, e emissão de guia (DAR).

## Regras de cálculo (Simples Nacional)

- Alíquota interestadual pelo estado de origem: 7% para SP, RJ, MG, PR, SC e RS; 12% para os demais; 4% para importados.
- Alíquota interna geral da PB: 20% (Lei 12.788/2023), editável na tela.
- O ICMS de fronteira é pago fora do DAS (LC 123/2006, art. 13, § 1º, XIII, "a" e "g").
- **Substituição tributária (NCM no Anexo 05):** MVA ajustada = [(1 + MVA) × (1 − interestadual) ÷ (1 − interna)] − 1, com 2 casas decimais. Se o fornecedor é do Simples, usa a MVA original sem ajuste (Conv. ICMS 142/2018, cl. 11, § 1º). Base = (produtos + frete + IPI) × (1 + MVA). ICMS = base × interna − (produtos + frete) × interestadual.
- **Antecipação parcial (NCM fora do anexo):** diferença de alíquotas sem agregar MVA. Base = produtos + frete + IPI. ICMS = base × interna − (produtos + frete) × interestadual.
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
| **PDF oficial do Anexo 05 não importado** | Pendência essencial | Sem ele, a busca por NCM não encontra nada e o app só calcula com MVA manual ou antecipação parcial | O envio pelo chat falhou; enviar pelo GitHub e rodar `pnpm anexo5:import` |
| **Banco de dados de produção** | Decisão externa | O histórico só funciona com um PostgreSQL acessível pelo app publicado | Escolher o provedor (ex.: Neon ou Supabase) e configurar `DATABASE_URL` |
| **Força da senha** | Risco aceito | A senha pedida tem 4 dígitos (10 mil combinações). Há 1 s de espera por erro, mas várias tentativas em paralelo ainda podem descobri-la | Usar uma senha mais longa em `APP_PASSWORD` ou adicionar bloqueio por tentativas |
| Regras do Simples na PB | Premissa reversível | IPI na base da antecipação, MVA sem ajuste para fornecedor do Simples e crédito pela alíquota interestadual vieram da LC 123, do Conv. 142/2018 e de fontes secundárias; o RICMS-PB não foi consultado (site bloqueado) | Validar com a contabilidade |
| Base "por dentro" | Premissa | Fontes secundárias indicam que, desde 2021, a PB calcula a antecipação do regime normal "por dentro" (art. 106). Não foi confirmado se vale para o Simples | Validar com a contabilidade |
| Industrialização e uso/consumo | Fora da v1 | A empresa é metalúrgica; compras de insumos ou de uso e consumo podem ter outra regra | Definir com a contabilidade |
| Cartão CNPJ de 2015 | Premissa | Enquadramento atual no Simples informado pelo usuário | Nenhum |

## Critérios de aceite

- Com NCM coberto pelo anexo, o resultado indica substituição tributária e usa a MVA do item escolhido; com fornecedor do Simples marcado, a MVA não é ajustada.
- Com NCM fora do anexo, o resultado indica antecipação parcial, com IPI na base.
- Frete e IPI só entram no cálculo quando marcados.
- R$ 1.000 de PE, frete R$ 50, IPI 10%, sem MVA: 10,4% e R$ 104,00.
- Uma simulação salva aparece no topo do histórico com fornecedor e observação, e a busca por um trecho da observação a encontra.
- Sem a senha, qualquer página redireciona para "Entrar"; com a senha certa, volta à página pedida.
- A tela não tem rolagem horizontal em 390px.

## Próxima entrega

Importar o PDF oficial vigente do Anexo 05 e conferir 10 itens de segmentos diferentes contra o documento.

## Manutenção

Atualize este documento quando o objetivo, o escopo, as regras fiscais ou os critérios de aceite mudarem. Decisões técnicas e evidências ficam em `docs/architecture.md` e `docs/setup.md`.
