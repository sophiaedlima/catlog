package br.com.catlog.servico;

import br.com.catlog.dominio.Endereco;
import br.com.catlog.dominio.Enums.Perfil;
import br.com.catlog.dominio.Usuario;
import br.com.catlog.dto.Dtos.CuidadorResponse;
import br.com.catlog.dto.Dtos.Pagina;
import br.com.catlog.erro.ErroApi;
import br.com.catlog.regras.Geo;
import br.com.catlog.repositorio.Repositorios.EnderecoRepository;
import br.com.catlog.repositorio.Repositorios.UsuarioRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CuidadorService {

    private final UsuarioRepository usuarios;
    private final EnderecoRepository enderecos;
    private final EnderecoService enderecoService;

    public CuidadorService(UsuarioRepository usuarios, EnderecoRepository enderecos, EnderecoService enderecoService) {
        this.usuarios = usuarios;
        this.enderecos = enderecos;
        this.enderecoService = enderecoService;
    }

    /** Cuidadores dentro do filtro do tutor e cujo raio de atendimento alcança o endereço escolhido. */
    @Transactional
    public Pagina<CuidadorResponse> buscar(Long tutorId, Long enderecoId, double distanciaMaximaKm, String ordem,
                                           int pagina, int tamanho) {
        Endereco origem = enderecoService.buscar(tutorId, enderecoId);
        enderecoService.completarCoordenadas(origem);
        if (!origem.temCoordenadas()) {
            throw ErroApi.invalido("Não conseguimos localizar esse endereço. Confira a rua e o número em Meu perfil.");
        }

        List<CuidadorResponse> achados = new ArrayList<>();
        for (Usuario cuidador : usuarios.findByPerfil(Perfil.CUIDADOR)) {
            Endereco base = enderecos.findFirstByUsuarioIdOrderByPrincipalDescIdAsc(cuidador.getId()).orElse(null);
            if (base == null || !base.temCoordenadas()) {
                continue;
            }
            double km = Geo.distanciaMetros(origem.getLatitude(), origem.getLongitude(),
                    base.getLatitude(), base.getLongitude()) / 1000;
            if (km <= distanciaMaximaKm && km <= cuidador.getRaioAtendimentoKm()) {
                achados.add(new CuidadorResponse(cuidador.getId(), cuidador.getNome(), cuidador.getApresentacao(),
                        cuidador.getRaioAtendimentoKm(), Math.round(km * 10) / 10.0));
            }
        }
        achados.sort("nome".equals(ordem)
                ? Comparator.comparing(CuidadorResponse::nome, String.CASE_INSENSITIVE_ORDER)
                : Comparator.comparingDouble(CuidadorResponse::distanciaKm));

        int inicio = Math.min(pagina * tamanho, achados.size());
        int fim = Math.min(inicio + tamanho, achados.size());
        int totalPaginas = (int) Math.ceil((double) achados.size() / tamanho);
        return new Pagina<>(achados.subList(inicio, fim), pagina, totalPaginas, achados.size());
    }
}
