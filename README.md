# Chronos — Relógio digital

Um relógio digital minimalista, responsivo e acessível, desenvolvido como um projeto de aprendizado em **HTML, CSS e JavaScript puro**.

## Visão geral

O Chronos transforma um exercício clássico de programação em uma central de tempo: acompanha o horário local em tempo real, cria alarmes personalizados, oferece cronômetro e temporizador, permite alternar entre os formatos de 12 e 24 horas e identifica a localização atual usando a geolocalização de alta precisão do navegador.

### Destaques

- Atualização do horário a cada segundo, sem bibliotecas externas.
- Formatação localizada em português do Brasil.
- Alternância entre formatos de 12h e 24h.
- Localização atual por GPS/rede do dispositivo com `enableHighAccuracy: true`, coordenadas e cidade.
- A localização só é solicitada quando a pessoa clica em **Detectar localização**.
- Alarmes personalizados persistidos no navegador, com nome, ativação/pausa e exclusão.
- Som de alerta gerado pela Web Audio API e notificações nativas do navegador.
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

Para obter a posição atual, clique em **Detectar localização** e permita o acesso quando o navegador solicitar. O recurso usa a API nativa `navigator.geolocation` com alta precisão e mostra as coordenadas recebidas; a cidade é obtida por geocodificação reversa. Em produção, o navegador exige HTTPS para liberar geolocalização.

### Alarmes e notificações

Na aba **Alarmes**, escolha um horário e um nome para criar um lembrete. Clique em **Ativar notificações** para autorizar notificações do navegador. O som é gerado localmente pela Web Audio API, sem arquivos externos; para que o alerta seja disparado, a página precisa continuar aberta.

### Cronômetro e temporizador

As abas **Cronômetro** e **Temporizador** funcionam diretamente no navegador, sem instalação ou backend. O cronômetro permite registrar voltas, enquanto o temporizador aceita minutos e segundos e alerta quando a contagem chega a zero.

## Deploy

O projeto está configurado para publicação no Netlify com `netlify.toml`. Também pode ser hospedado no GitHub Pages, pois não depende de backend ou etapa de compilação.

## Créditos

Projeto originalmente criado como exercício de programação e modernizado para fins de portfólio.

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).
