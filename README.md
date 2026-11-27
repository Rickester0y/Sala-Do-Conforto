[README.md](https://github.com/user-attachments/files/35516498/README.md)
# Sala Confortável

Extensão para navegador que deixa a **Sala do Futuro** do jeito que você prefere: temas escuros, cores sólidas, fotos de fundo e até uma imagem ou GIF seu.

Feita por um aluno do 3º ano do Ensino Médio Técnico em Desenvolvimento de Sistemas, como Trabalho de Conclusão de Curso, para outros alunos.

![Sala do Futuro com o tema Dolomitas](docs/screenshots/tema-dolomitas.png)

## Descrição

**Sala Confortável** é uma extensão de navegador, no padrão Manifest V3, que muda a aparência da Sala do Futuro, o portal que os alunos da rede estadual de São Paulo usam todos os dias para ver tarefas, notas, frequência, redações e mensagens. A extensão altera só o visual: nenhuma função do portal é modificada e nenhum dado é lido ou enviado.

Com ela, o aluno pode:

- escolher entre **22 temas prontos**, divididos em modos (como o Modo Escuro e o Alto Contraste), cores sólidas e fotos de fundo;
- **criar o próprio tema**, definindo as cores de fundo, cards, texto e destaque;
- usar **uma imagem ou GIF seu como fundo**, com prévia ao vivo, ajuste de escurecimento e cores do tema calculadas automaticamente a partir da imagem;
- **conferir o contraste** do texto antes de salvar, para saber se a leitura vai ficar confortável;
- **voltar ao visual original** a qualquer momento, com um clique.

Tudo acontece no navegador de quem instala. A extensão não usa servidor, não faz requisições de rede e não coleta informações, e a imagem escolhida fica guardada só no próprio computador. Os temas se aplicam na hora, sem recarregar a página, e a escolha fica salva entre uma sessão e outra.

O projeto nasceu como Trabalho de Conclusão de Curso do Ensino Médio Técnico em Desenvolvimento de Sistemas. O desafio técnico central foi fazer o tema funcionar num site que não foi feito para isso: o portal usa classes CSS geradas automaticamente, que mudam e não dá para prever. Por isso, além das regras de estilo fixas, a extensão analisa o estilo de cada elemento da página e corrige, por luminância, o que ficaria ilegível, preservando cores que o próprio site usa com significado, como os indicadores de presença.

A versão atual é a **1.0.0**, testada no Google Chrome.

## Por que existe

A Sala do Futuro é usada todos os dias pelos alunos da rede estadual de São Paulo, mas tem um layout fixo, quase todo branco, sem nenhuma opção de personalização. Em sessões longas, ou à noite, isso cansa. Como o portal é mantido pelo governo, um aluno não consegue pedir mudanças nele. Por isso a solução foi uma extensão: ela muda a aparência **apenas no seu navegador**, sem tocar no servidor e sem alterar nenhuma função do portal.

| Sem a extensão | Com o Modo Escuro |
|---|---|
| ![Sala do Futuro original](docs/screenshots/sem-tema.png) | ![Sala do Futuro em Modo Escuro](docs/screenshots/tema-preto.png) |

## O que ela faz

- **22 temas prontos**, em três categorias: 4 modos, 8 cores sólidas e 10 fotos.
- **Tema próprio:** você escolhe as cores de fundo, cards, texto e destaque.
- **Imagem própria:** use uma foto ou GIF seu como fundo, com prévia ao vivo, ajuste de escurecimento e cores calculadas automaticamente a partir da imagem.
- **Contraste conferido:** a página de imagem mostra se o texto ficará confortável de ler.
- **Aplica na hora**, sem recarregar a página, e lembra da sua escolha.
- **Voltar ao normal** é um clique: escolha o tema Padrão.
- **Créditos das fotos** exibidos na própria página, quando você escolhe um tema de foto.

| Temas prontos | Tema personalizado | Sua imagem |
|---|---|---|
| ![Popup com a categoria Fotos](docs/screenshots/popup-fotos.png) | ![Popup com o criador de tema](docs/screenshots/popup-custom.png) | ![Página para escolher a imagem](docs/screenshots/aba-imagem.png) |

## Instalação

A extensão ainda não está na Chrome Web Store, então ela é instalada pelo modo desenvolvedor. Leva menos de um minuto.

1. Baixe o arquivo `.zip` da [página de Releases](../../releases) e extraia numa pasta (ou clone este repositório).
2. No navegador, abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta que contém o arquivo `manifest.json`.
5. Fixe a extensão na barra do navegador (ícone de quebra-cabeça).
6. Abra a Sala do Futuro e clique no ícone da extensão.

O Chrome pode mostrar um aviso sobre extensões do modo desenvolvedor. É normal para extensões instaladas assim.

**Navegadores:** testada no Google Chrome. Em princípio funciona em navegadores baseados em Chromium, como Brave e Edge. O Firefox não foi testado.

## Como usar

**Escolher um tema:** clique no ícone, abra uma das gavetas (Modos, Cores Sólidas ou Fotos) e clique no tema.

**Criar o seu tema:** abra *Criar meu próprio tema*, escolha as quatro cores e clique em *Usar meu tema*.

**Usar uma imagem sua:**
1. Em *Criar meu próprio tema*, clique em *Adicionar minha imagem*. Uma aba nova se abre.
2. Escolha ou arraste uma imagem (JPG, PNG, WebP ou GIF).
3. Ajuste o escurecimento e confira a prévia e o contraste.
4. Clique em *Usar como meu tema*.

**Limites:** fotos de até 50 MB (são reduzidas para no máximo 1600 px e viram JPEG leve); GIFs de até 15 MB (mantidos como estão, para preservar a animação).

**Dicas:** prefira imagens na horizontal; um escurecimento entre 40% e 60% costuma deixar o texto confortável; GIFs usam mais memória, então prefira os curtos.

## Temas

| Categoria | Temas |
|---|---|
| Modos | Padrão (sem alterações), Modo Escuro, Tons Pastel, Alto Contraste |
| Cores sólidas | Floresta Calma, Azul Meia-Noite, Vinho Tinto, Verde Musgo, Grafite, Mostarda, Ametista, Terracota |
| Fotos | Dolomitas, Céu Estrelado, Inverno Cinza, Chuva Dourada, Sakura, Fundo do Mar, Rosas Vermelhas, Brasas, Campo de Flores, Expresso Paulista |

![Tema Alto Contraste](docs/screenshots/tema-contraste.png)

## Como funciona

A extensão usa o padrão **Manifest V3** e é feita só com JavaScript, HTML e CSS, sem bibliotecas externas.

1. O **popup** grava o tema escolhido no armazenamento do navegador.
2. O **content script**, que roda dentro da Sala do Futuro, percebe a mudança e injeta o CSS do tema.
3. Como o portal usa classes CSS dinâmicas (geradas automaticamente e imprevisíveis), uma **correção em JavaScript** analisa o estilo de cada elemento e adapta, por luminância, o que ficaria ilegível. Cores com significado, como os indicadores de presença, são preservadas.
4. Um **MutationObserver** acompanha o conteúdo que o site carrega depois, e as correções rodam numa única varredura da página.
5. Uma **tela de carregamento** com a cor do tema evita o clarão branco antes de o tema aparecer.

Os detalhes completos (arquitetura, funções, decisões e histórico de problemas) estão na documentação técnica que acompanha o projeto.

### Estrutura

| Arquivo | Função |
|---|---|
| `manifest.json` | Declaração da extensão, permissões e scripts |
| `themes.js` | Catálogo dos 22 temas, funções de cor e gerador de CSS |
| `content.js` | Aplica o tema e corrige elementos dentro da Sala do Futuro |
| `popup.html` / `popup.js` | Janela da extensão: temas, criador de tema e atalho para a imagem |
| `imagem.html` / `imagem.js` | Página de imagem própria: prévia, cores automáticas e contraste |
| `icons/` | Ícones da extensão |
| `images/` | Fotos dos temas e fundo do popup |

![Página de imagem própria com a imagem aplicada](docs/screenshots/tema-imagem.png)

## Privacidade e permissões

- Pede só **`storage`** (guardar suas escolhas) e **`unlimitedStorage`** (guardar GIFs maiores que a cota padrão).
- Atua **somente** em `saladofuturo.educacao.sp.gov.br`.
- **Não faz requisições de rede**, não usa servidor e **não coleta nenhum dado**. Não lê notas, mensagens, nomes nem conteúdo do portal; lê apenas o estilo visual dos elementos para decidir como corrigi-los.
- Sua imagem fica **só no seu navegador**. As cores do tema podem ser sincronizadas pela conta do Chrome, se a sincronização estiver ligada.

## Limitações conhecidas

- Depende da estrutura atual do portal: se a Sala do Futuro mudar seus componentes, algumas correções podem precisar de ajuste.
- Os testes são manuais; não há testes automatizados.
- GIFs grandes usam bastante memória, porque o arquivo inteiro é carregado em cada aba do portal.
- A prévia da página de imagem é aproximada, não uma cópia do site.
- A instalação ainda é manual (modo desenvolvedor).

## Ideias futuras

- Publicar na Chrome Web Store.
- Versão para Firefox.
- Salvar vários temas próprios e exportar/importar temas.
- Trocar o tema automaticamente por horário (claro de dia, escuro à noite).
- Testes automatizados de contraste.

## Créditos

As fotos dos temas são do [Pexels](https://www.pexels.com/pt-br/license/). A licença permite uso gratuito; a atribuição não é obrigatória, mas foi adotada por respeito aos fotógrafos, e cada crédito aparece dentro da extensão.

| Tema | Autor |
|---|---|
| Dolomitas | Marek Piwnicki |
| Céu Estrelado | Nicolas Outin |
| Inverno Cinza | Stanislav Kondratiev |
| Chuva Dourada | Madison Inouye |
| Sakura | Alex Brites |
| Fundo do Mar | Javier Balseiro |
| Rosas Vermelhas | Kaboompics.com |
| Brasas | Alexander Zvir |
| Campo de Flores | Mallesh Baithi |
| Expresso Paulista | JR Satilite |

## Aviso

Este é um projeto independente e **não tem vínculo oficial** com a Secretaria da Educação do Estado de São Paulo. A Sala do Futuro e sua identidade pertencem à instituição; a extensão apenas altera como o portal é exibido no navegador de quem a instala, sem modificar suas funções.

## Licença

<!-- Escolha uma licença para o código (por exemplo, MIT) e adicione o arquivo LICENSE na raiz. -->

O código foi desenvolvido para fins educacionais. As fotos dos temas pertencem aos seus autores, conforme os créditos acima.
