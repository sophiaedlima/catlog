package br.com.catlog.controller;

import br.com.catlog.dto.Dtos.AtualizarUsuarioRequest;
import br.com.catlog.dto.Dtos.CadastroRequest;
import br.com.catlog.dto.Dtos.EnderecoRequest;
import br.com.catlog.dto.Dtos.EnderecoResponse;
import br.com.catlog.dto.Dtos.LoginRequest;
import br.com.catlog.dto.Dtos.NotificacaoResponse;
import br.com.catlog.dto.Dtos.SessaoResponse;
import br.com.catlog.dto.Dtos.UsuarioResponse;
import br.com.catlog.servico.ContaService;
import br.com.catlog.servico.EnderecoService;
import br.com.catlog.servico.NotificacaoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ContaController {

    private final ContaService contas;
    private final EnderecoService enderecos;
    private final NotificacaoService notificacoes;

    public ContaController(ContaService contas, EnderecoService enderecos, NotificacaoService notificacoes) {
        this.contas = contas;
        this.enderecos = enderecos;
        this.notificacoes = notificacoes;
    }

    @PostMapping("/auth/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public SessaoResponse cadastrar(@Valid @RequestBody CadastroRequest pedido) {
        return contas.cadastrar(pedido);
    }

    @PostMapping("/auth/login")
    public SessaoResponse entrar(@Valid @RequestBody LoginRequest pedido) {
        return contas.entrar(pedido);
    }

    @GetMapping("/me")
    public UsuarioResponse eu(@AuthenticationPrincipal Jwt jwt) {
        return contas.buscar(id(jwt));
    }

    @PutMapping("/me")
    public UsuarioResponse atualizar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AtualizarUsuarioRequest pedido) {
        return contas.atualizar(id(jwt), pedido);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirConta(@AuthenticationPrincipal Jwt jwt) {
        contas.excluir(id(jwt));
    }

    @GetMapping("/enderecos")
    public List<EnderecoResponse> listarEnderecos(@AuthenticationPrincipal Jwt jwt) {
        return enderecos.listar(id(jwt));
    }

    @PostMapping("/enderecos")
    @ResponseStatus(HttpStatus.CREATED)
    public EnderecoResponse criarEndereco(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody EnderecoRequest pedido) {
        return enderecos.criar(id(jwt), pedido);
    }

    @PutMapping("/enderecos/{enderecoId}")
    public EnderecoResponse atualizarEndereco(@AuthenticationPrincipal Jwt jwt, @PathVariable Long enderecoId,
                                              @Valid @RequestBody EnderecoRequest pedido) {
        return enderecos.atualizar(id(jwt), enderecoId, pedido);
    }

    @DeleteMapping("/enderecos/{enderecoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirEndereco(@AuthenticationPrincipal Jwt jwt, @PathVariable Long enderecoId) {
        enderecos.excluir(id(jwt), enderecoId);
    }

    @PostMapping("/notificacoes/entregar")
    public List<NotificacaoResponse> entregarNotificacoes(@AuthenticationPrincipal Jwt jwt) {
        return notificacoes.entregarPendentes(id(jwt));
    }

    private Long id(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
