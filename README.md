# GOGHOS TCG

Protótipo jogável de cartas e batalha por turnos. A versão **0.17.1** corrige a hierarquia após a recuperação da Daly Mãe: os resgatados entram na sequência de velocidades que ainda falta, sem reiniciar a rodada nem repetir ataques. Há seleção alternada de dois Comuns por equipe, seis montes visíveis, medalhas por cor e movimentação de Suportes. A arena mantém a referência visual do criador: campo no centro, registro e leque à esquerda, vez atual e atributos à direita, com as artes originais recebidas.

## Jogar e desenvolver

Abra `index.html` no navegador. O jogo roda localmente, sem conta, servidor ou internet. Para servir os arquivos durante o desenvolvimento, execute `npm run dev` na raiz do projeto e acesse `http://localhost:8000`.

É necessário **Node.js 20 ou superior** para rodar os testes e **Python 3** para `npm run dev`. Não há pacotes externos nem etapa de instalação:

```sh
npm test
```

## Onde está cada parte

| Caminho | Conteúdo |
| --- | --- |
| `js/data/` | Personagens, cartas de Apoio e cartas do monte principal |
| `js/core/` | Regras da batalha, seleção, IA, montes e recuperação |
| `js/ui/` | Telas, cartas, mão e mensagens |
| `assets/` e `css/` | Arte recebida, conceitos, fontes e aparência |
| `tests/` | Regras atuais e testes da interface com DOM simulado |
| `docs/` | Regras completas e histórico das versões recebidas |

[Regras e decisões provisórias](docs/REGRAS.md) · [Validação e imagens](docs/VALIDACAO.md) · [Artes recebidas](docs/ARTES.md) · [Histórico](docs/HISTORICO.md) · [Como contribuir](CONTRIBUTING.md)

## Estado do protótipo

A partida já pode ser concluída contra a IA. Há seleção inicial, cinco montes de personagens, compra do monte principal, cartas de Apoio, Esquiva, mana, recuperação e vitória ao eliminar a Daly Mãe adversária. A Loja, os efeitos de Item e Habilidade Especial e parte da arte continuam em desenvolvimento. Sam, Eletric e Sarck têm ilustrações recebidas e aparecem em **Personagens** no menu. Os outros nomes e retratos ainda são provisórios; os atributos seguem as faixas da v0.14, com os valores conhecidos de Eletric e da Vida de Sarck preservados.

Formação de exemplo para revisar o visual e o enquadramento das ilustrações:

![Arena no computador](docs/previews/arena-v0.17.0-desktop.png)
