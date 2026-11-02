package br.com.catlog.regras;

import br.com.catlog.dominio.Enums.SituacaoSaude;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/** Regras dos cuidados de saúde (RN04) e do peso (RN07). */
public final class RegrasSaude {

    public static final int DIAS_ALERTA = 7;
    public static final BigDecimal VARIACAO_ALERTA_PERCENTUAL = new BigDecimal("10");

    private RegrasSaude() {
    }

    public static SituacaoSaude situacao(LocalDate proximaDose, LocalDate hoje) {
        if (proximaDose == null) {
            return SituacaoSaude.EM_DIA;
        }
        if (proximaDose.isBefore(hoje)) {
            return SituacaoSaude.VENCIDO;
        }
        return proximaDose.isAfter(hoje.plusDays(DIAS_ALERTA)) ? SituacaoSaude.EM_DIA : SituacaoSaude.A_VENCER;
    }

    public static BigDecimal variacaoPercentual(BigDecimal anterior, BigDecimal atual) {
        return atual.subtract(anterior).multiply(BigDecimal.valueOf(100)).divide(anterior, 1, RoundingMode.HALF_UP);
    }

    public static boolean variacaoExigeAlerta(BigDecimal variacaoPercentual) {
        return variacaoPercentual.abs().compareTo(VARIACAO_ALERTA_PERCENTUAL) > 0;
    }
}
