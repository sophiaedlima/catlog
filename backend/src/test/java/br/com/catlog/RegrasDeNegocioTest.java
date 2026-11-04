package br.com.catlog;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.catlog.dominio.Enums.SituacaoSaude;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.regras.Geo;
import br.com.catlog.regras.RegrasSaude;
import br.com.catlog.regras.RegrasVisita;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class RegrasDeNegocioTest {

    private static final Instant AGORA = Instant.parse("2026-11-10T12:00:00Z");

    @Test
    void rn01VisitasComMenosDe30MinutosEntreElasConflitam() {
        Instant dezHoras = Instant.parse("2026-11-10T10:00:00Z");
        assertThat(RegrasVisita.temConflito(dezHoras, 60, dezHoras.plus(Duration.ofMinutes(89)), 60)).isTrue();
        assertThat(RegrasVisita.temConflito(dezHoras.plus(Duration.ofMinutes(89)), 60, dezHoras, 60)).isTrue();
    }

    @Test
    void rn01VisitasCom30MinutosOuMaisEntreElasNaoConflitam() {
        Instant dezHoras = Instant.parse("2026-11-10T10:00:00Z");
        assertThat(RegrasVisita.temConflito(dezHoras, 60, dezHoras.plus(Duration.ofMinutes(90)), 60)).isFalse();
        assertThat(RegrasVisita.temConflito(dezHoras.plus(Duration.ofMinutes(90)), 60, dezHoras, 60)).isFalse();
    }

    @Test
    void rn02ExigeDozeHorasDeAntecedenciaEDuracaoEntre30E120() {
        assertThat(RegrasVisita.antecedenciaValida(AGORA.plus(Duration.ofHours(12)), AGORA)).isTrue();
        assertThat(RegrasVisita.antecedenciaValida(AGORA.plus(Duration.ofHours(11)), AGORA)).isFalse();
        assertThat(RegrasVisita.duracaoValida(30)).isTrue();
        assertThat(RegrasVisita.duracaoValida(120)).isTrue();
        assertThat(RegrasVisita.duracaoValida(29)).isFalse();
        assertThat(RegrasVisita.duracaoValida(121)).isFalse();
    }

    @Test
    void rn02VisitaAceitaSoCancelaAteSeisHorasAntes() {
        Instant inicio = AGORA.plus(Duration.ofHours(6));
        assertThat(RegrasVisita.podeCancelar(SituacaoVisita.ACEITA, inicio, AGORA)).isTrue();
        assertThat(RegrasVisita.podeCancelar(SituacaoVisita.ACEITA, inicio.minusSeconds(1), AGORA)).isFalse();
        assertThat(RegrasVisita.podeCancelar(SituacaoVisita.SOLICITADA, inicio.minusSeconds(1), AGORA)).isTrue();
        assertThat(RegrasVisita.podeCancelar(SituacaoVisita.EM_ANDAMENTO, inicio, AGORA)).isFalse();
    }

    @Test
    void rn03JanelaDeCheckinVaiDe15AntesA30Depois() {
        assertThat(RegrasVisita.dentroDaJanelaDeCheckin(AGORA, AGORA.minus(Duration.ofMinutes(15)))).isTrue();
        assertThat(RegrasVisita.dentroDaJanelaDeCheckin(AGORA, AGORA.plus(Duration.ofMinutes(30)))).isTrue();
        assertThat(RegrasVisita.dentroDaJanelaDeCheckin(AGORA, AGORA.minus(Duration.ofMinutes(16)))).isFalse();
        assertThat(RegrasVisita.dentroDaJanelaDeCheckin(AGORA, AGORA.plus(Duration.ofMinutes(31)))).isFalse();
    }

    @Test
    void rn03DistanciaEhCalculadaEmMetros() {
        double cemMetros = Geo.distanciaMetros(-16.7050, -49.2670, -16.7041, -49.2670);
        double umQuilometro = Geo.distanciaMetros(-16.7050, -49.2670, -16.6960, -49.2670);
        assertThat(RegrasVisita.pertoDoEndereco(cemMetros)).isTrue();
        assertThat(RegrasVisita.pertoDoEndereco(umQuilometro)).isFalse();
    }

    @Test
    void rn04CalculaASituacaoDoCuidado() {
        LocalDate hoje = LocalDate.of(2026, 11, 10);
        assertThat(RegrasSaude.situacao(hoje.minusDays(1), hoje)).isEqualTo(SituacaoSaude.VENCIDO);
        assertThat(RegrasSaude.situacao(hoje, hoje)).isEqualTo(SituacaoSaude.A_VENCER);
        assertThat(RegrasSaude.situacao(hoje.plusDays(7), hoje)).isEqualTo(SituacaoSaude.A_VENCER);
        assertThat(RegrasSaude.situacao(hoje.plusDays(8), hoje)).isEqualTo(SituacaoSaude.EM_DIA);
        assertThat(RegrasSaude.situacao(null, hoje)).isEqualTo(SituacaoSaude.EM_DIA);
    }

    @Test
    void rn06SoAceitaTransicoesNaOrdem() {
        assertThat(RegrasVisita.transicaoPermitida(SituacaoVisita.SOLICITADA, SituacaoVisita.ACEITA)).isTrue();
        assertThat(RegrasVisita.transicaoPermitida(SituacaoVisita.ACEITA, SituacaoVisita.EM_ANDAMENTO)).isTrue();
        assertThat(RegrasVisita.transicaoPermitida(SituacaoVisita.EM_ANDAMENTO, SituacaoVisita.CONCLUIDA)).isTrue();
        assertThat(RegrasVisita.transicaoPermitida(SituacaoVisita.SOLICITADA, SituacaoVisita.CONCLUIDA)).isFalse();
        assertThat(RegrasVisita.transicaoPermitida(SituacaoVisita.ACEITA, SituacaoVisita.CONCLUIDA)).isFalse();
        assertThat(RegrasVisita.transicaoPermitida(SituacaoVisita.CONCLUIDA, SituacaoVisita.CANCELADA)).isFalse();
        assertThat(RegrasVisita.respostaExpirada(AGORA.plus(Duration.ofHours(2)), AGORA)).isTrue();
        assertThat(RegrasVisita.respostaExpirada(AGORA.plus(Duration.ofHours(3)), AGORA)).isFalse();
    }

    @Test
    void rn07AlertaSoAcimaDe10PorCento() {
        BigDecimal perdeuPouco = RegrasSaude.variacaoPercentual(new BigDecimal("4.00"), new BigDecimal("3.60"));
        BigDecimal perdeuMuito = RegrasSaude.variacaoPercentual(new BigDecimal("4.00"), new BigDecimal("3.50"));
        BigDecimal ganhouMuito = RegrasSaude.variacaoPercentual(new BigDecimal("4.00"), new BigDecimal("4.50"));
        assertThat(RegrasSaude.variacaoExigeAlerta(perdeuPouco)).isFalse();
        assertThat(RegrasSaude.variacaoExigeAlerta(perdeuMuito)).isTrue();
        assertThat(RegrasSaude.variacaoExigeAlerta(ganhouMuito)).isTrue();
    }

    @Test
    void rn08AcessoDoCuidadorTerminaVinteEQuatroHorasDepoisDaConclusao() {
        assertThat(RegrasVisita.cuidadorPodeVerDados(SituacaoVisita.ACEITA, null, AGORA)).isTrue();
        assertThat(RegrasVisita.cuidadorPodeVerDados(SituacaoVisita.SOLICITADA, null, AGORA)).isFalse();
        assertThat(RegrasVisita.cuidadorPodeVerDados(SituacaoVisita.CONCLUIDA, AGORA.minus(Duration.ofHours(23)), AGORA)).isTrue();
        assertThat(RegrasVisita.cuidadorPodeVerDados(SituacaoVisita.CONCLUIDA, AGORA.minus(Duration.ofHours(24)), AGORA)).isFalse();
    }
}
