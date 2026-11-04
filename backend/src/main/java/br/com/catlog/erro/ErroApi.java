package br.com.catlog.erro;

import org.springframework.http.HttpStatus;

/** Falha esperada, com mensagem pronta para ser mostrada ao usuário. */
public class ErroApi extends RuntimeException {

    private final HttpStatus status;

    public ErroApi(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ErroApi naoEncontrado(String mensagem) {
        return new ErroApi(HttpStatus.NOT_FOUND, mensagem);
    }

    public static ErroApi conflito(String mensagem) {
        return new ErroApi(HttpStatus.CONFLICT, mensagem);
    }

    public static ErroApi invalido(String mensagem) {
        return new ErroApi(HttpStatus.UNPROCESSABLE_CONTENT, mensagem);
    }

    public static ErroApi negado(String mensagem) {
        return new ErroApi(HttpStatus.FORBIDDEN, mensagem);
    }
}
