# Origem e integração do projeto

Os arquivos `goghos-v0_12_0.zip` e `goghos-v0_14_0.zip` foram comparados por nome e conteúdo. Todos os 40 arquivos da 0.12 estão presentes na 0.14; 10 deles mudaram e a 0.14 acrescentou 2 testes. Não havia um terceiro conjunto de arquivos exclusivos da 0.12 a transplantar. Os commits de importação preservam cada versão separadamente no histórico do Git.

| Área | v0.12.0 | v0.14.0, adotada no projeto atual |
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
