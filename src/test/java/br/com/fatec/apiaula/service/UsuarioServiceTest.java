package br.com.fatec.apiaula.service;

import br.com.fatec.apiaula.dto.UsuarioRequest;
import br.com.fatec.apiaula.model.Usuario;
import br.com.fatec.apiaula.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class UsuarioServiceTest {

    private UsuarioRepository repository;
    private UsuarioService service;

    @BeforeEach
    void configurar() {
        repository = mock(UsuarioRepository.class);
        service = new UsuarioService(repository);
    }

    private MockMultipartFile arquivo(String nome, String conteudo) {
        return new MockMultipartFile("arquivo", nome, "text/plain", conteudo.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void salvarRemoveEspacosDoNome() {
        when(repository.save(any(Usuario.class))).thenAnswer(chamada -> chamada.getArgument(0));

        Usuario salvo = service.salvar(new UsuarioRequest("  Ana Lima  ", 20));

        assertEquals("Ana Lima", salvo.getNome());
        assertEquals(20, salvo.getIdade());
    }

    @Test
    void deletarRetornaFalseQuandoUsuarioNaoExiste() {
        when(repository.existsById(99)).thenReturn(false);

        assertFalse(service.deletar(99));
        verify(repository, never()).deleteById(any());
    }

    @Test
    void atualizarRetornaVazioQuandoUsuarioNaoExiste() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertTrue(service.atualizar(99, new UsuarioRequest("Ana", 20)).isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void importaArquivoValidoEIgnoraLinhasEmBranco() {
        int quantidade = service.importarArquivo(arquivo("usuarios.csv", "﻿Ana;20\n\nBruno; 35 \n"));

        assertEquals(2, quantidade);
        ArgumentCaptor<List<Usuario>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertEquals("Ana", captor.getValue().get(0).getNome());
        assertEquals(35, captor.getValue().get(1).getIdade());
    }

    @Test
    void naoSalvaNadaSeUmaLinhaForInvalida() {
        IllegalArgumentException erro = assertThrows(IllegalArgumentException.class,
                () -> service.importarArquivo(arquivo("usuarios.txt", "Ana;20\nBruno;abc\n")));

        assertTrue(erro.getMessage().contains("linha 2"));
        verify(repository, never()).saveAll(anyList());
    }

    @Test
    void recusaIdadeForaDoIntervalo() {
        assertThrows(IllegalArgumentException.class,
                () -> service.importarArquivo(arquivo("usuarios.txt", "Ana;121\n")));
    }

    @Test
    void recusaExtensaoDiferenteDeTxtOuCsv() {
        IllegalArgumentException erro = assertThrows(IllegalArgumentException.class,
                () -> service.importarArquivo(arquivo("usuarios.pdf", "Ana;20\n")));

        assertEquals("Selecione um arquivo TXT ou CSV.", erro.getMessage());
    }
}
