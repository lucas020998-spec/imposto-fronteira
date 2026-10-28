# Preparação local

## Pré-requisitos

- Node.js 22 ou mais novo (`node -v`).
- pnpm 10 (`corepack enable` ativa a versão do `packageManager`).

## Primeira execução

```bash
pnpm install
pnpm dev
```

Abra http://localhost:3000. Não há variáveis de ambiente.

## Base do Anexo 05

O repositório traz `src/data/anexo5.json` vazio até a primeira importação. Para preencher:

1. Baixe o PDF vigente do Anexo 05 do RICMS-PB no portal da SEFAZ-PB.
2. Rode `pnpm anexo5:import caminho/ANEXO_05.pdf "Anexo 05 RICMS-PB, versão de DD/MM/AAAA"`.
3. Confira alguns itens no JSON contra o PDF (CEST, NCM e MVA).
4. Faça commit do JSON atualizado.

Se o PDF não for lido corretamente, exporte a tabela para CSV com as colunas `cest;ncm;descricao;mva` e importe o CSV.

## Verificar

`pnpm check` roda lint, tipos, lint tipado, autoteste das regras, testes e build. Nada depende de rede ou credenciais.

## Agentes

Leia [AGENTS.md](../AGENTS.md). [CLAUDE.md](../CLAUDE.md) importa as mesmas instruções. As skills locais e suas fontes estão em [setup.md](setup.md).

## Problemas conhecidos

- Aviso `MODULE_TYPELESS_PACKAGE_JSON` ao importar: resolvido com `"type": "module"` no `package.json`.
