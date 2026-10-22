# Origem e integração do projeto

Os arquivos `goghos-v0_12_0.zip` e `goghos-v0_14_0.zip` foram comparados por nome e conteúdo. Todos os 40 arquivos da 0.12 estão presentes na 0.14; 10 deles mudaram e a 0.14 acrescentou 2 testes. Não havia um terceiro conjunto de arquivos exclusivos da 0.12 a transplantar. Os commits de importação preservam cada versão separadamente no histórico do Git.

| Área | v0.12.0 | v0.14.0, base das regras atuais |
| --- | --- | --- |
| Partida | Seleção de Comuns, cinco montes, Daly, Daly Mãe, recuperação, eliminação, IA e Esquiva | Mantém essas mecânicas e adapta a formação e o espaço disponível |
| Formação | Retaguarda de qualquer classe e sem limite fixo | Até 3 na frente e até 2 Supports na retaguarda |
| Apoio | Três cartas equipadas desde o início em painel lateral | Cartas de Apoio são compradas do monte principal e usadas da mão |
| Mão | Sem limite | Limite de 5; jogador escolhe substituição ou descarte, IA substitui a mais antiga |
| Mago | Mana inicial por raridade, sem regeneração | 3 pontos para todos os Magos; recupera 1 após cada ação resolvida |
| Personagens | Atributos de protótipo | Vida e Dano calculados por faixa de raridade e perfil de classe |
| Interface | Painel lateral de Apoio e mão à direita | Leque da mão, registro visual de eventos e animações de batalha |

As regras acima são incompatíveis entre as versões. A versão mais recente define o comportamento atual. Os testes antigos da 0.12 foram preservados no commit de importação; parte das expectativas deles se refere a regras substituídas. A suíte corrente verifica as regras da 0.14 e as mecânicas da 0.12 que permanecem em vigor.

Para consultar as versões recebidas sem duplicar arquivos no projeto:

```sh
git show 1243c0f:README.md  # v0.12.0
git show e6af3aa:README.md  # v0.14.0
```

## v0.15.0 — artes e personagens

O arquivo `kikiy.zip` trouxe 48 imagens. Sam recebeu a arte da carta de referência; Eletric entrou como Mago Raro, com 220 de Vida e 130 de Dano conforme a carta; Sarck entrou como Tank Épico, com 530 de Vida. O Dano e a Velocidade de Sarck, as classes/raridades atribuídas e os efeitos especiais “3000W” e “Steel Jaw” ainda dependem de confirmação. A interface usa a área ilustrada das cartas completas e mostra os atributos atuais calculados pelo jogo. As três cartas de Apoio e o logotipo foram atualizados. As demais artes foram preservadas como conceitos e catalogadas em `docs/ARTES.md`.

## v0.15.1 — composição das cartas e recuperação

As três cartas prontas foram separadas como referência. Eletric e Sarck usam suas ilustrações avulsas; Sam usa o retrato do banner recebido, com enquadramento próprio. Moldura, nome, vida, dano, mana e fôlego são camadas independentes. Os símbolos das habilidades também são enquadrados sem duplicar a estrela.

A recuperação agora recebe até 3 Comuns, 2 Raros ou 1 Épico, entregando as cartas restantes quando o monte tem menos. Montes vazios ficam bloqueados. A mão ocupa uma área própria para não cobrir as escolhas em telas pequenas. Decisões de mão cheia e cura da Brisa pausam a ordem antes de liberar o próximo personagem.

Validação: suíte de regras, catálogo, recuperação e interface, incluindo 100 partidas simuladas; revisão no Chromium em desktop e celular.
