const API_URL = "/api/usuarios";
const IDADE_MAXIMA = 120; // mesmo limite do UsuarioRequest no back-end

// ===================== Elementos da página =====================
const formulario = document.getElementById("form-usuario");
const campoId = document.getElementById("usuario-id");
const campoNome = document.getElementById("nome");
const campoIdade = document.getElementById("idade");
const erroNome = document.getElementById("erro-nome");
const erroIdade = document.getElementById("erro-idade");

const tituloFormulario = document.getElementById("titulo-formulario");
const etiquetaEdicao = document.getElementById("etiqueta-edicao");
const botaoSalvar = document.getElementById("botao-salvar");
const botaoCancelar = document.getElementById("botao-cancelar");
const botaoAtualizar = document.getElementById("botao-atualizar");

const campoBusca = document.getElementById("busca");
const corpoTabela = document.getElementById("tabela-usuarios");
const cabecalhosOrdenaveis = document.querySelectorAll("th[data-campo]");
const listaVazia = document.getElementById("lista-vazia");
const listaVaziaTexto = document.getElementById("lista-vazia-texto");
const quantidadeUsuarios = document.getElementById("quantidade-usuarios");

const statusApi = document.getElementById("status-api");
const statusTexto = document.getElementById("status-texto");

const resumoTotal = document.getElementById("resumo-total");
const resumoMedia = document.getElementById("resumo-media");
const resumoMin = document.getElementById("resumo-min");
const resumoMax = document.getElementById("resumo-max");

const areaImportacao = document.getElementById("area-importacao");
const arquivoUsuarios = document.getElementById("arquivo-usuarios");
const resultadoImportacao = document.getElementById("resultado-importacao");
const botaoBaixarExemplo = document.getElementById("baixar-exemplo");

const dialogoExcluir = document.getElementById("dialogo-excluir");
const dialogoTexto = document.getElementById("dialogo-texto");
const avisos = document.getElementById("avisos");

// ===================== Estado =====================
let usuarios = [];
let idEmEdicao = null;
let ordenacao = { campo: "id", direcao: "asc" };

// ===================== Eventos =====================
document.addEventListener("DOMContentLoaded", listarUsuarios);

formulario.addEventListener("submit", salvarUsuario);
botaoCancelar.addEventListener("click", limparFormulario);
botaoAtualizar.addEventListener("click", listarUsuarios);
campoBusca.addEventListener("input", renderizarTabela);

campoNome.addEventListener("input", () => limparErroCampo(campoNome, erroNome));
campoIdade.addEventListener("input", () => limparErroCampo(campoIdade, erroIdade));

// Esc cancela a edição
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && idEmEdicao !== null && !dialogoExcluir.open) {
        limparFormulario();
    }
});

// Ordenação ao clicar no cabeçalho da coluna
cabecalhosOrdenaveis.forEach((th) => {
    th.querySelector("button").addEventListener("click", () => {
        const campo = th.dataset.campo;
        const mesmaColuna = ordenacao.campo === campo;
        ordenacao = {
            campo,
            direcao: mesmaColuna && ordenacao.direcao === "asc" ? "desc" : "asc"
        };
        renderizarTabela();
    });
});

// Importação: clique, teclado e arrastar e soltar
areaImportacao.addEventListener("click", () => arquivoUsuarios.click());
areaImportacao.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        arquivoUsuarios.click();
    }
});
areaImportacao.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    areaImportacao.classList.add("arrastando");
});
areaImportacao.addEventListener("dragleave", () => areaImportacao.classList.remove("arrastando"));
areaImportacao.addEventListener("drop", (evento) => {
    evento.preventDefault();
    areaImportacao.classList.remove("arrastando");
    const arquivo = evento.dataTransfer.files[0];
    if (arquivo) {
        importarArquivo(arquivo);
    }
});
arquivoUsuarios.addEventListener("change", () => {
    const arquivo = arquivoUsuarios.files[0];
    if (arquivo) {
        importarArquivo(arquivo);
    }
});
botaoBaixarExemplo.addEventListener("click", baixarExemplo);

// ===================== Listagem =====================
async function listarUsuarios() {
    mostrarCarregando();

    try {
        const resposta = await fetch(API_URL);

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os usuários.");
        }

        usuarios = await resposta.json();
        definirStatusApi("online", "API online");
        renderizarTabela();
    } catch (erro) {
        usuarios = [];
        definirStatusApi("offline", "API fora do ar");
        corpoTabela.innerHTML = "";
        quantidadeUsuarios.textContent = "Não foi possível carregar os usuários.";
        listaVaziaTexto.textContent = "Verifique se a aplicação Spring Boot está rodando e tente atualizar.";
        listaVazia.classList.remove("oculto");
        atualizarResumo();
        mostrarAviso("Não foi possível conectar à API.", "erro");
    }
}

function mostrarCarregando() {
    listaVazia.classList.add("oculto");
    corpoTabela.innerHTML = "";

    for (let i = 0; i < 3; i++) {
        const linha = document.createElement("tr");
        linha.className = "linha-carregando";
        for (let j = 0; j < 4; j++) {
            const celula = document.createElement("td");
            const barra = document.createElement("span");
            barra.className = "esqueleto";
            celula.appendChild(barra);
            linha.appendChild(celula);
        }
        corpoTabela.appendChild(linha);
    }
}

function definirStatusApi(estado, texto) {
    statusApi.dataset.estado = estado;
    statusTexto.textContent = texto;
}

// Aplica a busca e a ordenação sobre a lista que veio da API
function usuariosVisiveis() {
    const termo = normalizar(campoBusca.value.trim());
    const filtrados = termo
        ? usuarios.filter((usuario) => normalizar(usuario.nome).includes(termo))
        : [...usuarios];

    const { campo, direcao } = ordenacao;
    const fator = direcao === "asc" ? 1 : -1;

    return filtrados.sort((a, b) => {
        if (campo === "nome") {
            return a.nome.localeCompare(b.nome, "pt-BR") * fator;
        }
        return (a[campo] - b[campo]) * fator;
    });
}

// Remove acentos e deixa minúsculo, para "jose" encontrar "José"
function normalizar(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function renderizarTabela() {
    const lista = usuariosVisiveis();
    corpoTabela.innerHTML = "";

    atualizarResumo();
    atualizarSetasOrdenacao();

    const total = usuarios.length;
    quantidadeUsuarios.textContent = lista.length === total
        ? `${total} usuário(s) cadastrado(s)`
        : `Mostrando ${lista.length} de ${total} usuário(s)`;

    if (lista.length === 0) {
        listaVaziaTexto.textContent = total === 0
            ? "Nenhum usuário cadastrado ainda. Use o formulário ou importe um arquivo."
            : `Nenhum usuário encontrado para "${campoBusca.value.trim()}".`;
        listaVazia.classList.remove("oculto");
        return;
    }

    listaVazia.classList.add("oculto");
    lista.forEach((usuario) => corpoTabela.appendChild(criarLinha(usuario)));
}

function criarLinha(usuario) {
    const linha = document.createElement("tr");
    if (usuario.id === idEmEdicao) {
        linha.classList.add("em-edicao");
    }

    const celulaId = criarCelula(usuario.id);
    celulaId.classList.add("coluna-id");
    linha.appendChild(celulaId);

    // Nome com avatar das iniciais
    const celulaNome = document.createElement("td");
    const nome = document.createElement("span");
    nome.className = "nome-usuario";
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = iniciais(usuario.nome);
    nome.append(avatar, document.createTextNode(usuario.nome));
    celulaNome.appendChild(nome);
    linha.appendChild(celulaNome);

    linha.appendChild(criarCelula(`${usuario.idade} anos`));

    const celulaAcoes = document.createElement("td");
    celulaAcoes.classList.add("coluna-acoes");
    celulaAcoes.append(
        criarBotaoIcone("editar", `Editar ${usuario.nome}`, () => iniciarEdicao(usuario)),
        criarBotaoIcone("excluir", `Excluir ${usuario.nome}`, () => excluirUsuario(usuario))
    );
    linha.appendChild(celulaAcoes);

    return linha;
}

function criarCelula(valor) {
    const celula = document.createElement("td");
    celula.textContent = valor;
    return celula;
}

const ICONES = {
    editar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    excluir: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
};

function criarBotaoIcone(tipo, rotulo, aoClicar) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `botao-icone ${tipo}`;
    botao.title = rotulo;
    botao.setAttribute("aria-label", rotulo);
    botao.innerHTML = ICONES[tipo]; // SVG fixo do próprio código, sem dados do usuário
    botao.addEventListener("click", aoClicar);
    return botao;
}

function iniciais(nome) {
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] ?? "";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (primeira + ultima).toUpperCase();
}

function atualizarSetasOrdenacao() {
    cabecalhosOrdenaveis.forEach((th) => {
        const ativo = th.dataset.campo === ordenacao.campo;
        th.setAttribute("aria-sort", ativo ? (ordenacao.direcao === "asc" ? "ascending" : "descending") : "none");
    });
}

function atualizarResumo() {
    if (usuarios.length === 0) {
        resumoTotal.textContent = usuarios.length;
        resumoMedia.textContent = "–";
        resumoMin.textContent = "–";
        resumoMax.textContent = "–";
        return;
    }

    const idades = usuarios.map((usuario) => usuario.idade);
    const media = idades.reduce((soma, idade) => soma + idade, 0) / idades.length;

    resumoTotal.textContent = usuarios.length;
    resumoMedia.textContent = `${media.toFixed(1).replace(".", ",")} anos`;
    resumoMin.textContent = `${Math.min(...idades)} anos`;
    resumoMax.textContent = `${Math.max(...idades)} anos`;
}

// ===================== Cadastro e edição =====================
async function salvarUsuario(evento) {
    evento.preventDefault();

    const usuario = {
        nome: campoNome.value.trim(),
        idade: campoIdade.value === "" ? null : Number(campoIdade.value)
    };

    if (!validarUsuario(usuario)) {
        return;
    }

    const editando = idEmEdicao !== null;
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = editando ? "Salvando..." : "Cadastrando...";

    try {
        const resposta = await fetch(editando ? `${API_URL}/${idEmEdicao}` : API_URL, {
            method: editando ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
        });

        if (resposta.status === 404) {
            throw new Error("Usuário não encontrado. Ele pode ter sido excluído.");
        }

        if (resposta.status === 400) {
            const corpo = await lerJson(resposta);
            if (corpo?.erros) {
                mostrarErrosDaApi(corpo.erros);
                return;
            }
            throw new Error(corpo?.mensagem ?? "Dados inválidos.");
        }

        if (!resposta.ok) {
            throw new Error(editando
                ? "Não foi possível atualizar o usuário."
                : "Não foi possível cadastrar o usuário.");
        }

        mostrarAviso(editando
            ? `Usuário "${usuario.nome}" atualizado.`
            : `Usuário "${usuario.nome}" cadastrado.`);

        limparFormulario();
        await listarUsuarios();
    } catch (erro) {
        mostrarAviso(erro.message, "erro");
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = idEmEdicao !== null ? "Salvar" : "Cadastrar";
    }
}

function validarUsuario(usuario) {
    let valido = true;

    if (usuario.nome.length < 3 || usuario.nome.length > 100) {
        marcarErroCampo(campoNome, erroNome, "O nome deve ter entre 3 e 100 caracteres.");
        valido = false;
    }

    if (usuario.idade === null || !Number.isInteger(usuario.idade)
        || usuario.idade < 0 || usuario.idade > IDADE_MAXIMA) {
        marcarErroCampo(campoIdade, erroIdade, `Informe uma idade inteira entre 0 e ${IDADE_MAXIMA}.`);
        valido = false;
    }

    if (!valido) {
        formulario.querySelector('[aria-invalid="true"]').focus();
    }

    return valido;
}

// Mostra embaixo de cada campo a mensagem que veio do GlobalExceptionHandler
function mostrarErrosDaApi(erros) {
    if (erros.nome) marcarErroCampo(campoNome, erroNome, erros.nome);
    if (erros.idade) marcarErroCampo(campoIdade, erroIdade, erros.idade);
}

function marcarErroCampo(campo, elementoErro, texto) {
    campo.setAttribute("aria-invalid", "true");
    elementoErro.textContent = texto;
}

function limparErroCampo(campo, elementoErro) {
    campo.removeAttribute("aria-invalid");
    elementoErro.textContent = "";
}

function iniciarEdicao(usuario) {
    idEmEdicao = usuario.id;

    campoId.value = usuario.id;
    campoNome.value = usuario.nome;
    campoIdade.value = usuario.idade;
    limparErroCampo(campoNome, erroNome);
    limparErroCampo(campoIdade, erroIdade);

    tituloFormulario.textContent = `Editar usuário #${usuario.id}`;
    etiquetaEdicao.classList.remove("oculto");
    botaoSalvar.textContent = "Salvar";
    botaoCancelar.classList.remove("oculto");

    renderizarTabela(); // destaca a linha em edição
    formulario.scrollIntoView({ behavior: "smooth", block: "center" });
    campoNome.focus({ preventScroll: true });
}

function limparFormulario() {
    formulario.reset();

    idEmEdicao = null;
    campoId.value = "";
    limparErroCampo(campoNome, erroNome);
    limparErroCampo(campoIdade, erroIdade);

    tituloFormulario.textContent = "Cadastrar usuário";
    etiquetaEdicao.classList.add("oculto");
    botaoSalvar.textContent = "Cadastrar";
    botaoCancelar.classList.add("oculto");

    renderizarTabela();
}

// ===================== Exclusão =====================
function confirmarExclusao(nome) {
    return new Promise((resolver) => {
        dialogoTexto.textContent = `O usuário "${nome}" será removido permanentemente.`;
        dialogoExcluir.returnValue = "";
        dialogoExcluir.addEventListener(
            "close",
            () => resolver(dialogoExcluir.returnValue === "confirmar"),
            { once: true }
        );
        dialogoExcluir.showModal();
    });
}

async function excluirUsuario(usuario) {
    const confirmou = await confirmarExclusao(usuario.nome);

    if (!confirmou) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/${usuario.id}`, { method: "DELETE" });

        if (resposta.status === 404) {
            throw new Error("Usuário não encontrado. Ele já pode ter sido excluído.");
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível excluir o usuário.");
        }

        if (idEmEdicao === usuario.id) {
            limparFormulario();
        }

        mostrarAviso(`Usuário "${usuario.nome}" excluído.`);
        await listarUsuarios();
    } catch (erro) {
        mostrarAviso(erro.message, "erro");
    }
}

// ===================== Importação de arquivo =====================
async function importarArquivo(arquivo) {
    const nome = arquivo.name.toLowerCase();

    if (!nome.endsWith(".txt") && !nome.endsWith(".csv")) {
        mostrarResultadoImportacao("Selecione um arquivo .txt ou .csv.", "erro");
        arquivoUsuarios.value = "";
        return;
    }

    const dados = new FormData();
    dados.append("arquivo", arquivo);

    areaImportacao.classList.add("enviando");
    mostrarResultadoImportacao(`Importando "${arquivo.name}"...`, "");

    try {
        const resposta = await fetch(`${API_URL}/importar`, {
            method: "POST",
            body: dados
        });

        const texto = await resposta.text();

        if (!resposta.ok) {
            throw new Error(texto || "Não foi possível importar o arquivo.");
        }

        mostrarResultadoImportacao(texto, "sucesso");
        await listarUsuarios();
    } catch (erro) {
        mostrarResultadoImportacao(erro.message, "erro");
    } finally {
        areaImportacao.classList.remove("enviando");
        arquivoUsuarios.value = "";
    }
}

function mostrarResultadoImportacao(texto, tipo) {
    resultadoImportacao.textContent = texto;
    resultadoImportacao.className = `resultado-importacao ${tipo}`;
}

// Gera um CSV de exemplo no próprio navegador
function baixarExemplo() {
    const conteudo = "Ana Lima;20\nBruno Costa;35\nCarla Souza;28\n";
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "usuarios-exemplo.csv";
    link.click();
    URL.revokeObjectURL(link.href);
}

// ===================== Utilitários =====================
async function lerJson(resposta) {
    try {
        return await resposta.json();
    } catch {
        return null;
    }
}

function mostrarAviso(texto, tipo = "sucesso") {
    const aviso = document.createElement("div");
    aviso.className = `aviso ${tipo}`;
    aviso.setAttribute("role", tipo === "erro" ? "alert" : "status");
    aviso.textContent = texto;
    avisos.appendChild(aviso);

    setTimeout(() => {
        aviso.classList.add("saindo");
        setTimeout(() => aviso.remove(), 300);
    }, 4000);
}
