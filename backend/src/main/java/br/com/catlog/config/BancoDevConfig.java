package br.com.catlog.config;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/** PostgreSQL embutido, para rodar a API e os testes sem instalar um banco. */
@Configuration
@Profile({"dev", "test"})
public class BancoDevConfig {

    @Bean(destroyMethod = "close")
    EmbeddedPostgres postgresEmbutido() throws IOException {
        return EmbeddedPostgres.builder().start();
    }

    @Bean
    DataSource dataSource(EmbeddedPostgres postgresEmbutido) {
        return postgresEmbutido.getPostgresDatabase();
    }
}
