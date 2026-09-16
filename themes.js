// themes.js
// Cada tema é um objeto simples: variáveis CSS que serão aplicadas na página.
// Para adicionar um novo tema pronto, basta copiar um bloco e mudar os valores.

const SALA_CONFORTAVEL_THEMES = {
  padrao: {
    label: "Padrão (sem alterações)",
    vars: {}
  },

  modoEscuro: {
    label: "Modo Escuro",
    vars: {
      "--sf-bg": "#1a1a1d",
      "--sf-bg-secundario": "#2c2c30",
      "--sf-texto": "#e8e8e8",
      "--sf-destaque": "#4f9dff",
      "--sf-fonte": "inherit"
    }
  },

  tonsPastel: {
    label: "Tons Pastel",
    vars: {
      "--sf-bg": "#fdf6f0",
      "--sf-bg-secundario": "#fbe9e7",
      "--sf-texto": "#4a4a4a",
      "--sf-destaque": "#f7a1a1",
      "--sf-fonte": "inherit"
    }
  },

  altoContraste: {
    label: "Alto Contraste",
    vars: {
      "--sf-bg": "#000000",
      "--sf-bg-secundario": "#000000",
      "--sf-texto": "#ffffff",
      "--sf-destaque": "#ffff00",
      "--sf-fonte": "inherit"
    }
  },

  florestaCalma: {
    label: "Floresta Calma",
    vars: {
      "--sf-bg": "#eef4ea",
      "--sf-bg-secundario": "#dbe8d4",
      "--sf-texto": "#2f3e2e",
      "--sf-destaque": "#6a9955",
      "--sf-fonte": "inherit"
    }
  },

  azulMeiaNoite: {
    label: "Azul Meia-Noite",
    vars: {
      "--sf-bg": "#0a1128",
      "--sf-bg-secundario": "#1b2a4a",
      "--sf-texto": "#dce4f0",
      "--sf-destaque": "#5db7de",
      "--sf-fonte": "inherit"
    }
  },

  auroraNoturna: {
    label: "Aurora Noturna 🌌",
    // "imagem" é o nome do arquivo de imagem, colocado na MESMA pasta dos outros
    // arquivos da extensão (manifest.json, content.js etc.). Pra criar outro tema
    // com imagem, é só colocar o arquivo ali do lado e apontar o nome aqui.
    imagem: "aurora.svg",
    vars: {
      "--sf-bg": "#0a1128", // usado como cor de fallback enquanto a imagem carrega
      "--sf-bg-secundario": "#1b2a4a",
      "--sf-texto": "#eef2fb",
      "--sf-destaque": "#7fd8d0",
      "--sf-fonte": "inherit"
    }
  },

  ceuEstrelado: {
    label: "Céu Estrelado ✨",
    imagem: "ceu-estrelado.jpg",
    vars: {
      "--sf-bg": "#0d1a2b", // cor de fallback enquanto a foto carrega
      "--sf-bg-secundario": "#152840",
      "--sf-texto": "#eef4fb",
      "--sf-destaque": "#8fd6e8",
      "--sf-fonte": "inherit"
    }
  }
};

// Gera o CSS de um tema a partir das variáveis + das regras que usam essas variáveis.
// IMPORTANTE: os seletores abaixo (".corpo-principal", ".cabecalho" etc.) são EXEMPLOS.
// Você precisa abrir o DevTools (F12) na Sala do Futuro, inspecionar os elementos
// reais (fundo da página, cabeçalho, cards, texto) e trocar esses seletores pelos certos.
function gerarCSSDoTema(tema) {
  const v = tema.vars;
  if (!v || Object.keys(v).length === 0) return ""; // tema "padrao" não aplica nada

  const variaveis = Object.entries(v)
    .map(([nome, valor]) => `${nome}: ${valor};`)
    .join("\n  ");

  // Se o tema tiver uma imagem de fundo, monta a regra de background com ela.
  // A imagem fica coberta por um gradiente escuro semitransparente por cima
  // (mesma cor de fundo do tema), pra garantir que o texto continue legível
  // não importa quão clara ou "bagunçada" a imagem seja.
  const regraFundo = tema.imagem
    ? `
      background-image:
        linear-gradient(rgba(10, 17, 40, 0.55), rgba(10, 17, 40, 0.55)),
        url("${chrome.runtime.getURL(tema.imagem)}") !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
    `
    : `background-color: var(--sf-bg) !important;`;

  return `
    :root {
      ${variaveis}
    }

    /* Fundo geral da página (Material UI monta tudo dentro de #root) */
    body, #root {
      ${regraFundo}
      color: var(--sf-texto) !important;
    }

    /* Cabeçalho (AppBar do Material UI) */
    header.MuiAppBar-root {
      background-color: var(--sf-bg-secundario) !important;
      color: var(--sf-texto) !important;
    }

    /* Menu lateral (Drawer do Material UI) */
    .MuiDrawer-root .MuiPaper-root,
    .MuiDrawer-paper {
      background-color: var(--sf-bg-secundario) !important;
      color: var(--sf-texto) !important;
    }

    /* Área principal de conteúdo — fica transparente de propósito, pra deixar
       aparecer o que estiver por trás (a cor OU a imagem de fundo do body/#root) */
    .MuiContainer-root {
      background-color: transparent !important;
      color: var(--sf-texto) !important;
    }

    /* Camadas de layout que ficam entre o #root e o conteúdo de verdade (o "invólucro"
       da página inteira, e a biblioteca simplebar que cuida da rolagem) não têm cor
       própria de propósito — ficam sempre transparentes, garantido via CSS puro (sem
       depender de JavaScript medir nada, o que evitava rodar bem na hora certa em
       toda troca de página dentro do site). */
    #root > div,
    [data-simplebar],
    .simplebar-wrapper,
    .simplebar-mask,
    .simplebar-offset,
    .simplebar-content-wrapper,
    .simplebar-content {
      background: transparent !important;
    }

    /* Cards e blocos de superfície (Paper/Card do Material UI) */
    .MuiPaper-root {
      background-color: var(--sf-bg-secundario) !important;
      color: var(--sf-texto) !important;
    }

    /* Textos dentro dos componentes */
    .MuiTypography-root {
      color: var(--sf-texto) !important;
    }

    /* Links e botões */
    a, .MuiLink-root, .MuiButtonBase-root {
      color: var(--sf-destaque) !important;
    }

    /* Logo "Sala do Futuro" — como é uma imagem (não texto), simula um contorno fino
       ao redor das letras usando drop-shadow em várias direções, em vez de uma caixa. */
    img[src*="logo"] {
      filter:
        drop-shadow(1px 0 0 var(--sf-destaque))
        drop-shadow(-1px 0 0 var(--sf-destaque))
        drop-shadow(0 1px 0 var(--sf-destaque))
        drop-shadow(0 -1px 0 var(--sf-destaque)) !important;
    }

    /* Itens do menu lateral: hover e "selecionado" têm cor própria no site original
       (geralmente branco), que não é coberta pela correção via JavaScript porque só
       aparece quando o mouse está em cima. Definindo aqui via CSS, o navegador cuida
       de aplicar/remover sozinho, sem risco de "travar" numa cor errada.
       O "html body" na frente é só pra aumentar a força da regra (especificidade),
       porque o Material UI injeta o próprio CSS dinamicamente e às vezes empata
       com o nosso — assim a nossa sempre vence, não importa a ordem. */
    html body .MuiButtonBase-root:hover,
    html body .MuiListItemButton-root:hover,
    html body .MuiMenuItem-root:hover,
    html body .MuiListItemButton-root.Mui-selected,
    html body .MuiMenuItem-root.Mui-selected,
    html body [aria-current="page"] .MuiMenuItem-root,
    html body [aria-current="page"] .MuiButtonBase-root,
    html body .MuiListItemButton-root.Mui-selected:hover {
      background-color: var(--sf-bg-secundario) !important;
      background-image: none !important;
      color: var(--sf-destaque) !important;
      border-radius: 10px !important;
      border: 1.5px solid var(--sf-destaque) !important;
    }

    html body .MuiButtonBase-root:hover *,
    html body .MuiListItemButton-root:hover *,
    html body .MuiMenuItem-root:hover *,
    html body .MuiListItemButton-root.Mui-selected *,
    html body .MuiMenuItem-root.Mui-selected *,
    html body [aria-current="page"] .MuiMenuItem-root *,
    html body [aria-current="page"] .MuiButtonBase-root * {
      color: var(--sf-destaque) !important;
    }
  `;
}
