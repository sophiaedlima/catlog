package br.com.catlog.integracao;

public interface ArmazenamentoFotos {

    /** Guarda a imagem e devolve o endereço para acessá-la. */
    String salvar(byte[] conteudo, String tipo);
}
