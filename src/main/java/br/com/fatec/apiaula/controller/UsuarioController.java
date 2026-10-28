package br.com.fatec.apiaula.controller;

import br.com.fatec.apiaula.dto.UsuarioRequest;
import br.com.fatec.apiaula.model.Usuario;
import br.com.fatec.apiaula.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // GET - Listar todos os usuários
    @GetMapping
    public ResponseEntity<List<Usuario>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    // GET - Buscar usuário por ID
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Integer id) {
        return usuarioService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST - Criar novo usuário (responde 201 com o endereço do novo recurso no header Location)
    @PostMapping
    public ResponseEntity<Usuario> salvar(@RequestBody @Valid UsuarioRequest dados) {
        Usuario novoUsuario = usuarioService.salvar(dados);
        URI endereco = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(novoUsuario.getId())
                .toUri();
        return ResponseEntity.created(endereco).body(novoUsuario);
    }

    // PUT - Atualizar usuário
    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizar(@PathVariable Integer id, @RequestBody @Valid UsuarioRequest dados) {
        return usuarioService.atualizar(id, dados)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DELETE - Remover usuário por ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        if (usuarioService.deletar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // POST - Importar usuários de um arquivo TXT ou CSV no formato nome;idade
    @PostMapping("/importar")
    public ResponseEntity<String> importarArquivo(@RequestParam("arquivo") MultipartFile arquivo) {
        try {
            int quantidade = usuarioService.importarArquivo(arquivo);
            return ResponseEntity.ok(quantidade + " usuários importados com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Erro ao importar arquivo: " + e.getMessage());
        }
    }
}
