package br.com.catlog.integracao;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Converte endereço em coordenadas. Uma falha aqui nunca impede salvar o endereço. */
@Component
public class NominatimCliente {

    public record Coordenadas(double latitude, double longitude) {
    }

    private static final Logger log = LoggerFactory.getLogger(NominatimCliente.class);

    private final RestClient cliente;

    public NominatimCliente(@Value("${catlog.nominatim.contato}") String contato) {
        JdkClientHttpRequestFactory fabrica = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        fabrica.setReadTimeout(Duration.ofSeconds(5));
        String identificacao = contato.isBlank() ? "CatLog/0.1 (Projeto Integrador PUC Goias)" : "CatLog/0.1 (" + contato + ")";
        this.cliente = RestClient.builder()
                .baseUrl("https://nominatim.openstreetmap.org")
                .requestFactory(fabrica)
                .defaultHeader("User-Agent", identificacao)
                .build();
    }

    public Optional<Coordenadas> buscar(String endereco) {
        try {
            List<Map<String, Object>> achados = cliente.get()
                    .uri(u -> u.path("/search")
                            .queryParam("format", "jsonv2")
                            .queryParam("limit", 1)
                            .queryParam("countrycodes", "br")
                            .queryParam("q", endereco)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
            if (achados == null || achados.isEmpty()) {
                return Optional.empty();
            }
            Map<String, Object> primeiro = achados.getFirst();
            return Optional.of(new Coordenadas(
                    Double.parseDouble(String.valueOf(primeiro.get("lat"))),
                    Double.parseDouble(String.valueOf(primeiro.get("lon")))));
        } catch (RestClientException | NumberFormatException erro) {
            log.warn("Nominatim indisponível: {}", erro.getMessage());
            return Optional.empty();
        }
    }
}
