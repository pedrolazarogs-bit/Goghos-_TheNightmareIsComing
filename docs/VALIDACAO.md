# Validação — v0.52.0

Revisão em 18/11/2026 (America/Sao_Paulo), com Node.js e Chromium.

- `npm test`: aprovado antes e depois das alterações. Menu, abertura, áudio, PNGs originais e valores de vida/dano/fôlego preservados. O modo anterior mantém a série de 1793 ações.
- `tests/speed_cycles.test.js`: 31 escolhas com velocidade numérica, ordem decrescente, Sarck pendente, empates, eliminados, passes, pausa, nenhum apoio grátis no início ou entre rodadas e exatamente uma carta por reset. Séries completas com 1699 ações, sem recompensas duplicadas. Verificados cópias independentes, fila com UI cheia, limite de três e impedimento de reutilizar a mesma carta.
- `npm run test:battle`: aprovado no Chromium, incluindo uma série inteira até três pontos, hierarquia, velocidade na fila, carta completa no reset, recebimento, controles de personagem único, bots de 3,2 segundos, jogador eliminado, pausa, reinício, exportação e redimensionamento. Sarck consultável e início bloqueado enquanto sua regra especial estiver pendente.
- `npm run test:supports`: aprovado na bancada e na arena. Os quatro efeitos permanecem funcionais. Simular fim do ciclo entrega uma carta; UI cheia ou cópia igual não descarta o apoio; uma carta guardada pode substituir uma usada, com um novo uso independente. Fechar e reabrir não cria outra recompensa. Os seis efeitos pendentes continuam bloqueados.
- `npm run test:lab`: aprovado no laboratório e CardTouch com mouse e toque. Nenhuma interação anterior alterada.
- Celular: modo anterior de turnos, apoios anteriores e interface preservados. Comparação em 844 × 390 contra as posições/dimensões registradas na v0.50.0 para fila, apoios, retrato, painel e placar. O teste usa a fixture permanente `tests/fixtures/supports-touch-v050.json`.
- Revisão visual no computador: carta original completa e legível na obtenção, fila com velocidades e ciclo, ícones pequenos e contador de recebidos. Placar, painel e faixas CC mantêm o tamanho aprovado.

- Os cinco ZIPs passaram na verificação de integridade e comparação byte a byte com o projeto; somente os links de navegação das prévias são adaptados. Arena e bancada foram extraídas em outra pasta e passaram nos testes completos pelo servidor local, sem recurso ausente ou erro JavaScript.
- A abertura direta por `file://` não pôde ser verificada no Chromium gerenciado: a política do navegador bloqueou esse protocolo (`ERR_BLOCKED_BY_ADMINISTRATOR`). A validação dos pacotes extraídos foi feita por HTTP local.

[Recebimento no reset](previews/apoios-v0.52.0-reset.png) · [Hierarquia na batalha](previews/batalha-v0.52.0-velocidade.png)

[Regras dos apoios](APOIOS.md) · [Arena 4×4](ARENA_4X4.md) · [Velocidades impressas](CARTAS_KIT.md)
