# GOGHOS TCG

Protótipo jogável de um jogo de cartas e batalha por turnos. Esta base reúne as versões **0.12.0** e **0.14.0**: a seleção, os montes, a Daly Mãe e as regras de partida da 0.12 continuam presentes; a formação, a mão, a mana e a interface seguem as regras mais recentes da 0.14.

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
| `assets/` e `css/` | Arte, fontes e aparência |
| `tests/` | Regras atuais e testes da interface com DOM simulado |
| `docs/` | Regras completas e histórico das versões recebidas |

[Regras e decisões provisórias](docs/REGRAS.md) · [Comparação das versões](docs/HISTORICO.md) · [Como contribuir](CONTRIBUTING.md)

## Estado do protótipo

A partida já pode ser concluída contra a IA. Há seleção inicial, cinco montes de personagens, compra do monte principal, cartas de Apoio, Esquiva, mana, recuperação e vitória ao eliminar a Daly Mãe adversária. A Loja, os efeitos de Item e Habilidade Especial e parte da arte continuam em desenvolvimento. Os nomes e a arte dos personagens ainda são provisórios, e os atributos seguem as faixas da v0.14.
