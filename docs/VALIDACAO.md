# Validação — v0.50.0

Revisão em 18/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois da alteração. Menu, abertura, áudio, recursos originais e modelo da batalha preservados; 32 escolhas e séries completas com 1793 ações no teste do modelo.
- `npm run test:battle`: aprovado. Carregamento das 18 faixas CC e das 32 cartas, inspeção por clique e teclado, troca para último atacante, silhueta para faixa pendente, série completa até três vitórias, espera de 3,2 segundos dos bots, mortes, pausa, exportação, redimensionamento, reinício e toque.
- As 18 imagens de 2048 × 2048 pixels são cópias byte a byte dos arquivos recebidos em Photos-1-001 (5).zip. SHA-256 registrado no manifesto. Conferida a correspondência visual; Sheriff verde não foi confundido com Sheriff roxo.
- Comparação dos 32 registros com a v0.49.1: somente o campo de arte da fila foi acrescentado. Nomes, cartas, retratos, vida, dano, multiplicadores e fôlego permanecem iguais.
- No computador em 1440 × 900, placar, painel e retrato mantêm as mesmas posições e dimensões da v0.49.1. A fila apresenta as artes completas, sem invadir o retrato inferior. O teste também confere a separação em 1024 × 768.
- Em 844 × 390 com toque, as posições e dimensões da fila, faixa atual, painel, retrato e placar anterior são idênticas às da v0.49.1. As faixas novas ficam ocultas nessa composição.
- Prévia da arena e outros três pacotes gerados na v0.50.0. Integridade dos ZIPs, referências HTML locais e correspondência dos arquivos com o projeto verificadas, exceto os links de navegação adaptados nas prévias isoladas.
- O ZIP da arena foi extraído em uma pasta separada e aberto por outro servidor local: todas as 18 faixas carregaram, o último atacante foi atualizado, a consulta funcionou e não houve erros JavaScript nem respostas HTTP 404.

[Faixas originais na fila de turnos](previews/batalha-v0.50.0-faixas.png)

[Correspondência das artes](FAIXAS_PERSONAGENS.md) · [Artes pendentes](ARTES_PENDENTES.md) · [Regras da arena](ARENA_4X4.md)
