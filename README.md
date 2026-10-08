# Chronos — Relógio digital

Um relógio digital minimalista, responsivo e acessível, desenvolvido como um projeto de aprendizado em **HTML, CSS e JavaScript puro**.

## Visão geral

O Chronos transforma um exercício clássico de programação em uma central de tempo: acompanha o horário local em tempo real, cria alarmes personalizados, oferece cronômetro, temporizador e relógio mundial, permite alternar entre os formatos de 12 e 24 horas, alterna entre temas claro/escuro e identifica a localização atual usando a geolocalização de alta precisão do navegador.

### Destaques

- Atualização do horário a cada segundo, sem bibliotecas externas.
- Formatação localizada em português do Brasil.
- Alternância entre formatos de 12h e 24h.
- Localização atual por GPS/rede do dispositivo com `enableHighAccuracy: true`, coordenadas e cidade.
- Localização corrigida com botão reativado após sucesso/erro, mensagem de erro acionável, precisão em metros e dois provedores de geocodificação como fallback.
- A localização só é solicitada quando a pessoa clica em **Detectar localização**.
- Relógio mundial com múltiplos fusos horários, locais adicionáveis/removíveis e atualização em tempo real.
- Temas **Dark Mode** e **Light Mode**, com preferência salva no `localStorage`.
- Alarmes personalizados persistidos no navegador, com nome, ativação/pausa e exclusão.
- Som de alerta gerado pela Web Audio API e notificações nativas do navegador.
- Sons de alarme personalizados por upload de arquivos MP3, WAV ou OGG.
- Widget de clima com temperatura atual, sensação térmica, umidade e previsão de quatro dias.
- Cronômetro com pausa, retomada, zeragem e registro de voltas.
- Temporizador regressivo com pausa, retomada, zeragem e alerta ao finalizar.
- Layout responsivo para celular, tablet e desktop.
- Interface com foco visível, HTML semântico e suporte a `prefers-reduced-motion`.
- Zero build e zero dependências: basta abrir o `index.html`.

## Estrutura

```text
digital-clock/
├── assets/              # Espaço para recursos visuais futuros
├── src/
│   ├── css/style.css    # Design, responsividade e animações
│   └── js/clock.js      # Lógica do relógio e controles
├── index.html           # Página principal
├── manus-routes.json    # Manifesto de rotas
├── netlify.toml         # Configuração de publicação estática
└── LICENSE
```

## Como executar

Como o projeto é estático, não é necessário instalar nada. Abra o `index.html` diretamente no navegador ou inicie um servidor local:

```bash
python3 -m http.server 8000
```

Depois, acesse <http://localhost:8000>.

### Localização precisa

Para obter a posição atual, clique em **Detectar localização** e permita o acesso quando o navegador solicitar. O recurso usa a API nativa `navigator.geolocation` com alta precisão, mostra imediatamente as coordenadas e a margem de precisão em metros e tenta identificar a cidade por dois serviços de geocodificação reversa. Em produção, o navegador exige HTTPS para liberar geolocalização. Se o navegador bloquear o acesso, clique no ícone de cadeado ao lado do endereço, permita **Localização** e tente novamente.

### Relógio mundial e temas

Na aba **Mundo**, acompanhe São Paulo, Nova York e Tóquio por padrão, adicione outros locais e remova os que não quiser. Os horários são calculados com `Intl.DateTimeFormat` e os fusos IANA oficiais. O botão de tema no topo alterna entre Dark e Light Mode; a escolha fica salva localmente.

### Alarmes e notificações

Na aba **Alarmes**, escolha um horário e um nome para criar um lembrete. Clique em **Ativar notificações** para autorizar notificações do navegador. O som padrão é gerado localmente pela Web Audio API. Para usar um som próprio, selecione **Som personalizado** e carregue um arquivo `.mp3`, `.wav` ou `.ogg`; o arquivo fica salvo somente no `localStorage` do navegador.

Para adicionar sons diretamente ao código, coloque o arquivo em `assets/sounds/` e troque a fonte do áudio em `src/js/clock.js`:

```js
const audio = new Audio("assets/sounds/meu-alarme.mp3");
audio.play();
```

### Clima

Depois de clicar em **Detectar localização** e permitir o acesso, o Chronos usa latitude e longitude do dispositivo para consultar temperatura atual, sensação térmica, umidade e previsão de quatro dias no [Open-Meteo](https://open-meteo.com/). Não é necessária chave de API. A consulta só é feita após a permissão de localização e as coordenadas não são armazenadas pelo projeto.

### Cronômetro e temporizador

As abas **Cronômetro** e **Temporizador** funcionam diretamente no navegador, sem instalação ou backend. O cronômetro permite registrar voltas, enquanto o temporizador aceita minutos e segundos e alerta quando a contagem chega a zero.

## Deploy

O projeto está configurado para publicação no Netlify com `netlify.toml` e está disponível em **[chronos-digital-clock.netlify.app](https://chronos-digital-clock.netlify.app/)**. Também pode ser hospedado no GitHub Pages, pois não depende de backend ou etapa de compilação.

## Créditos

Projeto originalmente criado como exercício de programação e modernizado para fins de portfólio.

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).
