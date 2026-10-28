# Imposto Fronteira PB

Simulador do ICMS de fronteira para compras interestaduais da Marconi Pinto Metalúrgica, empresa do Simples Nacional na Paraíba. O gerente de compras informa o NCM, o estado do fornecedor e o valor; o app consulta o Anexo 05 do RICMS-PB, mostra o percentual de imposto com a memória de cálculo e guarda as simulações num histórico pesquisável.

## Rodar

Requer Node.js 22+, pnpm 10 e PostgreSQL (para o histórico).

```bash
pnpm install
cp .env.example .env.local   # preencha DATABASE_URL e APP_PASSWORD (senha de acesso)
pnpm db:migrate              # cria a tabela do histórico
pnpm dev                     # http://localhost:3000
pnpm check                   # lint, tipos, testes e build (não precisa de banco)
```

O simulador funciona sem banco; só o histórico depende dele. Detalhes em [docs/onboarding.md](docs/onboarding.md).

### No Windows, com dois cliques

Com o Node.js instalado e o `.env.local` pronto, dê dois cliques em `Iniciar Imposto Fronteira.bat`. Na primeira vez (e depois de baixar uma versão nova) ele instala e prepara o app; depois só liga e abre o navegador em http://localhost:3000. Sem o pnpm instalado, ele usa o `npx` (vem com o Node.js). Fechar a janela preta desliga o app. Para ter um ícone na área de trabalho: botão direito no arquivo → **Enviar para** → **Área de trabalho (criar atalho)**.

### Importar o Anexo 05

A base atual vem do PDF atualizado em 09/07/2025, guardado em `fontes/`. Quando a SEFAZ-PB publicar outra versão, salve o PDF em `fontes/` e rode:

```bash
pnpm anexo5:import fontes/ARQUIVO.pdf "Anexo 05 RICMS-PB, atualizado em DD/MM/AAAA"
```

O comando grava `src/data/anexo5.json`. Confira alguns itens com o PDF antes de publicar. Também aceita CSV com as colunas `cest;ncm;descricao;mva`.

## Documentação

- [Produto e escopo](PRODUCT.md)
- [Preparação local](docs/onboarding.md)
- [Estrutura e decisões técnicas](docs/architecture.md)
- [Design e acessibilidade](docs/design.md)
- [Verificações de qualidade](docs/quality.md)
- [Instruções para agentes](AGENTS.md)
- [Setup e evidências](docs/setup.md)

## Próxima entrega

Publicar no Render com o banco no Neon e instalar no celular (passo a passo em [docs/onboarding.md](docs/onboarding.md#publicação-neon-banco--render-app)).
