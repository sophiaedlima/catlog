package br.com.catlog.servico;

import br.com.catlog.dominio.Endereco;
import br.com.catlog.dominio.Usuario;
import br.com.catlog.dto.Dtos.EnderecoRequest;
import br.com.catlog.dto.Dtos.EnderecoResponse;
import br.com.catlog.erro.ErroApi;
import br.com.catlog.integracao.NominatimCliente;
import br.com.catlog.repositorio.Repositorios.EnderecoRepository;
import br.com.catlog.repositorio.Repositorios.UsuarioRepository;
import br.com.catlog.repositorio.Repositorios.VisitaRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EnderecoService {

    private final EnderecoRepository enderecos;
    private final UsuarioRepository usuarios;
    private final VisitaRepository visitas;
    private final NominatimCliente nominatim;

    public EnderecoService(EnderecoRepository enderecos, UsuarioRepository usuarios, VisitaRepository visitas,
                           NominatimCliente nominatim) {
        this.enderecos = enderecos;
        this.usuarios = usuarios;
        this.visitas = visitas;
        this.nominatim = nominatim;
    }

    @Transactional(readOnly = true)
    public List<EnderecoResponse> listar(Long usuarioId) {
        return enderecos.findByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId).stream()
                .map(EnderecoService::paraResponse)
                .toList();
    }

    @Transactional
    public EnderecoResponse criar(Long usuarioId, EnderecoRequest pedido) {
        Usuario dono = usuarios.findById(usuarioId)
                .orElseThrow(() -> ErroApi.naoEncontrado("Usuário não encontrado."));
        Endereco endereco = new Endereco();
        endereco.setUsuario(dono);
        boolean primeiro = enderecos.findFirstByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId).isEmpty();
        return salvar(endereco, pedido, primeiro || pedido.principal());
    }

    @Transactional
    public EnderecoResponse atualizar(Long usuarioId, Long id, EnderecoRequest pedido) {
        Endereco endereco = buscar(usuarioId, id);
        return salvar(endereco, pedido, endereco.isPrincipal() || pedido.principal());
    }

    @Transactional
    public void excluir(Long usuarioId, Long id) {
        Endereco endereco = buscar(usuarioId, id);
        if (visitas.existsByEnderecoId(id)) {
            throw ErroApi.conflito("Esse endereço está ligado a visitas e não pode ser excluído.");
        }
        enderecos.delete(endereco);
        enderecos.flush();
        if (endereco.isPrincipal()) {
            enderecos.findFirstByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId).ifPresent(e -> e.setPrincipal(true));
        }
    }

    /** Tenta de novo obter as coordenadas de um endereço salvo enquanto o Nominatim estava fora do ar. */
    @Transactional
    public void completarCoordenadas(Endereco endereco) {
        if (!endereco.temCoordenadas()) {
            nominatim.buscar(endereco.enderecoCompleto()).ifPresent(c -> {
                endereco.setLatitude(c.latitude());
                endereco.setLongitude(c.longitude());
            });
        }
    }

    Endereco buscar(Long usuarioId, Long id) {
        return enderecos.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> ErroApi.naoEncontrado("Endereço não encontrado."));
    }

    private EnderecoResponse salvar(Endereco endereco, EnderecoRequest pedido, boolean principal) {
        endereco.setApelido(pedido.apelido().trim());
        endereco.setCep(pedido.cep());
        endereco.setLogradouro(pedido.logradouro().trim());
        endereco.setNumero(pedido.numero().trim());
        endereco.setComplemento(pedido.complemento());
        endereco.setBairro(pedido.bairro().trim());
        endereco.setCidade(pedido.cidade().trim());
        endereco.setUf(pedido.uf().toUpperCase());
        endereco.setPrincipal(principal);
        endereco.setLatitude(null);
        endereco.setLongitude(null);
        completarCoordenadas(endereco);
        if (principal) {
            enderecos.findByUsuarioIdOrderByPrincipalDescIdAsc(endereco.getUsuario().getId())
                    .forEach(outro -> outro.setPrincipal(false));
        }
        endereco.setPrincipal(principal);
        return paraResponse(enderecos.save(endereco));
    }

    public static EnderecoResponse paraResponse(Endereco e) {
        return new EnderecoResponse(e.getId(), e.getApelido(), e.getCep(), e.getLogradouro(), e.getNumero(),
                e.getComplemento(), e.getBairro(), e.getCidade(), e.getUf(), e.getLatitude(), e.getLongitude(),
                e.isPrincipal());
    }
}
