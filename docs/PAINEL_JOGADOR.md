# Painel do jogador — v0.48.0

O painel inferior direito da arena segue a composição enviada em **Photos-1-001 (4).zip**: retrato atrás da base preta, faixa vermelha de vida, coração à direita, dano com espada abaixo e losango de fôlego sobre a faixa. A estrela da habilidade principal permanece fixa ao lado; suas informações abrem por clique. A fonte é German Beauty, já usada no jogo.

## Artes originais

Os cinco PNGs foram copiados sem recortar, redesenhar ou recomprimir. `assets/player-panel-v048/manifest.json` registra os nomes recebidos e SHA-256.

| Arquivo recebido | Uso no projeto |
| --- | --- |
| 230 Sem Título_20261118141204.png | `panel-base.png`: base preta |
| 230 Sem Título_20261118141143.png | `health-bar.png`: faixa de vida |
| Original-Base43_20260131112227.png | `heart.png`: coração |
| 168 Sem Título_20260502120457.png | `damage.png`: espada |
| 230 Sem Título_20261118141134.png | `reference.png`: referência completa para consulta |

O losango enviado coincide com `assets/menu-v036/star.webp`, já recebido. A estrela principal usa `assets/card-touch-v044/star.png`. Os cinco retratos separados existentes continuam em uso; personagens sem retrato separado mostram a carta completa. Não foi extraído um personagem da composição de referência nem criada uma nova ilustração.

## Valores e cliques

- Vida e dano continuam seguindo a carta escolhida. Os números 350/120/3 da referência não substituem os atributos oficiais de outro personagem.
- A faixa vermelha acompanha a vida atual, de zero à vida máxima, com transição curta. Ao zerar, o retrato perde cor; na próxima rodada, o painel volta à vida restaurada pelo modelo da batalha.
- Coração e espada abrem a inspeção do personagem. Ataques com multiplicador aparecem como `70 × 6`; ataques ainda sem valor aparecem como `—`.
- O usuário confirmou que o losango representa **fôlego**. Seu valor vem do losango impresso em cada uma das 32 cartas. Clicar abre a explicação do indicador.
- Consumo e recuperação de fôlego **não foram definidos**. O atributo é exibido, mas não modifica os ataques ou a duração dos turnos. Habilidades, classes, itens e apoios continuam aguardando regras.
- A estrela principal não se move no hover e não tem animação recorrente.

## Prévia isolada

Abra **painel.html** para testar somente esta parte. Escolha uma das 32 cartas, aplique dano ou cura, reduza/aumente o fôlego e restaure os valores. Esses controles alteram apenas a simulação local dessa página; não consomem fôlego na batalha nem gravam progresso.

`js/ui/player_panel.js` e `css/player_panel.css` são compartilhados entre a prévia e `batalha.html`. Portanto, as duas páginas mostram a mesma implementação. `js/ui/player_panel_preview.js` contém apenas os controles da prévia.

Use `npm run test:panel` com o servidor ativo para verificar valores extremos, recursos, cliques, teclado e enquadramento. `npm run package:panel` gera `downloads/painel-v0.48.0.zip`; extraia tudo e abra painel.html. Apenas os links de navegação são adaptados no ZIP isolado, pois o restante do laboratório não acompanha esse pacote.

O menu, sua composição de celular, a abertura obrigatória e o áudio não receberam alterações. O painel fica no laboratório independente.
