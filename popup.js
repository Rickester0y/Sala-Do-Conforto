// popup.js

const listaTemasEl = document.getElementById("lista-temas");
const detalhesCustom = document.getElementById("detalhes-custom");
const previewCustomEl = document.getElementById("preview-custom");
const cabecalhoEl = document.getElementById("cabecalho-popup");

// Pede pro content script da aba ativa mostrar o toast de crédito da foto —
// igual uma notificação da Steam, no canto da tela, não dentro do popup (que
// é pequeno demais e some assim que o usuário clica fora). Só manda a
// mensagem pra temas com foto E crédito conhecido (campo "credito" em
// themes.js); se a aba ativa não for a Sala do Futuro (content script não
// rodando lá), o sendMessage falha e a gente só ignora — não tem onde
// mostrar o toast mesmo.
function mostrarCreditoFoto(tema) {
  if (!tema || !tema.credito) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (abas) => {
    const aba = abas && abas[0];
    if (!aba || !aba.id) return;
    chrome.tabs.sendMessage(
      aba.id,
      { tipo: "sala-confortavel:credito-foto", credito: tema.credito },
      () => {
        void chrome.runtime.lastError; // sem content script na aba: ignora
      }
    );
  });
}

// Decide se o cabeçalho precisa da variante "clara" (texto escuro com contorno
// claro) com base na luminância da cor de fundo do tema — reaproveitando o
// luminanciaHex() que já existe no themes.js pro cálculo da cor elevada dos
// cards. Tema "Padrão" (sem vars) não entra aqui: fica sempre com o gradiente
// de marca (roxo), que é escuro o bastante pro texto branco funcionar.
function cabecalhoEhClaro(tema) {
  const cor = tema && tema.vars && (tema.vars["--sf-bg-secundario"] || tema.vars["--sf-bg"]);
  if (!cor) return false;
  return luminanciaHex(cor) > 0.55;
}

// Deixa o fundo do cabeçalho como uma "miniatura" do tema atualmente
// selecionado — com foto, se o tema tiver uma; com o degradê das duas cores
// de fundo do tema, se for um tema sólido; ou volta pro gradiente de marca
// (definido no CSS) se for o tema "Padrão", que não tem cores próprias.
function aplicarTemaNoCabecalho(tema) {
  if (tema && tema.imagem) {
    cabecalhoEl.style.backgroundImage = `url('${chrome.runtime.getURL(tema.imagem)}')`;
  } else {
    const bg = tema && tema.vars && tema.vars["--sf-bg"];
    const bgSecundario = tema && tema.vars && tema.vars["--sf-bg-secundario"];
    if (bg && bgSecundario) {
      cabecalhoEl.style.backgroundImage = `linear-gradient(135deg, ${bg}, ${bgSecundario} 70%)`;
    } else {
      cabecalhoEl.style.backgroundImage = ""; // volta pro gradiente de marca do CSS
    }
  }

  cabecalhoEl.classList.toggle("cabecalho-claro", cabecalhoEhClaro(tema));
}

// Cores de amostra do tema "Padrão" (o site original), só pra mostrar um preview
// bonito no card, já que esse tema não tem variáveis próprias (vars: {}).
const AMOSTRA_PADRAO = {
  "--sf-bg": "#ffffff",
  "--sf-bg-secundario": "#f2f2f5",
  "--sf-destaque": "#1857a4"
};

function amostraDoTema(tema) {
  const vars = Object.keys(tema.vars).length > 0 ? tema.vars : AMOSTRA_PADRAO;
  return [vars["--sf-bg"], vars["--sf-bg-secundario"], vars["--sf-destaque"]];
}

const NOMES_CATEGORIAS = {
  modos: "Modos",
  cores: "Cores Sólidas",
  fotos: "Fotos"
};

function criarCardDeTema(chave, tema, temaAtual) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "tema-card" + (chave === temaAtual ? " selecionado" : "");

  // Se o tema tiver uma imagem de fundo de verdade, mostra ela na prévia.
  // Senão, mostra a tirinha com as 3 cores principais do tema.
  let htmlAmostra;
  if (tema.imagem) {
    const urlImagem = chrome.runtime.getURL(tema.imagem);
    htmlAmostra = `<div class="amostra" style="background-image:url('${urlImagem}');background-size:cover;background-position:center;"></div>`;
  } else {
    const [corBg, corBgSecundario, corDestaque] = amostraDoTema(tema);
    htmlAmostra = `
      <div class="amostra">
        <span style="background:${corBg}"></span>
        <span style="background:${corBgSecundario}"></span>
        <span style="background:${corDestaque}"></span>
      </div>
    `;
  }

  card.innerHTML = `
    <span class="check">✓</span>
    ${htmlAmostra}
    <span class="nome-tema">${tema.label}</span>
  `;

  card.addEventListener("click", () => {
    chrome.storage.sync.set({ temaSelecionado: chave });
    document.querySelectorAll(".tema-card").forEach((c) => c.classList.remove("selecionado"));
    card.classList.add("selecionado");
    detalhesCustom.open = false;
    aplicarTemaNoCabecalho(tema);
    mostrarCreditoFoto(tema);
  });

  return card;
}

// Fecha todas as gavetas de categoria, exceto a que acabou de abrir — assim só
// uma fica aberta por vez ("acordeão"), do jeito que foi pedido: abre a gaveta,
// escolhe um tema, e ela some de vista só quando outra gaveta é aberta.
function configurarAcordeaoDeSecoes() {
  const gavetas = Array.from(listaTemasEl.querySelectorAll("details.secao-temas"));
  gavetas.forEach((gaveta) => {
    gaveta.addEventListener("toggle", () => {
      if (!gaveta.open) return;
      gavetas.forEach((outra) => {
        if (outra !== gaveta) outra.open = false;
      });
    });
  });
}

function montarListaDeTemas(temaAtual) {
  listaTemasEl.innerHTML = "";

  // Agrupa os temas por categoria, na ordem em que cada categoria aparece
  // pela primeira vez em SALA_CONFORTAVEL_THEMES (modos → cores → fotos).
  const porCategoria = new Map();
  Object.entries(SALA_CONFORTAVEL_THEMES).forEach(([chave, tema]) => {
    const categoria = tema.categoria || "outros";
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria).push([chave, tema]);
  });

  // Descobre a categoria do tema selecionado, pra abrir só a gaveta dele.
  const temaAtualObj = SALA_CONFORTAVEL_THEMES[temaAtual];
  const categoriaDoTemaAtual = temaAtualObj ? temaAtualObj.categoria : null;

  porCategoria.forEach((temasDaCategoria, categoria) => {
    const gaveta = document.createElement("details");
    gaveta.className = `secao-temas secao-${categoria}`;
    // Se o tema salvo for "custom" (sem categoria própria), nenhuma gaveta
    // abre sozinha — o usuário escolhe qual quer ver.
    gaveta.open = categoria === categoriaDoTemaAtual;

    const titulo = document.createElement("summary");
    titulo.className = "secao-titulo";
    titulo.innerHTML = `
      <span class="secao-titulo-texto">
        <span class="secao-titulo-ponto"></span>${NOMES_CATEGORIAS[categoria] || categoria}
      </span>
      <span class="seta">▶</span>
    `;
    gaveta.appendChild(titulo);

    const grade = document.createElement("div");
    grade.className = "grade-temas";
    temasDaCategoria.forEach(([chave, tema]) => {
      grade.appendChild(criarCardDeTema(chave, tema, temaAtual));
    });
    gaveta.appendChild(grade);

    listaTemasEl.appendChild(gaveta);
  });

  configurarAcordeaoDeSecoes();
}

function atualizarPreviewCustom() {
  previewCustomEl.innerHTML = `
    <span style="background:${document.getElementById("cor-bg").value}"></span>
    <span style="background:${document.getElementById("cor-bg-secundario").value}"></span>
    <span style="background:${document.getElementById("cor-destaque").value}"></span>
  `;
}

["cor-bg", "cor-bg-secundario", "cor-texto", "cor-destaque"].forEach((id) => {
  document.getElementById(id).addEventListener("input", atualizarPreviewCustom);
});

// Monta a lista IMEDIATAMENTE, de forma síncrona, com "padrao" como palpite —
// isso faz o popup já nascer do tamanho certo (evita o "pulo" de vazio pra
// cheio que acontecia enquanto esperava o chrome.storage responder). O
// chrome.storage.sync.get logo abaixo é assíncrono por natureza (não tem como
// evitar isso), mas como normalmente responde em poucos milissegundos, a
// pequena correção de "padrao" pro tema real fica praticamente imperceptível
// — bem diferente do salto de tamanho de um popup vazio se preenchendo.
montarListaDeTemas("padrao");
atualizarPreviewCustom();

// Corrige pro tema real assim que o chrome.storage responder
chrome.storage.sync.get(["temaSelecionado", "temaCustom"], (dados) => {
  const chave = dados.temaSelecionado || "padrao";
  montarListaDeTemas(chave);

  const temaAtual = chave === "custom" && dados.temaCustom
    ? { vars: dados.temaCustom }
    : SALA_CONFORTAVEL_THEMES[chave] || SALA_CONFORTAVEL_THEMES.padrao;
  aplicarTemaNoCabecalho(temaAtual);
});

// Botão "Usar meu tema": salva as 4 cores escolhidas como tema customizado
const botaoSalvar = document.getElementById("salvar-custom");
botaoSalvar.addEventListener("click", () => {
  const temaCustom = {
    "--sf-bg": document.getElementById("cor-bg").value,
    "--sf-bg-secundario": document.getElementById("cor-bg-secundario").value,
    "--sf-texto": document.getElementById("cor-texto").value,
    "--sf-destaque": document.getElementById("cor-destaque").value
  };

  chrome.storage.sync.set({ temaSelecionado: "custom", temaCustom }, () => {
    document.querySelectorAll(".tema-card").forEach((c) => c.classList.remove("selecionado"));
    botaoSalvar.textContent = "Tema aplicado ✓";
    botaoSalvar.classList.add("salvo");
    aplicarTemaNoCabecalho({ vars: temaCustom });
    setTimeout(() => {
      botaoSalvar.textContent = "Usar meu tema";
      botaoSalvar.classList.remove("salvo");
    }, 1400);
  });
});
