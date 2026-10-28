# Imposto Fronteira PB

Simulador do ICMS de fronteira para compras interestaduais da Marconi Pinto Metalúrgica, empresa do Simples Nacional na Paraíba. O gerente de compras informa o NCM, o estado do fornecedor e o valor; o app consulta o Anexo 05 do RICMS-PB, mostra o percentual de imposto com a memória de cálculo e guarda as simulações num histórico pesquisável.

## Rodar

Requer Node.js 22+, pnpm 10 e PostgreSQL (para o histórico).

```bash
pnpm install
cp .env.example .env.local   # preencha DATABASE_URL
pnpm db:migrate              # cria a tabela do histórico
pnpm dev                     # http://localhost:3000
pnpm check                   # lint, tipos, testes e build (não precisa de banco)
```

O simulador funciona sem banco; só o histórico depende dele. Detalhes em [docs/onboarding.md](docs/onboarding.md).

### Importar o Anexo 05

Baixe o PDF vigente do Anexo 05 no site da SEFAZ-PB e rode:

```bash
pnpm anexo5:import caminho/ANEXO_05.pdf "Anexo 05 RICMS-PB, versão de DD/MM/AAAA"
```

O comando grava `src/data/anexo5.json`. Confira alguns itens com o PDF antes de usar. Também aceita CSV com as colunas `cest;ncm;descricao;mva`.

## Documentação

- [Produto e escopo](PRODUCT.md)
- [Preparação local](docs/onboarding.md)
- [Estrutura e decisões técnicas](docs/architecture.md)
- [Design e acessibilidade](docs/design.md)
- [Verificações de qualidade](docs/quality.md)
- [Instruções para agentes](AGENTS.md)
- [Setup e evidências](docs/setup.md)

## Próxima entrega

Importar o PDF oficial do Anexo 05 e conferir 10 itens de segmentos diferentes contra o documento.
