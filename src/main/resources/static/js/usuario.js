const API_URL = "/api/usuarios";

const formulario = document.getElementById("form-usuario");
const campoId = document.getElementById("usuario-id");
const campoNome = document.getElementById("nome");
const campoIdade = document.getElementById("idade");

const tituloFormulario = document.getElementById("titulo-formulario");
const botaoSalvar = document.getElementById("botao-salvar");
const botaoCancelar = document.getElementById("botao-cancelar");
const botaoAtualizar = document.getElementById("botao-atualizar");

const corpoTabela = document.getElementById("tabela-usuarios");
const listaVazia = document.getElementById("lista-vazia");
const quantidadeUsuarios = document.getElementById("quantidade-usuarios");
const mensagem = document.getElementById("mensagem");

const cardImportacao = document.getElementById("cardImportacao");
const arquivoUsuarios = document.getElementById("arquivoUsuarios");
const mensagemImportacao = document.getElementById("mensagemImportacao");

let usuarios = [];
let idEmEdicao = null;

document.addEventListener("DOMContentLoaded", listarUsuarios);

formulario.addEventListener("submit", salvarUsuario);
botaoCancelar.addEventListener("click", cancelarEdicao);
botaoAtualizar.addEventListener("click", listarUsuarios);

// Importação: o card abre o seletor de arquivo (listeners registrados uma única vez)
cardImportacao.addEventListener("click", () => arquivoUsuarios.click());
cardImportacao.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        arquivoUsuarios.click();
    }
});
arquivoUsuarios.addEventListener("change", importarArquivo);

async function importarArquivo() {
    const arquivo = arquivoUsuarios.files[0];

    if (!arquivo) {
        return;
    }

    const dados = new FormData();
    dados.append("arquivo", arquivo);

    mensagemImportacao.textContent = "Importando usuários...";

    try {
        const resposta = await fetch(`${API_URL}/importar`, {
            method: "POST",
            body: dados
        });

        const texto = await resposta.text();

        if (!resposta.ok) {
            throw new Error(texto);
        }

        mensagemImportacao.textContent = texto;

        await listarUsuarios();
    } catch (erro) {
        mensagemImportacao.textContent = erro.message;
    } finally {
        arquivoUsuarios.value = "";
    }
}

// Lê a mensagem de erro que a API devolve em JSON (GlobalExceptionHandler)
async function lerErro(resposta, mensagemPadrao) {
    try {
        const corpo = await resposta.json();
        if (corpo.erros) {
            return Object.values(corpo.erros).join(" ");
        }
        return corpo.mensagem || mensagemPadrao;
    } catch {
        return mensagemPadrao;
    }
}

async function listarUsuarios() {
    try {
        const resposta = await fetch(API_URL);

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os usuários.");
        }

        usuarios = await resposta.json();

        renderizarTabela();
    } catch (erro) {
        exibirMensagem(erro.message, "erro");
        quantidadeUsuarios.textContent = "Não foi possível carregar os usuários.";
    }
}

function renderizarTabela() {
    corpoTabela.innerHTML = "";

    quantidadeUsuarios.textContent =
        `${usuarios.length} usuário(s) cadastrado(s)`;

    if (usuarios.length === 0) {
        listaVazia.classList.remove("oculto");
        return;
    }

    listaVazia.classList.add("oculto");

    usuarios.forEach(usuario => {
        const linha = document.createElement("tr");

        linha.appendChild(criarCelula(usuario.id));
        linha.appendChild(criarCelula(usuario.nome));
        linha.appendChild(criarCelula(usuario.idade));

        const celulaAcoes = document.createElement("td");

        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.classList.add("botao-editar");
        botaoEditar.addEventListener("click", () => iniciarEdicao(usuario));

        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.classList.add("botao-excluir");
        botaoExcluir.addEventListener(
            "click",
            () => excluirUsuario(usuario.id, usuario.nome)
        );
        celulaAcoes.appendChild(botaoEditar);
        celulaAcoes.appendChild(botaoExcluir);
        linha.appendChild(celulaAcoes);

        corpoTabela.appendChild(linha);
    });
}

function criarCelula(valor) {
    const celula = document.createElement("td");
    celula.textContent = valor;
    return celula;
}

async function salvarUsuario(evento) {
    evento.preventDefault();

    const usuario = {
        nome: campoNome.value.trim(),
        idade: Number(campoIdade.value)
    };

    if (!validarUsuario(usuario)) {
        return;
    }

    try {
        if (idEmEdicao === null) {
            await cadastrarUsuario(usuario);
        } else {
            await atualizarUsuario(idEmEdicao, usuario);
        }

        limparFormulario();
        await listarUsuarios();
    } catch (erro) {
        exibirMensagem(erro.message, "erro");
    }
}

function validarUsuario(usuario) {
    if (usuario.nome.length < 3) {
        exibirMensagem(
            "O nome deve possuir pelo menos três caracteres.",
            "erro"
        );
        return false;
    }

    if (
        !Number.isInteger(usuario.idade) ||
        usuario.idade < 0 ||
        usuario.idade > 120
    ) {
        exibirMensagem(
            "Informe uma idade inteira entre 0 e 120 anos.",
            "erro"
        );
        return false;
    }

    return true;
}

async function cadastrarUsuario(usuario) {
    const resposta = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(usuario)
    });

    if (!resposta.ok) {
        throw new Error(await lerErro(resposta, "Não foi possível cadastrar o usuário."));
    }

    exibirMensagem("Usuário cadastrado com sucesso.", "sucesso");
}

async function atualizarUsuario(id, usuario) {
    const resposta = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(usuario)
    });

    if (resposta.status === 404) {
        throw new Error("Usuário não encontrado.");
    }

    if (!resposta.ok) {
        throw new Error(await lerErro(resposta, "Não foi possível atualizar o usuário."));
    }

    exibirMensagem("Usuário atualizado com sucesso.", "sucesso");
}

function iniciarEdicao(usuario) {
    idEmEdicao = usuario.id;

    campoId.value = usuario.id;
    campoNome.value = usuario.nome;
    campoIdade.value = usuario.idade;

    tituloFormulario.textContent = `Editar usuário ${usuario.id}`;
    botaoSalvar.textContent = "Salvar alterações";
    botaoCancelar.classList.remove("oculto");

    campoNome.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function cancelarEdicao() {
    limparFormulario();
    ocultarMensagem();
}

function limparFormulario() {
    formulario.reset();

    idEmEdicao = null;
    campoId.value = "";

    tituloFormulario.textContent = "Cadastrar usuário";
    botaoSalvar.textContent = "Cadastrar";
    botaoCancelar.classList.add("oculto");
}

async function excluirUsuario(id, nome) {
    const confirmou = window.confirm(
        `Deseja realmente excluir o usuário "${nome}"?`
    );

    if (!confirmou) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (resposta.status === 404) {
            throw new Error("Usuário não encontrado.");
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível excluir o usuário.");
        }

        if (idEmEdicao === id) {
            limparFormulario();
        }

        exibirMensagem("Usuário excluído com sucesso.", "sucesso");

        await listarUsuarios();
    } catch (erro) {
        exibirMensagem(erro.message, "erro");
    }
}

function exibirMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem";

    if (tipo === "sucesso") {
        mensagem.classList.add("mensagem-sucesso");
    } else {
        mensagem.classList.add("mensagem-erro");
    }
}

function ocultarMensagem() {
    mensagem.textContent = "";
    mensagem.className = "mensagem oculto";
}