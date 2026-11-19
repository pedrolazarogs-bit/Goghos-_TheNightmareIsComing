# Apoios — v0.54.0

Foram recebidos **9 PNGs de cartas completas** em Photos-1-001 (7).zip e **10 PNGs de ícones** em Photos-1-001 (6).zip. A carta completa aparece na preparação do laboratório; durante a batalha, o recebimento é discreto junto ao HUD e a arte completa abre somente ao clicar no ícone do aviso. O ícone menor ocupa a UI e permanece visível após o uso. O décimo ícone, de máscara, ainda não tem carta completa nem nome oficial: sua carta usa uma marcação com “?”.

## Uso confirmado pelo usuário

Cada carta pode ser ativada **uma vez em toda a série**, somente na vez do personagem do jogador e **sem gastar seu ataque**. A preparação permite até três apoios diferentes, sem duplicatas. Esse conjunto inicial é escolhido antes de iniciar a série. Durante a batalha, novas cópias recebidas nos resets entram automaticamente em espaços vazios ou usados. Com a mão cheia, o jogador escolhe exatamente qual apoio substituir ou descarta a carta nova. A escolha nunca aumenta a mão acima de três. Reiniciar cria uma nova sessão; não existe compra, recompensa persistente ou acesso pelo menu principal.

O usuário autorizou aplicar os efeitos claros das cartas e deixar regras ambíguas pendentes. Os valores impressos dos personagens não foram alterados. Os apoios só modificam a resolução das ações às quais se aplicam.

## Recebimento por velocidade

A cada volta completa da hierarquia, quando todos os personagens vivos já agiram, o jogador ganha uma carta. A ordem volta à maior velocidade impressa; o ciclo seguinte começa. Não há recompensa ao iniciar a série, ao abrir diálogos, ao avançar de rodada ou ao terminar a partida. Uma eliminação pula a vez da carta eliminada.

Nesta prévia, o sorteio inclui os quatro apoios com regras claras: Bandeide, Na Moleira, Escudo Volátil e Papakill. Os seis pendentes continuam disponíveis para ver suas artes na preparação. O sorteio é feito uma única vez pelo modelo por reset; reabrir a tela não troca nem duplica a carta.

Com espaço livre ou uma carta usada, o novo apoio entra automaticamente na mão. Um aviso pequeno mostra seu nome e ícone por cinco segundos, sem abrir diálogo, tomar foco ou interromper o turno. Pode ser fechado antes. A arte completa é consultada clicando no ícone do aviso.

Com **três cartas disponíveis**, a nova carta fica como uma única oferta, fora da mão. O aviso oferece **Trocar** ou **Descartar nova**. Ao escolher Trocar, clique em um dos três ícones existentes para substituir exatamente aquela carta; Escape cancela a seleção e conserva a oferta. Descartar nova mantém a mão intacta. Não há botão RECEBIDOS, fila ou reserva de cartas. O próximo turno aguarda a decisão, evitando novas ofertas acumuladas ou descarte automático. O relógio da série continua.

Cada cópia recebida tem um uso, inclusive quando repete uma arte. Cartas usadas nunca recarregam. Trocar um apoio já ativado não apaga seu efeito: o bônus ou escudo pendente permanece até o próximo ataque correspondente, uma única vez. Uma segunda cópia do mesmo efeito não pode ser ativada enquanto ele já estiver preparado. Cartas da mão e efeitos ativados permanecem entre rodadas; reiniciar apaga a sessão.

## Efeitos disponíveis

| Apoio | Alvo e efeito | Limites |
| --- | --- | --- |
| Bandeide | Um aliado vivo recupera até 70 PV. | Respeita a vida máxima; não ressuscita e não é consumido sem alvo válido. |
| Na Moleira | O personagem do jogador recebe +50 no próximo ataque. | Soma 50 uma vez ao ataque completo, não a cada golpe do multiplicador. Exige ataque definido. |
| Escudo Volátil | O personagem do jogador bloqueia até 80 do próximo ataque recebido. | Nunca transforma dano em cura; termina após esse ataque, mesmo quando bloqueia tudo. |
| Papakill | Elimina um oponente vivo com menos de 40 PV. | Aceita 1–39 PV; 40 não é elegível. A eliminação pode dar ponto ou encerrar a série; não consome o ataque normal. |

Na Moleira e Escudo Volátil ficam **Ativados** até o próximo ataque correspondente, inclusive entre rodadas. Após o disparo, passam a **Usados**. Bandeide e Papakill aplicam o efeito imediatamente e passam a Usados. Os ícones usados ficam atenuados e continuam clicáveis para consulta, sem permitir nova ativação. Ações inválidas, fora da vez, durante pausa ou após a eliminação do jogador são recusadas sem consumo.

Cura e Papakill oferecem seleção de alvo. Dano extra e proteção aplicam-se ao próprio personagem do jogador nesta implementação. A cor da arte não muda o time do apoio. Os sete bots não receberam apoios nem novas habilidades.

## Regras pendentes

- **Brisa:** Falta definir a duração do apoio, quem escolhe o aliado curado e se cada eliminação oferece uma nova cura.
- **Sortudo:** A batalha ainda não tem rolagem de dados. Falta definir como a prioridade altera uma rolagem e o que conta como jogada.
- **Uma mãozinha:** Falta confirmar se compara e copia a vida atual ou máxima, como resolver empates e se pode ultrapassar a vida máxima da carta.
- **Última chance:** Falta definir o aliado afetado, a duração e se o bônus termina quando ele volta a 100 pontos de vida.
- **Recruta:** A arena atual é 4 contra 4. Falta definir o quinto espaço, o personagem recrutado e sua posição na ordem de turnos.
- **Máscara:** Faltam a carta completa, o nome oficial e as regras deste ícone.

Esses seis apoios podem ser obtidos e equipados para conferir as artes, mas não concedem efeitos. O botão informa a pendência em vez de simular uma ativação.

## Testar apenas esta parte

Extraia o ZIP da prévia e abra **apoios.html**. Use Obter apoios, escolha uma carta e confirme Obter e equipar. A carta completa aparece na confirmação; o ícone passa a ocupar um dos três espaços.

Inicie o teste e ajuste a vida nos campos da bancada. Para Bandeide, deixe um aliado abaixo da vida máxima; para Papakill, deixe um oponente entre 1 e 39. Os botões Seu ataque e Ataque inimigo usam o mesmo modelo da arena, mas devolvem a vez ao jogador para agilizar a verificação. **Simular fim do ciclo** considera os outros personagens como já tendo agido e conclui a ação do jogador contra o oponente com mais vida. Se a rodada continuar, chega exatamente uma carta. Teste com a mão vazia para ver a entrada automática ou prepare três apoios para testar Trocar e Descartar nova. Esses ajustes de vida e de ordem existem somente nesta página. Na arena real, mantenha os turnos normais, os bots e suas esperas.

Em **batalha.html**, selecione o personagem e use Escolher apoios antes de Iniciar batalha. Depois, os ícones pequenos ficam no canto inferior esquerdo. A preparação e o HUD novos são exclusivos do computador; a composição e as interações anteriores do celular foram preservadas. Placar, painel do jogador e faixas CC mantêm o tamanho aprovado.

## Arquivos originais e implementação

Os arquivos em assets/supports-v051/ conservam os bytes recebidos; manifest.json registra origem, dimensões e SHA-256. O enquadramento é feito por CSS sem recompressão dos PNGs. A área das cartas exibida inclui o retângulo completo da ilustração; os pixels isolados fora dela em dois arquivos não ampliam o enquadramento. Todos os nomes e desenhos impressos permanecem no arquivo original.

js/lab/supports.js contém o catálogo e as pendências. js/lab/battle.js valida e aplica os quatro efeitos, além de resolver a pontuação de eliminações. js/ui/supports.js e css/supports.css são compartilhados entre arena e prévia. Apenas js/ui/supports_preview.js contém os controles manuais da bancada.

A obtenção usa uma entrada curta, sem repetição e respeitando movimento reduzido. Apoios ativados não flutuam nem têm animações recorrentes.

Use `npm test`, `npm run test:supports` e `npm run test:battle`. `npm run package:supports` gera downloads/apoios-v0.54.0.zip, sem depender das demais telas.

## Correspondência das artes

| Apoio | Carta completa | Ícone da UI |
| --- | --- | --- |
| Bandeide | 52 Sem Título21_20261118210419.png | 53 Sem Título7_20261118205402.png |
| Na Moleira | 52 Sem Título17_20261118210336.png | 53 Sem Título7_20261118205251.png |
| Escudo Volátil | 52 Sem Título25_20261118211031.png | 53 Sem Título7_20261118205823.png |
| Papakill | 52 Sem Título20_20261118210431.png | 53 Sem Título7_20261118205433.png |
| Brisa | 52 Sem Título23_20261118210353.png | 53 Sem Título7_20261118205326.png |
| Sortudo | 52 Sem Título22_20261118210614.png | 53 Sem Título7_20261118205531.png |
| Uma mãozinha | 52 Sem Título25_20261118210658.png | 53 Sem Título7_20261118205554.png |
| Última chance | 52 Sem Título7_20261118211112.png | 53 Sem Título7_20261118205929.png |
| Recruta | 52 Sem Título15_20261118211200.png | 53 Sem Título7_20261118210130.png |
| Máscara | Pendente | 53 Sem Título7_20261118205452.png |
