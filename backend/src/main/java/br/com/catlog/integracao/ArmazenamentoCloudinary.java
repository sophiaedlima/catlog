package br.com.catlog.integracao;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

public class ArmazenamentoCloudinary implements ArmazenamentoFotos {

    private final String apiKey;
    private final String apiSecret;
    private final String enderecoEnvio;
    private final RestClient cliente = RestClient.create();

    public ArmazenamentoCloudinary(String cloudName, String apiKey, String apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.enderecoEnvio = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";
    }

    @Override
    public String salvar(byte[] conteudo, String tipo) {
        String instante = String.valueOf(Instant.now().getEpochSecond());
        MultiValueMap<String, Object> corpo = new LinkedMultiValueMap<>();
        corpo.add("file", new ByteArrayResource(conteudo) {
            @Override
            public String getFilename() {
                return "foto";
            }
        });
        corpo.add("api_key", apiKey);
        corpo.add("timestamp", instante);
        corpo.add("signature", assinar("timestamp=" + instante + apiSecret));

        Map<String, Object> resposta = cliente.post()
                .uri(enderecoEnvio)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(corpo)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
        return String.valueOf(resposta.get("secure_url"));
    }

    private String assinar(String texto) {
        try {
            byte[] resumo = MessageDigest.getInstance("SHA-1").digest(texto.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumo);
        } catch (NoSuchAlgorithmException erro) {
            throw new IllegalStateException(erro);
        }
    }
}
