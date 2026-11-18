# Faixas CC dos personagens — v0.50.0

As 18 artes de `Photos-1-001 (5).zip` foram incorporadas à fila de turnos da arena de computador. São usadas em **Próximo**, **Vez atual** e **Último ataque**, conforme o personagem presente em cada posição. Clique na faixa para consultar a carta; a estrela impressa na própria arte não executa uma habilidade.

Os PNGs originais de 2048 × 2048 pixels estão em `assets/turn-order-v050/`. O manifesto registra o nome do arquivo recebido, o personagem, os limites de transparência e o SHA-256. Nenhuma imagem foi redesenhada, recortada ou recomprimida. O enquadramento por CSS remove somente o espaço transparente ao redor e mantém o desenho completo, inclusive o nome impresso.

A faixa da vez atual é um pouco maior. Os rótulos externos identificam a posição na fila e a equipe real; as cores impressas das artes não são alteradas. Antes do primeiro ataque, o último espaço indica “Nenhum ataque”. Personagens sem faixa recebem uma silhueta com “?” e nome, mantendo a consulta por clique.

A composição é exclusiva do computador com ponteiro preciso e largura mínima de 981 pixels. O celular mantém a fila anterior. O placar e o painel continuam com o tamanho reduzido da v0.49.1; atributos, regras, áudio e menu não mudaram.

## Correspondência das artes

| Personagem da carta | Arquivo recebido | Arquivo no projeto |
| --- | --- | --- |
| Rawlin | 202 Sem Título4_20261116093817.png | `rawlin.png` |
| Trucc | 202 Sem Título4_20261104082201.png | `trucc.png` |
| Zuri | 202 Sem Título4_20261104083633.png | `zuri.png` |
| Sam | 202 Sem Título4_20261104081258.png | `sam.png` |
| Fomor | 202 Sem Título4_20261116215332.png | `fomor.png` |
| Mike | 202 Sem Título4_20261104080915.png | `mike.png` |
| Sheriff · verde | 202 Sem Título4_20261116214233.png | `sheriff-verde.png` |
| Karma | 202 Sem Título4_20261116213950.png | `karma.png` |
| Daztirry | 202 Sem Título4_20261104082624.png | `daztirry.png` |
| Sarck | 202 Sem Título4_20261104083222.png | `sarck.png` |
| Barn | 202 Sem Título4_20261116214510.png | `barn.png` |
| Jonh | 202 Sem Título4_20261116214718.png | `jonh.png` |
| Z-Zus | 202 Sem Título4_20261104084257.png | `z-zus.png` |
| Chama | 202 Sem Título4_20261104083358.png | `chama.png` |
| Unicorn | 202 Sem Título4_20261104081453.png | `unicorn.png` |
| Nully | 202 Sem Título4_20261104082910.png | `nully.png` |
| Elish | 202 Sem Título4_20261116215126.png | `elish.png` |
| Penxy | 202 Sem Título4_20261104083957.png | `penxy.png` |

A associação segue a ilustração, mesmo onde a grafia da faixa difere da carta (Sarck/Shark e Jonh/John). Os nomes do catálogo e os atributos das cartas foram preservados. A faixa Sheriff corresponde à variante verde, com chapéu e estrela “×1”; a variante roxa continua pendente.

## Faixas pendentes

Zeneerian, Eletric, Sheriff · roxo, Vaglar · preto, Vaglar · azul, DD-X, Rayyb, Endrik, Alex, P.ULLYS, Cavaleiro, Zikssy, Linx, Draktar.

## Testar

Extraia a prévia da arena e abra `batalha.html`. Escolha um dos personagens acima para conferir sua faixa na posição atual. Ataque um oponente: ela passa para o último ataque e a fila acompanha os bots. A seleção permite conferir qualquer uma das 32 cartas; reiniciar volta à escolha. As inspeções pausam as decisões dos bots até serem fechadas.
