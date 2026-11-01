# Desenvolvimento

1. Rode `npm test` antes de alterar regras ou telas.
2. Faça a mudança na área correspondente: `js/data/` para conteúdo, `js/core/` para regras e `js/ui/` para interface.
3. Atualize os testes que descrevem a regra alterada e registre a decisão em `docs/REGRAS.md`.
4. Abra `index.html` no navegador ou use `npm run dev` para testar a partida manualmente.

O jogo não possui dependências de terceiros. A pasta `assets/` contém arte e fontes do protótipo; arquivos indicados como provisórios nas regras podem ser substituídos quando houver material definitivo.

## Entregas por versão

A cada atualização, revise os controles afetados e incremente a versão em `package.json` e `G.CONFIG.version` (`js/data/characters.js`). Registre as mudanças em `docs/HISTORICO.md`, atualize a versão apresentada no README e execute as validações pertinentes. Publique cada versão com uma tag Git `vX.Y.Z` e forneça o link do ZIP dessa tag para teste. Preserve os valores e regras de balanceamento quando a mudança for visual.
