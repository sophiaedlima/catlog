package br.com.catlog.controller;

import br.com.catlog.dominio.Enums.SituacaoVisita;
import br.com.catlog.dto.Dtos.CancelarRequest;
import br.com.catlog.dto.Dtos.CheckinRequest;
import br.com.catlog.dto.Dtos.CuidadorResponse;
import br.com.catlog.dto.Dtos.FotoResponse;
import br.com.catlog.dto.Dtos.Pagina;
import br.com.catlog.dto.Dtos.RelatorioRequest;
import br.com.catlog.dto.Dtos.ResumoCuidador;
import br.com.catlog.dto.Dtos.ResumoTutor;
import br.com.catlog.dto.Dtos.VisitaRequest;
import br.com.catlog.dto.Dtos.VisitaResponse;
import br.com.catlog.erro.ErroApi;
import br.com.catlog.integracao.ArmazenamentoFotos;
import br.com.catlog.servico.CuidadorService;
import br.com.catlog.servico.ResumoService;
import br.com.catlog.servico.VisitaService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class VisitaController {

    private final VisitaService visitas;
    private final CuidadorService cuidadores;
    private final ResumoService resumos;
    private final ArmazenamentoFotos armazenamento;

    public VisitaController(VisitaService visitas, CuidadorService cuidadores, ResumoService resumos,
                            ArmazenamentoFotos armazenamento) {
        this.visitas = visitas;
        this.cuidadores = cuidadores;
        this.resumos = resumos;
        this.armazenamento = armazenamento;
    }

    @GetMapping("/cuidadores")
    public Pagina<CuidadorResponse> buscarCuidadores(@AuthenticationPrincipal Jwt jwt,
                                                     @RequestParam Long enderecoId,
                                                     @RequestParam(defaultValue = "5") double distanciaMaximaKm,
                                                     @RequestParam(defaultValue = "distancia") String ordem,
                                                     @RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "20") int tamanho) {
        return cuidadores.buscar(id(jwt), enderecoId, distanciaMaximaKm, ordem, pagina, tamanho);
    }

    @PostMapping("/visitas")
    @ResponseStatus(HttpStatus.CREATED)
    public VisitaResponse solicitar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody VisitaRequest pedido) {
        return visitas.solicitar(id(jwt), pedido);
    }

    @GetMapping("/visitas")
    public Pagina<VisitaResponse> listar(@AuthenticationPrincipal Jwt jwt,
                                         @RequestParam(required = false) List<SituacaoVisita> situacoes,
                                         @RequestParam(required = false) Instant de,
                                         @RequestParam(required = false) Instant ate,
                                         @RequestParam(defaultValue = "0") int pagina,
                                         @RequestParam(defaultValue = "20") int tamanho) {
        return visitas.listar(id(jwt), situacoes, de, ate, pagina, tamanho);
    }

    @GetMapping("/visitas/{visitaId}")
    public VisitaResponse detalhar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long visitaId) {
        return visitas.detalhar(id(jwt), visitaId);
    }

    @PostMapping("/visitas/{visitaId}/aceitar")
    public VisitaResponse aceitar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long visitaId) {
        return visitas.aceitar(id(jwt), visitaId);
    }

    @PostMapping("/visitas/{visitaId}/recusar")
    public VisitaResponse recusar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long visitaId) {
        return visitas.recusar(id(jwt), visitaId);
    }

    @PostMapping("/visitas/{visitaId}/cancelar")
    public VisitaResponse cancelar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long visitaId,
                                   @Valid @RequestBody CancelarRequest pedido) {
        return visitas.cancelar(id(jwt), visitaId, pedido);
    }

    @PostMapping("/visitas/{visitaId}/checkin")
    public VisitaResponse checkin(@AuthenticationPrincipal Jwt jwt, @PathVariable Long visitaId,
                                  @Valid @RequestBody CheckinRequest pedido) {
        return visitas.checkin(id(jwt), visitaId, pedido);
    }

    @PostMapping("/visitas/{visitaId}/relatorio")
    public VisitaResponse concluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Long visitaId,
                                   @Valid @RequestBody RelatorioRequest pedido) {
        return visitas.concluir(id(jwt), visitaId, pedido);
    }

    @GetMapping("/resumo/tutor")
    public ResumoTutor resumoTutor(@AuthenticationPrincipal Jwt jwt) {
        return resumos.doTutor(id(jwt));
    }

    @GetMapping("/resumo/cuidador")
    public ResumoCuidador resumoCuidador(@AuthenticationPrincipal Jwt jwt) {
        return resumos.doCuidador(id(jwt));
    }

    @PostMapping("/fotos")
    @ResponseStatus(HttpStatus.CREATED)
    public FotoResponse enviarFoto(@RequestParam("arquivo") MultipartFile arquivo) throws IOException {
        String tipo = arquivo.getContentType();
        if (tipo == null || !List.of("image/jpeg", "image/png").contains(tipo)) {
            throw ErroApi.invalido("Envie uma foto no formato JPG ou PNG.");
        }
        return new FotoResponse(armazenamento.salvar(arquivo.getBytes(), tipo));
    }

    private Long id(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
