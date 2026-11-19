# Validação — v0.53.0

Revisão em 18/11/2026 (America/Sao_Paulo), com Node.js e Chromium.

- `npm test`: aprovado antes e depois das alterações. Abertura, menu, áudio, artes originais e valores impressos preservados. Séries completas do modo anterior (1793 ações) e da hierarquia (1699 ações).
- Novo `tests/support_hand.test.js`: entrada automática com vaga, máximo de três cartas, apenas uma oferta pendente, escolha exata do espaço substituído, descarte mantendo a mão, repetição de arte com uso independente, rejeição de callbacks repetidos/índices inválidos e ausência de avanço enquanto há decisão pendente. Bônus e escudo ativados sobrevivem à troca, funcionam uma vez e não se acumulam com outra cópia do mesmo efeito.
- `npm run test:supports`: aprovado na bancada e na arena. Recebimento sem modal automático, arte completa por clique, troca por teclado, Escape cancelando a seleção, descarte sem alterar a mão e aviso de entrada automática desaparecendo após cinco segundos. Os quatro efeitos existentes, uso único, regras pendentes e reinício continuam funcionando.
- `npm run test:battle`: aprovado com série completa, troca e descarte pelo HUD real, uma única oferta, espera da decisão sem avançar ataques e cronômetro contínuo. Confirmados retomada dos bots, 3,2 segundos de espera, controle de um personagem, exportação, reinício, teclado, redimensionamento e toque. A decisão permanece acessível quando uma sessão de computador é reduzida para 960 px de largura.
- Aviso compacto conferido no campo real sem interseção com cartas, ações ou painel do jogador. O campo permanece visível; a carta ampliada só abre a pedido.
- Celular: turnos e UI anteriores preservados, com comparação das posições e dimensões em 844 × 390 contra `tests/fixtures/supports-touch-v050.json`. Nenhuma arte foi criada ou reprocessada.

- Os cinco ZIPs passaram na verificação de integridade e comparação com os arquivos do projeto. Só os links de navegação são adaptados nas prévias. Os pacotes de apoios e batalha foram extraídos em outra pasta e passaram novamente nos testes completos por HTTP local, sem erro JavaScript ou recurso ausente.

[Escolha na bancada](previews/apoios-v0.53.0-troca.png) · [Aviso discreto na batalha](previews/batalha-v0.53.0-aviso.png)

[Regras dos apoios](APOIOS.md) · [Arena 4×4](ARENA_4X4.md)
