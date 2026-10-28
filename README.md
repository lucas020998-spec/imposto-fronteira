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

Publicar o app com o banco no Neon (passo a passo em [docs/onboarding.md](docs/onboarding.md#banco-de-produção-neon)).
