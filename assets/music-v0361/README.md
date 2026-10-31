# Músicas recebidas — v0.36.1

Os três MP3s foram copiados dos anexos do criador, sem recodificar, cortar ou normalizar. O manifesto registra os nomes recebidos, tamanhos, SHA-256 e metadados medidos com FFprobe.

| Recebido | Arquivo local | Uso | Duração | Repetição |
| --- | --- | --- | --- | --- |
| `BattleMusic.mp3` | `combat.mp3` | Batalha | 181,97 s | Sim |
| `DefeatMusicc.mp3` | `defeat.mp3` | Derrota | 60,29 s | Não |
| `WinMusic.mp3` | `victory.mp3` | Vitória | 62,54 s | Não |

Todos são MP3 estéreo a 44,1 kHz. O controlador de trilha continua respeitando volume, mudo, pausa, transição entre contextos e suspensão da aba. Vitória e derrota tocam uma vez por resultado, sem reiniciar a cada redesenho. A música da abertura e a música do menu permanecem nos recursos recebidos anteriormente.

As composições anteriores em `assets/music/` ficam preservadas no histórico e nos arquivos do projeto; estas três faixas passam a ser as ativas para combate e resultados.
