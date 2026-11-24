// imagem.js
// Página onde o aluno escolhe a PRÓPRIA imagem de fundo. Fica numa aba (e não
// dentro do popup) porque o seletor de arquivos do sistema costuma fechar o
// popup de extensão do Chrome antes de a imagem chegar.

const MAX_LADO = 1600; // maior lado da imagem, em px (mesmo padrão das fotos dos temas prontos)
const MAX_ARQUIVO_BYTES = 50 * 1024 * 1024;
// GIF não é redimensionado (perderia a animação), então limitamos o peso. O custo real é memória:
// o GIF inteiro é carregado e decodificado em CADA aba da Sala do Futuro. 15 MB é um meio-termo
// seguro; acima disso o Chrome pode ficar pesado em computadores com pouca RAM.
const MAX_GIF_BYTES = 15 * 1024 * 1024;
// O data URL (base64) ocupa ~4/3 do tamanho do arquivo; sem essa folga, GIFs perto do limite
// passavam no primeiro limite e eram barrados aqui com a mensagem errada.
// Essa quantidade só cabe no storage.local por causa da permissão "unlimitedStorage" (manifest.json);
// sem ela a cota é de ~10 MB.
const LIMITE_FINAL_CHARS = Math.ceil(MAX_GIF_BYTES * 4 / 3) + 1024;

const $ = (id) => document.getElementById(id);

let imagemAtual = null;      // data URL da imagem em edição
let coresAuto = null;        // cores calculadas a partir da imagem
let coresExistentes = null;  // cores do tema personalizado já salvo (se houver)
let imagemJaSalva = false;

// ---------- mensagens ----------
function mostrarMensagem(texto, tipo) {
  const el = $("mensagem");
  el.textContent = texto;
  el.className = tipo; // "erro" ou "ok"
}
function limparMensagem() {
  $("mensagem").className = "escondido";
}

// ---------- leitura da imagem ----------
function lerComoDataURL(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error("leitura"));
    leitor.readAsDataURL(arquivo);
  });
}

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagem"));
    img.src = src;
  });
}

// Reduz a imagem (maior lado = MAX_LADO) e converte pra JPEG — fica com algumas
// centenas de KB em vez de vários MB, bem dentro do limite de armazenamento.
function redimensionar(img) {
  const escala = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight));
  const largura = Math.round(img.naturalWidth * escala);
  const altura = Math.round(img.naturalHeight * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000"; // PNG com transparência vira fundo preto, não um buraco
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(img, 0, 0, largura, altura);
  return canvas.toDataURL("image/jpeg", 0.82);
}

// ---------- cores automáticas ----------
function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hslParaHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const cor = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * cor).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Tira a cor média da imagem e monta um tema ESCURO em volta dela: fundo e
// cards bem escuros com o mesmo matiz da foto, texto claro, destaque vivo.
function calcularCores(img) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 24;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, 24, 24);
  const pixels = ctx.getImageData(0, 0, 24, 24).data;

  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; n++;
  }
  if (n === 0) { r = g = b = 40; n = 1; }

  const [h, s] = rgbParaHsl(r / n, g / n, b / n);
  const colorido = s >= 0.12; // foto quase cinza: usa um azul neutro em vez de um matiz aleatório
  const matiz = colorido ? h : 220;
  const satFundo = colorido ? Math.min(Math.max(s, 0.2), 0.45) : 0.06;
  const satDestaque = colorido ? Math.min(Math.max(s * 1.1, 0.5), 0.85) : 0.55;

  return {
    "--sf-bg": hslParaHex(matiz, satFundo, 0.09),
    "--sf-bg-secundario": hslParaHex(matiz, satFundo, 0.16),
    "--sf-texto": "#f2f2f5",
    "--sf-destaque": hslParaHex(matiz, satDestaque, 0.72)
  };
}

// ---------- tela ----------
// ---------- detalhes visuais ----------
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((p) => {
    const c = parseInt(hex.slice(p, p + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function razaoContraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
function formatarBytes(n) {
  return n >= 1048576 ? `${(n / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

const CORES_PREVIA_PADRAO = {
  "--sf-bg": "#1e222a", "--sf-bg-secundario": "#2d3340", "--sf-texto": "#f2f2f5", "--sf-destaque": "#4c8dff"
};

function atualizarPaleta(cores) {
  const mapa = { bg: "--sf-bg", card: "--sf-bg-secundario", texto: "--sf-texto", destaque: "--sf-destaque" };
  Object.entries(mapa).forEach(([nome, variavel]) => {
    $("sw-" + nome).style.background = cores[variavel];
    $("hx-" + nome).textContent = cores[variavel].toUpperCase();
  });
  const razao = razaoContraste(cores["--sf-texto"], cores["--sf-bg-secundario"]);
  const nivel = razao >= 7 ? ["", "Excelente"] : razao >= 4.5 ? ["medio", "Bom"] : ["baixo", "Baixo"];
  $("contraste").className = nivel[0];
  $("contraste-valor").textContent = `${razao.toFixed(1).replace(".", ",")}:1`;
  $("contraste-texto").textContent = `Contraste do texto nos cards: ${nivel[1].toLowerCase()}.`;
}

function atualizarPreview() {
  const tela = $("preview");
  tela.classList.toggle("sem-imagem", !imagemAtual);
  tela.style.backgroundImage = imagemAtual ? `url("${imagemAtual}")` : "";
  $("preview-escuro").style.background = imagemAtual ? `rgba(0, 0, 0, ${Number($("escurecer").value) / 100})` : "transparent";
  $("escurecer").style.setProperty("--pct", `${(Number($("escurecer").value) / 80) * 100}%`);

  const usarAuto = $("combinar-cores").checked || !coresExistentes;
  const cores = (usarAuto ? coresAuto : coresExistentes) || coresAuto || CORES_PREVIA_PADRAO;
  tela.style.setProperty("--pv-bg", cores["--sf-bg"]);
  tela.style.setProperty("--pv-card", cores["--sf-bg-secundario"]);
  tela.style.setProperty("--pv-texto", cores["--sf-texto"]);
  tela.style.setProperty("--pv-destaque", cores["--sf-destaque"]);
  atualizarPaleta(cores);
}

function mostrarInfo(dados) {
  const tem = !!dados;
  $("info-vazio").classList.toggle("escondido", tem);
  $("info-mini").classList.toggle("escondido", !tem);
  $("info-dados").classList.toggle("escondido", !tem);
  if (!tem) return;
  $("info-mini").style.backgroundImage = `url("${imagemAtual}")`;
  $("info-nome").textContent = dados.nome;
  $("info-tipo").textContent = dados.tipo;
  $("info-dim").textContent = dados.dim;
  $("info-peso").textContent = dados.peso;
  $("info-aviso").textContent = dados.aviso;
}

function mostrarAjuste() {
  $("cartao-ajuste").classList.remove("escondido");
  $("remover").classList.toggle("escondido", !imagemJaSalva);
  atualizarPreview();
}

async function processarArquivo(arquivo) {
  limparMensagem();

  if (!arquivo || !arquivo.type.startsWith("image/")) {
    mostrarMensagem("Esse arquivo não parece ser uma imagem. Tente um JPG, PNG, WebP ou GIF.", "erro");
    return;
  }
  if (arquivo.size > MAX_ARQUIVO_BYTES) {
    mostrarMensagem("Essa imagem é muito grande (mais de 50 MB). Tente uma menor.", "erro");
    return;
  }
  const ehGif = arquivo.type === "image/gif";
  if (ehGif && arquivo.size > MAX_GIF_BYTES) {
    mostrarMensagem(`Esse GIF é pesado demais (o limite é ${Math.round(MAX_GIF_BYTES / 1048576)} MB). Tente um GIF menor ou uma imagem normal.`, "erro");
    return;
  }

  try {
    const original = await lerComoDataURL(arquivo);
    const img = await carregarImagem(original);
    const final = ehGif ? original : redimensionar(img);

    if (final.length > LIMITE_FINAL_CHARS) {
      mostrarMensagem("Mesmo reduzida, essa imagem ficou pesada demais. Tente outra.", "erro");
      return;
    }

    imagemAtual = final;
    coresAuto = calcularCores(img);
    const tipo = (arquivo.type.split("/")[1] || "imagem").toUpperCase().replace("JPEG", "JPG");
    mostrarInfo({
      nome: arquivo.name,
      tipo,
      dim: `${img.naturalWidth}×${img.naturalHeight}`,
      peso: ehGif ? formatarBytes(arquivo.size) : `${formatarBytes(arquivo.size)} → ${formatarBytes(final.length * 0.75)}`,
      aviso: ehGif
        ? "GIF mantido como está, pra não perder a animação. Ele usa mais memória que uma foto."
        : "Reduzida pra no máximo 1600 px no lado maior, pra ficar leve e carregar rápido."
    });
    mostrarAjuste();
  } catch (erro) {
    mostrarMensagem("Não consegui abrir essa imagem. Tente outro arquivo.", "erro");
  }
}

function salvar() {
  if (!imagemAtual) return;
  const escurecer = Number($("escurecer").value);
  const usarAuto = $("combinar-cores").checked || !coresExistentes;
  const cores = usarAuto ? coresAuto : coresExistentes;

  chrome.storage.local.set({ temaCustomImagem: imagemAtual, temaCustomEscurecer: escurecer }, () => {
    if (chrome.runtime.lastError) {
      mostrarMensagem("Não consegui salvar a imagem (pode ser pesada demais). Tente uma menor.", "erro");
      return;
    }
    chrome.storage.sync.set({ temaSelecionado: "custom", temaCustom: cores }, () => {
      coresExistentes = cores;
      imagemJaSalva = true;
      $("remover").classList.remove("escondido");
      mostrarMensagem("Pronto! Seu tema já está ativo. Se a Sala do Futuro estiver aberta, ela muda sozinha.", "ok");
    });
  });
}

function remover() {
  chrome.storage.local.remove(["temaCustomImagem", "temaCustomEscurecer"], () => {
    imagemAtual = null;
    imagemJaSalva = false;
    mostrarInfo(null);
    atualizarPreview();
    $("cartao-ajuste").classList.add("escondido");
    mostrarMensagem("Imagem removida. Seu tema continua ativo, só com as cores.", "ok");
  });
}

// ---------- eventos ----------
const zona = $("zona-arquivo");
const campoArquivo = $("arquivo");

zona.addEventListener("click", () => campoArquivo.click());
zona.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); campoArquivo.click(); }
});
$("trocar").addEventListener("click", () => campoArquivo.click());
campoArquivo.addEventListener("change", () => {
  processarArquivo(campoArquivo.files[0]);
  campoArquivo.value = ""; // permite escolher o mesmo arquivo de novo
});

// Soltar o arquivo fora da área não deve fazer o navegador abrir a imagem na aba.
["dragover", "drop"].forEach((nome) => document.addEventListener(nome, (e) => e.preventDefault()));
zona.addEventListener("dragover", () => zona.classList.add("arrastando"));
zona.addEventListener("dragleave", () => zona.classList.remove("arrastando"));
zona.addEventListener("drop", (e) => {
  zona.classList.remove("arrastando");
  processarArquivo(e.dataTransfer.files[0]);
});

$("escurecer").addEventListener("input", () => {
  $("valor-escurecer").textContent = `${$("escurecer").value}%`;
  atualizarPreview();
});
$("combinar-cores").addEventListener("change", atualizarPreview);
$("salvar").addEventListener("click", salvar);
$("remover").addEventListener("click", remover);

// ---------- ao abrir: mostra o que já está salvo ----------
chrome.storage.sync.get(["temaCustom"], ({ temaCustom }) => {
  coresExistentes = temaCustom && temaCustom["--sf-bg"] ? temaCustom : null;
  // Já tem cores criadas pelo aluno? Não sobrescreve sem ele querer.
  $("combinar-cores").checked = !coresExistentes;

  chrome.storage.local.get(["temaCustomImagem", "temaCustomEscurecer"], async (local) => {
    if (!local.temaCustomImagem) return;
    imagemAtual = local.temaCustomImagem;
    imagemJaSalva = true;
    const escurecer = Number.isFinite(local.temaCustomEscurecer) ? local.temaCustomEscurecer : 45;
    $("escurecer").value = escurecer;
    $("valor-escurecer").textContent = `${escurecer}%`;
    try {
      const img = await carregarImagem(imagemAtual);
      coresAuto = calcularCores(img);
      const tipo = (imagemAtual.match(/^data:image\/([a-z0-9.+-]+)/i) || [])[1] || "imagem";
      mostrarInfo({
        nome: "Imagem salva no seu tema",
        tipo: tipo.toUpperCase().replace("JPEG", "JPG"),
        dim: `${img.naturalWidth}×${img.naturalHeight}`,
        peso: formatarBytes(imagemAtual.length * 0.75),
        aviso: "Essa é a imagem que está ativa agora. Escolha outra pra trocar."
      });
    } catch (erro) { /* sem cores automáticas, só usa as existentes */ }
    mostrarAjuste();
  });
});

// Limites exibidos vêm das mesmas constantes que o código usa de verdade.
$("limite-gif").textContent = Math.round(MAX_GIF_BYTES / 1048576);
$("limite-img").textContent = Math.round(MAX_ARQUIVO_BYTES / 1048576);
atualizarPreview();
