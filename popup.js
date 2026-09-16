// popup.js

const listaTemasEl = document.getElementById("lista-temas");
const detalhesCustom = document.getElementById("detalhes-custom");
const previewCustomEl = document.getElementById("preview-custom");

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

function montarListaDeTemas(temaAtual) {
  listaTemasEl.innerHTML = "";

  Object.entries(SALA_CONFORTAVEL_THEMES).forEach(([chave, tema]) => {
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
    });

    listaTemasEl.appendChild(card);
  });
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

// Carrega o tema salvo e marca o card certo ao abrir o popup
chrome.storage.sync.get(["temaSelecionado"], (dados) => {
  montarListaDeTemas(dados.temaSelecionado || "padrao");
  atualizarPreviewCustom();
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
    setTimeout(() => {
      botaoSalvar.textContent = "Usar meu tema";
      botaoSalvar.classList.remove("salvo");
    }, 1400);
  });
});
