package br.com.catlog.servico;

import br.com.catlog.dominio.Enums.SituacaoSaude;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Gato;
import br.com.catlog.dto.Dtos.AlertaSaude;
import br.com.catlog.dto.Dtos.ResumoCuidador;
import br.com.catlog.dto.Dtos.ResumoTutor;
import br.com.catlog.dto.Dtos.VisitaResponse;
import br.com.catlog.repositorio.Repositorios.GatoRepository;
import br.com.catlog.repositorio.Repositorios.VisitaRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResumoService {

    private final GatoRepository gatos;
    private final VisitaRepository visitas;
    private final SaudeService saude;
    private final VisitaService visitaService;
    private final ZoneId fuso;

    public ResumoService(GatoRepository gatos, VisitaRepository visitas, SaudeService saude,
                         VisitaService visitaService, ZoneId fuso) {
        this.gatos = gatos;
        this.visitas = visitas;
        this.saude = saude;
        this.visitaService = visitaService;
        this.fuso = fuso;
    }

    @Transactional(readOnly = true)
    public ResumoTutor doTutor(Long tutorId) {
        List<Gato> gatosDoTutor = gatos.findByTutorIdOrderByNomeAsc(tutorId);
        List<AlertaSaude> alertas = new ArrayList<>();
        for (Gato gato : gatosDoTutor) {
            saude.itensDoGato(gato.getId()).stream()
                    .filter(i -> i.situacao() != SituacaoSaude.EM_DIA)
                    .forEach(i -> alertas.add(new AlertaSaude(gato.getId(), gato.getNome(), i.id(), i.nome(),
                            i.situacao(), i.proximaDose())));
        }
        alertas.sort(Comparator.comparing(AlertaSaude::proximaDose));

        VisitaResponse proxima = visitas.findFirstByTutorIdAndSituacaoInAndInicioAfterOrderByInicioAsc(tutorId,
                        List.of(SituacaoVisita.ACEITA, SituacaoVisita.EM_ANDAMENTO), Instant.now().minusSeconds(4 * 3600))
                .map(v -> visitaService.paraResponse(v, tutorId, false))
                .orElse(null);
        VisitaResponse ultima = visitas.findFirstByTutorIdAndSituacaoOrderByInicioDesc(tutorId, SituacaoVisita.CONCLUIDA)
                .map(v -> visitaService.paraResponse(v, tutorId, false))
                .orElse(null);
        return new ResumoTutor(alertas, proxima, ultima, gatosDoTutor.stream().map(Gato::getNome).toList());
    }

    @Transactional(readOnly = true)
    public ResumoCuidador doCuidador(Long cuidadorId) {
        LocalDate hoje = LocalDate.now(fuso);
        Instant inicioDia = hoje.atStartOfDay(fuso).toInstant();
        Instant fimDia = hoje.plusDays(1).atStartOfDay(fuso).toInstant();
        YearMonth mes = YearMonth.from(hoje);
        Instant inicioMes = mes.atDay(1).atStartOfDay(fuso).toInstant();
        Instant fimMes = mes.plusMonths(1).atDay(1).atStartOfDay(fuso).toInstant();

        List<VisitaResponse> hojeLista = visitas.findByCuidadorIdAndInicioBetweenOrderByInicioAsc(cuidadorId, inicioDia, fimDia)
                .stream()
                .filter(v -> v.getSituacao() == SituacaoVisita.ACEITA
                        || v.getSituacao() == SituacaoVisita.EM_ANDAMENTO
                        || v.getSituacao() == SituacaoVisita.CONCLUIDA)
                .map(v -> visitaService.paraResponse(v, cuidadorId, false))
                .toList();
        long pendentes = visitas.findByCuidadorIdAndSituacaoIn(cuidadorId, List.of(SituacaoVisita.SOLICITADA)).size();
        long concluidas = visitas.contarDoCuidador(cuidadorId, SituacaoVisita.CONCLUIDA, inicioMes, fimMes);
        long agendadas = visitas.contarDoCuidador(cuidadorId, SituacaoVisita.ACEITA, inicioMes, fimMes);
        return new ResumoCuidador(hojeLista, pendentes, concluidas, agendadas);
    }
}
