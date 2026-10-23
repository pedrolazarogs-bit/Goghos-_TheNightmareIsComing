# Zeenneriam e a invocação primordial — v0.23.0

Zeenneriam é um **Deus sem raridade**. Seu cadastro fica separado dos 30 personagens dos seis montes. A arte imprime “ZENEERIAN”; ela foi preservada literalmente. A carta de referência, a base sem números e o banner do `KitZenneriam.zip` estão guardados com hashes em `assets/characters/zenneriam_manifest.json`.

| Vida | Dano básico | Velocidade | Fôlego | Habilidade | Tributos |
| ---: | ---: | ---: | ---: | --- | --- |
| 1.700 | 700 | 7 | 12 | Presence | MAX |

## Obtenção

Existem **exatamente três cartas físicas de Fragmento Primordial na partida inteira**, embaralhadas no monte principal compartilhado. Cada uma tem identidade própria. Os fragmentos vão diretamente para a mão e ocupam vagas no limite normal de cinco. Não há reposição nem reciclagem.

Quem reunir os três na própria mão pode selecionar um fragmento e usar **Invocar Zeenneriam**, durante a vez da equipe, inclusive se seu personagem estiver impedido. A invocação exige uma vaga válida, consome os três para o descarte e retira o único Deus da reserva divina. Não usa o limite de Apoio nem a ação do personagem. Não pode ocorrer durante escolhas obrigatórias, pausa ou feedback da interface.

A entrada respeita a formação: frente primeiro; com a frente cheia, pode ocupar uma vaga traseira pelo tributo de Suporte. Ele aguarda o próximo ciclo de velocidade, assim como entradas por medalha. Se não havia atacante em nenhuma equipe, retoma o ciclo que aguardava sem comprar novamente. Recruta também pode abrir a quarta vaga frontal.

Não vem de medalha, seleção inicial, recuperação da Daly Mãe ou Morto Vivo. Se for eliminado, permanece na área de excluídos. Uma nova partida restaura a reserva e os três fragmentos. A IA também invoca, inclusive quando a batalha está sem atacantes. Fragmentos utilizáveis e uma ressurreição capaz de devolver um atacante impedem empate prematuro.

## Presence

Conforme confirmado pelo criador, ignora **habilidades de personagens**, tanto as usadas contra ele quanto as defesas e reações de seus alvos. **Cartas de Apoio continuam funcionando**. Não Grita, por exemplo, pode suspender Presence durante suas quatro ações; os tributos MAX permanecem.

- Não pode ser escolhido para dimensão, livro, hipnose, sono ou petrificação enquanto Presence estiver ativa. Habilidades benéficas de personagens também não o afetam.
- Ataques normais ainda causam dano. Ignora os componentes de habilidade: imobilização de John, multiplicação de Nully/quatro braços/caça, bônus de estrela/susto/Oni, socos adicionais do combo, área, queimaduras, execução, livro e reações automáticas.
- Ao atacar, ignora armadura de Cavaleiro, proteções de Mike/Striker, duelo de Xerife, esquiva especial de Trucc, redirecionamento de Z-Zus, Oni, revide de Sark/Karma/Chama e tubarão de Endrik. Pode atravessar o isolamento dimensional; as vagas normais de retaguarda continuam protegidas.
- Tributos de classe são regras separadas: Parry adversário pode defender, resistência natural pode reduzir dano, e o crítico de Destroyer continua válido. Sua Mana de Mago já permite ignorar a esquiva comum.
- Ao retornar depois de um silêncio, Presence desfaz controles e queimaduras de personagem que ainda estiverem nele. Escudos, cura e demais efeitos de Apoio permanecem válidos.

## MAX e tributos das classes

As novas regras de Tanque e Destroyer valem para **todos os personagens dessas classes**, além do Deus. Valores de Vida/Dano continuam terminando em 0 ou 5; porcentagens sobem para o próximo múltiplo de cinco.

| Classe | Tributo |
| --- | --- |
| Mago | Mana inicial/máxima 3; recupera +1 por ação concluída. Cada ponto gasto soma 10 de dano, parâmetro ainda provisório. |
| Assassino | Esquiva se for mais rápido: d6 até a diferença de velocidade. Mago ignora esse teste. |
| Fighter | Parry; John e Zeenneriam defendem com 1 ou 2 no d6. Os demais Fighters mantêm seus limiares individuais ainda não definidos. |
| Tanque | Resistência natural de 10% a dano de ataques, incluindo revides que sejam ataques. Não reduz queimadura periódica, livro, dano do machado ou execução. Combina com outras reduções antes do arredondamento. |
| Destroyer | Um d6 por ataque: 1 ou 2 concede +25% de dano. Não multiplica execuções, dano fixo periódico nem vidas da Daly Mãe. No míssil, o crítico vale no alvo principal e o dano lateral deriva dos 20% desse impacto, sem nova rolagem. |
| Suporte | Transita entre retaguarda e frente, respeitando vagas e mantendo pelo menos um defensor na frente. |

Zeenneriam reúne todos os seis. Seus números iniciais vêm da arte e não usam as faixas de raridade. O menu **Invocação de Zeenneriam** prepara os três fragmentos na mão para testar a invocação manualmente; o Deus começa fora da arena.
