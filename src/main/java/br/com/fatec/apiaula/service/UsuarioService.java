package br.com.fatec.apiaula.service;

import br.com.fatec.apiaula.dto.UsuarioRequest;
import br.com.fatec.apiaula.model.Usuario;
import br.com.fatec.apiaula.repository.UsuarioRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    // Mesmo limite usado no UsuarioRequest e no formulário do front
    static final int IDADE_MAXIMA = 120;

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Listar todos os usuários ordenados por ID
    public List<Usuario> listar() {
        return usuarioRepository.findAll(Sort.by("id").ascending());
    }

    public Optional<Usuario> buscarPorId(Integer id) {
        return usuarioRepository.findById(id);
    }

    public Usuario salvar(UsuarioRequest dados) {
        Usuario usuario = new Usuario(dados.nome().trim(), dados.idade());
        return usuarioRepository.save(usuario);
    }

    // Retorna false quando o usuário não existe, para o controller responder 404
    public boolean deletar(Integer id) {
        if (!usuarioRepository.existsById(id)) {
            return false;
        }
        usuarioRepository.deleteById(id);
        return true;
    }

    public Optional<Usuario> atualizar(Integer id, UsuarioRequest dados) {
        return usuarioRepository.findById(id).map(usuarioExistente -> {
            usuarioExistente.setNome(dados.nome().trim());
            usuarioExistente.setIdade(dados.idade());
            return usuarioRepository.save(usuarioExistente);
        });
    }

    // ===================== IMPORTAÇÃO DE ARQUIVO =====================

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Selecione um arquivo para importar.");
        }

        String nomeArquivo = arquivo.getOriginalFilename();
        if (nomeArquivo == null) {
            throw new IllegalArgumentException("O arquivo selecionado é inválido.");
        }

        String nomeEmMinusculo = nomeArquivo.toLowerCase();
        if (!nomeEmMinusculo.endsWith(".txt") && !nomeEmMinusculo.endsWith(".csv")) {
            throw new IllegalArgumentException("Selecione um arquivo TXT ou CSV.");
        }
    }

    // Importa usuários no formato nome;idade
    // Linhas em branco são ignoradas.
    // Se alguma linha for inválida, nenhum usuário é cadastrado.
    @Transactional
    public int importarArquivo(MultipartFile arquivo) {
        validarArquivo(arquivo);

        List<Usuario> usuariosImportados = new ArrayList<>();

        try (BufferedReader leitor = new BufferedReader(
                new InputStreamReader(arquivo.getInputStream(), StandardCharsets.UTF_8))) {

            String linha;
            int numeroLinha = 0;

            while ((linha = leitor.readLine()) != null) {
                numeroLinha++;
                linha = linha.trim();

                // Pula linhas em branco (é comum o editor deixar uma no final do arquivo)
                if (linha.isEmpty()) {
                    continue;
                }

                String[] dados = linha.split(";", -1);
                if (dados.length != 2) {
                    throw new IllegalArgumentException(
                            "Formato inválido na linha " + numeroLinha + ". Utilize nome;idade.");
                }

                String nome = dados[0].trim();
                String idadeTexto = dados[1].trim();

                // Remove o BOM que alguns editores colocam no início do arquivo
                if (numeroLinha == 1) {
                    nome = nome.replace("\uFEFF", "");
                }

                if (nome.isEmpty()) {
                    throw new IllegalArgumentException("O nome está vazio na linha " + numeroLinha + ".");
                }

                if (nome.length() < 3 || nome.length() > 100) {
                    throw new IllegalArgumentException(
                            "O nome da linha " + numeroLinha + " deve ter entre 3 e 100 caracteres.");
                }

                int idade;
                try {
                    idade = Integer.parseInt(idadeTexto);
                } catch (NumberFormatException erro) {
                    throw new IllegalArgumentException(
                            "A idade da linha " + numeroLinha + " deve ser um número inteiro.");
                }

                if (idade < 0 || idade > IDADE_MAXIMA) {
                    throw new IllegalArgumentException(
                            "A idade da linha " + numeroLinha + " deve estar entre 0 e " + IDADE_MAXIMA + " anos.");
                }

                Usuario usuario = new Usuario();
                usuario.setNome(nome);
                usuario.setIdade(idade);
                usuariosImportados.add(usuario);
            }

            if (usuariosImportados.isEmpty()) {
                throw new IllegalArgumentException("O arquivo não contém usuários.");
            }

            usuarioRepository.saveAll(usuariosImportados);
            return usuariosImportados.size();

        } catch (IOException erro) {
            throw new IllegalArgumentException("Não foi possível ler o arquivo.");
        }
    }
}