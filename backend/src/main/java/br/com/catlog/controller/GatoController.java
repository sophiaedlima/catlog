package br.com.catlog.controller;

import br.com.catlog.dto.Dtos.GatoRequest;
import br.com.catlog.dto.Dtos.GatoResponse;
import br.com.catlog.dto.Dtos.ItemSaudeRequest;
import br.com.catlog.dto.Dtos.ItemSaudeResponse;
import br.com.catlog.dto.Dtos.Pagina;
import br.com.catlog.dto.Dtos.PesoRequest;
import br.com.catlog.dto.Dtos.PesoResponse;
import br.com.catlog.servico.GatoService;
import br.com.catlog.servico.SaudeService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gatos")
public class GatoController {

    private final GatoService gatos;
    private final SaudeService saude;

    public GatoController(GatoService gatos, SaudeService saude) {
        this.gatos = gatos;
        this.saude = saude;
    }

    @GetMapping
    public Pagina<GatoResponse> listar(@AuthenticationPrincipal Jwt jwt,
                                       @RequestParam(required = false) String busca,
                                       @RequestParam(defaultValue = "0") int pagina,
                                       @RequestParam(defaultValue = "20") int tamanho) {
        return gatos.listar(id(jwt), busca, pagina, tamanho);
    }

    @GetMapping("/{gatoId}")
    public GatoResponse buscar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId) {
        return gatos.buscar(id(jwt), gatoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GatoResponse criar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody GatoRequest pedido) {
        return gatos.criar(id(jwt), pedido);
    }

    @PutMapping("/{gatoId}")
    public GatoResponse atualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId,
                                  @Valid @RequestBody GatoRequest pedido) {
        return gatos.atualizar(id(jwt), gatoId, pedido);
    }

    @DeleteMapping("/{gatoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId) {
        gatos.excluir(id(jwt), gatoId);
    }

    @GetMapping("/{gatoId}/itens-saude")
    public List<ItemSaudeResponse> listarItens(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId) {
        return saude.listarItens(id(jwt), gatoId);
    }

    @PostMapping("/{gatoId}/itens-saude")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemSaudeResponse criarItem(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId,
                                       @Valid @RequestBody ItemSaudeRequest pedido) {
        return saude.criarItem(id(jwt), gatoId, pedido);
    }

    @PutMapping("/{gatoId}/itens-saude/{itemId}")
    public ItemSaudeResponse atualizarItem(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId,
                                           @PathVariable Long itemId, @Valid @RequestBody ItemSaudeRequest pedido) {
        return saude.atualizarItem(id(jwt), gatoId, itemId, pedido);
    }

    @DeleteMapping("/{gatoId}/itens-saude/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirItem(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId, @PathVariable Long itemId) {
        saude.excluirItem(id(jwt), gatoId, itemId);
    }

    @GetMapping("/{gatoId}/pesos")
    public List<PesoResponse> listarPesos(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId) {
        return saude.listarPesos(id(jwt), gatoId);
    }

    @PostMapping("/{gatoId}/pesos")
    @ResponseStatus(HttpStatus.CREATED)
    public PesoResponse registrarPeso(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId,
                                      @Valid @RequestBody PesoRequest pedido) {
        return saude.registrarPeso(id(jwt), gatoId, pedido);
    }

    @DeleteMapping("/{gatoId}/pesos/{pesoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirPeso(@AuthenticationPrincipal Jwt jwt, @PathVariable Long gatoId, @PathVariable Long pesoId) {
        saude.excluirPeso(id(jwt), gatoId, pesoId);
    }

    private Long id(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
