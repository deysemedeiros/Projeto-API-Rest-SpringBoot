package br.com.fatec.apiaula.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Dados que o cliente pode enviar ao cadastrar ou atualizar um usuário.
// O id não fica aqui de propósito: quem gera o id é o banco.
public record UsuarioRequest(

        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 3, max = 100, message = "O nome deve ter entre 3 e 100 caracteres.")
        String nome,

        @NotNull(message = "A idade é obrigatória.")
        @Min(value = 0, message = "A idade deve ser no mínimo 0.")
        @Max(value = 120, message = "A idade deve ser no máximo 120.")
        Integer idade
) {
}
