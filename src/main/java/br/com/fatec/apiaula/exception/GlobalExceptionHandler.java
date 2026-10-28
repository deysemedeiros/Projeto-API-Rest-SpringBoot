package br.com.fatec.apiaula.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

// Centraliza o tratamento de erros da API para devolver sempre um JSON padronizado.
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Campos que não passaram nas validações do UsuarioRequest (@NotBlank, @Min, @Max...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> tratarValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new LinkedHashMap<>();
        for (FieldError erro : ex.getBindingResult().getFieldErrors()) {
            erros.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        return resposta(HttpStatus.BAD_REQUEST, "Dados inválidos.", erros);
    }

    // JSON mal formatado, por exemplo idade enviada como texto
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> tratarJsonInvalido(HttpMessageNotReadableException ex) {
        return resposta(HttpStatus.BAD_REQUEST, "O corpo da requisição está em um formato inválido.", null);
    }

    // Id na URL que não é número, por exemplo /api/usuarios/abc
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> tratarParametroInvalido(MethodArgumentTypeMismatchException ex) {
        return resposta(HttpStatus.BAD_REQUEST, "O parâmetro '" + ex.getName() + "' é inválido.", null);
    }

    private ResponseEntity<Map<String, Object>> resposta(HttpStatus status, String mensagem, Map<String, String> erros) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("status", status.value());
        corpo.put("mensagem", mensagem);
        if (erros != null) {
            corpo.put("erros", erros);
        }
        return ResponseEntity.status(status).body(corpo);
    }
}
