package br.com.catlog.servico;

import br.com.catlog.dominio.Enums.SituacaoSaude;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Enums.TipoItemSaude;
import br.com.catlog.dominio.Gato;
import br.com.catlog.dominio.ItemSaude;
import br.com.catlog.dominio.RegistroPeso;
import br.com.catlog.dominio.Usuario;
import br.com.catlog.dto.Dtos.GatoRequest;
import br.com.catlog.dto.Dtos.GatoResponse;
import br.com.catlog.dto.Dtos.Pagina;
import br.com.catlog.erro.ErroApi;
import br.com.catlog.regras.RegrasSaude;
import br.com.catlog.repositorio.Repositorios.GatoRepository;
import br.com.catlog.repositorio.Repositorios.ItemSaudeRepository;
import br.com.catlog.repositorio.Repositorios.RegistroPesoRepository;
import br.com.catlog.repositorio.Repositorios.UsuarioRepository;
import br.com.catlog.repositorio.Repositorios.VisitaRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GatoService {

    private final GatoRepository gatos;
    private final UsuarioRepository usuarios;
    private final ItemSaudeRepository itens;
    private final RegistroPesoRepository pesos;
    private final VisitaRepository visitas;
    private final ZoneId fuso;

    public GatoService(GatoRepository gatos, UsuarioRepository usuarios, ItemSaudeRepository itens,
                       RegistroPesoRepository pesos, VisitaRepository visitas, ZoneId fuso) {
        this.gatos = gatos;
        this.usuarios = usuarios;
        this.itens = itens;
        this.pesos = pesos;
        this.visitas = visitas;
        this.fuso = fuso;
    }

    @Transactional(readOnly = true)
    public Pagina<GatoResponse> listar(Long tutorId, String busca, int pagina, int tamanho) {
        String termo = busca == null ? "" : busca.trim();
        return Pagina.de(gatos.findByTutorIdAndNomeContainingIgnoreCaseOrderByNomeAsc(
                tutorId, termo, PageRequest.of(pagina, tamanho)).map(this::paraResponse));
    }

    @Transactional(readOnly = true)
    public GatoResponse buscar(Long tutorId, Long id) {
        return paraResponse(buscarEntidade(tutorId, id));
    }

    @Transactional
    public GatoResponse criar(Long tutorId, GatoRequest pedido) {
        Usuario tutor = usuarios.findById(tutorId).orElseThrow(() -> ErroApi.naoEncontrado("Usuário não encontrado."));
        Gato gato = new Gato();
        gato.setTutor(tutor);
        preencher(gato, pedido);
        return paraResponse(gatos.save(gato));
    }

    @Transactional
    public GatoResponse atualizar(Long tutorId, Long id, GatoRequest pedido) {
        Gato gato = buscarEntidade(tutorId, id);
        preencher(gato, pedido);
        return paraResponse(gato);
    }

    @Transactional
    public void excluir(Long tutorId, Long id) {
        Gato gato = buscarEntidade(tutorId, id);
        boolean visitaAberta = visitas.gatoEmVisitaAtiva(id,
                List.of(SituacaoVisita.SOLICITADA, SituacaoVisita.ACEITA, SituacaoVisita.EM_ANDAMENTO));
        if (visitaAberta) {
            throw ErroApi.conflito("Esse gato tem visitas em aberto. Cancele essas visitas antes de excluir.");
        }
        gatos.delete(gato);
    }

    Gato buscarEntidade(Long tutorId, Long id) {
        return gatos.findByIdAndTutorId(id, tutorId).orElseThrow(() -> ErroApi.naoEncontrado("Gato não encontrado."));
    }

    GatoResponse paraResponse(Gato g) {
        LocalDate hoje = LocalDate.now(fuso);
        List<ItemSaude> itensDoGato = itens.findByGatoIdOrderByProximaDoseAscIdAsc(g.getId());
        SituacaoSaude pior = itensDoGato.stream()
                .map(i -> RegrasSaude.situacao(i.getProximaDose(), hoje))
                .max(Enum::compareTo)
                .orElse(SituacaoSaude.EM_DIA);
        boolean tomaRemedio = itensDoGato.stream().anyMatch(i -> i.getTipo() == TipoItemSaude.REMEDIO);
        RegistroPeso ultimoPeso = pesos.findFirstByGatoIdOrderByDataMedicaoDescIdDesc(g.getId()).orElse(null);
        return new GatoResponse(g.getId(), g.getNome(), g.getRaca(), g.getSexo(), g.getDataNascimento(), g.getFotoUrl(),
                g.getCuidadosEspeciais(),
                ultimoPeso == null ? null : ultimoPeso.getPesoKg(),
                ultimoPeso == null ? null : ultimoPeso.getDataMedicao(),
                pior, tomaRemedio);
    }

    private void preencher(Gato gato, GatoRequest pedido) {
        gato.setNome(pedido.nome().trim());
        gato.setRaca(pedido.raca());
        gato.setSexo(pedido.sexo());
        gato.setDataNascimento(pedido.dataNascimento());
        gato.setFotoUrl(pedido.fotoUrl());
        gato.setCuidadosEspeciais(pedido.cuidadosEspeciais());
    }
}
