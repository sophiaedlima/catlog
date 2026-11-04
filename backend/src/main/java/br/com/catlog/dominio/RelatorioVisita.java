package br.com.catlog.dominio;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "relatorio_visita")
@Getter
@Setter
public class RelatorioVisita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visita_id")
    private Visita visita;

    private boolean alimentou;

    @Column(name = "trocou_agua")
    private boolean trocouAgua;

    @Column(name = "limpou_caixa")
    private boolean limpouCaixa;

    private boolean medicou;
    private String observacoes;

    @Column(name = "registrado_em")
    private Instant registradoEm;

    @OneToMany(mappedBy = "relatorio", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem")
    private List<FotoRelatorio> fotos = new ArrayList<>();

    public void adicionarFoto(String url) {
        FotoRelatorio foto = new FotoRelatorio();
        foto.setRelatorio(this);
        foto.setUrl(url);
        foto.setOrdem(fotos.size());
        fotos.add(foto);
    }
}
