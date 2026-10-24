# Kit visual recebido — v0.27.0

Inventário dos cinco arquivos enviados pelo criador: `MasterKitUp.rar`, `Ms1.rar`, `Ms2.rar`, `Ms3.rar` e `Ms4.rar`. São **106 arquivos de mídia**: 103 PNGs, 1 JPEG e 2 vídeos MP4. Os 85 arquivos novos foram copiados byte a byte; 21 entradas idênticas reutilizam arquivos que já existiam no projeto.

[manifest.json](manifest.json) registra arquivo de origem, nome original, tamanho, SHA-256, dimensões, modo de cor e limites de transparência. Nenhum nome ou número recebido foi reinterpretado como alteração de balanceamento. As folhas de personagem são referências visuais: seus números, classes, raridades e descrições podem ser antigos e **não substituem os dados atuais do jogo**. Petra permanece fora do elenco jogável.

## Fundos e cenário

| Arquivo | Uso visual sugerido | Dimensão |
| --- | --- | --- |
| `backgrounds/red-tree-field.png` | Arena e seleção com o campo da árvore vermelha | 1536 × 1024 |
| `backgrounds/crystal-valley.png` | Santuário, galeria ou entrada de personagens | 1536 × 1024 |
| `backgrounds/cosmic-rift.png` | Portal, invocação, abertura e efeitos do santuário | 1536 × 1024 |
| `environment/pine-single.png` | Elemento de cenário em primeiro plano | 2048 × 2048 |
| `environment/pine-grove.png` | Conjunto de árvores para camadas do cenário | 2048 × 2048 |

## Interface

O logotipo recebido em Ms4 é idêntico a `assets/logo/logo.png`. Seu conteúdo ocupa `[193, 289, 1866, 1722]` na imagem de 2048 × 2048. O verso preto simples recebido é o já existente `assets/arena/card_back.png`; o novo verso com moldura fica em `ui/framed-card-back.png`.

- `ui/ability-star.png`: estrela de habilidade com transparência (414 × 347).
- `ui/champion-emblem.png`, `ui/championship-logo.png` e `ui/arena-banner.png`: emblemas e faixa do universo GOGHOS.
- `ui/speech-bubble.png`: balão vazio para apresentação de falas.
- `ui/chama-turn-banner.png` e `ui/turn-banner-base.png`: referências do indicador da vez.
- `ui/rarity-{blue,green,purple,red,holographic,light}.png`: blocos de cor recebidos; sua apresentação não redefine as raridades efetivas das cartas.
- `ui/{mint,green,sunset,crimson}-slab.png`: placas inclinadas para detalhes da interface.
- `ui/difficulty-{very-easy,easy,average,hard,hardcore,empty}.png`: faixas de dificuldade ilustradas; apenas apresentação, sem criação de regras de dificuldade.
- `ui/holographic-gradient.jpg`: gradiente recebido para detalhes holográficos.

Ícones já existentes, novamente recebidos e mantidos sem duplicação:

| Elemento | Caminho existente |
| --- | --- |
| Vida | `assets/arena/heart.png` |
| Ataque | `assets/arena/attack.png` |
| Daly Mãe | `assets/arena/daly_mae.png` |
| Moeda | `assets/concepts/kikiy/36.png` |
| Escudo | `assets/concepts/kikiy/18.png` |
| Estrela holográfica | `assets/concepts/kikiy/28.png` |
| Moldura de painel | `assets/concepts/kikiy/32.png` |
| Emblema MAX | `assets/concepts/kikiy/35.png` |
| Retrato desconhecido | `assets/arena/unknown_portrait.png` |

A moeda ocupa `[560, 216, 1580, 1446]` na imagem de 2048 × 2048. O manifesto contém os limites de transparência dos demais PNGs para enquadramento por CSS, sem modificar os originais.

## Personagens e moedas

As ilustrações separadas ficam em `characters/`: Chama, Fonior, Linx, Nully, Petra, Sam, Sark (`sarck.png`), Sheriff, Trucc, Unicorn, Vaglar e Zuri. Elas podem ilustrar menus, fichas e efeitos, preservando as bases oficiais das cartas de batalha.

Os dez cartões de moeda ficam em `currency/coin-card-{50,100,120,150,170,200,350,400,520,800}.png`. Os valores desenhados são referências recebidas; não definem preços, recompensas ou atributos automaticamente.

As folhas de referência/lore ficam em `lore/`, identificadas pelo personagem. Existem variações de Daztirry e Zeenneriam, preservadas separadamente. `references/petra-card.png` é a carta completa recebida no MasterKitUp e permanece somente referência, sem adicionar Petra à batalha.

## Vídeos

| Arquivo | Características | Uso recomendado |
| --- | --- | --- |
| `video/zeenneriam-teaser.mp4` | 17,08 s; 1080 × 1440; H.264 a 25 fps; áudio AAC estéreo | Teaser opcional de galeria, com controle de reprodução. Montagem em preto e branco com desenhos, lápides, carta e transições rápidas. |
| `video/trio-reference.mp4` | 16,02 s; 1080 × 1440; H.264 a 30 fps; áudio AAC estéreo | Referência preservada. O texto “THE BEST TRIO” e a estética dos personagens não correspondem claramente às ilustrações principais; não foi recomendado para o fluxo de entrada do jogo. |

Nenhum vídeo precisa ser baixado ou reproduzido automaticamente para entrar na partida. A análise técnica identificou faixas de áudio, sem atribuir autoria ou sugerir que elas sejam usadas como trilha do jogo.
