# Chronos — Relógio digital

Um relógio digital minimalista, responsivo e acessível, desenvolvido como um projeto de aprendizado em **HTML, CSS e JavaScript puro**.

## Visão geral

O Chronos transforma um exercício clássico de programação em uma pequena experiência visual: acompanha o horário local em tempo real, exibe a data atual e permite alternar entre os formatos de 12 e 24 horas.

### Destaques

- Atualização do horário a cada segundo, sem bibliotecas externas.
- Formatação localizada em português do Brasil.
- Alternância entre formatos de 12h e 24h.
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

## Deploy

O projeto está configurado para publicação no Netlify com `netlify.toml`. Também pode ser hospedado no GitHub Pages, pois não depende de backend ou etapa de compilação.

## Créditos

Projeto originalmente criado como exercício de programação e modernizado para fins de portfólio.

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).
