package br.com.fatec.apiaula.controller;

import br.com.fatec.apiaula.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Sobe a aplicação inteira com o banco H2 e testa os endpoints de ponta a ponta
@SpringBootTest
@AutoConfigureMockMvc
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository repository;

    @BeforeEach
    void limparBanco() {
        repository.deleteAll();
    }

    @Test
    void cadastraUsuarioERetorna201ComLocation() throws Exception {
        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \"Ana Lima\", \"idade\": 20}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/usuarios/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nome").value("Ana Lima"));
    }

    @Test
    void recusaUsuarioInvalidoComMensagensPorCampo() throws Exception {
        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\": \"\", \"idade\": 200}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists())
                .andExpect(jsonPath("$.erros.idade").value("A idade deve ser no máximo 120."));
    }

    @Test
    void retorna404ParaUsuarioInexistente() throws Exception {
        mockMvc.perform(get("/api/usuarios/9999"))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/usuarios/9999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void retorna400QuandoIdNaoENumero() throws Exception {
        mockMvc.perform(get("/api/usuarios/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("O parâmetro 'id' é inválido."));
    }
}
