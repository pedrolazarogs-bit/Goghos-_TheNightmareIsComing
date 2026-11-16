# GOGHOS — The Nightmare Is Coming

**Versão 0.42.0 — menu de apresentação, sem sistema de favorito.**

[Baixar esta versão em ZIP](https://github.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/archive/refs/tags/v0.42.0.zip)

Esta edição mantém a abertura obrigatória, o menu ilustrado, os efeitos de entrada, as animações contínuas e o áudio. Os ícones de Play, loja, deck, ranked, perfil, moedas, configurações e modo continuam na composição visual, sem abrir telas ou iniciar ações. Os acessos no rodapé permanecem desativados.

Na v0.41.0, o menu de computador segue a nova referência enviada: divisão em zigue-zague, base circular em degradê, perfil com nível, Ranked junto à divisão, atalhos inferiores e Play amarelo. Os quatro ícones enviados foram incorporados sem alterar seus arquivos. Os elementos novos são decorativos, sem novos acessos ou sistemas de progressão.

A Unicorn aparece como arte fixa do menu, no tamanho e enquadramento aprovados. O sistema de personagem favorito foi removido: não há seletor, botão de troca nem leitura da antiga preferência salva. No computador, a entrada toca uma vez e termina em repouso, sem zoom ou flutuação.

A composição de celular permanece preservada, com a mesma remoção do recurso de favorito solicitada nesta versão.

A tela de carregamento vem primeiro. Depois aparece a apresentação de GOGHOS, que aguarda qualquer tecla ou toque antes de mostrar o menu. A música começa nessa apresentação e continua no menu, sem reiniciar.

Os motores de batalha, draft, loja, personagens, coleção e demais telas internas foram retirados deste pacote, junto com as artes e estilos usados apenas nessas telas. As versões anteriores permanecem no histórico e nas tags do repositório.

A animação de vitória e seus recursos foram preservados como módulo de apresentação, sem acesso pelos botões do menu. Todos os 11 arquivos de áudio existentes na versão anterior foram conservados, inclusive as trilhas de combate, vitória e derrota. Esta edição não inicia partidas nem concede recompensas.

## Testar

Extraia o ZIP, entre na pasta do projeto e execute:

```sh
npm run dev
```

Abra <http://localhost:8000>. O comando usa Python 3; Node.js é necessário para os testes automatizados. O jogo roda com arquivos locais e não precisa baixar dependências ou acessar serviços externos.

1. Toque em **Toque para iniciar** e aguarde o carregamento e a apresentação.
2. Pressione qualquer tecla ou toque na tela quando a apresentação indicar que pode continuar.
3. Confira o menu, as animações e a continuidade da música.
4. Clique ou toque no personagem: a arte é decorativa e não abre seleção.
5. Clique nos demais ícones: eles devem manter o menu aberto, sem iniciar ações internas.

## Validação

```sh
npm test
```

Verifica os recursos originais, a ausência de telas internas, a abertura obrigatória, as tentativas de carregamento e o controle da trilha sonora.

Com Playwright, pngjs e Chromium disponíveis e o servidor iniciado:

```sh
npm run test:browser
```

O teste percorre a abertura no computador e no celular, confere a música contínua, a ausência de acessos nos elementos do menu, a arte dentro da divisão e a animação de vitória preservada. Uma antiga preferência de favorito não altera a arte fixa nem pula a abertura.

[Histórico de versões](docs/HISTORICO.md) · [Validação desta entrega](docs/VALIDACAO.md)
