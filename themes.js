// themes.js
// Cada tema é um objeto simples: variáveis CSS que serão aplicadas na página.
// Para adicionar um novo tema pronto, basta copiar um bloco e mudar os valores.

// --- Helpers de tonalidade -------------------------------------------------
// Usados pra criar uma 3ª camada de profundidade ("cor elevada" dos cards) a
// partir da cor secundária de cada tema, sem precisar escolher essa cor à mão
// pra cada um dos 17 temas. Sem isso, cabeçalho, menu lateral e cards ficavam
// exatamente na mesma cor — o que é confortável em alguns temas (ex: Aurora,
// onde a imagem já dá variação natural), mas deixa temas sólidos "achatados",
// principalmente o Alto Contraste, onde fundo e fundo-secundário eram o MESMO
// preto (#000000), então literalmente tudo tinha a cor idêntica.

// Clareia (quantidade > 0) ou escurece (quantidade < 0) uma cor hex, deslocando
// cada canal RGB uma fração do caminho até 255 (branco) ou 0 (preto).
function ajustarClaridadeHex(hex, quantidade) {
  const limpo = hex.replace("#", "");
  const bigint = parseInt(limpo, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  const alvo = quantidade > 0 ? 255 : 0;
  const fator = Math.abs(quantidade);

  r = Math.round(r + (alvo - r) * fator);
  g = Math.round(g + (alvo - g) * fator);
  b = Math.round(b + (alvo - b) * fator);

  const paraHex = (n) => n.toString(16).padStart(2, "0");
  return `#${paraHex(r)}${paraHex(g)}${paraHex(b)}`;
}

function luminanciaHex(hex) {
  const limpo = hex.replace("#", "");
  const bigint = parseInt(limpo, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Tema escuro: cards ficam um pouco MAIS CLAROS que o cabeçalho/menu (parecem
// "flutuar" acima do fundo escuro). Tema claro: cards ficam um pouco MAIS
// ESCUROS (dão a sensação de profundidade sem precisar de sombra de verdade).
function calcularCorElevada(corSecundariaHex) {
  const ehEscura = luminanciaHex(corSecundariaHex) < 0.5;
  return ajustarClaridadeHex(corSecundariaHex, ehEscura ? 0.10 : -0.06);
}
// ----------------------------------------------------------------------------

// Cada tema tem uma "categoria", usada só pelo popup pra agrupar os temas em
// seções (Modos, Cores Sólidas, Fotos) em vez de uma lista única.
const SALA_CONFORTAVEL_THEMES = {
  padrao: {
    label: "Padrão (sem alterações)",
    categoria: "modos",
    vars: {}
  },

  modoEscuro: {
    label: "Modo Escuro",
    categoria: "modos",
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
    categoria: "modos",
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
    categoria: "modos",
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
    categoria: "cores",
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
    categoria: "cores",
    vars: {
      "--sf-bg": "#0a1128",
      "--sf-bg-secundario": "#1b2a4a",
      "--sf-texto": "#dce4f0",
      "--sf-destaque": "#5db7de",
      "--sf-fonte": "inherit"
    }
  },

  vinhoTinto: {
    label: "Vinho Tinto 🍷",
    categoria: "cores",
    vars: {
      "--sf-bg": "#241014",
      "--sf-bg-secundario": "#3a1b21",
      "--sf-texto": "#f2e3e6",
      "--sf-destaque": "#e08fa0",
      "--sf-fonte": "inherit"
    }
  },

  verdeMusgo: {
    label: "Verde Musgo 🌿",
    categoria: "cores",
    vars: {
      "--sf-bg": "#10201a",
      "--sf-bg-secundario": "#1c332a",
      "--sf-texto": "#e6f0ea",
      "--sf-destaque": "#7bc99a",
      "--sf-fonte": "inherit"
    }
  },

  grafite: {
    label: "Grafite",
    categoria: "cores",
    vars: {
      "--sf-bg": "#1e1f24",
      "--sf-bg-secundario": "#2c2d33",
      "--sf-texto": "#e7e7ea",
      "--sf-destaque": "#a495ff",
      "--sf-fonte": "inherit"
    }
  },

  mostarda: {
    label: "Mostarda 🍯",
    categoria: "cores",
    // Amarelo de verdade em tela cheia cansa a vista rápido — em vez disso, um
    // marrom quente escuro como base (tipo luz de fim de tarde) com o amarelo
    // reservado pro destaque, que é onde ele realmente chama atenção.
    vars: {
      "--sf-bg": "#201a08",
      "--sf-bg-secundario": "#332a10",
      "--sf-texto": "#f7f0da",
      "--sf-destaque": "#f0c14b",
      "--sf-fonte": "inherit"
    }
  },

  ametista: {
    label: "Ametista 💜",
    categoria: "cores",
    vars: {
      "--sf-bg": "#170b26",
      "--sf-bg-secundario": "#2a1440",
      "--sf-texto": "#f3e9fb",
      "--sf-destaque": "#c792ea",
      "--sf-fonte": "inherit"
    }
  },

  terracota: {
    label: "Terracota 🏺",
    categoria: "cores",
    // A categoria "Cores Sólidas" tava com só 1 tema claro (Floresta Calma)
    // pra 4 escuros — esse aqui equilibra um pouco, pra quem prefere fundo
    // claro mas quer uma cor mais quente que o Tons Pastel.
    vars: {
      "--sf-bg": "#fbf1ea",
      "--sf-bg-secundario": "#f3ddd0",
      "--sf-texto": "#4a332a",
      "--sf-destaque": "#c1694f",
      "--sf-fonte": "inherit"
    }
  },

  dolomitas: {
    label: "Dolomitas 🏔️",
    categoria: "fotos",
    // "imagem" é o nome do arquivo de imagem, dentro da pasta images/. Pra criar
    // outro tema com imagem, é só colocar o arquivo ali dentro e apontar o nome aqui.
    imagem: "images/aurora.jpg",
    credito: { autor: "Marek Piwnicki", url: "https://www.pexels.com/pt-br/foto/majestosa-montanha-dolomita-ao-por-do-sol-31346405/" },
    // Overlay roxo-escuro puxando pro tom do céu ao entardecer na foto — o SVG
    // antigo não precisava disso (já vinha estilizado), mas foto de verdade sim.
    overlay: "rgba(20, 14, 35, 0.4)",
    vars: {
      "--sf-bg": "#241b38", // usado como cor de fallback enquanto a imagem carrega
      "--sf-bg-secundario": "#382a52",
      "--sf-texto": "#f3eefb",
      "--sf-destaque": "#e3a76f",
      "--sf-fonte": "inherit"
    }
  },

  ceuEstrelado: {
    label: "Céu Estrelado ✨",
    categoria: "fotos",
    imagem: "images/ceu-estrelado.jpg",
    credito: { autor: "Nicolas Outin", url: "https://www.pexels.com/pt-br/foto/natureza-arvores-silhueta-estrelas-13444719/" },
    overlay: "rgba(10, 20, 35, 0.35)",
    vars: {
      "--sf-bg": "#0d1a2b", // cor de fallback enquanto a foto carrega
      "--sf-bg-secundario": "#152840",
      "--sf-texto": "#eef4fb",
      "--sf-destaque": "#8fd6e8",
      "--sf-fonte": "inherit"
    }
  },

  invernoCinza: {
    label: "Inverno Cinza 🌫️",
    categoria: "fotos",
    imagem: "images/inverno.jpg",
    credito: { autor: "Stanislav Kondratiev", url: "https://www.pexels.com/pt-br/foto/neve-floresta-selva-mata-6549134/" },
    overlay: "rgba(18, 20, 24, 0.45)",
    vars: {
      "--sf-bg": "#16181c",
      "--sf-bg-secundario": "#23262b",
      "--sf-texto": "#e9eaec",
      "--sf-destaque": "#a9b4c0",
      "--sf-fonte": "inherit"
    }
  },

  chuvaDourada: {
    label: "Chuva Dourada 🌧️",
    categoria: "fotos",
    imagem: "images/chuva.jpg",
    credito: { autor: "Madison Inouye", url: "https://www.pexels.com/pt-br/foto/gotas-de-agua-no-vidro-durante-a-noite-3728299/" },
    overlay: "rgba(28, 16, 6, 0.45)",
    vars: {
      "--sf-bg": "#1c1006",
      "--sf-bg-secundario": "#2e1d0d",
      "--sf-texto": "#f8ecdc",
      "--sf-destaque": "#f0a949",
      "--sf-fonte": "inherit"
    }
  },

  sakura: {
    label: "Sakura 🌸",
    categoria: "fotos",
    imagem: "images/sakura.jpg",
    credito: { autor: "Alex Brites", url: "https://www.pexels.com/pt-br/foto/cerejeiras-em-flor-na-primavera-de-shinjuku-36721359/" },
    // Foto bem clara e colorida — precisa de overlay mais forte pra não competir
    // com o texto por cima.
    overlay: "rgba(40, 14, 26, 0.6)",
    vars: {
      "--sf-bg": "#2a0f1c",
      "--sf-bg-secundario": "#40192a",
      "--sf-texto": "#fdeaf1",
      "--sf-destaque": "#f79ec0",
      "--sf-fonte": "inherit"
    }
  },

  fundoDoMar: {
    label: "Fundo do Mar 🪸",
    categoria: "fotos",
    imagem: "images/oceano.jpg",
    credito: { autor: "Javier Balseiro", url: "https://www.pexels.com/pt-br/foto/anemonas-do-mar-de-um-azul-vibrante-em-ambiente-subaquatico-38682431/" },
    overlay: "rgba(4, 14, 44, 0.45)",
    vars: {
      "--sf-bg": "#04102c",
      "--sf-bg-secundario": "#0d2150",
      "--sf-texto": "#e6f1ff",
      "--sf-destaque": "#5fc9f0",
      "--sf-fonte": "inherit"
    }
  },

  rosasVermelhas: {
    label: "Rosas Vermelhas 🌹",
    categoria: "fotos",
    imagem: "images/rosas.jpg",
    credito: { autor: "Kaboompics.com", url: "https://www.pexels.com/pt-br/foto/vermelho-amor-romantico-flores-4195587/" },
    overlay: "rgba(34, 6, 10, 0.55)",
    vars: {
      "--sf-bg": "#22060a",
      "--sf-bg-secundario": "#3a0e14",
      "--sf-texto": "#fceaec",
      "--sf-destaque": "#ef7f8e",
      "--sf-fonte": "inherit"
    }
  },

  brasas: {
    label: "Brasas 🔥",
    categoria: "fotos",
    imagem: "images/fogo.jpg",
    credito: { autor: "Alexander Zvir", url: "https://www.pexels.com/pt-br/foto/casa-lar-residencia-ardente-11490331/" },
    overlay: "rgba(22, 8, 4, 0.45)",
    vars: {
      "--sf-bg": "#160804",
      "--sf-bg-secundario": "#2a1109",
      "--sf-texto": "#fbe9de",
      "--sf-destaque": "#ff8b3d",
      "--sf-fonte": "inherit"
    }
  },

  campoDeFlores: {
    label: "Campo de Flores 💜",
    categoria: "fotos",
    imagem: "images/flores.jpg",
    credito: { autor: "Mallesh Baithi", url: "https://www.pexels.com/fr-fr/photo/fleurs-de-phlox-violet-vibrantes-en-pleine-floraison-31735762/" },
    // Foto bem saturada (roxo/magenta forte) — overlay roxo-escuro pra unificar
    // com a paleta do tema em vez de brigar com a cor natural da foto.
    overlay: "rgba(30, 10, 42, 0.5)",
    vars: {
      "--sf-bg": "#1e0a2a",
      "--sf-bg-secundario": "#301042",
      "--sf-texto": "#f5e9fb",
      "--sf-destaque": "#e0a1f7",
      "--sf-fonte": "inherit"
    }
  },

  expressoPaulista: {
    label: "Expresso Paulista 🚂",
    categoria: "fotos",
    imagem: "images/trem.jpg",
    credito: { autor: "JR Satilite", url: "https://www.pexels.com/photo/vintage-paulista-train-in-sao-paulo-brazil-32992506/" },
    // Foto com metade clara (céu) — overlay verde-escuro puxando pro verde do
    // vagão, com destaque dourado ecoando as letras "PAULISTA" da foto.
    overlay: "rgba(10, 20, 15, 0.5)",
    vars: {
      "--sf-bg": "#0f1c14",
      "--sf-bg-secundario": "#1c3324",
      "--sf-texto": "#f5f0dc",
      "--sf-destaque": "#d4af5a",
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
  // A imagem fica coberta por uma camada semitransparente por cima (na cor definida
  // em "overlay" do tema, ou azul-escuro por padrão), pra garantir que o texto
  // continue legível não importa quão clara ou "bagunçada" a imagem seja.
  // Fotos claras (ex: flores de cerejeira ao sol) precisam de overlay mais forte;
  // fotos já escuras precisam de menos.
  const camadaEscura = tema.overlay || "rgba(10, 17, 40, 0.35)";
  const regraFundo = tema.imagem
    ? `
      background-image:
        linear-gradient(${camadaEscura}, ${camadaEscura}),
        url("${chrome.runtime.getURL(tema.imagem)}") !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
    `
    : `background-color: var(--sf-bg) !important;`;

  // Cabeçalho de tabela (ex: "Componente/Faltas/% presença" na página Presença)
  // usa a cor "primária" azul padrão do Material UI pros títulos ordenáveis —
  // fica ilegível/estranho no nosso fundo escuro. Via classe ESTÁVEL do MUI
  // (não a dinâmica css-xxxxx), então não depende de heurística por elemento.
  // Só entra em temas escuros: em tema claro esse azul já contrasta bem com o
  // fundo original, e forçar branco ali faria o oposto do que queremos.
  const ehTemaClaro = v["--sf-bg-secundario"] ? luminanciaHex(v["--sf-bg-secundario"]) > 0.55 : false;
  const regraCabecalhoTabela = !ehTemaClaro
    ? `
    .MuiTableCell-head,
    .MuiTableSortLabel-root {
      color: #ffffff !important;
    }
  `
    : "";

  // Rótulo flutuante de campo de formulário (ex: "Título", "Redação" na
  // Redação Paulista) usa classe estável do MUI, mas no estado "não focado"
  // costuma vir com OPACIDADE reduzida além da cor escura — só a cor não
  // bastava. 0.85 (não 1) porque o rótulo ainda deve parecer um pouco mais
  // discreto que o texto preenchido de verdade — só não mais quase-invisível.
  const regraRotuloFormulario = !ehTemaClaro
    ? `
    .MuiInputLabel-root,
    .MuiFormLabel-root {
      color: #ffffff !important;
      opacity: 0.85 !important;
    }
  `
    : "";

  return `
    :root {
      ${variaveis}
    }

    /* Fundo geral da página (Material UI monta tudo dentro de #root) */
    body, #root {
      ${regraFundo}
      color: var(--sf-texto) !important;
    }

    ${regraCabecalhoTabela}
    ${regraRotuloFormulario}

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
    html body .MuiContainer-root {
      background-color: transparent !important;
      color: var(--sf-texto) !important;
    }

    /* Cards e blocos de superfície (Paper/Card do Material UI) — tom "elevado",
       um degrau diferente do cabeçalho/menu, pra não ficar tudo na mesma cor.
       O fallback pro secundário é só segurança, caso --sf-bg-elevado não tenha
       sido calculado por algum motivo. */
    .MuiPaper-root {
      background-color: var(--sf-bg-elevado, var(--sf-bg-secundario)) !important;
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
