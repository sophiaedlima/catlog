package br.com.catlog.dominio;

import br.com.catlog.dominio.Enums.Perfil;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "visita")
@Getter
@Setter
public class Visita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id")
    private Usuario tutor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cuidador_id")
    private Usuario cuidador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "endereco_id")
    private Endereco endereco;

    private Instant inicio;

    @Column(name = "duracao_minutos")
    private int duracaoMinutos;

    private String instrucoes;

    @Enumerated(EnumType.STRING)
    private SituacaoVisita situacao = SituacaoVisita.SOLICITADA;

    @Column(name = "motivo_cancelamento")
    private String motivoCancelamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancelada_por")
    private Perfil canceladaPor;

    @Column(name = "checkin_em")
    private Instant checkinEm;

    @Column(name = "checkin_latitude")
    private Double checkinLatitude;

    @Column(name = "checkin_longitude")
    private Double checkinLongitude;

    @Column(name = "concluida_em")
    private Instant concluidaEm;

    @Column(name = "criado_em")
    private Instant criadoEm = Instant.now();

    @ManyToMany
    @JoinTable(name = "visita_gato",
            joinColumns = @JoinColumn(name = "visita_id"),
            inverseJoinColumns = @JoinColumn(name = "gato_id"))
    @OrderBy("nome")
    private Set<Gato> gatos = new LinkedHashSet<>();

    @OneToOne(mappedBy = "visita", fetch = FetchType.LAZY)
    private RelatorioVisita relatorio;

    public Instant fim() {
        return inicio.plusSeconds(duracaoMinutos * 60L);
    }
}
