# Validação — v0.51.0

Revisão em 18/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois das alterações. Menu, abertura, áudio e recursos originais preservados. As 32 escolhas de personagem e a série de 1793 ações mantêm os resultados anteriores sem apoios equipados.
- Novo teste do modelo de apoios: limite de três, preparação antes da série, duplicatas, troca bloqueada durante a batalha, uso único, pausa, vez do bot, jogador eliminado, cura limitada ao máximo e sem ressurreição, bônus de +50 uma vez por ataque completo, escudo consumido inclusive com dano zero, persistência entre rodadas e Papakill com limite estrito de 1–39 PV. Vitória final e cronômetro conferidos sem pontuação duplicada.
- Os seis apoios pendentes rejeitam ativação sem alterar o estado. Os 19 PNGs têm os hashes esperados e foram comparados byte a byte com os arquivos extraídos dos dois ZIPs recebidos.
- `npm run test:supports`: aprovado na prévia e na arena. Carregamento das 19 imagens, carta completa ao obter, ícones persistentes, limite de três, seleção de alvo, quatro efeitos reais, ponto ao eliminar o último oponente, uso único entre rodadas, teclado, Escape, preservação do personagem escolhido, bloqueio na vez do bot e reinício sem apoios ou timers antigos.
- `npm run test:battle`: aprovado com a série completa até três vitórias, valores impressos, cartas e faixas, estrela fixa, um jogador e sete bots, espera de 3,2 segundos, morte, pausa, exportação, reinício, redimensionamento e toque.
- `npm run test:lab`: aprovado no laboratório e CardTouch, com mouse e toque. A nova entrada não altera as interações anteriores.
- Comparação geométrica em 844 × 390 com toque: fila, apoios anteriores, retrato, painel e placar permanecem nas mesmas posições e dimensões da v0.50.0. Os controles novos de apoios não aparecem nessa versão da arena.
- Revisão visual no computador: carta completa enquadrada sem esticar, ícones pequenos sem moldura extra, indicação de Pronto/Ativado/Usado, nomes e regras legíveis. Placar, painel e fila CC mantêm a composição aprovada.

- Os cinco ZIPs da v0.51.0 passaram na verificação de integridade e na comparação com os arquivos do projeto, com adaptações apenas dos links de navegação nas prévias isoladas. O ZIP de apoios foi extraído em outra pasta e passou novamente nos testes de obtenção e efeitos pelo servidor local, sem erro JavaScript ou recurso HTTP ausente.

[Carta de apoio](previews/apoios-v0.51.0-carta.png) · [Bancada dos efeitos](previews/apoios-v0.51.0-bancada.png) · [Apoios na batalha](previews/batalha-v0.51.0-apoios.png)

[Regras e pendências](APOIOS.md) · [Arena 4×4](ARENA_4X4.md)
