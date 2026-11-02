package br.com.catlog.servico;

import br.com.catlog.dominio.Enums.Perfil;
import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dominio.Usuario;
import br.com.catlog.dto.Dtos.AtualizarUsuarioRequest;
import br.com.catlog.dto.Dtos.CadastroRequest;
import br.com.catlog.dto.Dtos.LoginRequest;
import br.com.catlog.dto.Dtos.SessaoResponse;
import br.com.catlog.dto.Dtos.UsuarioResponse;
import br.com.catlog.erro.ErroApi;
import br.com.catlog.repositorio.Repositorios.UsuarioRepository;
import br.com.catlog.repositorio.Repositorios.VisitaRepository;
import br.com.catlog.seguranca.TokenService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContaService {

    private final UsuarioRepository usuarios;
    private final VisitaRepository visitas;
    private final PasswordEncoder codificador;
    private final TokenService tokens;

    public ContaService(UsuarioRepository usuarios, VisitaRepository visitas, PasswordEncoder codificador,
                        TokenService tokens) {
        this.usuarios = usuarios;
        this.visitas = visitas;
        this.codificador = codificador;
        this.tokens = tokens;
    }

    @Transactional
    public SessaoResponse cadastrar(CadastroRequest pedido) {
        String email = pedido.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw ErroApi.conflito("Já existe uma conta com esse e-mail.");
        }
        Usuario usuario = new Usuario();
        usuario.setNome(pedido.nome().trim());
        usuario.setEmail(email);
        usuario.setTelefone(pedido.telefone().trim());
        usuario.setSenhaHash(codificador.encode(pedido.senha()));
        usuario.setPerfil(pedido.perfil());
        usuarios.save(usuario);
        return new SessaoResponse(tokens.gerar(usuario), paraResponse(usuario));
    }

    @Transactional(readOnly = true)
    public SessaoResponse entrar(LoginRequest pedido) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(pedido.email().trim())
                .filter(u -> codificador.matches(pedido.senha(), u.getSenhaHash()))
                .orElseThrow(() -> new ErroApi(HttpStatus.UNAUTHORIZED,
                        "E-mail ou senha incorretos. Confira os dados e tente de novo."));
        return new SessaoResponse(tokens.gerar(usuario), paraResponse(usuario));
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscar(Long id) {
        return paraResponse(buscarEntidade(id));
    }

    @Transactional
    public UsuarioResponse atualizar(Long id, AtualizarUsuarioRequest pedido) {
        Usuario usuario = buscarEntidade(id);
        usuario.setNome(pedido.nome().trim());
        usuario.setTelefone(pedido.telefone().trim());
        if (usuario.getPerfil() == Perfil.CUIDADOR) {
            usuario.setApresentacao(pedido.apresentacao());
            if (pedido.raioAtendimentoKm() != null) {
                usuario.setRaioAtendimentoKm(pedido.raioAtendimentoKm());
            }
        }
        return paraResponse(usuario);
    }

    /** RNF03 (LGPD): apaga a conta e tudo que depende dela, desde que não haja visita em aberto. */
    @Transactional
    public void excluir(Long id) {
        boolean visitaAberta = visitas.usuarioEmVisitaAtiva(id,
                List.of(SituacaoVisita.SOLICITADA, SituacaoVisita.ACEITA, SituacaoVisita.EM_ANDAMENTO));
        if (visitaAberta) {
            throw ErroApi.conflito("Você tem visitas em aberto. Cancele ou conclua essas visitas antes de excluir a conta.");
        }
        visitas.deleteAll(visitas.findAll((raiz, consulta, cb) -> cb.or(
                cb.equal(raiz.get("tutor").get("id"), id),
                cb.equal(raiz.get("cuidador").get("id"), id))));
        usuarios.delete(buscarEntidade(id));
    }

    Usuario buscarEntidade(Long id) {
        return usuarios.findById(id).orElseThrow(() -> ErroApi.naoEncontrado("Usuário não encontrado."));
    }

    private UsuarioResponse paraResponse(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getTelefone(), u.getPerfil(),
                u.getApresentacao(), u.getRaioAtendimentoKm(), u.getCriadoEm());
    }
}
