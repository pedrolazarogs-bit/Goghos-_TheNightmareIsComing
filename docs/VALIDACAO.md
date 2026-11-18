# Validação — v0.48.1

Revisão em 18/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois da mudança. Menu, abertura, áudio, artes originais e modelo da batalha continuam preservados.
- `npm run test:panel`: aprovado com os 32 personagens. Conferidos cliques nos quatro ícones, teclado, estrela estática, vida zero/máxima, dano com multiplicador, fôlego e ajuste da prévia à janela.
- `npm run test:battle`: aprovado em uma série completa. Fila de turnos livre, um jogador e sete bots, espera de 3,2 segundos, pontuação até três, CardTouch, pausa, exportação e reinício preservados. A verificação com toque também passou.
- Revisão visual da ampliação: retrato de 400 × 300 px no lugar de 320 × 240 px; cartas usadas como retrato passam a 212 × 250 px. Coração, espada, estrela e losango crescem cerca de 12% e mantêm distância dos números de vida/dano.
- A ampliação fica restrita a janelas de computador com ponteiro preciso. As dimensões e posições do retrato e dos ícones em uma janela com toque de 844 × 390 foram comparadas diretamente ao CSS da v0.48.0 e permaneceram idênticas.
- PNGs, atributos e regras não foram alterados. O fôlego continua apenas informativo na batalha.
- ZIPs do painel, arena e laboratório gerados na mesma versão. Integridade verificada e recursos comparados byte a byte ao projeto; apenas os links das páginas isoladas recebem a adaptação documentada.

[Prévia ampliada](previews/painel-v0.48.1.png) · [Painel na batalha](previews/batalha-v0.48.1-desktop.png)

[Detalhes do painel](PAINEL_JOGADOR.md) · [Regras da arena](ARENA_4X4.md)
