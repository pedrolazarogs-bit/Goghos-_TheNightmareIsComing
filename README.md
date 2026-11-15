# GOGHOS — The Nightmare Is Coming

**Versão 0.40.3 — menu com seleção de personagem favorito.**

[Baixar esta versão em ZIP](https://github.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/archive/refs/tags/v0.40.3.zip)

Esta edição mantém a abertura obrigatória, o menu ilustrado, os efeitos de entrada, as animações contínuas e o áudio. Os ícones de Play, loja, deck, ranked, perfil, moedas, configurações e modo continuam na composição visual, sem abrir telas ou iniciar ações. Os acessos no rodapé permanecem desativados.

Na v0.40.3, o triângulo preto decorativo foi removido do fundo no computador, revelando a imagem original do cenário.

No computador, os cinco personagens voltaram ao tamanho e ao enquadramento aprovados na v0.40.0. Uma transição de transparência nas extremidades suaviza os cortes das artes sem ampliá-las. A entrada e a troca de favorito usam fade com um pequeno deslocamento, sem zoom e com apenas uma execução; ao terminar, o personagem fica parado, sem flutuação ou repetição.

A versão de celular está preservada no comportamento e no enquadramento da v0.40.0. Novas alterações no celular dependem de pedido explícito.

Clique ou toque no personagem para abrir **Personagem favorito**. Escolha entre **Unicorn, Sam, Sark, Nully e Mike**: a imagem e o nome mudam na hora, e a preferência fica salva neste navegador. A aba também funciona com teclado e pode ser fechada pelo botão ×, Escape ou um clique fora dela. Se o navegador impedir o salvamento, a escolha funciona durante a sessão.

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
4. Clique ou toque no personagem e selecione outro favorito. Feche e reabra o jogo para conferir que a escolha foi salva.
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

O teste percorre a abertura em computador e celular, verifica por pixels que o personagem repousa dentro da divisão após a animação, confere o áudio contínuo, clica nos 10 elementos decorativos que antes eram botões, confere a troca dos cinco favoritos, a persistência e o fechamento por teclado, mantém os demais acessos desativados e exercita o módulo de vitória diretamente. O menu não oferece esse acesso.

Para conferir também o tamanho aprovado, o enquadramento e a transparência das bordas durante a entrada e a escolha no computador:

```sh
npm run test:desktop-character
```

[Histórico de versões](docs/HISTORICO.md) · [Validação desta entrega](docs/VALIDACAO.md)
