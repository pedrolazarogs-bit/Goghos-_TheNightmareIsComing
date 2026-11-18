# Cartas recebidas — v0.47.0

Os dois arquivos KitCharacters.rar e KitCharacters2.rar contêm 32 PNGs completos, com transparência e resolução de 1536 × 2048. Os arquivos foram incorporados sem recortar, redesenhar ou recomprimir. O manifesto em assets/characters-v047/manifest.json registra origem, nome do arquivo e SHA-256.

O jogador pode escolher qualquer carta na seleção visual da arena, usando a busca ou o seletor. Uma prévia ampliada mostra a carta inteira. No campo, a barra abaixo da imagem indica a vida atual; os números impressos na arte permanecem intactos.

## Atributos aplicados

Por solicitação do usuário, vida e dano vêm dos valores impressos. Multiplicadores explícitos são aplicados ao dano total: 70 × 6 = 420, 55 × 6 = 330, 45 × 2 = 90 e 90 × 2 = 180. Não foram inferidos escudos, cura, críticos, efeitos de classe ou habilidades a partir dos desenhos. O nome escrito junto do ataque é apenas informativo.

| Carta | Vida | Ataque impresso | Dano aplicado |
| --- | ---: | --- | ---: |
| Unicorn | 390 | 60 | 60 |
| Sam | 530 | 70 × 6 | 420 |
| Sarck | 530 | — | Pendente |
| Nully | 370 | 80 | 80 |
| Mike | 130 | 170 | 170 |
| Jonh | 270 | 80 | 80 |
| Zeneerian | 1700 | 700 | 700 |
| Eletric | 220 | 100 | 100 |
| Penxy | 500 | 140 | 140 |
| Z-Zus | 1200 | 300 | 300 |
| Chama | 230 | 55 × 6 | 330 |
| Daztirry | 1250 | 240 | 240 |
| Zuri | 1050 | 160 | 160 |
| Trucc | 430 | 120 | 120 |
| Rawlin | 860 | 180 | 180 |
| Barn | 330 | 120 | 120 |
| Fomor | 260 | 220 | 220 |
| Elish | 240 | 80 | 80 |
| Sheriff · verde | 190 | — | Pendente |
| Sheriff · roxo | 210 | 220 | 220 |
| Vaglar · preto | 590 | — | Pendente |
| Vaglar · azul | 230 | 90 | 90 |
| DD-X | 260 | 45 × 2 | 90 |
| Rayyb | 240 | 90 | 90 |
| Endrik | 160 | 250 | 250 |
| Alex | 200 | 170 | 170 |
| P.ULLYS | 150 | 300 | 300 |
| Cavaleiro | 920 | 130 | 130 |
| Zikssy | 160 | 120 | 120 |
| Linx | 660 | — | Pendente |
| Karma | 320 | 120 | 120 |
| Draktar | 310 | 90 × 2 | 180 |

## Regras ainda pendentes

Sarck, Sheriff · verde, Vaglar · preto e Linx têm “—” no campo de ataque. O valor permanece ausente (`null`), sem atribuir dano fictício. Na vez do jogador, aparece **Passar vez**; os bots passam após a mesma espera de 3,2 segundos. Esses personagens podem ser atacados e eliminados normalmente.

As duas cartas Sheriff e as duas Vaglar permanecem separadas, com IDs distintos. As cores no nome do seletor identificam os arquivos; não definem classes ou relações entre os personagens.

A estrela principal continua fixa e consultável por clique. Efeitos de habilidades, símbolos laterais e atributos de classe aguardam as regras que o usuário se comprometeu a enviar.

Os cinco retratos isolados já recebidos são preservados. Para os demais personagens, a própria carta é exibida nos espaços de retrato, até recebermos ilustrações separadas.

O menu e a versão de celular do jogo não foram alterados. As cartas entram exclusivamente no experimento de batalha do laboratório.
