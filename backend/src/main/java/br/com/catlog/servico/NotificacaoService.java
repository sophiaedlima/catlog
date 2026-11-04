package br.com.catlog.servico;

import br.com.catlog.dominio.Notificacao;
import br.com.catlog.dto.Dtos.NotificacaoResponse;
import br.com.catlog.repositorio.Repositorios.NotificacaoRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacoes;

    public NotificacaoService(NotificacaoRepository notificacoes) {
        this.notificacoes = notificacoes;
    }

    void avisar(Long usuarioId, Long visitaId, String titulo, String mensagem) {
        Notificacao notificacao = new Notificacao();
        notificacao.setUsuarioId(usuarioId);
        notificacao.setVisitaId(visitaId);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacoes.save(notificacao);
    }

    /** Entrega as notificações pendentes ao aplicativo, que as exibe no celular (RF19). */
    @Transactional
    public List<NotificacaoResponse> entregarPendentes(Long usuarioId) {
        List<Notificacao> pendentes = notificacoes.findByUsuarioIdAndEntregueFalseOrderByCriadaEmAsc(usuarioId);
        pendentes.forEach(n -> n.setEntregue(true));
        return pendentes.stream()
                .map(n -> new NotificacaoResponse(n.getId(), n.getVisitaId(), n.getTitulo(), n.getMensagem()))
                .toList();
    }
}
