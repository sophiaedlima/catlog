package br.com.catlog.dominio;

public final class Enums {

    private Enums() {
    }

    public enum Perfil { TUTOR, CUIDADOR }

    public enum Sexo { MACHO, FEMEA }

    public enum TipoItemSaude { VACINA, VERMIFUGO, REMEDIO }

    public enum SituacaoSaude { EM_DIA, A_VENCER, VENCIDO }

    public enum SituacaoVisita { SOLICITADA, ACEITA, RECUSADA, CANCELADA, EXPIRADA, EM_ANDAMENTO, CONCLUIDA }
}
