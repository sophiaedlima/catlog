package br.com.catlog.servico;

import br.com.catlog.dominio.Endereco;
import br.com.catlog.dominio.Enums.Perfil;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Enums.TipoItemSaude;
import br.com.catlog.dominio.Gato;
import br.com.catlog.dominio.RelatorioVisita;
import br.com.catlog.dominio.Usuario;
import br.com.catlog.dominio.Visita;
import br.com.catlog.dto.Dtos.CancelarRequest;
import br.com.catlog.dto.Dtos.CheckinRequest;
import br.com.catlog.dto.Dtos.GatoDaVisita;
import br.com.catlog.dto.Dtos.GatoDetalheVisita;
import br.com.catlog.dto.Dtos.Pagina;
import br.com.catlog.dto.Dtos.PessoaResumo;
import br.com.catlog.dto.Dtos.RelatorioRequest;
import br.com.catlog.dto.Dtos.RelatorioResponse;
import br.com.catlog.dto.Dtos.VisitaRequest;
import br.com.catlog.dto.Dtos.VisitaResponse;
import br.com.catlog.erro.ErroApi;
import br.com.catlog.regras.Geo;
import br.com.catlog.regras.RegrasVisita;
import br.com.catlog.repositorio.Repositorios.ItemSaudeRepository;
import br.com.catlog.repositorio.Repositorios.RelatorioVisitaRepository;
import br.com.catlog.repositorio.Repositorios.UsuarioRepository;
import br.com.catlog.repositorio.Repositorios.VisitaRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VisitaService {

    private static final List<SituacaoVisita> OCUPAM_AGENDA = List.of(SituacaoVisita.ACEITA, SituacaoVisita.EM_ANDAMENTO);
    private static final Duration TOLERANCIA_RELOGIO = Duration.ofMinutes(5);

    private final VisitaRepository visitas;
    private final UsuarioRepository usuarios;
    private final RelatorioVisitaRepository relatorios;
    private final ItemSaudeRepository itens;
    private final GatoService gatos;
    private final SaudeService saude;
    private final EnderecoService enderecos;
    private final NotificacaoService notificacoes;
    private final DateTimeFormatter formatoHora;
    private final DateTimeFormatter formatoDataHora;

    public VisitaService(VisitaRepository visitas, UsuarioRepository usuarios, RelatorioVisitaRepository relatorios,
                         ItemSaudeRepository itens, GatoService gatos, SaudeService saude, EnderecoService enderecos,
                         NotificacaoService notificacoes, ZoneId fuso) {
        this.visitas = visitas;
        this.usuarios = usuarios;
        this.relatorios = relatorios;
        this.itens = itens;
        this.gatos = gatos;
        this.saude = saude;
        this.enderecos = enderecos;
        this.notificacoes = notificacoes;
        this.formatoHora = DateTimeFormatter.ofPattern("HH:mm").withZone(fuso);
        this.formatoDataHora = DateTimeFormatter.ofPattern("dd/MM 'às' HH:mm").withZone(fuso);
    }

    @Transactional
    public VisitaResponse solicitar(Long tutorId, VisitaRequest pedido) {
        if (!RegrasVisita.duracaoValida(pedido.duracaoMinutos())) {
            throw ErroApi.invalido("A visita precisa durar de 30 a 120 minutos.");
        }
        if (!RegrasVisita.antecedenciaValida(pedido.inicio(), Instant.now())) {
            throw ErroApi.invalido("A visita precisa ser marcada com pelo menos 12 horas de antecedência.");
        }
        Usuario cuidador = usuarios.findById(pedido.cuidadorId())
                .filter(u -> u.getPerfil() == Perfil.CUIDADOR)
                .orElseThrow(() -> ErroApi.naoEncontrado("Cuidador não encontrado."));
        Endereco endereco = enderecos.buscar(tutorId, pedido.enderecoId());
        enderecos.completarCoordenadas(endereco);
        if (!endereco.temCoordenadas()) {
            throw ErroApi.invalido("Não conseguimos localizar esse endereço, e o check-in depende dele. Confira a rua e o número em Meu perfil.");
        }

        Visita visita = new Visita();
        visita.setTutor(usuarios.getReferenceById(tutorId));
        visita.setCuidador(cuidador);
        visita.setEndereco(endereco);
        visita.setInicio(pedido.inicio());
        visita.setDuracaoMinutos(pedido.duracaoMinutos());
        visita.setInstrucoes(pedido.instrucoes());
        for (Long gatoId : pedido.gatoIds()) {
            visita.getGatos().add(gatos.buscarEntidade(tutorId, gatoId));
        }
        visitas.save(visita);
        notificacoes.avisar(cuidador.getId(), visita.getId(), "Nova solicitação de visita",
                "Você recebeu um pedido de visita para " + formatoDataHora.format(visita.getInicio()) + ".");
        return paraResponse(visita, cuidador.getId(), true);
    }

    @Transactional(readOnly = true)
    public Pagina<VisitaResponse> listar(Long usuarioId, List<SituacaoVisita> situacoes, Instant de, Instant ate,
                                         int pagina, int tamanho) {
        Specification<Visita> filtro = (raiz, consulta, cb) -> {
            List<Predicate> condicoes = new ArrayList<>();
            condicoes.add(cb.or(cb.equal(raiz.get("tutor").get("id"), usuarioId),
                    cb.equal(raiz.get("cuidador").get("id"), usuarioId)));
            if (situacoes != null && !situacoes.isEmpty()) {
                condicoes.add(raiz.get("situacao").in(situacoes));
            }
            if (de != null) {
                condicoes.add(cb.greaterThanOrEqualTo(raiz.get("inicio"), de));
            }
            if (ate != null) {
                condicoes.add(cb.lessThan(raiz.get("inicio"), ate));
            }
            return cb.and(condicoes.toArray(Predicate[]::new));
        };
        PageRequest paginacao = PageRequest.of(pagina, tamanho, Sort.by(Sort.Direction.DESC, "inicio"));
        return Pagina.de(visitas.findAll(filtro, paginacao).map(v -> paraResponse(v, usuarioId, false)));
    }

    @Transactional(readOnly = true)
    public VisitaResponse detalhar(Long usuarioId, Long id) {
        return paraResponse(buscarDoUsuario(usuarioId, id), usuarioId, true);
    }

    /** RN01: trava o cuidador e bloqueia o aceite se houver sobreposição, contando o deslocamento. */
    @Transactional
    public VisitaResponse aceitar(Long cuidadorId, Long id) {
        usuarios.travarPorId(cuidadorId);
        Visita visita = buscarDoCuidador(cuidadorId, id);
        exigirTransicao(visita, SituacaoVisita.ACEITA);
        if (RegrasVisita.respostaExpirada(visita.getInicio(), Instant.now())) {
            throw ErroApi.conflito("O prazo para responder esse pedido terminou 2 horas antes do início da visita.");
        }
        visitas.findByCuidadorIdAndSituacaoIn(cuidadorId, OCUPAM_AGENDA).stream()
                .filter(outra -> RegrasVisita.temConflito(visita.getInicio(), visita.getDuracaoMinutos(),
                        outra.getInicio(), outra.getDuracaoMinutos()))
                .findFirst()
                .ifPresent(outra -> {
                    throw ErroApi.conflito("Essa visita conflita com a visita de " + outra.getTutor().getNome()
                            + " em " + formatoDataHora.format(outra.getInicio())
                            + ", contando 30 minutos de deslocamento.");
                });
        visita.setSituacao(SituacaoVisita.ACEITA);
        notificacoes.avisar(visita.getTutor().getId(), id, "Visita aceita",
                visita.getCuidador().getNome() + " aceitou a visita de " + formatoDataHora.format(visita.getInicio()) + ".");
        return paraResponse(visita, cuidadorId, true);
    }

    @Transactional
    public VisitaResponse recusar(Long cuidadorId, Long id) {
        Visita visita = buscarDoCuidador(cuidadorId, id);
        exigirTransicao(visita, SituacaoVisita.RECUSADA);
        visita.setSituacao(SituacaoVisita.RECUSADA);
        notificacoes.avisar(visita.getTutor().getId(), id, "Visita recusada",
                visita.getCuidador().getNome() + " não poderá fazer a visita de " + formatoDataHora.format(visita.getInicio()) + ".");
        return paraResponse(visita, cuidadorId, true);
    }

    @Transactional
    public VisitaResponse cancelar(Long usuarioId, Long id, CancelarRequest pedido) {
        Visita visita = buscarDoUsuario(usuarioId, id);
        exigirTransicao(visita, SituacaoVisita.CANCELADA);
        if (!RegrasVisita.podeCancelar(visita.getSituacao(), visita.getInicio(), Instant.now())) {
            throw ErroApi.conflito("Esta visita começa em menos de 6 horas e não pode mais ser cancelada pelo aplicativo.");
        }
        boolean peloTutor = visita.getTutor().getId().equals(usuarioId);
        visita.setSituacao(SituacaoVisita.CANCELADA);
        visita.setMotivoCancelamento(pedido.motivo().trim());
        visita.setCanceladaPor(peloTutor ? Perfil.TUTOR : Perfil.CUIDADOR);
        Usuario outraParte = peloTutor ? visita.getCuidador() : visita.getTutor();
        notificacoes.avisar(outraParte.getId(), id, "Visita cancelada",
                "A visita de " + formatoDataHora.format(visita.getInicio()) + " foi cancelada. Motivo: " + visita.getMotivoCancelamento());
        return paraResponse(visita, usuarioId, true);
    }

    /** RN03. Repetir o envio é aceito, pois a fila do aplicativo pode reenviar após uma falha de conexão. */
    @Transactional
    public VisitaResponse checkin(Long cuidadorId, Long id, CheckinRequest pedido) {
        Visita visita = buscarDoCuidador(cuidadorId, id);
        if (visita.getSituacao() == SituacaoVisita.EM_ANDAMENTO || visita.getSituacao() == SituacaoVisita.CONCLUIDA) {
            return paraResponse(visita, cuidadorId, true);
        }
        exigirTransicao(visita, SituacaoVisita.EM_ANDAMENTO);

        Instant momento = momentoInformado(pedido.capturadoEm());
        if (!RegrasVisita.dentroDaJanelaDeCheckin(visita.getInicio(), momento)) {
            throw ErroApi.invalido("O check-in desta visita é permitido das "
                    + formatoHora.format(visita.getInicio().minus(RegrasVisita.CHECKIN_ANTES)) + " às "
                    + formatoHora.format(visita.getInicio().plus(RegrasVisita.CHECKIN_DEPOIS)) + ".");
        }
        Endereco endereco = visita.getEndereco();
        double distancia = Geo.distanciaMetros(pedido.latitude(), pedido.longitude(),
                endereco.getLatitude(), endereco.getLongitude());
        if (!RegrasVisita.pertoDoEndereco(distancia)) {
            throw ErroApi.invalido("Você está a " + Math.round(distancia)
                    + " metros do endereço. O check-in só é aceito a até 200 metros.");
        }

        visita.setSituacao(SituacaoVisita.EM_ANDAMENTO);
        visita.setCheckinEm(momento);
        visita.setCheckinLatitude(pedido.latitude());
        visita.setCheckinLongitude(pedido.longitude());
        notificacoes.avisar(visita.getTutor().getId(), id, "Visita iniciada",
                visita.getCuidador().getNome() + " chegou ao endereço às " + formatoHora.format(momento) + ".");
        return paraResponse(visita, cuidadorId, true);
    }

    /** RN05. Repetir o envio é aceito, pois a fila do aplicativo pode reenviar após uma falha de conexão. */
    @Transactional
    public VisitaResponse concluir(Long cuidadorId, Long id, RelatorioRequest pedido) {
        Visita visita = buscarDoCuidador(cuidadorId, id);
        if (visita.getSituacao() == SituacaoVisita.CONCLUIDA) {
            return paraResponse(visita, cuidadorId, true);
        }
        exigirTransicao(visita, SituacaoVisita.CONCLUIDA);
        if (!pedido.alimentou() || !pedido.trocouAgua() || !pedido.limpouCaixa()) {
            throw ErroApi.invalido("Preencha toda a lista de tarefas antes de concluir a visita.");
        }
        if (precisaMedicar(visita) && !pedido.medicou()) {
            throw ErroApi.invalido("Um dos gatos toma remédio, então marcar \"medicou\" é obrigatório.");
        }
        Instant momento = momentoInformado(pedido.capturadoEm());

        RelatorioVisita relatorio = new RelatorioVisita();
        relatorio.setVisita(visita);
        relatorio.setAlimentou(pedido.alimentou());
        relatorio.setTrocouAgua(pedido.trocouAgua());
        relatorio.setLimpouCaixa(pedido.limpouCaixa());
        relatorio.setMedicou(pedido.medicou());
        relatorio.setObservacoes(pedido.observacoes());
        relatorio.setRegistradoEm(momento);
        pedido.fotos().forEach(relatorio::adicionarFoto);
        relatorios.save(relatorio);
        visita.setRelatorio(relatorio);

        visita.setSituacao(SituacaoVisita.CONCLUIDA);
        visita.setConcluidaEm(momento);
        notificacoes.avisar(visita.getTutor().getId(), id, "Visita concluída",
                visita.getCuidador().getNome() + " concluiu a visita e enviou o relatório com fotos.");
        return paraResponse(visita, cuidadorId, true);
    }

    /** RN06: pedidos sem resposta até 2 horas antes do início expiram sozinhos. */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expirarPedidosSemResposta() {
        Instant limite = Instant.now().plus(RegrasVisita.LIMITE_RESPOSTA);
        for (Visita visita : visitas.findBySituacaoAndInicioLessThanEqual(SituacaoVisita.SOLICITADA, limite)) {
            visita.setSituacao(SituacaoVisita.EXPIRADA);
            notificacoes.avisar(visita.getTutor().getId(), visita.getId(), "Pedido expirado",
                    "O pedido de visita de " + formatoDataHora.format(visita.getInicio()) + " não teve resposta e expirou.");
        }
    }

    VisitaResponse paraResponse(Visita v, Long usuarioId, boolean incluirDadosGatos) {
        Instant agora = Instant.now();
        boolean ehTutor = v.getTutor().getId().equals(usuarioId);
        boolean liberado = ehTutor || RegrasVisita.cuidadorPodeVerDados(v.getSituacao(), v.getConcluidaEm(), agora);
        List<GatoDetalheVisita> dadosGatos = incluirDadosGatos && liberado
                ? v.getGatos().stream().map(this::detalheDoGato).toList()
                : null;
        return new VisitaResponse(v.getId(), v.getSituacao(), v.getInicio(), v.fim(), v.getDuracaoMinutos(),
                v.getInstrucoes(), pessoa(v.getTutor()), pessoa(v.getCuidador()),
                EnderecoService.paraResponse(v.getEndereco()),
                v.getGatos().stream().map(g -> new GatoDaVisita(g.getId(), g.getNome(), g.getFotoUrl())).toList(),
                v.getMotivoCancelamento(), v.getCanceladaPor(), v.getCheckinEm(), v.getConcluidaEm(),
                RegrasVisita.podeCancelar(v.getSituacao(), v.getInicio(), agora), liberado, precisaMedicar(v),
                dadosGatos, relatorioResponse(v.getRelatorio()));
    }

    private GatoDetalheVisita detalheDoGato(Gato g) {
        var itensDoGato = saude.itensDoGato(g.getId());
        boolean tomaRemedio = itensDoGato.stream().anyMatch(i -> i.tipo() == TipoItemSaude.REMEDIO);
        return new GatoDetalheVisita(g.getId(), g.getNome(), g.getRaca(), g.getSexo(), g.getDataNascimento(),
                g.getFotoUrl(), g.getCuidadosEspeciais(), tomaRemedio, itensDoGato);
    }

    private boolean precisaMedicar(Visita visita) {
        List<Long> ids = visita.getGatos().stream().map(Gato::getId).toList();
        return !ids.isEmpty() && itens.existsByGatoIdInAndTipo(ids, TipoItemSaude.REMEDIO);
    }

    private RelatorioResponse relatorioResponse(RelatorioVisita r) {
        if (r == null) {
            return null;
        }
        return new RelatorioResponse(r.isAlimentou(), r.isTrocouAgua(), r.isLimpouCaixa(), r.isMedicou(),
                r.getObservacoes(), r.getRegistradoEm(), r.getFotos().stream().map(f -> f.getUrl()).toList());
    }

    private PessoaResumo pessoa(Usuario u) {
        return new PessoaResumo(u.getId(), u.getNome(), u.getTelefone());
    }

    /** O momento vem do celular quando a ação foi feita sem internet, mas nunca pode estar no futuro. */
    private Instant momentoInformado(Instant capturadoEm) {
        Instant agora = Instant.now();
        if (capturadoEm == null) {
            return agora;
        }
        if (capturadoEm.isAfter(agora.plus(TOLERANCIA_RELOGIO))) {
            throw ErroApi.invalido("O relógio do celular está adiantado. Ajuste a hora e tente de novo.");
        }
        return capturadoEm;
    }

    private void exigirTransicao(Visita visita, SituacaoVisita destino) {
        if (!RegrasVisita.transicaoPermitida(visita.getSituacao(), destino)) {
            throw ErroApi.conflito("Essa ação não é permitida para uma visita na situação atual.");
        }
    }

    private Visita buscarDoUsuario(Long usuarioId, Long id) {
        Visita visita = visitas.findById(id).orElseThrow(() -> ErroApi.naoEncontrado("Visita não encontrada."));
        if (!visita.getTutor().getId().equals(usuarioId) && !visita.getCuidador().getId().equals(usuarioId)) {
            throw ErroApi.naoEncontrado("Visita não encontrada.");
        }
        return visita;
    }

    private Visita buscarDoCuidador(Long cuidadorId, Long id) {
        Visita visita = visitas.findById(id).orElseThrow(() -> ErroApi.naoEncontrado("Visita não encontrada."));
        if (!visita.getCuidador().getId().equals(cuidadorId)) {
            throw ErroApi.naoEncontrado("Visita não encontrada.");
        }
        return visita;
    }
}
