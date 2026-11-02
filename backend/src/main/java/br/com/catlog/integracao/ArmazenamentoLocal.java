package br.com.catlog.integracao;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Guarda as fotos em uma pasta do servidor, usado quando o Cloudinary não está configurado. */
public class ArmazenamentoLocal implements ArmazenamentoFotos {

    private final Path pasta;

    public ArmazenamentoLocal(Path pasta) {
        this.pasta = pasta;
    }

    @Override
    public String salvar(byte[] conteudo, String tipo) {
        String nome = UUID.randomUUID() + ("image/png".equals(tipo) ? ".png" : ".jpg");
        try {
            Files.createDirectories(pasta);
            Files.write(pasta.resolve(nome), conteudo);
        } catch (IOException erro) {
            throw new UncheckedIOException(erro);
        }
        return "/arquivos/" + nome;
    }
}
