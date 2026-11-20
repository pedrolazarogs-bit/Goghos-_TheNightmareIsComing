# Cartas recebidas — valores em partida na v0.55.0

Os dois arquivos KitCharacters.rar e KitCharacters2.rar contêm 32 PNGs completos, com transparência e resolução de 1536 × 2048. Os arquivos foram incorporados sem recortar, redesenhar ou recomprimir. O manifesto em assets/characters-v047/manifest.json registra origem, nome do arquivo e SHA-256.

O catálogo mantém as 32 cartas, usando a busca ou o seletor. No computador, 31 cartas têm velocidade definida e podem iniciar a batalha; Sarck aguarda sua regra especial. Uma prévia ampliada mostra a carta inteira. No computador, o campo e a inspeção ampliada exibem vida atual diretamente sobre os números impressos. Dano, cura, eliminação e restauração de rodada atualizam essa camada. O ataque mantém seu multiplicador quando não há bônus; com Na Moleira, mostra o total acrescido de 50, uma única vez por ataque (Sam: 70 × 6 + 50 = 470). Após o uso, volta ao valor normal. O painel e CardTouch acompanham o bônus. Ataques indefinidos mantêm o traço original. O catálogo e o celular preservam a apresentação anterior.

`js/ui/card_values.js` usa coordenadas específicas das 32 artes, a fonte original do jogo e as duas cores do fundo sob os dígitos. As camadas seguem o mesmo enquadramento proporcional da imagem, inclusive no retrato que usa a carta completa. Nenhum PNG foi editado; os valores de base do catálogo também não são modificados. Fôlego e velocidade permanecem nos valores atuais, sem criar regras de consumo ou bônus.

## Atributos aplicados

Por solicitação do usuário, vida e dano vêm dos valores impressos. Multiplicadores explícitos são aplicados ao dano total: 70 × 6 = 420, 55 × 6 = 330, 45 × 2 = 90 e 90 × 2 = 180. Não foram inferidos escudos, cura, críticos, efeitos de classe ou habilidades a partir dos desenhos. O nome escrito junto do ataque é apenas informativo.

| Carta | Vida | Ataque impresso | Dano aplicado | Fôlego | Velocidade |
| --- | ---: | --- | ---: | ---: | ---: |
| Unicorn | 390 | 60 | 60 | 6 | 4 |
| Sam | 530 | 70 × 6 | 420 | 7 | 7 |
| Sarck | 530 | — | Pendente | 5 | — |
| Nully | 370 | 80 | 80 | 5 | 9 |
| Mike | 130 | 170 | 170 | 6 | 5 |
| Jonh | 270 | 80 | 80 | 3 | 2 |
| Zeneerian | 1700 | 700 | 700 | 12 | 7 |
| Eletric | 220 | 100 | 100 | 4 | 3 |
| Penxy | 500 | 140 | 140 | 7 | 9 |
| Z-Zus | 1200 | 300 | 300 | 5 | 3 |
| Chama | 230 | 55 × 6 | 330 | 7 | 5 |
| Daztirry | 1250 | 240 | 240 | 10 | 6 |
| Zuri | 1050 | 160 | 160 | 12 | 7 |
| Trucc | 430 | 120 | 120 | 4 | 9 |
| Rawlin | 860 | 180 | 180 | 6 | 6 |
| Barn | 330 | 120 | 120 | 6 | 3 |
| Fomor | 260 | 220 | 220 | 7 | 4 |
| Elish | 240 | 80 | 80 | 3 | 4 |
| Sheriff · verde | 190 | — | Pendente | 3 | 5 |
| Sheriff · roxo | 210 | 220 | 220 | 4 | 2 |
| Vaglar · preto | 590 | — | Pendente | 12 | 5 |
| Vaglar · azul | 230 | 90 | 90 | 4 | 2 |
| DD-X | 260 | 45 × 2 | 90 | 6 | 3 |
| Rayyb | 240 | 90 | 90 | 4 | 5 |
| Endrik | 160 | 250 | 250 | 6 | 4 |
| Alex | 200 | 170 | 170 | 2 | 3 |
| P.ULLYS | 150 | 300 | 300 | 6 | 6 |
| Cavaleiro | 920 | 130 | 130 | 8 | 2 |
| Zikssy | 160 | 120 | 120 | 1 | 5 |
| Linx | 660 | — | Pendente | 3 | 4 |
| Karma | 320 | 120 | 120 | 7 | 6 |
| Draktar | 310 | 90 × 2 | 180 | 6 | 7 |

Na v0.48.0, o usuário confirmou que o losango representa fôlego. Seus valores impressos aparecem no painel e na inspeção. Consumo e recuperação ainda não estão definidos; nenhum ataque gasta esse atributo por enquanto.

A velocidade foi transcrita do pico superior de cada carta, conforme explicado pelo usuário na v0.52.0. Os 31 valores numéricos definem a ordem da arena de computador. Sarck mantém `speed: null`: o usuário informou que enviará uma regra especial. Sua arte continua consultável, mas fica fora das equipes desse modo até a definição.

## Regras ainda pendentes

Sarck, Sheriff · verde, Vaglar · preto e Linx têm “—” no campo de ataque. O valor permanece ausente (`null`), sem atribuir dano fictício. Na vez do jogador, aparece **Passar vez**; os bots passam após a mesma espera de 3,2 segundos. Esses personagens podem ser atacados e eliminados normalmente quando participam; a participação de Sarck no computador também depende da regra de velocidade.

As duas cartas Sheriff e as duas Vaglar permanecem separadas, com IDs distintos. As cores no nome do seletor identificam os arquivos; não definem classes ou relações entre os personagens.

A estrela principal continua fixa e consultável por clique. Efeitos de habilidades, símbolos laterais e atributos de classe aguardam as regras que o usuário se comprometeu a enviar.

Os cinco retratos isolados já recebidos são preservados. Para os demais personagens, a própria carta é exibida nos espaços de retrato, até recebermos ilustrações separadas.

O menu e a versão de celular do jogo não foram alterados. A arena continua disponível pelo laboratório e pelo Play do computador.
