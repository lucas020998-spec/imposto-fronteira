# Design e acessibilidade

## Direção

Ferramenta de trabalho para o gerente de compras: sóbria, direta, em pt-BR. O número que importa (percentual sobre os produtos) aparece grande e primeiro; a memória de cálculo vem logo abaixo, para conferência. Funciona no celular durante uma negociação e no desktop ao montar pedidos.

## Sistema existente

- Ícone: quadrado verde-azulado (`#0f766e`) com "PB" e "ICMS %" em branco; versões em `public/icons/` (192, 512 e maskable com margem de segurança) e `src/app/icon.png`/`apple-icon.png`. A cor do tema do navegador é a mesma.
- Tokens em `src/app/globals.css`: `background`, `foreground`, `card`, `muted`, `line`, `accent` (verde-azulado), com variantes para tema escuro via `prefers-color-scheme`.
- Tipografia: fonte do sistema (`--font-sans`); números com `tabular-nums`.
- Componentes: `Simulador`, `Resultado` e `SalvarSimulacao` em `src/components/`; página `/historico` com cartões e busca. Não há biblioteca de UI; `cn()` em `src/lib/utils.ts` está disponível.

## Interação

- Todos os campos têm `<label>`; grupos usam `<fieldset>`/`<legend>`.
- O resultado tem `aria-live="polite"` e é recalculado a cada digitação, sem botão.
- Frete e IPI ficam atrás de caixas de seleção: o campo só aparece quando marcado.
- Itens do anexo com o mesmo NCM aparecem como botões de opção, com CEST, variante, MVA original e ajustada para a origem escolhida, alíquota especial e descrição.
- "Compra para revenda" fica desmarcada por padrão; o texto do NCM avisa quando o item está no Anexo 05 mas o cálculo é de antecipação.
- Frete tem a opção "cobrado na própria nota"; IPI vem em R$ por padrão, com opção de percentual.
- O resultado da antecipação mostra os créditos da nota e do CT-e, o valor líquido, a base "por dentro" e a diferença de alíquotas, na mesma ordem do extrato da SEFAZ.
- Item sem MVA percentual mostra o motivo no lugar do resultado e pede a MVA manual.
- A alíquota interna fica vazia por padrão; o texto de exemplo mostra o valor automático (do anexo ou geral).
- Mensagens de estado do NCM ficam abaixo do campo e ligadas por `aria-describedby`.
- "Salvar simulação" fica desativado sem NCM e valor, mostra "Salvando…" durante o envio e anuncia o resultado com `role="status"`; após salvar, limpa fornecedor e observação e oferece link para o histórico.
- O histórico usa `<form role="search">` com GET (`?q=`), então a busca funciona sem JavaScript e pode ser favoritada. Datas no fuso de João Pessoa.

## Layout e revisão

- Uma coluna no celular; a partir de `md` (768px), formulário à esquerda e resultado fixo à direita.
- Estados: sem valor ("Informe o valor dos produtos…"), base vazia, NCM encontrado, NCM fora do anexo; histórico vazio, busca sem resultado e banco inacessível.
- Verificado com Playwright em 1200px e 390px (simulador, histórico e explicação): sem rolagem horizontal, sem erros de console.
- Pendente: revisão completa com a skill `web-design-guidelines` e teste com leitor de tela.

## Manutenção

Mudanças visuais alteram os tokens em `globals.css` e esta página quando uma regra mudar.
