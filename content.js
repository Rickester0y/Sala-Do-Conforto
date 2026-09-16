// content.js
// Roda dentro da página da Sala do Futuro (declarado no manifest.json).
// Lê o tema salvo (ou um tema customizado) e injeta o CSS correspondente.

const SALA_CONFORTAVEL_STYLE_ID = "sala-confortavel-style-tag";
const SALA_CONFORTAVEL_MARCADOR = "data-sc-ajustado"; // evita reprocessar o mesmo elemento
const SALA_CONFORTAVEL_MARCADOR_BORDA = "data-sc-borda"; // marca elementos com borda interna corrigida
const SALA_CONFORTAVEL_MARCADOR_ELEV = "data-sc-elevacao"; // marca elementos com sombra trocada por borda
const SALA_CONFORTAVEL_MARCADOR_ICONE = "data-sc-icone"; // marca ícones pequenos com brilho ajustado
const SALA_CONFORTAVEL_CLASSE_CARREGANDO = "sala-confortavel-carregando";

// Esconde o CONTEÚDO da página (não o <html> inteiro) e pinta o fundo com a cor do
// tema imediatamente — tipo uma "tela de carregamento" de jogo — em vez de deixar a
// página em branco/transparente enquanto a extensão termina de aplicar o tema.
// Usa localStorage (que é síncrono, ao contrário do chrome.storage) pra já saber
// de cara qual cor pintar, sem esperar a resposta do chrome.storage.sync.get.
const SALA_CONFORTAVEL_CACHE_COR = "sala-confortavel-cor-fundo-cache";

(function mostrarTelaDeCarregamento() {
  const corCache = localStorage.getItem(SALA_CONFORTAVEL_CACHE_COR);
  const corDeFundo = corCache || "#1a1a1d"; // cor padrão pra a primeiríssima vez (antes de existir cache)

  const tag = document.createElement("style");
  tag.id = "sala-confortavel-esconder";
  tag.textContent = `
    html.${SALA_CONFORTAVEL_CLASSE_CARREGANDO} {
      background-color: ${corDeFundo} !important;
    }
    html.${SALA_CONFORTAVEL_CLASSE_CARREGANDO} body {
      visibility: hidden !important;
    }
  `;
  document.documentElement.appendChild(tag);
  document.documentElement.classList.add(SALA_CONFORTAVEL_CLASSE_CARREGANDO);

  // Trava de segurança: se algo der errado e a correção nunca "avisar que terminou",
  // a página é revelada de qualquer jeito depois de 1.5s, pra nunca travar o acesso do aluno.
  setTimeout(revelarPagina, 1500);
})();

function revelarPagina() {
  document.documentElement.classList.remove(SALA_CONFORTAVEL_CLASSE_CARREGANDO);
}

function aplicarCSS(cssTexto) {
  let tag = document.getElementById(SALA_CONFORTAVEL_STYLE_ID);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = SALA_CONFORTAVEL_STYLE_ID;
    document.documentElement.appendChild(tag);
  }
  tag.textContent = cssTexto || "";
}

// Decide se uma cor (formato "rgb(r,g,b)" ou "rgba(r,g,b,a)") é "clara" o suficiente
// pra precisar de ajuste. Usa uma fórmula simples de luminância percebida.
function corEhClara(corCss) {
  const numeros = corCss.match(/[\d.]+/g);
  if (!numeros || numeros.length < 3) return false;
  const [r, g, b] = numeros.map(Number);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6;
}

// Decide se uma cor de borda é um "acento" colorido de propósito (ex: a linha
// laranja/azul/rosa embaixo de alguns cards), pra não apagar esse detalhe visual
// quando a gente for aplicar nossa borda padrão em cima do card.
function corEhAcentoColorido(corCss) {
  const numeros = corCss.match(/[\d.]+/g);
  if (!numeros || numeros.length < 3) return false;
  const [r, g, b] = numeros.map(Number);
  const alpha = numeros.length >= 4 ? Number(numeros[3]) : 1;
  if (alpha < 0.6) return false;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  return maxC - minC > 25; // cor "colorida" (não cinza/preto/branco)
}

// Aplica uma borda padrão (branca semitransparente) em volta do elemento. A borda de
// baixo é tratada à parte: se o site já definiu alguma borda ali (seja lá qual for a
// cor — pode ser um acento colorido de propósito), a gente deixa 100% intocada; se não
// tinha nenhuma, aplicamos a borda padrão também, pra não deixar o card "aberto" embaixo.
function aplicarBordaPreservandoAcentos(el, bordaPadrao) {
  ["Top", "Right", "Left"].forEach((lado) => {
    el.style.setProperty(`border-${lado.toLowerCase()}`, bordaPadrao, "important");
  });

  const estilo = getComputedStyle(el);
  const larguraBottom = parseFloat(estilo.borderBottomWidth);
  const temBordaBottomPropria = larguraBottom > 0 && estilo.borderBottomStyle !== "none";
  if (!temBordaBottomPropria) {
    el.style.setProperty("border-bottom", bordaPadrao, "important");
  }
}

// O menu lateral (Drawer) já é 100% coberto pelas regras fixas do themes.js
// (fundo, texto, hover, item selecionado). Deixamos ele de fora da correção via
// JavaScript de propósito: JS "tira uma foto" do estado do elemento e trava esse
// resultado, e se essa foto for tirada bem no meio de um clique/hover, ela grava
// esse estado temporário (o tal "fantasma") como se fosse permanente. CSS não tem
// esse problema porque reage sozinho o tempo todo.
function estaDentroDoMenuLateral(el) {
  return el.closest(".MuiDrawer-root") !== null;
}

// Percorre a página e escurece na marra qualquer elemento com fundo claro
// que os seletores fixos do themes.js não tenham pego (cards com classes
// dinâmicas do Material UI, que mudam a cada card/página).
function corrigirFundosClaros(temaVars, temaTemImagem) {
  if (!temaVars || Object.keys(temaVars).length === 0) return;

  const bgSecundario = temaVars["--sf-bg-secundario"];
  const corTexto = temaVars["--sf-texto"];

  const candidatos = Array.from(document.querySelectorAll("body *:not(script):not(style)")).filter((el) => {
    if (el.hasAttribute(SALA_CONFORTAVEL_MARCADOR)) return false;
    if (estaDentroDoMenuLateral(el)) return false;
    if (el.id === "root") return false; // já é coberto pelo CSS fixo (inclusive imagem de fundo, se houver)

    const estilo = getComputedStyle(el);
    const bg = estilo.backgroundColor;
    const temFundoSolidoClaro = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && corEhClara(bg);

    // Alguns painéis usam gradiente (ex: "Meus pontos") em vez de cor sólida —
    // background-color sozinho não pega isso, então checamos background-image também.
    const temGradiente = estilo.backgroundImage && estilo.backgroundImage !== "none" && estilo.backgroundImage.includes("gradient");

    return temFundoSolidoClaro || temGradiente;
  });

  candidatos.forEach((el) => {
    // Quando o tema tem imagem de fundo, o "wrapper" que envolve a página inteira
    // (filho direto de #root) vira TRANSPARENTE em vez de ganhar cor sólida — senão
    // ele tampa a imagem por completo. Tratamos ele como "tela cheia" direto pela
    // posição no HTML (não medindo tamanho), porque medir no meio de uma troca de
    // página pode pegar um valor errado (0) e travar isso errado pra sempre.
    // Quando o tema tem imagem de fundo, um wrapper "gigante" (que cobre quase a
    // tela toda, tipo o filho direto de #root, ou outros wrappers estruturais do
    // Material UI que ficam entre o menu de rolagem e o conteúdo) vira TRANSPARENTE
    // em vez de ganhar cor sólida — senão ele tampa a imagem por completo.
    // Quando o tema tem imagem de fundo, um wrapper "gigante" vira TRANSPARENTE em
    // vez de ganhar cor sólida — senão ele tampa a imagem por completo. Em vez de
    // medir o tamanho dele (o que pode dar errado bem no meio de uma troca de
    // página, travando a decisão errada pra sempre), identificamos ele pela
    // POSIÇÃO FIXA na estrutura do HTML — isso não muda nunca, seja qual for a
    // página aberta dentro do site:
    //   - filho direto de #root (o "invólucro" de toda a página)
    //   - filho direto de .simplebar-content (o wrapper logo antes do Container,
    //     que vimos ser o culpado real de tampar a imagem)
    const ehFilhoDoRoot = el.parentElement && el.parentElement.id === "root";
    const ehFilhoDoSimplebarContent = el.parentElement && el.parentElement.classList.contains("simplebar-content");
    const vaiFicarTransparente = temaTemImagem && (ehFilhoDoRoot || ehFilhoDoSimplebarContent);

    el.style.setProperty("background-color", vaiFicarTransparente ? "transparent" : bgSecundario, "important");
    el.style.setProperty("background-image", "none", "important");
    el.style.setProperty("color", corTexto, "important");
    el.style.setProperty("border-radius", "10px", "important");
    el.setAttribute(SALA_CONFORTAVEL_MARCADOR, "1");

    // Só deixa a borda bem visível em elementos grandes (cards de conteúdo de verdade).
    // Elementos pequenos (ícones, botões do menu) ganham uma borda quase imperceptível,
    // pra não deixar a tela inteira "riscada" de branco.
    const retangulo = el.getBoundingClientRect();
    const ehCardGrande = retangulo.width > 150 && retangulo.height > 60;
    const opacidadeBorda = ehCardGrande ? 0.4 : 0.06;
    aplicarBordaPreservandoAcentos(el, `2px solid rgba(255, 255, 255, ${opacidadeBorda})`);
  });
}

// Corrige linhas divisórias/bordas internas que eram cinza-claras no site original
// (ex: a linha vertical que separa duas seções dentro do mesmo card) e que ficam
// quase invisíveis em cima do fundo escuro.
// Analisa uma cor (rgb ou rgba) e decide se ela precisa ser clareada pra continuar
// visível em cima do fundo escuro. Cobre dois casos:
// 1) Cor sólida clara (ex: bordas cinza claro comuns) — já ficava óbvio antes.
// 2) Cor PRETA semitransparente (ex: rgba(0,0,0,0.12)) — muito comum no Material UI
//    para divisórias e sombras sutis. Em cima de fundo branco isso aparece como
//    cinza clarinho, mas em cima do nosso fundo escuro fica praticamente invisível.
function precisaClarear(corCss) {
  const numeros = corCss.match(/[\d.]+/g);
  if (!numeros || numeros.length < 3) return null;

  const [r, g, b] = numeros.map(Number);
  const alpha = numeros.length >= 4 ? Number(numeros[3]) : 1;
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (alpha >= 0.95) {
    return luminancia > 0.6 ? { novaOpacidade: 0.3 } : null;
  }

  // Cor escura e semitransparente: provavelmente uma divisória/overlay do tipo
  // Material UI que precisa virar clara (branca) pra aparecer no tema escuro.
  if (luminancia < 0.4) {
    return { novaOpacidade: Math.min(alpha * 2.5, 0.4) };
  }

  return null;
}

// O Material UI usa box-shadow (sombra preta semitransparente) pra dar profundidade
// aos cards com elevação. Assim como a borda, essa sombra é praticamente invisível
// em cima do nosso fundo escuro. Em vez de tentar clarear a sombra (complicado de
// calcular com precisão), a gente simplesmente troca por uma borda visível.
function corrigirElevacoes() {
  document.querySelectorAll("body *:not(script):not(style)").forEach((el) => {
    if (el.hasAttribute(SALA_CONFORTAVEL_MARCADOR_ELEV)) return;
    if (estaDentroDoMenuLateral(el)) return;

    const estilo = getComputedStyle(el);
    if (estilo.boxShadow === "none") return;

    const retangulo = el.getBoundingClientRect();
    const ehCardGrande = retangulo.width > 150 && retangulo.height > 60;
    if (!ehCardGrande) return; // não mexe em sombra de botão pequeno, ícone etc.

    // Antes de apagar a sombra, verifica se alguma das cores dela é um "acento"
    // colorido de propósito (a mesma técnica da linha embaixo dos cards, só que
    // feita com box-shadow em vez de border). Se for, resgata essa cor como uma
    // borda de verdade antes de jogar a sombra fora.
    const coresDaSombra = estilo.boxShadow.match(/rgba?\([^)]+\)/g) || [];
    const corDeAcento = coresDaSombra.find((cor) => corEhAcentoColorido(cor));

    el.style.setProperty("box-shadow", "none", "important");

    if (corDeAcento) {
      el.style.setProperty("border-bottom", `3px solid ${corDeAcento}`, "important");
    }

    aplicarBordaPreservandoAcentos(el, "2px solid rgba(255, 255, 255, 0.3)");
    el.setAttribute(SALA_CONFORTAVEL_MARCADOR_ELEV, "1");
  });
}

// Ícones pequenos (SVG ou <img>) costumam ser desenhados pensando em fundo claro,
// e ficam "sem vida" em cima do nosso fundo escuro. Aumenta um pouco o brilho/contraste
// só neles (não em imagens grandes, tipo fotos ou o troféu, pra não estourar o visual).
function corrigirIconesEscuros() {
  document.querySelectorAll("svg, img").forEach((el) => {
    if (el.hasAttribute(SALA_CONFORTAVEL_MARCADOR_ICONE)) return;

    const retangulo = el.getBoundingClientRect();
    const ehIconePequeno = retangulo.width > 0 && retangulo.width <= 40 && retangulo.height <= 40;
    if (!ehIconePequeno) return;

    el.style.setProperty("filter", "brightness(1.35) contrast(1.1)", "important");
    el.setAttribute(SALA_CONFORTAVEL_MARCADOR_ICONE, "1");
  });
}

function corrigirBordasInternasClaras() {
  const lados = ["Top", "Right", "Bottom", "Left"];

  document.querySelectorAll("body *:not(script):not(style)").forEach((el) => {
    if (el.hasAttribute(SALA_CONFORTAVEL_MARCADOR_BORDA)) return;
    if (estaDentroDoMenuLateral(el)) return;

    const estilo = getComputedStyle(el);
    const ladosAjustados = [];

    lados.forEach((lado) => {
      const largura = parseFloat(estilo[`border${lado}Width`]);
      const tipoBorda = estilo[`border${lado}Style`];
      const cor = estilo[`border${lado}Color`];
      const analise = largura > 0 && tipoBorda !== "none" ? precisaClarear(cor) : null;

      if (analise) {
        el.style.setProperty(`border-${lado.toLowerCase()}-color`, `rgba(255, 255, 255, ${analise.novaOpacidade})`, "important");
        ladosAjustados.push(lado.toLowerCase());
      }
    });

    if (ladosAjustados.length > 0) {
      el.setAttribute(SALA_CONFORTAVEL_MARCADOR_BORDA, ladosAjustados.join(","));
    }
  });
}

// Remove os ajustes "na marra" feitos por corrigirFundosClaros (usado ao voltar pro tema Padrão)
function removerCorrecoesManuais() {
  document.querySelectorAll(`[${SALA_CONFORTAVEL_MARCADOR}]`).forEach((el) => {
    el.style.removeProperty("background-color");
    el.style.removeProperty("background-image");
    el.style.removeProperty("color");
    el.style.removeProperty("border-radius");
    ["border-top", "border-right", "border-left", "border-bottom"].forEach((lado) => el.style.removeProperty(lado));
    el.removeAttribute(SALA_CONFORTAVEL_MARCADOR);
  });

  document.querySelectorAll(`[${SALA_CONFORTAVEL_MARCADOR_BORDA}]`).forEach((el) => {
    const lados = el.getAttribute(SALA_CONFORTAVEL_MARCADOR_BORDA).split(",");
    lados.forEach((lado) => el.style.removeProperty(`border-${lado}-color`));
    el.removeAttribute(SALA_CONFORTAVEL_MARCADOR_BORDA);
  });

  document.querySelectorAll(`[${SALA_CONFORTAVEL_MARCADOR_ELEV}]`).forEach((el) => {
    el.style.removeProperty("box-shadow");
    ["border-top", "border-right", "border-left", "border-bottom"].forEach((lado) => el.style.removeProperty(lado));
    el.removeAttribute(SALA_CONFORTAVEL_MARCADOR_ELEV);
  });

  document.querySelectorAll(`[${SALA_CONFORTAVEL_MARCADOR_ICONE}]`).forEach((el) => {
    el.style.removeProperty("filter");
    el.removeAttribute(SALA_CONFORTAVEL_MARCADOR_ICONE);
  });
}

let temaVarsAtuais = null;
let temaImagemAtual = null;
let observerAtivo = null;
let primeiraCorrecaoFeita = false;

// Como o script agora roda em "document_start" (pra aplicar o CSS o quanto antes
// e evitar o "flash" de tela clara), o <body> pode ainda nem existir nesse momento.
// Essa função espera o <body> aparecer antes de tentar escanear elementos nele.
function quandoBodyExistir(callback) {
  if (document.body) {
    callback();
    return;
  }
  const obs = new MutationObserver(() => {
    if (document.body) {
      obs.disconnect();
      callback();
    }
  });
  obs.observe(document.documentElement, { childList: true });
}

let correcaoAgendada = false;

function rodarCorrecaoCompleta() {
  corrigirFundosClaros(temaVarsAtuais, Boolean(temaImagemAtual));
  corrigirBordasInternasClaras();
  corrigirElevacoes();
  corrigirIconesEscuros();
}

function agendarCorrecao() {
  if (!temaVarsAtuais || correcaoAgendada) return;
  correcaoAgendada = true;
  // requestAnimationFrame roda assim que o navegador for desenhar o próximo quadro
  // (bem mais rápido que um setTimeout de várias centenas de ms), e ainda assim
  // agrupa várias mutações do DOM que aconteçam juntas numa única correção.
  requestAnimationFrame(() => {
    correcaoAgendada = false;
    quandoBodyExistir(() => {
      rodarCorrecaoCompleta();
      primeiraCorrecaoFeita = true;
      revelarPagina();
    });
  });
}

function carregarTemaAtual() {
  chrome.storage.sync.get(["temaSelecionado", "temaCustom"], (dados) => {
    const chave = dados.temaSelecionado || "padrao";

    let vars = {};
    let imagem = null;
    if (chave === "custom" && dados.temaCustom) {
      vars = dados.temaCustom;
    } else {
      const tema = SALA_CONFORTAVEL_THEMES[chave] || SALA_CONFORTAVEL_THEMES.padrao;
      vars = tema.vars;
      imagem = tema.imagem || null; // <- isso estava faltando: a imagem nunca chegava até aqui
    }

    // Isso aplica na hora, mesmo antes do <body> existir — é o que evita o flash inicial.
    aplicarCSS(gerarCSSDoTema({ vars, imagem }));

    // Guarda a cor de fundo atual pra já pintar a tela de carregamento certa
    // da próxima vez que essa página for aberta (antes mesmo da extensão "acordar").
    if (vars["--sf-bg"]) {
      localStorage.setItem(SALA_CONFORTAVEL_CACHE_COR, vars["--sf-bg"]);
    } else {
      localStorage.removeItem(SALA_CONFORTAVEL_CACHE_COR); // tema Padrão: nada a cachear
    }

    quandoBodyExistir(() => {
      removerCorrecoesManuais();
      temaVarsAtuais = vars;
      temaImagemAtual = imagem;

      if (Object.keys(vars).length > 0) {
        agendarCorrecao();

        // A Sala do Futuro carrega conteúdo dinamicamente (SPA), então observamos
        // mudanças no DOM pra corrigir cards novos assim que aparecerem na tela.
        if (!observerAtivo) {
          observerAtivo = new MutationObserver(agendarCorrecao);
          observerAtivo.observe(document.body, { childList: true, subtree: true });
        }
      } else if (observerAtivo) {
        observerAtivo.disconnect();
        observerAtivo = null;
      }

      if (Object.keys(vars).length === 0) {
        revelarPagina(); // tema Padrão: nada a corrigir, mostra a página na hora
      }
    });
  });
}

// Aplica assim que a página carrega
carregarTemaAtual();

// Se o aluno trocar o tema no popup enquanto a página já está aberta,
// atualiza na hora, sem precisar recarregar.
chrome.storage.onChanged.addListener((mudancas, area) => {
  if (area === "sync" && (mudancas.temaSelecionado || mudancas.temaCustom)) {
    carregarTemaAtual();
  }
});

