package br.com.fatec.apiaula.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.fatec.apiaula.model.Usuario;

@RestController
public class OlaController {

    @GetMapping("/ola")
    public String dizerOla() {
        return "Olá, mundo!";
    }


}
