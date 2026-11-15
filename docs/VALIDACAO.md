# Validação — v0.39.1

Validado em 15/11/2026, com Node.js e Chromium em modo headless, usando o servidor local do projeto.

## Testes automatizados

`npm test` passou:

- Verificações de pacote: menu sem controles de navegação, arquivos de jogo ausentes, versão consistente e recursos de apresentação presentes.
- Integridade: SHA-256 dos recursos preservados comparado com os bytes da v0.38.0, incluindo todos os 11 arquivos de áudio.
- Preferências: volumes limitados, movimento reduzido e ausência de dependências de partida.
- 9 testes do carregamento original.
- 15 testes da abertura obrigatória, incluindo falha, nova tentativa, foco e proteção contra conclusão antecipada.
- 11 testes da trilha sonora, incluindo continuidade, mute, pausa em segundo plano e descarte de áudio obsoleto.

`npm run test:browser` passou com os fluxos completos em **1366 × 768** e **390 × 844**, além do recorte e da estabilidade após redimensionar para **1024 × 768** e **320 × 568**:

- Carregamento original antes da apresentação de título.
- Escape e teclas antecipadas não pulam a abertura.
- A apresentação aguarda tecla/toque depois de concluir a entrada.
- Música do menu ativa desde a apresentação, com a mesma execução e tempo crescente ao entrar no menu.
- Clique/toque nos 10 elementos que antes eram botões; nenhuma tela, painel, navegação ou alteração de progresso.
- Teclado no menu não inicia ações internas.
- Todas as imagens do menu carregadas, sem rolagem horizontal ou vertical.
- Animação de vitória exercitada diretamente pelo teste; seus dois comandos retornam ao menu e não iniciam uma partida. O menu não possui acesso a esse módulo.
- Personagem sem animação de entrada, flutuação ou alteração de posição ao longo da observação.
- Comparação de capturas com e sem o personagem, mantendo os demais efeitos pausados durante a medição: nenhum pixel do personagem fora do polígono da divisão, nos quatro tamanhos verificados.
- Recorte acompanha o redimensionamento e o espaço interno do SVG em retrato; borda desenhada sobre o personagem.
- Enquadramento do celular revisto para manter o rosto visível.
- Movimento reduzido aplicado ao menu.
- Nenhuma exceção JavaScript ou resposta HTTP de erro durante os fluxos.

As capturas foram revisadas visualmente. `git diff --check` passou.

## Capturas desta versão

[Menu no computador](previews/menu-v0.39.1-desktop.png) · [Menu no celular](previews/menu-v0.39.1-celular.png)

[Vitória no computador](previews/vitoria-v0.39.1-desktop.png) · [Vitória no celular](previews/vitoria-v0.39.1-celular.png)
