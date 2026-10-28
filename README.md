# API REST de Usuários com Spring Boot

Projeto da disciplina **Desenvolvimento Web III** (Fatec Zona Leste): uma API REST com CRUD de usuários, importação em lote por arquivo e uma página web que consome a API com `fetch`.

## Tecnologias

- Java 17 e Spring Boot 3.2
- Spring Web, Spring Data JPA e Bean Validation
- PostgreSQL hospedado no [Neon](https://neon.tech)
- Swagger UI (springdoc-openapi)
- JUnit 5, Mockito, MockMvc e H2 nos testes
- HTML, CSS e JavaScript no front

## Estrutura

```
src/main/java/br/com/fatec/apiaula
├── controller   → endpoints REST (UsuarioController, OlaController)
├── dto          → UsuarioRequest: dados aceitos no cadastro/edição, com validações
├── exception    → GlobalExceptionHandler: erros padronizados em JSON
├── model        → entidade JPA Usuario
├── repository   → UsuarioRepository (JpaRepository)
└── service      → regras de negócio e importação de arquivo
src/main/resources/static → página web (index.html, css, js)
```

## Como rodar

1. Crie um banco no Neon e copie o arquivo `.env.example` para `.env`, preenchendo `DB_URL`, `DB_USERNAME` e `DB_PASSWORD`.
2. Rode a aplicação:
   ```bash
   ./mvnw spring-boot:run
   ```
3. Acesse:
   - Página web: http://localhost:8080
   - Swagger: http://localhost:8080/swagger-ui.html

## Endpoints

| Método | Rota                     | Descrição                                   | Respostas      |
|--------|--------------------------|---------------------------------------------|----------------|
| GET    | `/api/usuarios`          | Lista os usuários ordenados por id          | 200            |
| GET    | `/api/usuarios/{id}`     | Busca um usuário                            | 200, 404       |
| POST   | `/api/usuarios`          | Cadastra um usuário                         | 201, 400       |
| PUT    | `/api/usuarios/{id}`     | Atualiza um usuário                         | 200, 400, 404  |
| DELETE | `/api/usuarios/{id}`     | Remove um usuário                           | 204, 404       |
| POST   | `/api/usuarios/importar` | Importa usuários de um arquivo `.txt`/`.csv`| 200, 400       |

Exemplo de cadastro:

```json
{ "nome": "Ana Lima", "idade": 20 }
```

Exemplo de erro de validação (400):

```json
{
  "status": 400,
  "mensagem": "Dados inválidos.",
  "erros": { "idade": "A idade deve ser no máximo 120." }
}
```

### Importação de arquivo

Envie um `multipart/form-data` com o campo `arquivo`. Cada linha segue o formato `nome;idade`:

```
Ana Lima;20
Bruno Costa;35
```

Linhas em branco são ignoradas. Se qualquer linha for inválida, nenhum usuário é cadastrado (a importação é feita em uma única transação) e a resposta informa qual linha tem o problema.

## Testes

Os testes usam um banco H2 em memória, então não precisam do Neon nem do `.env`:

```bash
./mvnw test
```
