# Catálogo histórico para regressão

`legacy_catalog.js` congela os dados e formações da v0.20.0 para os testes antigos de batalha, recuperação, interface e arredondamento. Esses cenários verificam comportamentos anteriores com entradas estáveis, incluindo a seleção histórica de quatro Comuns.

O arquivo não é carregado por `index.html` e não integra o jogo. O catálogo de produção tem somente 30 oficiais. `catalog.test.js`, `official_abilities.test.js` e `official_integration.test.js` usam diretamente esse catálogo atual; verificam a seleção de um Comum mais um Raro automático, as novas habilidades e 200 partidas completas.
