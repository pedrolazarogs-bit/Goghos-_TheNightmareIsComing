# Validação — v0.47.0

Revisão em 17/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois das mudanças. Preservados os testes de menu, abertura, áudio, recursos originais e laboratório.
- O modelo da arena percorreu as 32 escolhas e 1.793 ações. Conferidos atributos impressos, multiplicadores, limite de dano à vida restante, quatro ataques pendentes, passagem de vez, um jogador e sete bots, restauração por vida máxima e pontuação até três vitórias.
- `npm run test:battle`: aprovado no projeto. As 32 imagens carregam em 1536 × 2048; galeria, busca, cartas com nomes repetidos, escolha por clique/seletor, inspeção ampliada e ausência das molduras provisórias são verificadas.
- Conferidos estrela fixa, espera de 3,2 segundos, CardTouch, morte do personagem do jogador, continuidade dos bots, série completa, pausa, exportação, relógio final, teclado, redimensionamento, toque e reinício sem ações antigas.
- A carta com ataque “—” não recebe zero ou dano fictício no painel: o valor continua ausente e o botão de passar a vez funciona. O CardTouch anterior passou nos testes de regressão de `npm run test:lab` com mouse e toque.
- Os 32 PNGs foram comparados byte a byte com os arquivos extraídos dos RARs. Origem e SHA-256 registrados no manifesto. Não houve recorte, redesenho nem recompressão.
- O roteiro com relógio simulado passou a aguardar o evento real de redimensionamento antes de enviar Enter, evitando testar o clique enquanto a escala ainda era a da janela anterior.
- A revisão visual ajustou a altura do retrato que usa a carta completa para não encobrir a fila de turnos; a vida atual permanece fora da ilustração original.
- Menu e versão de celular do jogo não receberam mudanças visuais ou funcionais. As novas interações ficam na arena independente do laboratório.

A prévia extraída de `downloads/batalha-v0.47.0.zip` é validada por HTTP local com o mesmo roteiro completo. O teste adicional confere que o retrato da carta nova não cobre a ordem dos turnos. Seus módulos e recursos são comparados ao projeto, com a adaptação prevista apenas no link de retorno da página.

[Seleção das cartas](previews/cartas-v0.47.0-selecao.png) · [Batalha](previews/batalha-v0.47.0-desktop.png) · [Carta ampliada](previews/cartas-v0.47.0-detalhes.png) · [Novo personagem](previews/batalha-v0.47.0-personagem.png)

[Cartas e atributos](CARTAS_KIT.md) · [Regras da arena](ARENA_4X4.md) · [Artes ainda pendentes](ARTES_PENDENTES.md)
