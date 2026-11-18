# Validação — v0.48.0

Revisão em 18/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois das mudanças. Menu, abertura obrigatória, áudio e recursos originais continuam preservados. O modelo da arena percorreu as 32 escolhas e 1.793 ações, mantendo os atributos e o fôlego sem consumo inventado.
- `npm run test:panel`: aprovado no projeto e na prévia extraída do ZIP. Conferidos os 32 retratos/cartas, vida zerada, dano excedente, cura limitada à vida máxima, valores inválidos, fôlego de zero ao máximo somente na simulação, restauração e dados originais imutáveis.
- Conferidos quatro dígitos de vida, fôlego de dois dígitos, multiplicadores e ataque ausente como “—”. Coração, espada, estrela e losango abrem seus detalhes por mouse e teclado; Escape fecha o diálogo e restaura o foco. A estrela permanece fixa e sem animação recorrente.
- `npm run test:battle`: aprovado. O painel acompanha a vida do personagem controlado durante uma série completa, inclusive sua eliminação e a restauração entre rodadas. O fôlego permanece no valor da carta; não altera dano, turnos ou balanceamento.
- A arena mantém um jogador e sete bots, espera de 3,2 segundos, cartas retas, CardTouch, pausa, relógio crescente, exportação, reinício sem callbacks antigos e vitória aos três pontos. Teclado, redimensionamento e toque continuam funcionando.
- `npm run test:lab`: aprovado no laboratório e no experimento CardTouch, com mouse e toque.
- Os cinco PNGs do painel foram comparados byte a byte ao ZIP recebido. Nomes de origem e SHA-256 estão no manifesto. As 32 cartas e as artes anteriores não foram modificadas.
- Revisão visual em 1440 × 900 e 1024 × 768: painel na quina direita, fila de turnos livre, valores legíveis e botões acessíveis. A prévia independente também se ajusta a janelas estreitas sem rolagem horizontal. Isso não altera a versão de celular do menu do jogo.
- Os ZIPs do painel, arena e laboratório passaram na verificação de integridade e de recursos locais. Seus arquivos correspondem ao projeto, exceto os links de navegação documentados nos pacotes isolados.
- A prévia extraída passou no roteiro completo do painel; a arena extraída também foi aberta para conferir imagens, valores e clique no losango de fôlego.

A mudança usa o componente `js/ui/player_panel.js` tanto na arena quanto em `painel.html`. A prévia não implementa consumo ou recuperação de fôlego na batalha; os botões de teste alteram apenas o estado local dela.

[Prévia do painel](previews/painel-v0.48.0.png) · [Vida após dano](previews/painel-v0.48.0-dano.png) · [Painel na batalha](previews/batalha-v0.48.0-desktop.png)

[Painel e origem das peças](PAINEL_JOGADOR.md) · [Cartas e atributos](CARTAS_KIT.md) · [Regras da arena](ARENA_4X4.md) · [Artes pendentes](ARTES_PENDENTES.md)
