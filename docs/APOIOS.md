# Kit de Apoio — v0.23.0

As 17 cartas oficiais têm uma única definição por nome. Bandeide, Brisa e Na Moloeira substituem as entradas anteriores; não foram duplicadas. As artes originais e seus hashes estão em `assets/support/manifest.json`. Cada Apoio tem duas cópias físicas no monte principal, composição provisória que pode ser ajustada.

O uso vem da mão: um Apoio por equipe entre duas ações consecutivas, sem gastar a ação do personagem. Isso funciona durante imobilização, sono, paralisia, petrificação e hipnose. Usar Apoio não avança dano periódico, mana, velocidade ou compras. As duas equipes seguem as mesmas regras. Alvos válidos aparecem em botões e recebem destaque na arena; ressuscitar permite escolher na lista de eliminados.

| Carta | Regra implementada |
| --- | --- |
| Na Moloeira | +20 no próximo ataque da equipe, consumidos uma vez. |
| Bandeide | Cura até 80 de Vida de um aliado vivo, limitada ao máximo. |
| Brisa | Enquanto ativa, cada eliminação aliada permite curar outro aliado ferido em 30. O jogador escolhe; o bot cura o mais ferido. |
| Zap | Descarta um Apoio aleatório da mão adversária. Não remove medalhas ou Itens. Sem Apoio disponível, não é consumida. |
| Não Grita | Desliga a habilidade principal do alvo por quatro ações globais. Desfaz controles mantidos por essa habilidade e suspende a armadura de Cavaleiro. Tributos de classe e Apoios continuam. Suprimir um Oni já ativo encerra sua sobrevivência excepcional. |
| Sortudo | O próximo d6 da equipe recebe o melhor resultado para aquele teste. Ex.: 6 para Nully, 1 para crítico/Parry, número ainda não repetido no combo de Sam. Depois se esgota. |
| Fôlego | Prepara o aliado: após ser atacado e sobreviver, fica invulnerável até terminar a próxima ação global. Não ressuscita um alvo morto pelo golpe inicial. |
| Combokill | O aliado ganha outro ataque imediatamente após um golpe seu eliminar um adversário. Vale para dano normal ou execução, sem reset de velocidade ou compra extra. Não concede ação se o próprio aliado morrer na troca. |
| Papakill | Executa um adversário com Vida estritamente menor que 40. Proteção de Z-Zus e invulnerabilidade continuam seguindo suas regras. |
| Eu Denovo | Uma única ação extra para o aliado. Se ainda não agiu, recebe a extra depois da ação normal; se já agiu, ela entra na fila prioritária. A hierarquia restante é retomada depois. |
| Furto | Rouba um Apoio aleatório da mão adversária. A carta usada sai antes do roubo, preservando o limite de cinco. |
| Morto Vivo | Devolve a mesma carta física eliminada com exatamente **1 de Vida**, exceção confirmada ao múltiplo de cinco. A habilidade principal fica removida; não refaz a entrada nem recupera bônus anteriores. Mantém os tributos de classe. Precisa de vaga válida; não invoca Deuses. |
| Recruta | Abre uma quarta vaga frontal, uma vez por equipe. A retaguarda continua com duas vagas. |
| Escudo Volátil | Bloqueia até 80 de um dano numérico, após as reduções, e é consumido. Parry ou Esquiva não o gastam; não bloqueia execução instantânea. |
| Poder Adicional | Reabre um uso esgotado de quatro braços, cura total, pó mágico ou estrela; permite repetir o susto; recupera um ponto de precisão de petrificação. Em Oni ativo, prepara mais uma duração de três ações, sem acumular outro +30 de ataque. Não duplica passivas contínuas nem concede ação. |
| Uma Mãozinha | O aliado vivo de menor Vida atual copia a maior Vida máxima entre os personagens vivos da arena e fica com esse valor de Vida atual/máxima. Não diminui seu máximo e não repete no mesmo beneficiado. |
| Última Chance | Aplicável abaixo de 100 de Vida: +50 de ataque enquanto o aliado estiver abaixo desse limiar. Cura até 100 ou mais suspende o bônus; cair novamente o reativa, sem acumular. |

As decisões de Morto Vivo com 1 de Vida, Recruta na quarta vaga frontal, Sortudo no próximo dado, Eu Denovo uma única vez e Combokill após qualquer golpe fatal foram confirmadas pelo criador. Os demais detalhes de alvo, desempate e interação acima tornam as cartas jogáveis e ficam centralizados em `js/core/support_effects.js`.

O menu **Testar cartas de Apoio** oferece um cenário para cada carta. Itens e Habilidades Especiais continuam aguardando efeitos oficiais.
