package br.com.catlog.regras;

import br.com.catlog.dominio.Enums.SituacaoVisita;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/** Regras de negócio da visita (RN01, RN02, RN03, RN05, RN06 e RN08), sem dependência de banco. */
public final class RegrasVisita {

    public static final Duration DESLOCAMENTO = Duration.ofMinutes(30);
    public static final Duration ANTECEDENCIA_MINIMA = Duration.ofHours(12);
    public static final Duration LIMITE_CANCELAMENTO = Duration.ofHours(6);
    public static final Duration LIMITE_RESPOSTA = Duration.ofHours(2);
    public static final Duration CHECKIN_ANTES = Duration.ofMinutes(15);
    public static final Duration CHECKIN_DEPOIS = Duration.ofMinutes(30);
    public static final Duration ACESSO_APOS_CONCLUSAO = Duration.ofHours(24);
    public static final int DURACAO_MINIMA = 30;
    public static final int DURACAO_MAXIMA = 120;
    public static final int DISTANCIA_CHECKIN_METROS = 200;
    public static final int MAXIMO_FOTOS = 5;

    private static final Map<SituacaoVisita, Set<SituacaoVisita>> TRANSICOES = Map.of(
            SituacaoVisita.SOLICITADA, EnumSet.of(SituacaoVisita.ACEITA, SituacaoVisita.RECUSADA,
                    SituacaoVisita.CANCELADA, SituacaoVisita.EXPIRADA),
            SituacaoVisita.ACEITA, EnumSet.of(SituacaoVisita.EM_ANDAMENTO, SituacaoVisita.CANCELADA),
            SituacaoVisita.EM_ANDAMENTO, EnumSet.of(SituacaoVisita.CONCLUIDA));

    private RegrasVisita() {
    }

    public static boolean transicaoPermitida(SituacaoVisita de, SituacaoVisita para) {
        return TRANSICOES.getOrDefault(de, Set.of()).contains(para);
    }

    public static boolean duracaoValida(int minutos) {
        return minutos >= DURACAO_MINIMA && minutos <= DURACAO_MAXIMA;
    }

    public static boolean antecedenciaValida(Instant inicio, Instant agora) {
        return !inicio.isBefore(agora.plus(ANTECEDENCIA_MINIMA));
    }

    /** RN01: duas visitas conflitam quando se sobrepõem, contando 30 minutos de deslocamento antes e depois. */
    public static boolean temConflito(Instant inicioA, int duracaoA, Instant inicioB, int duracaoB) {
        Instant fimA = inicioA.plus(Duration.ofMinutes(duracaoA)).plus(DESLOCAMENTO);
        Instant fimB = inicioB.plus(Duration.ofMinutes(duracaoB));
        return inicioA.minus(DESLOCAMENTO).isBefore(fimB) && inicioB.isBefore(fimA);
    }

    /** RN02: visita solicitada pode ser cancelada; visita aceita, somente até 6 horas antes do início. */
    public static boolean podeCancelar(SituacaoVisita situacao, Instant inicio, Instant agora) {
        return switch (situacao) {
            case SOLICITADA -> true;
            case ACEITA -> !agora.isAfter(inicio.minus(LIMITE_CANCELAMENTO));
            default -> false;
        };
    }

    /** RN06: pedido sem resposta expira 2 horas antes do início. */
    public static boolean respostaExpirada(Instant inicio, Instant agora) {
        return !agora.isBefore(inicio.minus(LIMITE_RESPOSTA));
    }

    /** RN03: janela de 15 minutos antes até 30 minutos depois do horário marcado. */
    public static boolean dentroDaJanelaDeCheckin(Instant inicio, Instant momento) {
        return !momento.isBefore(inicio.minus(CHECKIN_ANTES)) && !momento.isAfter(inicio.plus(CHECKIN_DEPOIS));
    }

    public static boolean pertoDoEndereco(double distanciaMetros) {
        return distanciaMetros <= DISTANCIA_CHECKIN_METROS;
    }

    /** RN08: acesso do cuidador do aceite até 24 horas depois da conclusão. */
    public static boolean cuidadorPodeVerDados(SituacaoVisita situacao, Instant concluidaEm, Instant agora) {
        return switch (situacao) {
            case ACEITA, EM_ANDAMENTO -> true;
            case CONCLUIDA -> concluidaEm != null && agora.isBefore(concluidaEm.plus(ACESSO_APOS_CONCLUSAO));
            default -> false;
        };
    }
}
