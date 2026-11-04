package br.com.catlog.config;

import br.com.catlog.integracao.ArmazenamentoCloudinary;
import br.com.catlog.integracao.ArmazenamentoFotos;
import br.com.catlog.integracao.ArmazenamentoLocal;
import java.nio.file.Path;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AplicacaoConfig implements WebMvcConfigurer {

    @Value("${catlog.fotos.pasta}")
    private String pastaFotos;

    @Bean
    ZoneId fuso(@Value("${catlog.fuso}") String fuso) {
        return ZoneId.of(fuso);
    }

    @Bean
    ArmazenamentoFotos armazenamentoFotos(@Value("${catlog.cloudinary.cloud-name}") String cloudName,
                                          @Value("${catlog.cloudinary.api-key}") String apiKey,
                                          @Value("${catlog.cloudinary.api-secret}") String apiSecret) {
        if (cloudName.isBlank()) {
            return new ArmazenamentoLocal(Path.of(pastaFotos));
        }
        return new ArmazenamentoCloudinary(cloudName, apiKey, apiSecret);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/arquivos/**")
                .addResourceLocations(Path.of(pastaFotos).toAbsolutePath().toUri().toString() + "/");
    }
}
